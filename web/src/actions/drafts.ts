"use server";

import { z } from "zod";
import { authSchema } from "@/serverAuth";
import * as Files from "@/files";
import { revalidatePath } from "next/cache";
import { webhookNotifyNewArticle } from "@/webhooks";
import { draftIdSchema } from "@/schemas";
import { getNNDB } from "@/db";

export {
  listDrafts,
  getDraft,
  updateDraft,
  deleteDraft,
  createDraft,
  publishDraft,
};

function makeListDraftsQuery<T extends ReturnType<typeof getNNDB>>(db: T, authorId: string) {
  return db
    .selectFrom("drafts")
    .innerJoin("articles", "drafts.article_id", "articles.id")
    .select("id")
    .select("title")
    .select("created_at")
    .select("updated_at")
    .select("article_id")
    .select(({exists, selectFrom}) => exists(
      selectFrom("last_editions")
      .select("id")
      .whereRef("article_id", "=", "drafts.id")
    ).as("published"))
    .where("author_id", "=", authorId)
}

async function listDrafts(auth: z.input<typeof authSchema>) {
  const { id: authorId } = await authSchema.parseAsync(auth);

  return await makeListDraftsQuery(getNNDB(), authorId)
    .orderBy(["updated_at desc", "created_at desc"])
    .execute();
}

async function getDraft(
  auth: z.input<typeof authSchema>,
  draftId: z.input<typeof draftIdSchema>,
) {
  const { id: authorId } = await authSchema.parseAsync(auth);
  const { id } = await draftIdSchema.parseAsync(draftId);

  return await getNNDB().transaction().execute(async tx => {
    const draft = await makeListDraftsQuery(tx, authorId)
      .select("content")
      .where("drafts.id", "=", id)
      .executeTakeFirst();
    if (!draft) {
      return null;
    }

    const files = await tx
      .selectFrom("files")
      .select("id")
      .select("name")
      .select("mime_type")
      .where("draft_id", "=", id)
      .execute();

    return { ...draft, files };
  });
}

const updateDraftSchema = z.object({
  title: z.string().max(255),
  content: z.string(),
});
async function updateDraft(
  auth: z.input<typeof authSchema>,
  draftId: z.input<typeof draftIdSchema>,
  payload: z.input<typeof updateDraftSchema>,
) {
  const { id: userId } = await authSchema.parseAsync(auth);
  const { id } = await draftIdSchema.parseAsync(draftId);
  const { title, content } = await updateDraftSchema.parseAsync(payload);

  return (
    await getNNDB().updateTable("drafts")
      .set("title", title)
      .set("content", content)
      .where("id", "=", id)
      .where(({eb, selectFrom}) => eb(
        selectFrom("articles").select("author_id").whereRef("id", "=", "drafts.article_id"),
        "=", userId))
      .executeTakeFirst()
  ).numUpdatedRows === 1n
    ? "Ok"
    : "NotFound";
}

async function deleteDraft(
  auth: z.input<typeof authSchema>,
  draftId: z.input<typeof draftIdSchema>,
) {
  const { id } = await draftIdSchema.parseAsync(draftId);
  const { id: userId } = await authSchema.parseAsync(auth);

  const res = await getNNDB().transaction().execute(async (tx) => {
    const deleteResult = await tx
      .deleteFrom("drafts")
      .where("id", "=", id)
      .where(({eb, selectFrom}) => eb(
        selectFrom("articles").select("author_id").whereRef("id", "=", "drafts.article_id"),
        "=", userId))
      .returning("article_id")
      .executeTakeFirst();
    if (!deleteResult) {
      return { type: "NotFound" } as const;
    }
    await tx
      .deleteFrom("articles")
      .where("id", "=", deleteResult.article_id)
      .where(({eb, selectFrom}) => eb(
        "id", "not in",
        selectFrom("editions").select("article_id")
      ))
      .execute();

    return { type: "Ok" } as const;
  });

  if (res.type !== "Ok") {
    return { type: res.type } as const;
  }
  await Files.deleteDraftFiles(id);
  return { type: "Ok" } as const;
}

async function createDraft(auth: z.input<typeof authSchema>) {
  const { id: authorId } = await authSchema.parseAsync(auth);

  return await getNNDB()
    .with("new_article", (db) => db
          .insertInto("articles")
          .values({ author_id: authorId })
          .returning("id"))
    .insertInto("drafts")
    .values(({selectFrom}) => ({
      article_id: selectFrom("new_article").select("new_article.id"),
    }))
    .returning("id")
    .executeTakeFirstOrThrow();
}

const publishDraftSchema = z.object({
  id: z.number(),
  notes: z.string().max(255),
  notify: z.boolean(),
  rememberNotify: z.boolean(),
  thumbnailId: z.number().nullable(),
});

async function publishDraft(
  auth: z.input<typeof authSchema>,
  payload: z.infer<typeof publishDraftSchema>,
) {
  const { id: draftId, notes, notify, rememberNotify, thumbnailId } =
    publishDraftSchema.parse(payload);
  const { id: userId } = await authSchema.parseAsync(auth);

  const res = await getNNDB().transaction().execute(async (tx) => {
    //const hasTitle = await first(Queries.draftHasTitle, { id, userId });
    const draft = await tx
      .selectFrom("drafts")
      .innerJoin("articles", "drafts.article_id", "articles.id")
      .select("title")
      .where("drafts.id", "=", draftId)
      .where("articles.author_id", "=", userId)
      .executeTakeFirst();

    if (!draft) {
      return { type: "NotFound" } as const;
    } else if (draft.title === "") {
      return { type: "NoTitle" } as const;
    }

    const files = await tx
      .selectFrom("files")
      .select(["id", "mime_type"])
      .where("draft_id", "=", draftId)
      .execute();

    if (thumbnailId !== null) {
      // thumbnail should be one of the files uploaded to this draft
      // and should be an image
      const thumbnail = files.find((f) => f.id === thumbnailId);
      if (!thumbnail || !thumbnail.mime_type.startsWith("image/")) {
        return { type: "InvalidThumbnail" } as const;
      }
    }

    const { article_id, edition_id } = await tx
      .insertInto("editions")
      .columns(["article_id", "title", "content", "notes", "thumbnail"])
      .expression(({selectFrom, val}) => selectFrom("drafts")
                  .select([
                    "article_id",
                    "title",
                    "content",
                    val(notes).as("notes"),
                    val(thumbnailId).as("thumbnail")
                  ])
                  .where("id", "=", draftId))
      .returning(["article_id", "id as edition_id"])
      .executeTakeFirstOrThrow();

    await tx
      .updateTable("files")
      .set("edition_id", edition_id)
      .set("draft_id", null)
      .where("draft_id", "=", draftId)
      .execute();

    await tx
      .deleteFrom("drafts")
      .where("id", "=", draftId)
      .execute();

    if (files.length !== 0) {
      await Files.moveDraftFilesToEdition({ draftId, editionId: edition_id });
    }

    if (rememberNotify) {
      await tx
        .updateTable("users")
        .set("new_article_notify", notify)
        .where("id", "=", userId)
        .execute();
    }

    return { type: "Ok", articleId: article_id } as const;
  });

  if (res.type !== "Ok") {
    return res;
  }

  revalidatePath("/articles");

  if (notify) {
    // ignore the result of executeWebhooks
    void webhookNotifyNewArticle(res.articleId);
  }
  return res;
}

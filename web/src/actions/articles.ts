"use server";

import { authSchema } from "@/serverAuth";
import { z } from "zod";
import * as Files from "@/files";
import { revalidatePath } from "next/cache";
import {
  articleIdSchema,
  paginationSchema,
  paginationWithAuthorSchema,
} from "@/schemas";
import { getNNDB } from "@/db";

export {
  deleteArticle,
  editArticle,
  getArticleDraftId,
  listArticles,
  listArticlesByAuthor,
};

async function deleteArticle(
  auth: z.input<typeof authSchema>,
  articleId: z.input<typeof articleIdSchema>,
) {
  const { id: userId } = await authSchema.parseAsync(auth);
  const { id } = await articleIdSchema.parseAsync(articleId);

  const res = await getNNDB().transaction().execute(async (tx) => {
    const article = await tx
      .selectFrom("articles")
      .select("author_id")
      .where("id", "=", id)
      .executeTakeFirst();
    if (!article) {
      return { type: "NotFound" } as const;
    }
    if (article.author_id !== userId) {
      return { type: "Forbidden" } as const;
    }

    const draft = await tx
      .selectFrom("drafts")
      .select("id")
      .where("article_id", "=", id)
      .executeTakeFirst();
    const editions = await tx
      .selectFrom("editions")
      .select("id")
      .where("article_id", "=", id)
      .execute();
    await tx.deleteFrom("articles").where("id", "=", id).execute();
    return {
      type: "Ok",
      draftIds: draft ? [draft.id] : [],
      editionIds: editions.map((e) => e.id),
    } as const;
  });

  if (res.type !== "Ok") {
    return { type: res.type } as const;
  }

  await Promise.all([
    ...res.draftIds.map((id) => Files.deleteDraftFiles(id)),
    ...res.editionIds.map((id) => Files.deleteEditionFiles(id)),
  ]);
  revalidatePath("/articles");
  return { type: "Ok" } as const;
}

async function editArticle(
  auth: z.input<typeof authSchema>,
  article: z.input<typeof articleIdSchema>,
) {
  const { id: userId } = await authSchema.parseAsync(auth);
  const { id: articleId } = await articleIdSchema.parseAsync(article);

  const res = await getNNDB().transaction().execute(async (tx) => {
    const article = await tx
      .selectFrom("articles")
      .select("author_id")
      .where("id", "=", articleId)
      .executeTakeFirst();
    if (!article) {
      return { type: "NotFound" } as const;
    }
    if (article.author_id !== userId) {
      return { type: "Forbidden" } as const;
    }

    // get the last edition of the given article
    const edition = await tx
      .selectFrom("last_editions")
      .select("id")
      .where("article_id", "=", articleId)
      .executeTakeFirstOrThrow();

    // insert the last edition as a new draft
    const draft = await tx
      .insertInto("drafts")
      .columns(["article_id", "title", "content"])
      .expression(eb => eb
                  .selectFrom("editions")
                  .select(["article_id", "title", "content"])
                  .where("id", "=", edition.id))
      .returning("id")
      .executeTakeFirstOrThrow();

    // copy the files of the last edition to the new draft
    const files = await tx
      // first insert the files of the last edition as those of the new draft
      .with("new_files", (cte) => cte
        .insertInto("files")
        .columns(["draft_id", "name", "mime_type"])
        .expression(({eb, val}) => eb
                    .selectFrom("files")
                    .select([val(draft.id).as("draft_id"), "name", "mime_type"])
                    .where("edition_id", "=", edition.id))
        .returning(["id", "name"]))
      // then return (oldId, newId, name) for each file
      // note that names are unique per edition/draft
      .selectFrom("new_files")
      .innerJoin("files", "files.name", "new_files.name")
      .select(["files.id as oldId", "new_files.id as newId", "new_files.name"])
      .where("edition_id", "=", edition.id)
      .execute();

    await Files.linkEditionFilesToDraft({
      editionId: edition.id,
      draftId: draft.id,
      files,
    });

    return { type: "Ok", draftId: draft.id } as const;
  });

  if (res.type !== "Ok") {
    return { type: res.type } as const;
  }

  return { type: "Ok", draftId: res.draftId } as const;
}

async function getArticleDraftId(
  auth: z.input<typeof authSchema>,
  article: z.input<typeof articleIdSchema>,
) {
  const { id: userId } = await authSchema.parseAsync(auth);
  const { id } = await articleIdSchema.parseAsync(article);

  const draft = await getNNDB()
    .selectFrom("drafts")
    .select("id")
    .where("article_id", "=", id)
    .where(eb => eb(
      eb.selectFrom("articles").select("author_id").where("id", "=", id),
      "=", userId))
    .executeTakeFirst();
  return draft?.id ?? null;
}

function makeListArticlesQuery(before: string, limit: number, prevId: number | null) {
  return getNNDB()
    .selectFrom("last_editions as e")
    .innerJoin("articles as a", "a.id", "e.article_id")
    .innerJoin("users as u", "u.id", "a.author_id")
    .innerJoin("article_stats as s", "s.id", "a.id")
    .select("a.id")
    .select("e.id as edition_id")
    .select("e.title")
    .select("a.author_id")
    .select("u.name as author_name")
    .select("first_published_at as published_at")
    .select("s.views_count")
    .select("s.likes_count")
    .select("s.comments_count")
    .select("thumbnail_id")
    .select("thumbnail_name")
    .where(({eb, refTuple, tuple}) => eb(
      refTuple("e.first_published_at", "a.id"), "<", tuple(before, prevId ?? 0)))
    .orderBy(({refTuple}) => refTuple("e.first_published_at", "a.id"), "desc")
    .limit(limit);
}

async function listArticles(payload: z.input<typeof paginationSchema>) {
  const { before, limit, prevId } = paginationSchema.parse(payload);

  return await makeListArticlesQuery(before, limit, prevId).execute();
}

async function listArticlesByAuthor(
  payload: z.input<typeof paginationWithAuthorSchema>,
) {
  const { authorId, before, limit, prevId } =
    paginationWithAuthorSchema.parse(payload);

  return await makeListArticlesQuery(before, limit, prevId)
    .where("a.author_id", "=", authorId)
    .execute();
}

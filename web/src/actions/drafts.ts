"use server";

import { z } from "zod";
import { authSchema } from "@/serverAuth";
import * as newdb from "@/newdb";
import * as Queries from "@/queries_sql";
import * as Files from "@/files";
import { revalidatePath } from "next/cache";
import { webhookNotifyNewArticle } from "@/webhooks";
import { draftIdSchema } from "@/schemas";

export {
  listDrafts,
  getDraft,
  updateDraft,
  deleteDraft,
  createDraft,
  publishDraft,
};

async function listDrafts(auth: z.input<typeof authSchema>) {
  const { id: authorId } = await authSchema.parseAsync(auth);

  return await newdb.list(Queries.listDrafts, { authorId });
}

async function getDraft(
  auth: z.input<typeof authSchema>,
  draftId: z.input<typeof draftIdSchema>,
) {
  const { id: authorId } = await authSchema.parseAsync(auth);
  const { id } = await draftIdSchema.parseAsync(draftId);

  return await newdb.tx(async ({ first, list }) => {
    const draft = await first(Queries.getDraft, { id, authorId: authorId });
    if (!draft) {
      return null;
    }

    const files = await list(Queries.listDraftFiles, { id });

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
    await newdb.option(Queries.updateDraft, { id, userId, title, content })
  )?.ok
    ? "Ok"
    : "NotFound";
}

async function deleteDraft(
  auth: z.input<typeof authSchema>,
  draftId: z.input<typeof draftIdSchema>,
) {
  const { id } = await draftIdSchema.parseAsync(draftId);
  const { id: userId } = await authSchema.parseAsync(auth);

  const res = await newdb.tx(async ({ first, execute }) => {
    const deleteResult = await first(Queries.deleteDraft, { id, userId });
    if (!deleteResult) {
      return { type: "NotFound" } as const;
    }
    await execute(Queries.deleteArticleIfNoEditions, {
      id: deleteResult.articleId,
    });

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

  return await newdb.unique(Queries.createDraft, { authorId });
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
  const { id, notes, notify, rememberNotify, thumbnailId } =
    publishDraftSchema.parse(payload);
  const { id: userId } = await authSchema.parseAsync(auth);

  const res = await newdb.tx(async ({ first, unique, execute, list }) => {
    const hasTitle = await first(Queries.draftHasTitle, { id, userId });
    if (hasTitle === null) {
      return { type: "NotFound" } as const;
    } else if (!hasTitle.hasTitle) {
      return { type: "NoTitle" } as const;
    }

    const files = await list(Queries.listDraftFiles, { id });

    if (thumbnailId !== null) {
      // thumbnail should be one of the files uploaded to this draft
      // and should be an image
      const thumbnail = files.find((f) => f.id === thumbnailId);
      if (!thumbnail || !thumbnail.mimeType.startsWith("image/")) {
        return { type: "InvalidThumbnail" } as const;
      }
    }

    const { articleId, editionId } = await unique(
      Queries.createEditionFromDraft,
      { draftId: id, notes, thumbnail: thumbnailId },
    );

    await execute(Queries.moveDraftFilesToEdition, { draftId: id, editionId });
    await execute(Queries.deleteDraft, { id, userId });

    if (files.length !== 0) {
      await Files.moveDraftFilesToEdition({ draftId: id, editionId });
    }

    if (rememberNotify) {
      await execute(Queries.setUserNewArticleNotifySetting, {
        id: userId,
        newArticleNotify: notify,
      });
    }

    return { type: "Ok", articleId } as const;
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

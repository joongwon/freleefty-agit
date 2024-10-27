"use server";

import { authSchema } from "@/serverAuth";
import * as newdb from "@/newdb";
import * as Queries from "@/queries_sql";
import { z } from "zod";
import * as Files from "@/files";
import { revalidatePath } from "next/cache";
import {
  articleIdSchema,
  paginationSchema,
  paginationWithAuthorSchema,
} from "@/schemas";

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

  const res = await newdb.tx(async ({ first, list, execute }) => {
    const authorId = (await first(Queries.getArticleAuthorId, { id }))
      ?.authorId;
    if (authorId === undefined) {
      return { type: "NotFound" } as const;
    } else if (authorId !== userId) {
      return { type: "Forbidden" } as const;
    }

    const draft = await first(Queries.getDraftIdOfArticle, { id, userId });
    const editions = await list(Queries.listEditionIds, { id });
    await execute(Queries.deleteArticle, { id });
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

  const res = await newdb.tx(async ({ first, unique, list }) => {
    const authorId = (
      await first(Queries.getArticleAuthorId, { id: articleId })
    )?.authorId;
    if (authorId === undefined) {
      return { type: "NotFound" } as const;
    } else if (authorId !== userId) {
      return { type: "Forbidden" } as const;
    }

    const draft = await unique(Queries.createDraftFromArticle, { articleId });
    const edition = await unique(Queries.getLastEditionId, { id: articleId });
    const files = await list(Queries.copyEditionFilesToDraft, {
      editionId: edition.id,
      draftId: draft.id,
    });

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

  return (
    (
      await newdb.option(Queries.getDraftIdOfArticle, {
        id,
        userId,
      })
    )?.id ?? null
  );
}

async function listArticles(payload: z.input<typeof paginationSchema>) {
  const { before, limit, prevId } = paginationSchema.parse(payload);

  return await newdb.list(Queries.listArticles, { before, limit, prevId });
}

async function listArticlesByAuthor(
  payload: z.input<typeof paginationWithAuthorSchema>,
) {
  const { authorId, before, limit, prevId } =
    paginationWithAuthorSchema.parse(payload);

  return await newdb.list(Queries.listArticlesByAuthor, {
    authorId,
    before,
    limit,
    prevId,
  });
}

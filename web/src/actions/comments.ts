"use server";
import { z } from "zod";
import { authSchema } from "@/serverAuth";
import { articleIdSchema, paginationWithAuthorSchema } from "@/schemas";
import * as newdb from "@/newdb";
import * as Queries from "@/queries_sql";
import { revalidatePath } from "next/cache";

export { createComment, deleteComment, listUserComments };

const createCommentSchema = z.object({
  article: articleIdSchema,
  content: z.string().min(1).max(1023),
});

async function createComment(
  auth: z.input<typeof authSchema>,
  payload: z.input<typeof createCommentSchema>,
) {
  const { id: userId } = await authSchema.parseAsync(auth);
  const {
    content,
    article: { id: articleId },
  } = createCommentSchema.parse(payload);

  await newdb.execute(Queries.createComment, {
    articleId,
    authorId: userId,
    content,
  });

  revalidatePath(`/articles/${articleId}`);
  return { type: "Ok" } as const;
}

const deleteCommentSchema = z.object({
  article: articleIdSchema,
  id: z.number(),
});

async function deleteComment(
  auth: z.input<typeof authSchema>,
  payload: z.input<typeof deleteCommentSchema>,
) {
  const { id: userId } = await authSchema.parseAsync(auth);
  const {
    id,
    article: { id: articleId },
  } = deleteCommentSchema.parse(payload);

  const res = await newdb.tx(async ({ first, execute }) => {
    const authorId = (await first(Queries.getCommentAuthorId, { id }))
      ?.authorId;
    if (authorId === undefined) {
      return { type: "NotFound" } as const;
    } else if (authorId !== userId) {
      return { type: "Forbidden" } as const;
    }

    await execute(Queries.deleteComment, { id });
    return { type: "Ok" } as const;
  });
  revalidatePath(`/articles/${articleId}`);
  return res;
}

async function listUserComments(
  payload: z.input<typeof paginationWithAuthorSchema>,
) {
  const { authorId, before, limit, prevId } =
    paginationWithAuthorSchema.parse(payload);

  return await newdb.list(Queries.listUserComments, {
    authorId,
    before,
    limit,
    prevId,
  });
}

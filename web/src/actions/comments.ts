"use server";
import { z } from "zod";
import { authSchema } from "@/serverAuth";
import {
  articleIdSchema,
  PaginationWithAuthor,
  paginationWithAuthorSchema,
} from "@/schemas";
import { revalidatePath } from "next/cache";
import { getNNDB } from "@/db";
import { makeListUserCommentsQuery } from "@/queries";

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

  await getNNDB()
    .insertInto("comments")
    .values({ article_id: articleId, author_id: userId, content })
    .execute();

  revalidatePath(`/articles/${articleId}`);
  return { type: "Ok" } as const;
}

const deleteCommentSchema = z.object({
  article: articleIdSchema,
  id: z.number().brand<"CommentsId">(),
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

  const res = await getNNDB()
    .transaction()
    .execute(async (tx) => {
      const comment = await tx
        .selectFrom("comments")
        .select("author_id")
        .where("id", "=", id)
        .executeTakeFirst();
      if (!comment) {
        return { type: "NotFound" } as const;
      } else if (comment.author_id !== userId) {
        return { type: "Forbidden" } as const;
      }

      await tx.deleteFrom("comments").where("id", "=", id).execute();
      return { type: "Ok" } as const;
    });
  revalidatePath(`/articles/${articleId}`);
  return res;
}

async function listUserComments(payload: PaginationWithAuthor<"CommentsId">) {
  const { authorId, before, limit, prevId } =
    paginationWithAuthorSchema<"CommentsId">().parse(payload);

  return await makeListUserCommentsQuery(getNNDB(), {
    authorId,
    before,
    limit,
    prevId,
  }).execute();
}

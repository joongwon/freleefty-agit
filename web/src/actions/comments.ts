"use server";
import { z } from "zod";
import { authSchema } from "@/serverAuth";
import { articleIdSchema, paginationWithAuthorSchema } from "@/schemas";
import { revalidatePath } from "next/cache";
import { getNNDB } from "@/db";

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

  const res = await getNNDB().transaction().execute(async (tx) => {
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

async function listUserComments(
  payload: z.input<typeof paginationWithAuthorSchema>,
) {
  const { authorId, before, limit, prevId } =
    paginationWithAuthorSchema.parse(payload);

  return await getNNDB()
    .selectFrom("comments")
    .innerJoin("articles", "comments.article_id", "articles.id")
    .innerJoin("last_editions", "articles.id", "last_editions.article_id")
    .innerJoin("users as article_author", "comments.author_id", "article_author.id")
    .select("comments.id")
    .select("comments.content")
    .select("comments.created_at")
    .select("comments.article_id")
    .select("article_author.name as article_author_name")
    .select("last_editions.title as article_title")
    .where("comments.author_id", "=", authorId)
    .where(({ eb, refTuple, tuple }) =>
      eb(refTuple("comments.created_at", "comments.id"), "<", tuple(before, prevId ?? 0))
    )
    .orderBy(["comments.created_at desc", "comments.id desc"])
    .limit(limit)
    .execute();
}

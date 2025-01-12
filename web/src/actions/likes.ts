"use server";
import { authSchema } from "@/serverAuth";
import { articleIdSchema } from "@/schemas";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getNNDB } from "@/db";

export { likeArticle, unlikeArticle, listLikers };

async function likeArticle(
  auth: z.input<typeof authSchema>,
  article: z.input<typeof articleIdSchema>,
) {
  const { id: userId } = await authSchema.parseAsync(auth);
  const { id: articleId } = await articleIdSchema.parseAsync(article);

  try {
    await getNNDB()
      .insertInto("likes")
      .values({ article_id: articleId, user_id: userId })
      .execute();
  } catch (e) {
    if ((e as { constraint?: string })?.constraint === "likes_pkey") {
      return { type: "InvalidAction" } as const;
    }
    throw e;
  }
  revalidatePath(`/articles/${articleId}`);
  return { type: "Ok" } as const;
}

async function unlikeArticle(
  auth: z.input<typeof authSchema>,
  article: z.input<typeof articleIdSchema>,
) {
  const { id: userId } = await authSchema.parseAsync(auth);
  const { id: articleId } = await articleIdSchema.parseAsync(article);

  const res = await getNNDB()
    .deleteFrom("likes")
    .where("article_id", "=", articleId)
    .where("user_id", "=", userId)
    .executeTakeFirst();

  revalidatePath(`/articles/${articleId}`);
  return { type: res.numDeletedRows === 1n ? "Ok" : "InvalidAction" } as const;
}

async function listLikers(article: z.input<typeof articleIdSchema>) {
  const { id: articleId } = await articleIdSchema.parseAsync(article);

  return await getNNDB()
    .selectFrom("likes")
    .innerJoin("users", "likes.user_id", "users.id")
    .select("user_id")
    .select("name as user_name")
    .select("created_at")
    .where("article_id", "=", articleId)
    .execute();
}

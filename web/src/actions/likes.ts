"use server";
import { authSchema } from "@/serverAuth";
import { articleIdSchema } from "@/schemas";
import * as newdb from "@/newdb";
import * as Queries from "@/queries_sql";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export { likeArticle, unlikeArticle, listLikers };

async function likeArticle(
  auth: z.input<typeof authSchema>,
  article: z.input<typeof articleIdSchema>,
) {
  const { id: userId } = await authSchema.parseAsync(auth);
  const { id: articleId } = await articleIdSchema.parseAsync(article);

  try {
    await newdb.execute(Queries.createLike, { articleId, userId });
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

  const res = await newdb.option(Queries.deleteLike, { articleId, userId });
  revalidatePath(`/articles/${articleId}`);
  return { type: res?.deleted ? "Ok" : "InvalidAction" } as const;
}

async function listLikers(article: z.input<typeof articleIdSchema>) {
  const { id: articleId } = await articleIdSchema.parseAsync(article);

  return await newdb.list(Queries.listLikes, { articleId });
}

"use server";
import { z } from "zod";
import { getRedis } from "@/db";
import { getNNDB } from "@/db";
import { ArticlesId } from "@/nndb/public/Articles";

const submitViewSchema = z.object({
  viewToken: z.string(),
});
export async function submitView(payload: z.input<typeof submitViewSchema>) {
  const { viewToken } = submitViewSchema.parse(payload);

  const redis = await getRedis();
  const rawArticleId = await redis.getDel(`view:${viewToken}`);
  if (!rawArticleId) {
    return;
  }
  const articleId = parseInt(rawArticleId);
  await getNNDB()
    .insertInto("views")
    .values({ article_id: <ArticlesId>articleId })
    .execute();
}

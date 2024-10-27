"use server";
import { z } from "zod";
import { getRedis } from "@/db";
import * as newdb from "@/newdb";
import * as Queries from "@/queries_sql";

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
  await newdb.execute(Queries.createViewLog, { articleId });
}

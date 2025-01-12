import { Kysely } from "kysely";
import DB from "@/nndb/Database";

export async function listArticles(
  db: Kysely<DB>,
  p: {
    before: string;
    limit: number;
    prevId?: number;
  }
) {
  return db.selectFrom("last_editions as e")
    .innerJoin("articles as a", "e.article_id", "a.id")
    .innerJoin("users as u", "a.author_id", "u.id")
    .innerJoin("article_stats as s", "a.id", "s.id")
    .select([
      "a.id",
      "e.id as edition_id",
      "title",
      "author_id",
      "name",
      "first_published_at as published_at",
      "comments_count",
      "views_count",
      "likes_count",
      "thumbnail_id",
      "thumbnail_name",
    ])
    .where(({eb,tuple,refTuple}) =>
           eb(refTuple("e.published_at", "a.id"), "<", tuple(p.before, p.prevId ?? 0)))
    .orderBy("e.published_at", "desc")
    .limit(p.limit)

}

import { Kysely } from "kysely";
import DB from "@/nndb/Database";

export function makeListDraftsQuery<T extends Kysely<DB>>(db: T, authorId: string) {
  return db
    .selectFrom("drafts")
    .innerJoin("articles", "drafts.article_id", "articles.id")
    .select("id")
    .select("title")
    .select("created_at")
    .select("updated_at")
    .select("article_id")
    .select(eb => eb.exists(
      eb.selectFrom("last_editions")
      .select("id")
      .whereRef("article_id", "=", "drafts.id")
    ).as("published"))
    .where("author_id", "=", authorId)
}

export function makeListUserCommentsQuery<T extends Kysely<DB>>(
  db: T,
  payload: { authorId: string, before: string, limit: number, prevId: number | null }
) {
  const { authorId, before, limit, prevId } = payload;
  return db
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
    .where(eb =>
      eb(eb.refTuple("comments.created_at", "comments.id"), "<", eb.tuple(before, prevId ?? 0))
    )
    .orderBy(["comments.created_at desc", "comments.id desc"])
    .limit(limit);
}

export function makeListArticlesQuery<T extends Kysely<DB>>(db: T,
  payload: {before: string, limit: number, prevId: number | null}) {
  const { before, limit, prevId } = payload
  return db
    .selectFrom("last_editions as e")
    .innerJoin("articles as a", "a.id", "e.article_id")
    .innerJoin("users as u", "u.id", "a.author_id")
    .innerJoin("article_stats as s", "s.id", "a.id")
    .select("a.id")
    .select("e.id as edition_id")
    .select("e.title")
    .select("a.author_id")
    .select("u.name as author_name")
    .select("first_published_at as published_at")
    .select("s.views_count")
    .select("s.likes_count")
    .select("s.comments_count")
    .select("thumbnail_id")
    .select("thumbnail_name")
    .where(eb => eb(
      eb.refTuple("e.first_published_at", "a.id"), "<", eb.tuple(before, prevId ?? 0)))
    .orderBy(eb => eb.refTuple("e.first_published_at", "a.id"), "desc")
    .limit(limit);
}

import { Kysely } from "kysely";
import DB from "@/nndb/Database";
import { UsersId } from "./nndb/public/Users";
import { CommentsId } from "./nndb/public/Comments";
import { PgTimestamp } from "./nndb/utils";
import { ArticlesId } from "./nndb/public/Articles";

export function makeListDraftsQuery<T extends Kysely<DB>>(
  db: T,
  authorId: UsersId,
) {
  return db
    .selectFrom("drafts")
    .innerJoin("articles", "drafts.article_id", "articles.id")
    .select("drafts.id")
    .select("title")
    .select("created_at")
    .select("updated_at")
    .select("article_id")
    .select((eb) =>
      eb
        .exists(
          eb
            .selectFrom("last_editions")
            .select("id")
            .whereRef("article_id", "=", "drafts.id"),
        )
        .as("published"),
    )
    .where("author_id", "=", authorId);
}

function makeListCommentsQuery<T extends Kysely<DB>>(
  db: T,
  payload: {
    before: PgTimestamp;
    limit: number;
    prevId: CommentsId | null;
  },
) {
  const { before, limit, prevId } = payload;
  return db
    .selectFrom("comments")
    .innerJoin("articles", "comments.article_id", "articles.id")
    .innerJoin("last_editions", "articles.id", "last_editions.article_id")
    .innerJoin(
      "users as article_author",
      "comments.author_id",
      "article_author.id",
    )
    .select("comments.id")
    .select("comments.content")
    .select("comments.created_at")
    .select("comments.article_id")
    .select("last_editions.title as article_title")
    .where((eb) =>
      eb(
        eb.refTuple("comments.created_at", "comments.id"),
        "<",
        eb.tuple(before, prevId ?? <CommentsId>0),
      ),
    )
    .orderBy(["comments.created_at desc", "comments.id desc"])
    .limit(limit);
}

export function makeListUserCommentsQuery<T extends Kysely<DB>>(
  db: T,
  payload: {
    authorId: UsersId;
    before: PgTimestamp;
    limit: number;
    prevId: CommentsId | null;
  },
) {
  return makeListCommentsQuery(db, payload).where(
    "comments.author_id",
    "=",
    payload.authorId,
  )
    .select("article_author.name as article_author_name");
}

export function makeListAllCommentsQuery<T extends Kysely<DB>>(
  db: T,
  payload: {
    before: PgTimestamp;
    limit: number;
    prevId: CommentsId | null;
  },
) {
  return makeListCommentsQuery(db, payload)
    .innerJoin("users as comment_author", "comments.author_id", "comment_author.id")
    .select("comment_author.name as author_name")
    .select("comment_author.id as author_id");
}


export function makeListArticlesQuery<T extends Kysely<DB>>(
  db: T,
  payload: { before: PgTimestamp; limit: number; prevId: ArticlesId | null },
) {
  const { before, limit, prevId } = payload;
  return db
    .selectFrom("last_editions as e")
    .innerJoin("articles as a", "a.id", "e.article_id")
    .innerJoin("users as u", "u.id", "a.author_id")
    .innerJoin("article_stats as s", "s.id", "a.id")
    .leftJoin("files as thumbnail", "e.thumbnail", "thumbnail.id")
    .select("a.id")
    .select("e.id as edition_id")
    .select("e.title")
    .select("a.author_id")
    .select("u.name as author_name")
    .select("first_published_at as published_at")
    .select("s.views_count")
    .select("s.likes_count")
    .select("s.comments_count")
    .select("thumbnail.id as thumbnail_id")
    .select("thumbnail.name as thumbnail_name")
    .where((eb) =>
      eb(
        eb.refTuple("e.first_published_at", "a.id"),
        "<",
        eb.tuple(before, prevId ?? <ArticlesId>0),
      ),
    )
    .orderBy((eb) => eb.refTuple("e.first_published_at", "a.id"), "desc")
    .limit(limit);
}

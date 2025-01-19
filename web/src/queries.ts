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
    .select(({exists, selectFrom}) => exists(
      selectFrom("last_editions")
      .select("id")
      .whereRef("article_id", "=", "drafts.id")
    ).as("published"))
    .where("author_id", "=", authorId)
}

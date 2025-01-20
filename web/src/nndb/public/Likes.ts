import { PgTimestamp } from "@/nndb/utils";
import type { ArticlesId } from './Articles';
import type { UsersId } from './Users';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Represents the table public.likes */
export default interface LikesTable {
  article_id: ColumnType<ArticlesId, ArticlesId, ArticlesId>;

  user_id: ColumnType<UsersId, UsersId, UsersId>;

  created_at: ColumnType<PgTimestamp, PgTimestamp | undefined, PgTimestamp>;
}

export type Likes = Selectable<LikesTable>;

export type NewLikes = Insertable<LikesTable>;

export type LikesUpdate = Updateable<LikesTable>;
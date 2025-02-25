import { z } from "zod";
import { PgTimestamp } from "@/nndb/utils";
import type { UsersId } from './Users';
import type { ArticlesId } from './Articles';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for public.comments */
export type CommentsId = number & z.BRAND<'CommentsId'>;

/** Represents the table public.comments */
export default interface CommentsTable {
  id: ColumnType<CommentsId, CommentsId | undefined, CommentsId>;

  content: ColumnType<string, string, string>;

  author_id: ColumnType<UsersId, UsersId, UsersId>;

  article_id: ColumnType<ArticlesId, ArticlesId, ArticlesId>;

  created_at: ColumnType<PgTimestamp, PgTimestamp | undefined, PgTimestamp>;
}

export type Comments = Selectable<CommentsTable>;

export type NewComments = Insertable<CommentsTable>;

export type CommentsUpdate = Updateable<CommentsTable>;
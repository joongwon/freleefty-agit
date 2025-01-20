import { z } from "zod";
import { PgTimestamp } from "@/nndb/utils";
import type { ArticlesId } from './Articles';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for public.drafts */
export type DraftsId = number & z.BRAND<'DraftsId'>;

/** Represents the table public.drafts */
export default interface DraftsTable {
  id: ColumnType<DraftsId, DraftsId | undefined, DraftsId>;

  title: ColumnType<string, string | undefined, string>;

  content: ColumnType<string, string | undefined, string>;

  created_at: ColumnType<PgTimestamp, PgTimestamp | undefined, PgTimestamp>;

  updated_at: ColumnType<PgTimestamp, PgTimestamp | undefined, PgTimestamp>;

  article_id: ColumnType<ArticlesId, ArticlesId, ArticlesId>;
}

export type Drafts = Selectable<DraftsTable>;

export type NewDrafts = Insertable<DraftsTable>;

export type DraftsUpdate = Updateable<DraftsTable>;
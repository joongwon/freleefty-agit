import { PgTimestamp } from "@/nndb/utils";
import type { EditionsId } from './Editions';
import type { ArticlesId } from './Articles';
import type { FilesId } from './Files';
import type { ColumnType, Selectable } from 'kysely';

/** Represents the view public.last_editions */
export default interface LastEditionsTable {
  id: ColumnType<EditionsId, never, never>;

  article_id: ColumnType<ArticlesId, never, never>;

  notes: ColumnType<string, never, never>;

  published_at: ColumnType<PgTimestamp, never, never>;

  title: ColumnType<string, never, never>;

  content: ColumnType<string, never, never>;

  first_published_at: ColumnType<PgTimestamp, never, never>;

  last_published_at: ColumnType<PgTimestamp, never, never>;

  thumbnail: ColumnType<FilesId | null, never, never>;
}

export type LastEditions = Selectable<LastEditionsTable>;
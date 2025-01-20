import { PgTimestamp } from "@/nndb/utils";
import type { ArticlesId } from './Articles';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for public.views */
export type ViewsId = number & { __brand?: 'ViewsId' };

/** Represents the table public.views */
export default interface ViewsTable {
  id: ColumnType<ViewsId, never, never>;

  article_id: ColumnType<ArticlesId, ArticlesId, ArticlesId>;

  created_at: ColumnType<PgTimestamp, PgTimestamp | undefined, PgTimestamp>;
}

export type Views = Selectable<ViewsTable>;

export type NewViews = Insertable<ViewsTable>;

export type ViewsUpdate = Updateable<ViewsTable>;
import type { ArticlesId } from './Articles';
import type { ColumnType, Selectable } from 'kysely';

/** Represents the view public.article_stats */
export default interface ArticleStatsTable {
  id: ColumnType<ArticlesId, never, never>;

  comments_count: ColumnType<string, never, never>;

  views_count: ColumnType<string, never, never>;

  likes_count: ColumnType<string, never, never>;
}

export type ArticleStats = Selectable<ArticleStatsTable>;
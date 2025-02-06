import type { ArticlesId } from './Articles';
import type { CategoriesId } from './Categories';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Represents the table public.article_categories */
export default interface ArticleCategoriesTable {
  article_id: ColumnType<ArticlesId, ArticlesId, ArticlesId>;

  category_id: ColumnType<CategoriesId, CategoriesId, CategoriesId>;
}

export type ArticleCategories = Selectable<ArticleCategoriesTable>;

export type NewArticleCategories = Insertable<ArticleCategoriesTable>;

export type ArticleCategoriesUpdate = Updateable<ArticleCategoriesTable>;
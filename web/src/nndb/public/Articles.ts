import type { UsersId } from './Users';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for public.articles */
export type ArticlesId = number & { __brand?: 'ArticlesId' };

/** Represents the table public.articles */
export default interface ArticlesTable {
  id: ColumnType<ArticlesId, ArticlesId | undefined, ArticlesId>;

  author_id: ColumnType<UsersId, UsersId, UsersId>;
}

export type Articles = Selectable<ArticlesTable>;

export type NewArticles = Insertable<ArticlesTable>;

export type ArticlesUpdate = Updateable<ArticlesTable>;
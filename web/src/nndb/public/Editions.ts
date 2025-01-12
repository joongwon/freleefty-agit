// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import type { ArticlesId } from './Articles';
import type { FilesId } from './Files';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for public.editions */
export type EditionsId = number & { __brand?: 'EditionsId' };

/** Represents the table public.editions */
export default interface EditionsTable {
  id: ColumnType<EditionsId, never, never>;

  article_id: ColumnType<ArticlesId, ArticlesId, ArticlesId>;

  notes: ColumnType<string, string, string>;

  published_at: ColumnType<string, string | undefined, string>;

  title: ColumnType<string, string, string>;

  content: ColumnType<string, string, string>;

  thumbnail: ColumnType<FilesId | null, FilesId | null, FilesId | null>;
}

export type Editions = Selectable<EditionsTable>;

export type NewEditions = Insertable<EditionsTable>;

export type EditionsUpdate = Updateable<EditionsTable>;
import { z } from "zod";
import { PgTimestamp } from "@/nndb/utils";
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for public.categories */
export type CategoriesId = number & z.BRAND<'CategoriesId'>;

/** Represents the table public.categories */
export default interface CategoriesTable {
  id: ColumnType<CategoriesId, CategoriesId | undefined, CategoriesId>;

  name: ColumnType<string, string, string>;

  is_group: ColumnType<boolean, boolean, boolean>;

  created_at: ColumnType<PgTimestamp, PgTimestamp | undefined, PgTimestamp>;

  parent_id: ColumnType<CategoriesId | null, CategoriesId | null, CategoriesId | null>;
}

export type Categories = Selectable<CategoriesTable>;

export type NewCategories = Insertable<CategoriesTable>;

export type CategoriesUpdate = Updateable<CategoriesTable>;
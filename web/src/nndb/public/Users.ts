import { z } from "zod";
import { PgTimestamp } from "@/nndb/utils";
import type { default as Role } from './Role';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for public.users */
export type UsersId = string & z.BRAND<'UsersId'>;

/** Represents the table public.users */
export default interface UsersTable {
  id: ColumnType<UsersId, UsersId, UsersId>;

  name: ColumnType<string, string, string>;

  naver_id: ColumnType<string, string, string>;

  role: ColumnType<Role, Role | undefined, Role>;

  name_updated_at: ColumnType<PgTimestamp, PgTimestamp | undefined, PgTimestamp>;

  new_article_notify: ColumnType<boolean, boolean | undefined, boolean>;
}

export type Users = Selectable<UsersTable>;

export type NewUsers = Insertable<UsersTable>;

export type UsersUpdate = Updateable<UsersTable>;
import { z } from "zod";
import { PgTimestamp } from "@/nndb/utils";
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for public.pgmigrations */
export type PgmigrationsId = number & z.BRAND<'PgmigrationsId'>;

/** Represents the table public.pgmigrations */
export default interface PgmigrationsTable {
  id: ColumnType<PgmigrationsId, PgmigrationsId | undefined, PgmigrationsId>;

  name: ColumnType<string, string, string>;

  run_on: ColumnType<PgTimestamp, PgTimestamp, PgTimestamp>;
}

export type Pgmigrations = Selectable<PgmigrationsTable>;

export type NewPgmigrations = Insertable<PgmigrationsTable>;

export type PgmigrationsUpdate = Updateable<PgmigrationsTable>;
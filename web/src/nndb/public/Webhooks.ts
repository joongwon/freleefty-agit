import { z } from "zod";
import { PgTimestamp } from "@/nndb/utils";
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for public.webhooks */
export type WebhooksId = number & z.BRAND<'WebhooksId'>;

/** Represents the table public.webhooks */
export default interface WebhooksTable {
  id: ColumnType<WebhooksId, WebhooksId | undefined, WebhooksId>;

  name: ColumnType<string, string, string>;

  url: ColumnType<string, string, string>;

  createdAt: ColumnType<PgTimestamp, PgTimestamp | undefined, PgTimestamp>;
}

export type Webhooks = Selectable<WebhooksTable>;

export type NewWebhooks = Insertable<WebhooksTable>;

export type WebhooksUpdate = Updateable<WebhooksTable>;
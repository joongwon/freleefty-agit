// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for public.webhooks */
export type WebhooksId = number & { __brand?: 'WebhooksId' };

/** Represents the table public.webhooks */
export default interface WebhooksTable {
  id: ColumnType<WebhooksId, WebhooksId | undefined, WebhooksId>;

  name: ColumnType<string, string, string>;

  url: ColumnType<string, string, string>;

  createdAt: ColumnType<string, string | undefined, string>;
}

export type Webhooks = Selectable<WebhooksTable>;

export type NewWebhooks = Insertable<WebhooksTable>;

export type WebhooksUpdate = Updateable<WebhooksTable>;
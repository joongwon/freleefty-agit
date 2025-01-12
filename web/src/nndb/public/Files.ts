// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import type { EditionsId } from './Editions';
import type { DraftsId } from './Drafts';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';

/** Identifier type for public.files */
export type FilesId = number & { __brand?: 'FilesId' };

/** Represents the table public.files */
export default interface FilesTable {
  id: ColumnType<FilesId, never, never>;

  edition_id: ColumnType<EditionsId | null, EditionsId | null, EditionsId | null>;

  draft_id: ColumnType<DraftsId | null, DraftsId | null, DraftsId | null>;

  name: ColumnType<string, string, string>;

  mime_type: ColumnType<string, string, string>;

  uploaded_at: ColumnType<string, string | undefined, string>;
}

export type Files = Selectable<FilesTable>;

export type NewFiles = Insertable<FilesTable>;

export type FilesUpdate = Updateable<FilesTable>;
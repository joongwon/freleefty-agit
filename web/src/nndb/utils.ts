import { z } from 'zod';

export type PgTimestamp = string & z.BRAND<"PgTimestamp">;
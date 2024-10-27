import { z } from "zod";

export const articleIdSchema = z.object({
  id: z.number(),
});

export const draftIdSchema = z.object({
  id: z.number(),
});

export const paginationSchema = z.object({
  before: z.string(),
  limit: z.number(),
  prevId: z.number().nullable(),
});

export const paginationWithAuthorSchema = paginationSchema.extend({
  authorId: z.string(),
});

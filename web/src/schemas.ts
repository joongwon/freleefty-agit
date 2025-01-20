import { z } from "zod";

export const articleIdSchema = z.object({
  id: z.number().brand<"ArticlesId">(),
});

export const draftIdSchema = z.object({
  id: z.number().brand<"DraftsId">(),
});

export function paginationSchema<T extends string>() {
  return z.object({
    before: z.string().brand<"PgTimestamp">(),
    limit: z.number(),
    prevId: z.number().brand<T>().nullable(),
  });
}

export type Pagination<T extends string> = z.input<
  ReturnType<typeof paginationSchema<T>>
>;

export function paginationWithAuthorSchema<T extends string>() {
  return paginationSchema<T>().extend({
    authorId: z.string().brand<"UsersId">(),
  });
}

export type PaginationWithAuthor<T extends string> = z.input<
  ReturnType<typeof paginationWithAuthorSchema<T>>
>;

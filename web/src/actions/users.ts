"use server";
import { z } from "zod";
import { authSchema } from "@/serverAuth";
import { getNNDB } from "@/db";
import { sql } from "kysely";

const nameUpdateDuration = 24 * 60 * 60 * 1000 * 3;
const userNameSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[^\s]+( [^\s]+)*$/),
});

export async function updateUserName(
  auth: z.input<typeof authSchema>,
  user: z.input<typeof userNameSchema>,
) {
  const { id: userId } = await authSchema.parseAsync(auth);
  const { name } = userNameSchema.parse(user);

  const now = Date.now();
  const res = await getNNDB()
    .transaction()
    .execute(async (tx) => {
      const { name_updated_at: nameUpdatedAtRaw } = await tx
        .selectFrom("users")
        .select("name_updated_at")
        .where("id", "=", userId)
        .executeTakeFirstOrThrow();
      const nameUpdatedAt = Date.parse(nameUpdatedAtRaw);
      if (now - nameUpdatedAt < nameUpdateDuration) {
        return {
          type: "TooSoon",
          remaining: nameUpdateDuration - (now - nameUpdatedAt),
        } as const;
      }
      await tx
        .updateTable("users")
        .set("name", name)
        .set("name_updated_at", sql`now()`)
        .where("id", "=", userId)
        .execute();
      return {
        type: "Ok",
      } as const;
    });

  return res;
}

export async function getUserNewArticleNotify(
  auth: z.input<typeof authSchema>,
) {
  const { id: userId } = await authSchema.parseAsync(auth);

  const res = await getNNDB()
    .selectFrom("users")
    .select("new_article_notify")
    .where("id", "=", userId)
    .executeTakeFirst();
  if (!res) {
    return { type: "NotFound" } as const;
  }
  return { type: "Ok", notify: res.new_article_notify } as const;
}

const notifySchema = z.object({
  notify: z.boolean(),
});
export async function setUserNewArticleNotify(
  auth: z.input<typeof authSchema>,
  payload: z.input<typeof notifySchema>,
) {
  const { id: userId } = await authSchema.parseAsync(auth);
  const { notify } = notifySchema.parse(payload);

  await getNNDB()
    .updateTable("users")
    .set("new_article_notify", notify)
    .where("id", "=", userId)
    .execute();
  return { type: "Ok" } as const;
}

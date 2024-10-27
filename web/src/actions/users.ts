"use server";
import { z } from "zod";
import { authSchema } from "@/serverAuth";
import * as newdb from "@/newdb";
import * as Queries from "@/queries_sql";

const nameUpdateDuration = 24 * 60 * 60 * 1000 * 7;
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
  const res = await newdb.tx(async ({ unique, execute }) => {
    const { nameUpdatedAt: nameUpdatedAtRaw } = await unique(
      Queries.getUserNameUpdatedAt,
      {
        id: userId,
      },
    );
    const nameUpdatedAt = Date.parse(nameUpdatedAtRaw);
    if (now - nameUpdatedAt < nameUpdateDuration) {
      return {
        type: "TooSoon",
        remaining: nameUpdateDuration - (now - nameUpdatedAt),
      } as const;
    }
    await execute(Queries.updateUserName, { id: userId, name });
    return {
      type: "Ok",
      profile: await unique(Queries.getUserById, { userId }),
    } as const;
  });

  return res;
}

export async function getUserNewArticleNotify(
  auth: z.input<typeof authSchema>,
) {
  const { id: userId } = await authSchema.parseAsync(auth);

  const res = await newdb.option(Queries.getUserNewArticleNotifySetting, {
    id: userId,
  });
  if (!res) {
    return { type: "NotFound" } as const;
  }
  return { type: "Ok", notify: res.newArticleNotify } as const;
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

  await newdb.execute(Queries.setUserNewArticleNotifySetting, {
    id: userId,
    newArticleNotify: notify,
  });
  return { type: "Ok" } as const;
}

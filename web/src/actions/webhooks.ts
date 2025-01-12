"use server";
import { z } from "zod";
import { authSchema } from "@/serverAuth";
import { webhookSendEmbed } from "@/webhooks";
import { getNNDB } from "@/db";

const createWebhookSchema = z.object({
  name: z.string().min(1).max(255),
  url: z.string().min(1).max(255),
});
export async function createWebhook(
  auth: z.input<typeof authSchema>,
  payload: z.input<typeof createWebhookSchema>,
) {
  const { role } = await authSchema.parseAsync(auth);
  const { name, url } = createWebhookSchema.parse(payload);

  if (role !== "admin") {
    return { type: "Forbidden" };
  }

  await getNNDB()
    .insertInto("webhooks")
    .values({ name, url })
    .execute();
  void webhookSendEmbed(url, {
    title: "안녕하세요!",
    description: "오늘부터 아지트새글을 알려드려요!",
    url: "https://blog.freleefty.org/",
  });
  return { type: "Ok" };
}

const webhookIdSchema = z.object({
  id: z.number(),
});
export async function deleteWebhook(
  auth: z.input<typeof authSchema>,
  payload: z.input<typeof webhookIdSchema>,
) {
  const { id } = webhookIdSchema.parse(payload);
  const { role } = await authSchema.parseAsync(auth);

  if (role !== "admin") {
    return { type: "Forbidden" } as const;
  }
  const res = await getNNDB()
    .deleteFrom("webhooks")
    .where("id", "=", id)
    .returning("url")
    .executeTakeFirst();
  if (!res) {
    return { type: "NotFound" } as const;
  }
  void webhookSendEmbed(res.url, {
    title: "안녕히계세요!",
    description: "이젠 새글 알림을 드리지 않아요... 인연이 된다면 다시 만나요!",
    url: "https://blog.freleefty.org/",
  });
  return { type: "Ok" } as const;
}

export async function listWebhooks(auth: z.input<typeof authSchema>) {
  const { role } = await authSchema.parseAsync(auth);
  if (role !== "admin") {
    return { type: "Forbidden" } as const;
  }
  const webhooks = await getNNDB()
    .selectFrom("webhooks")
    .select(["id", "name", "url"])
    .execute();
  return { type: "Ok", webhooks } as const;
}

import { getNNDB } from "@/db";

export async function webhookSendEmbed(
  webhookUrl: string,
  embed: {
    title?: string;
    description?: string;
    author?: { name: string; url: string };
    url?: string;
  },
) {
  const payload = {
    username: "아지트새글알리미",
    avatar_url: "https://blog.freleefty.org/img/discord-avatar.png",
    embeds: [
      {
        title: embed.title,
        type: "rich",
        description: embed.description,
        author: embed.author,
        url: embed.url,
      },
    ],
  };
  const payloadString = JSON.stringify(payload);
  await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payloadString,
  });
}

export async function webhookNotifyNewArticle(articleId: number) {
  const article = await getNNDB()
    .selectFrom("last_editions")
    .innerJoin("articles", "last_editions.article_id", "articles.id")
    .innerJoin("users", "articles.author_id", "users.id")
    .select("title")
    .select("author_id")
    .select("name as author_name")
    .where("articles.id", "=", articleId)
    .executeTakeFirst();
  if (!article) {
    console.error(
      `webhookNorifyNewArticle(): article with id=${articleId} not found`,
    );
    return;
  }
  const webhooks = await getNNDB()
    .selectFrom("webhooks")
    .select("url")
    .execute();
  await Promise.all(
    webhooks.map(({ url }) =>
      webhookSendEmbed(url, {
        title: article.title,
        author: {
          name: article.author_name,
          url: `https://blog.freleefty.org/users/${article.author_id}/`,
        },
        url: `https://blog.freleefty.org/articles/${articleId}`,
      }),
    ),
  );
}

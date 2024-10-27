import * as newdb from "@/newdb";
import * as Queries from "@/queries_sql";

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
  const article = await newdb.option(Queries.getArticleForWebhook, {
    id: articleId,
  });
  if (!article) {
    console.error(
      `webhookNorifyNewArticle(): article with id=${articleId} not found`,
    );
    return;
  }
  const webhooks = await newdb.list(Queries.listWebhooks, undefined);
  await Promise.all(
    webhooks.map(({ url }) =>
      webhookSendEmbed(url, {
        title: article.title,
        author: {
          name: article.authorName,
          url: `https://blog.freleefty.org/users/${article.authorId}/`,
        },
        url: `https://blog.freleefty.org/articles/${articleId}`,
      }),
    ),
  );
}

import { getRedis } from "@/db";
import { notFound } from "next/navigation";
import * as ArticleList from "@/components/ArticleList";
import Time from "@/components/Time";
import { FAVORITE, VISIBILITY, ARROW_UP, ARROW_DOWN } from "@/components/icons";
import { parseSafeInt } from "@/utils";
import Buttons from "./Buttons";
import DeleteCommentButton from "./DeleteCommentButton";
import { randomUUID } from "crypto";
import SubmitView from "./SubmitView";
import Viewer from "@/components/Viewer";
import { cache } from "react";
import { getEnv } from "@/env";
import * as CommentList from "@/components/CommentList";
import Link from "next/link";
import { getNNDB } from "@/db";

const getArticle = cache(async (articleId: number) => {
  return await getNNDB()
    .transaction()
    .execute(async (tx) => {
      const article = await tx
        .selectFrom("articles")
        .innerJoin("users", "articles.author_id", "users.id")
        .innerJoin("last_editions", "articles.id", "last_editions.article_id")
        .innerJoin("article_stats", "articles.id", "article_stats.id")
        .where("articles.id", "=", articleId)
        .select("articles.id as id")
        .select("last_editions.id as edition_id")
        .select("title")
        .select("content")
        .select("author_id")
        .select("users.name as author_name")
        .select("views_count")
        .select("likes_count")
        .select("first_published_at")
        .select("last_published_at")
        .executeTakeFirst();
      if (!article) {
        return null;
      }

      const editionsCount = await tx
        .selectFrom("editions")
        .where("article_id", "=", articleId)
        .select((eb) => eb.fn.countAll().as("count"))
        .executeTakeFirstOrThrow();

      const makeAdjacentQuery = () =>
        tx
          .selectFrom("articles")
          .innerJoin("last_editions", "articles.id", "last_editions.article_id")
          .innerJoin("users", "articles.author_id", "users.id")
          .innerJoin("article_stats", "articles.id", "article_stats.id")
          .select("articles.id as id")
          .select("last_editions.id as edition_id")
          .select("title")
          .select("author_id")
          .select("users.name as author_name")
          .select("first_published_at")
          .select("comments_count")
          .select("views_count")
          .select("likes_count")
          .select("thumbnail_id")
          .select("thumbnail_name");

      const next = await makeAdjacentQuery()
        .where((eb) =>
          eb(
            eb.refTuple("first_published_at", "id"),
            ">",
            eb.tuple(article.first_published_at, articleId),
          ),
        )
        .orderBy((eb) => eb.refTuple("first_published_at", "id"), "asc")
        .limit(1)
        .executeTakeFirst();

      const prev = await makeAdjacentQuery()
        .where((eb) =>
          eb(
            eb.refTuple("first_published_at", "id"),
            "<",
            eb.tuple(article.first_published_at, articleId),
          ),
        )
        .orderBy((eb) => eb.refTuple("first_published_at", "id"), "desc")
        .limit(1)
        .executeTakeFirst();

      const files = await tx
        .selectFrom("files")
        .where("edition_id", "=", article.edition_id)
        .select("id")
        .select("name")
        .execute();

      const comments = await tx
        .selectFrom("comments")
        .innerJoin("users", "comments.author_id", "users.id")
        .where("article_id", "=", articleId)
        .select("comments.id")
        .select("content")
        .select("comments.created_at")
        .select("author_id")
        .select("users.name as author_name")
        .orderBy((eb) => eb.refTuple("created_at", "id"), "asc")
        .execute();

      const toNumber = (x: number | bigint | string) => Number(x);

      return {
        ...article,
        next,
        prev,
        files,
        comments,
        editions_count: toNumber(editionsCount.count),
      };
    });
});

export async function generateMetadata(p: { params: { articleId: string } }) {
  const articleId = parseSafeInt(p.params.articleId);
  if (articleId === null) {
    return notFound();
  }

  const article = await getArticle(articleId);

  if (article === null) {
    return notFound();
  }

  return {
    title: article.title,
    description: article.content.slice(0, 100),
  };
}

export default async function ViewArticle(p: {
  params: { articleId: string };
}) {
  const articleId = parseSafeInt(p.params.articleId);
  if (articleId === null) {
    return notFound();
  }

  const article = await getArticle(articleId);

  if (article === null) {
    return notFound();
  }

  const viewToken = randomUUID();
  const redis = await getRedis();
  await redis.set(`view:${viewToken}`, articleId, { EX: 60 });

  const staticUrl = getEnv().STATIC_URL;

  return (
    <main>
      <header>
        <h1 className="text-3xl font-bold">{article.title}</h1>
        <p className="text-sm">
          <Link href={`/users/${article.author_id}`}>
            {article.author_name}
          </Link>
          {", "}
          <Time>{article.first_published_at}</Time>
          {article.first_published_at !== article.last_published_at ? (
            <>
              {" (개정: "}
              <Time>{article.last_published_at}</Time>
              {")"}
            </>
          ) : null}
        </p>
        <Stat>
          {VISIBILITY} {article.views_count}
        </Stat>
        <Stat>
          {FAVORITE} {article.likes_count}
        </Stat>
      </header>
      <Viewer
        content={article.content}
        files={article.files}
        fileSuffix={`${staticUrl}/${article.edition_id}`}
      />
      <hr className="border-none my-4" />
      <Buttons article={article} />
      <CommentList.Container>
        {article.comments.length === 0 ? (
          <CommentList.Empty>댓글이 없습니다</CommentList.Empty>
        ) : (
          article.comments.map((comment) => (
            <CommentList.Item
              key={comment.id}
              comment={comment}
              after={
                <DeleteCommentButton articleId={article.id} comment={comment} />
              }
            />
          ))
        )}
      </CommentList.Container>
      <ArticleList.Container>
        {article.next ? (
          <ArticleList.Item
            item={article.next}
            before={ARROW_UP}
            hrefPrefix="/articles"
          />
        ) : (
          <ArticleList.Message before={ARROW_UP}>
            (마지막 글입니다)
          </ArticleList.Message>
        )}
        {article.prev ? (
          <ArticleList.Item
            item={article.prev}
            before={ARROW_DOWN}
            hrefPrefix="/articles"
          />
        ) : (
          <ArticleList.Message before={ARROW_DOWN}>
            (첫번째 글입니다)
          </ArticleList.Message>
        )}
      </ArticleList.Container>
      <SubmitView viewToken={viewToken} authorId={article.author_id} />
    </main>
  );
}

function Stat(p: { children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-1 mr-4 text-sm">{p.children}</p>
  );
}

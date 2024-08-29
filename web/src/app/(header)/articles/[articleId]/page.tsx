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
import * as newdb from "@/newdb";
import * as Queries from "@/queries_sql";
import * as CommentList from "@/components/CommentList";
import Link from "next/link";

const getArticle = cache(async (articleId: number) => {
  return newdb.tx(async ({ first, list }) => {
    const article = await first(Queries.getArticle, { id: articleId });
    if (article === null) {
      return null;
    }
    const next = await first(Queries.getNextArticle, { id: articleId });
    const prev = await first(Queries.getPrevArticle, { id: articleId });
    const files = await list(Queries.getArticleFiles, { id: articleId });
    const comments = await list(Queries.getArticleComments, { id: articleId });
    return { ...article, next, prev, files, comments };
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
          <Link href={`/users/${article.authorId}`}>{article.authorName}</Link>
          {", "}
          <Time>{article.firstPublishedAt}</Time>
          {article.firstPublishedAt !== article.lastPublishedAt ? (
            <>
              {" (개정: "}
              <Time>{article.lastPublishedAt}</Time>
              {")"}
            </>
          ) : null}
        </p>
        <Stat>
          {VISIBILITY} {article.viewsCount}
        </Stat>
        <Stat>
          {FAVORITE} {article.likesCount}
        </Stat>
      </header>
      <Viewer
        content={article.content}
        files={article.files}
        fileSuffix={`${staticUrl}/${article.editionId}`}
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
          <ArticleList.Item item={article.next} before={ARROW_UP} hrefPrefix="/articles" />
        ) : (
          <ArticleList.Message before={ARROW_UP}>
            (마지막 글입니다)
          </ArticleList.Message>
        )}
        {article.prev ? (
          <ArticleList.Item item={article.prev} before={ARROW_DOWN} hrefPrefix="/articles" />
        ) : (
          <ArticleList.Message before={ARROW_DOWN}>
            (첫번째 글입니다)
          </ArticleList.Message>
        )}
      </ArticleList.Container>
      <SubmitView viewToken={viewToken} authorId={article.authorId} />
    </main>
  );
}

function Stat(p: { children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-1 mr-4 text-sm">{p.children}</p>
  );
}

import { getRedis } from "@/db";
import styles from "./page.module.scss";
import classnames from "classnames/bind";
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
import * as Queries from "@/queries.sql";

const cx = classnames.bind(styles);

const getArticle = cache(async (articleId: number) => {
  return newdb.tx(async ({ first , list}) => {
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
    <main className={cx("article")}>
      <header>
        <h1>{article.title}</h1>
        <p>
          {article.authorName}
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
        <p className={cx("stat")}>
          {VISIBILITY} {article.viewsCount}
        </p>
        <p className={cx("stat")}>
          {FAVORITE} {article.likesCount}
        </p>
      </header>
      <Viewer content={article.content} files={article.files} fileSuffix={`${staticUrl}/${article.editionId}`} />
      <Buttons article={article} />
      <section className={cx("comments")}>
        {article.comments.length === 0 && (
          <p className={cx("empty")}>댓글이 없습니다</p>
        )}
        {article.comments.map((comment) => (
          <article key={comment.id}>
            <p>{comment.content}</p>
            <DeleteCommentButton articleId={article.id} comment={comment} />
            <footer>
              {comment.authorName}
              {", "}
              <Time>{comment.createdAt}</Time>
            </footer>
          </article>
        ))}
      </section>
      <ArticleList.Container>
        {article.next ? (
          <ArticleList.Item article={article.next} before={ARROW_UP} />
        ) : (
          <ArticleList.Empty before={ARROW_UP}>
            (마지막 글입니다)
          </ArticleList.Empty>
        )}
        {article.prev ? (
          <ArticleList.Item article={article.prev} before={ARROW_DOWN} />
        ) : (
          <ArticleList.Empty before={ARROW_DOWN}>
            (첫번째 글입니다)
          </ArticleList.Empty>
        )}
      </ArticleList.Container>
      <SubmitView viewToken={viewToken} authorId={article.authorId} />
    </main>
  );
}

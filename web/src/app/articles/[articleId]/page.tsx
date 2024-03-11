import { getDB, getRedis } from "@/db";
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

const cx = classnames.bind(styles);

export default async function ViewArticle(p: {
  params: { articleId: string };
}) {
  const articleId = parseSafeInt(p.params.articleId);
  if (articleId === null) {
    return notFound();
  }

  const db = getDB();
  const article = await db.getArticle(articleId);

  if (article === null) {
    return notFound();
  }

  const viewToken = randomUUID();
  const redis = await getRedis();
  await redis.set(`view:${viewToken}`, articleId, { EX: 60 });

  return (
    <main className={cx("article")}>
      <header>
        <h1>{article.title}</h1>
        <p>
          {article.author.name}
          {", "}
          <Time>{article.publishedAt}</Time>
        </p>
        <p className={cx("stat")}>
          {VISIBILITY} {article.viewsCount}
        </p>
        <p className={cx("stat")}>
          {FAVORITE} {article.likesCount}
        </p>
      </header>
      <article>
        {article.content.split("\n").map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </article>
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
              {comment.author.name}
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
      <SubmitView viewToken={viewToken} />
    </main>
  );
}

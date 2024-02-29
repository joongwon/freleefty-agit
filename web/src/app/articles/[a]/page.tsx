import { getDB } from "@/db";
import styles from "./page.module.scss";
import classnames from "classnames/bind";
import { notFound } from "next/navigation";
import Link from "next/link";
import * as ArticleList from "@/components/ArticleList";
import Time from "@/components/Time";

const cx = classnames.bind(styles);

export default async function ViewArticle(p: { params: { a: string } }) {
  const articleId = parseSafeInt(p.params.a);
  if (articleId === null) {
    return notFound();
  }

  const db = getDB();
  const article = await db.getArticle(articleId);

  if (article === null) {
    return notFound();
  }

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
          <span className="material-symbols-outlined">visibility</span>{" "}
          {article.viewsCount}
        </p>
        <p className={cx("stat")}>
          <span className="material-symbols-outlined">favorite</span>{" "}
          {article.likesCount}
        </p>
      </header>
      <article>
        {article.content.split("\n").map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </article>
      <section className={cx("buttons")}>
        <button>
          <span className="material-symbols-outlined">comment</span>{" "}
          {article.comments.length}
        </button>
        <button className={cx("like")}>
          <span className="material-symbols-outlined">favorite</span>{" "}
          {article.likesCount}
        </button>
        <hr />
        <Link href="/articles">목록</Link>
        <button className={cx("delete")}>삭제</button>
      </section>
      <section className={cx("comments")}>
        {article.comments.map((comment) => (
          <article key={comment.id}>
            <p>{comment.content}</p>
            <footer>
              {comment.author.name}
              {", "}
              <Time>{comment.createdAt}</Time>
            </footer>
          </article>
        ))}
      </section>
      <ArticleList.Container>
        {article.next && <ArticleList.Item article={article.next} />}
        {article.prev && <ArticleList.Item article={article.prev} />}
      </ArticleList.Container>
    </main>
  );
}

function parseSafeInt(s: string) {
  if (!/^\d+$/.test(s)) {
    return null;
  }
  const n = parseInt(s);
  if (Number.isSafeInteger(n)) {
    return n;
  }
  return null;
}

import { getDB } from "@/db";
import styles from "./page.module.scss";
import classnames from "classnames/bind";
import { notFound } from "next/navigation";
import Link from "next/link";
import * as ArticleList from "@/components/ArticleList";

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
          {article.author.name}{", "}
          <time dateTime={article.publishedAt}>{article.publishedAt}</time>
        </p>
        <ul className={cx("stats")}>
          <li>
            <span className="material-symbols-outlined">visibility</span>
            {" "}{article.viewsCount}
          </li>
          <li>
            <span className="material-symbols-outlined">favorite</span>
            {" "}{article.likesCount}
          </li>
        </ul>
      </header>
      <article>
        {article.content.split("\n").map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </article>
      <footer>
        <button>
          <span className="material-symbols-outlined">comment</span>
          {" "}{article.comments.length}
        </button>
        <button>
          <span className="material-symbols-outlined">favorite</span>
          {" "}{article.likesCount}
        </button>
        <Link href="/articles">목록</Link>
        <button>삭제</button>
      </footer>
      <ul className={cx("comments")}>
        {article.comments.map((comment) => (
          <li key={comment.id}>
            <p>{comment.content}</p>
            <p>
              {comment.author.name}{", "}
              <time dateTime={comment.createdAt}>{comment.createdAt}</time>
            </p>
          </li>
        ))}
      </ul>
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

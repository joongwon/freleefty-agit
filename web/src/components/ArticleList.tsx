import type { ArticleSummary } from "db";
import Link from "next/link";
import { ReactNode } from "react";
import classnames from "classnames/bind";
import styles from "./ArticleList.module.scss";

const cx = classnames.bind(styles);

export function Container(p: { children: ReactNode }) {
  return (
    <ul className={cx("article-list")}>
      {p.children}
    </ul>
  );
}

export function Item(p: { article: ArticleSummary }) {
  return (
    <li>
      <Link href={`/articles/${p.article.id}`}>
        <div className={cx("title", { "untitled": p.article.title.length === 0 })}>
          {p.article.title.length > 0 ? p.article.title : "(제목없음)"}
        </div>
        {p.article.commentsCount > 0 && (
          <div className={cx("n-comments")}>
            <span className="material-symbols-outlined">comment</span>
            {p.article.commentsCount}
          </div>
        )}
        {p.article.viewsCount > 0 && (
          <div className={cx("n-views")}>
            <span className="material-symbols-outlined">visibility</span>
            {p.article.viewsCount}
          </div>
        )}
        {p.article.likesCount > 0 && (
          <div className={cx("n-likes")}>
            <span className="material-symbols-outlined">favorite</span>
            {p.article.likesCount}
          </div>
        )}
      </Link>
      <div className={cx("author")}>
        {p.article.author.name}{", "}
        <time>{p.article.publishedAt}</time>
      </div>
    </li>
  );
}

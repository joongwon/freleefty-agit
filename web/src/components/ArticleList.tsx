import Link from "next/link";
import { ReactNode } from "react";
import classnames from "classnames/bind";
import styles from "./ArticleList.module.scss";
import Time from "@/components/Time";
import { COMMENT, VISIBILITY, FAVORITE, ARROW_RIGHT } from "@/components/icons";
import { ArticleSummary, DraftSummary, EditionSummary } from "@/types";

const cx = classnames.bind(styles);

export function Container(p: { children: ReactNode }) {
  return <ul className={cx("article-list")}>{p.children}</ul>;
}

/**
 * before: 제목 앞에 표시할 내용. 이전/다음 글을 표시할 때 사용
 */
export function Item(p: { article: ArticleSummary; before?: ReactNode }) {
  return (
    <li>
      <Link href={`/articles/${p.article.id}`} className={cx("link")}>
        {p.before && <div className={cx("before")}>{p.before}</div>}
        <div className={cx("title")}>{p.article.title}</div>
        {p.article.commentsCount > 0 && (
          <div className={cx("n-comments")}>
            {COMMENT}
            {p.article.commentsCount}
          </div>
        )}
        {p.article.viewsCount > 0 && (
          <div className={cx("n-views")}>
            {VISIBILITY}
            {p.article.viewsCount}
          </div>
        )}
        {p.article.likesCount > 0 && (
          <div className={cx("n-likes")}>
            {FAVORITE}
            {p.article.likesCount}
          </div>
        )}
      </Link>
      <div className={cx("author")}>
        {p.article.authorName}
        {", "}
        <Time>{p.article.publishedAt}</Time>
      </div>
    </li>
  );
}

export function DraftItem(p: { draft: DraftSummary }) {
  return (
    <li>
      <Link href={`/drafts/${p.draft.id}`} className={cx("link")}>
        <div className={cx("title", { untitled: p.draft.title.length === 0 })}>
          {p.draft.title.length > 0 ? p.draft.title : "(제목없음)"}
        </div>
      </Link>
      <div className={cx("author")}>
        <Time>{p.draft.updatedAt}</Time>
      </div>
      {p.draft.published && (
        <Link href={`/articles/${p.draft.articleId}`} className={cx("pub")}>
          [발행판 보기]
        </Link>
      )}
    </li>
  );
}

export function EditionItem(p: {
  edition: EditionSummary;
  selected: boolean;
  latest: boolean;
}) {
  return (
    <li>
      <Link href={`/editions/${p.edition.id}`} className={cx("link")}>
        <div className={cx("before")}>{p.selected && ARROW_RIGHT}</div>
        <div className={cx("title")}>
          {p.edition.title}
          {p.latest ? <span className={cx("latest")}>[최신]</span> : null}
          {p.edition.notes.length > 0 && (
            <span className={cx("notes")}>({p.edition.notes})</span>
          )}
        </div>
      </Link>
      <div className={cx("author")}>
        <Time>{p.edition.publishedAt}</Time>
      </div>
    </li>
  );
}

export function Empty(p: { children: string; before?: ReactNode }) {
  return (
    <li>
      <div className={cx("link", "empty")}>
        {p.before && <div className={cx("before")}>{p.before}</div>}
        <div className={cx("title")}>{p.children}</div>
      </div>
    </li>
  );
}

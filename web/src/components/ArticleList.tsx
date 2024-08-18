import Link from "next/link";
import { ReactNode } from "react";
import Time from "@/components/Time";
import { COMMENT, VISIBILITY, FAVORITE, ARROW_RIGHT } from "@/components/icons";
import { ArticleSummary, DraftSummary, EditionSummary } from "@/types";

export function Container(p: { children: ReactNode }) {
  return <ul className="not-prose">{p.children}</ul>;
}

function ItemBase(p: { before?: ReactNode; children: ReactNode }) {
  return (
    <li className="border-0 first:border-t border-b flex gap-2 items-center">
      {p.before && (
        <div className="text-gray-500 flex align-center w-4">{p.before}</div>
      )}
      <div className="p-1 flex-1 flex items-center flex-wrap justify-start gap-2">
        {p.children}
      </div>
    </li>
  );
}

function Stat(p: { icon: ReactNode; value: number }) {
  return (
    p.value > 0 && (
      <span className="text-gray-500 inline-flex items-center align-bottom ml-2">
        {p.icon}
        {p.value}
      </span>
    )
  );
}

/**
 * before: 제목 앞에 표시할 내용. 이전/다음 글을 표시할 때 사용
 */
export function Item(
  p: (
    | { item: ArticleSummary; draft?: false; edition?: false }
    | { item: DraftSummary; draft: true; edition?: false }
    | { item: EditionSummary; draft?: false; edition: true }
  ) & { hideAuthor?: boolean; title?: React.ReactNode; before?: ReactNode },
) {
  return (
    <ItemBase before={p.before}>
      <p>
        <Link
          href={
            p.draft
              ? `/drafts/${p.item.id}`
              : p.edition
                ? `/editions/${p.item.id}`
                : `/articles/${p.item.id}`
          }
        >
          {p.title ?? p.item.title}
        </Link>
        {!p.draft && !p.edition && (
          <>
            <Stat icon={COMMENT} value={p.item.commentsCount} />
            <Stat icon={VISIBILITY} value={p.item.viewsCount} />
            <Stat icon={FAVORITE} value={p.item.likesCount} />
          </>
        )}
      </p>
      <p className="text-sm text-gray-600 flex-1 text-right whitespace-nowrap">
        {!p.draft && !p.edition && !p.hideAuthor && (
          <>
            <Link href={`/users/${p.item.authorId}`} className="text-gray-500">
              {p.item.authorName}
            </Link>
            ,{" "}
          </>
        )}
        {!p.draft ? (
          <Time>{p.item.publishedAt}</Time>
        ) : (
          <Time>{p.item.updatedAt}</Time>
        )}
      </p>
      {p.draft && p.item.published && (
        <Link
          href={`/articles/${p.item.articleId}`}
          className="text-sm text-gray-500 underline"
        >
          [발행판 보기]
        </Link>
      )}
    </ItemBase>
  );
}

export function DraftItem(p: { draft: DraftSummary }) {
  return <Item item={p.draft} draft />;
}

export function EditionItem(p: {
  edition: EditionSummary;
  selected: boolean;
  latest: boolean;
}) {
  return (
    <Item
      item={p.edition}
      edition
      before={p.selected ? ARROW_RIGHT : " " /* non-empty but invisible */}
      title={
        <>
          {p.edition.title}
          {p.latest && <span className="text-gray-400 text-sm">[최신]</span>}
          {p.edition.notes.length > 0 && (
            <span className="text-gray-500 text-sm">({p.edition.notes})</span>
          )}
        </>
      }
    />
  );
}

export function Empty(p: { children: string; before?: ReactNode }) {
  return (
    <ItemBase before={p.before}>
      <span className="text-gray-500">{p.children}</span>
    </ItemBase>
  );
}

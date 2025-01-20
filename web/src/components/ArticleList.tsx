import Link from "next/link";
import { ReactNode } from "react";
import Time from "@/components/Time";
import { COMMENT, VISIBILITY, FAVORITE, ARROW_RIGHT } from "@/components/icons";
import { getClientEnv } from "@/clientEnv";

export function Container(p: { children: ReactNode }) {
  return <ul className="not-prose">{p.children}</ul>;
}

function ItemBase(p: { before?: ReactNode; children: ReactNode }) {
  return (
    <li className="border-0 first:border-t border-b flex gap-2 items-center">
      {p.before && (
        <div className="text-gray-500 flex align-center w-4">{p.before}</div>
      )}
      <div className="p-1 flex-1 flex items-center flex-wrap justify-start gap-2 min-w-0">
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

export type ItemType = {
  id: number; // for creating links
  title: string;
  commentsCount?: number;
  viewsCount?: number;
  likesCount?: number;
  authorId?: string;
  authorName?: string;
  publishedAt?: string;
  updatedAt?: string;
  published?: boolean;
  articleId?: number; // for appending 발행판 보기 link
  notes?: string;
} & (
  | {
      editionId: number;
      thumbnailId: number;
      thumbnailName: string;
    }
  | {
      thumbnailId?: never;
    }
);

/**
 * before: 제목 앞에 표시할 내용. 이전/다음 글을 표시할 때 사용
 */
export function Item(p: {
  item: ItemType;
  hideAuthor?: boolean;
  title?: ReactNode;
  before?: ReactNode;
  hrefPrefix: "/drafts" | "/editions" | "/articles";
}) {
  return (
    <ItemBase before={p.before}>
      <p>
        <Link href={`${p.hrefPrefix}/${p.item.id}`} className="inline-block">
          {p.item.thumbnailId && (
            <img
              src={`${getClientEnv().THUMBNAIL_URL}/${p.item.editionId}/${p.item.thumbnailId}/${p.item.thumbnailName}`}
              alt={p.item.thumbnailName}
              className="w-16 h-16 object-cover rounded inline-block mr-2"
            />
          )}
          {p.title ?? p.item.title}
        </Link>
        {p.item.commentsCount !== undefined && (
          <Stat icon={COMMENT} value={p.item.commentsCount} />
        )}
        {p.item.viewsCount !== undefined && (
          <Stat icon={VISIBILITY} value={p.item.viewsCount} />
        )}
        {p.item.likesCount !== undefined && (
          <Stat icon={FAVORITE} value={p.item.likesCount} />
        )}
      </p>
      <p className="text-sm text-gray-600 flex-1 justify-end whitespace-nowrap flex max-w-full">
        {p.item.authorId && !p.hideAuthor && (
          <>
            <Link
              href={`/users/${p.item.authorId}`}
              className="text-gray-500 inline-block whitespace-nowrap min-w-0 overflow-hidden text-ellipsis"
            >
              {p.item.authorName}
            </Link>
            <span className="mr-1">{", "}</span>
          </>
        )}
        {p.item.publishedAt && <Time>{p.item.publishedAt}</Time>}
        {p.item.updatedAt && <Time>{p.item.updatedAt}</Time>}
      </p>
      {p.item.published && (
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

export function DraftItem(p: {
  draft: {
    id: number;
    title: string;
  };
}) {
  return (
    <Item
      item={p.draft}
      hrefPrefix="/drafts"
      title={
        p.draft.title.length > 0 ? (
          p.draft.title
        ) : (
          <span className="text-gray-500">(제목 없음)</span>
        )
      }
    />
  );
}

export function EditionItem(p: {
  edition: {
    id: number;
    title: string;
    notes: string;
  };
  selected: boolean;
  latest: boolean;
}) {
  return (
    <Item
      item={p.edition}
      hrefPrefix="/editions"
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

export function Message(p: { children: ReactNode; before?: ReactNode }) {
  return (
    <ItemBase before={p.before}>
      <span className="text-gray-500">{p.children}</span>
    </ItemBase>
  );
}

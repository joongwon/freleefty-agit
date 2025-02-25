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

function Stat(p: { icon: ReactNode; value?: number | null }) {
  return (
    p.value !== undefined &&
    p.value !== null &&
    p.value > 0 && (
      <span className="text-gray-500 inline-flex items-center align-middle ml-2">
        {p.icon}
        {p.value}
      </span>
    )
  );
}

export type ItemType = {
  id: number; // for creating links
  title: string;
  comments_count?: number | null;
  views_count?: number | null;
  likes_count?: number | null;
  author_id?: string | null;
  author_name?: string | null;
  published?: boolean | null;
  article_id?: number | null; // for appending 발행판 보기 link
  edition_id?: number;
  notes?: string;
} & (
  | {
      thumbnail_id: number;
      thumbnail_name?: string | null;
    }
  | {
      thumbnail_id?: null;
    }
) &
  (
    | {
        // author가 있으면 published_at이 있어야 함
        author_id: string;
        author_name: string;
        published_at: string;
        updated_at?: string;
      }
    | {
        published_at?: string;
        updated_at?: string;
        author_id?: null;
        author_name?: null;
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
      <p className="align-bottom">
        <Link href={`${p.hrefPrefix}/${p.item.id}`}>
          {p.item.thumbnail_id && (
            <img
              src={`${getClientEnv().THUMBNAIL_URL}/${p.item.edition_id}/${p.item.thumbnail_id}/${p.item.thumbnail_name}`}
              alt={p.item.thumbnail_name ?? "thumbnail"}
              className="w-16 h-16 object-cover rounded inline-block mr-2"
            />
          )}
          <span className="align-middle">{p.title ?? p.item.title}</span>
        </Link>
        <Stat icon={COMMENT} value={p.item.comments_count} />
        <Stat icon={VISIBILITY} value={p.item.views_count} />
        <Stat icon={FAVORITE} value={p.item.likes_count} />
      </p>
      <p className="text-sm text-gray-600 flex-1 justify-end whitespace-nowrap flex max-w-full">
        {p.item.author_id && !p.hideAuthor && (
          <>
            <Link
              href={`/users/${p.item.author_id}`}
              className="text-gray-500 inline-block whitespace-nowrap min-w-0 overflow-hidden text-ellipsis"
            >
              {p.item.author_name}
            </Link>
            <span className="mr-1">{", "}</span>
          </>
        )}
        {p.item.published_at && <Time>{p.item.published_at}</Time>}
        {p.item.updated_at && <Time>{p.item.updated_at}</Time>}
      </p>
      {p.item.published && (
        <Link
          href={`/articles/${p.item.article_id}`}
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
    updated_at: string;
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
    published_at: string;
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

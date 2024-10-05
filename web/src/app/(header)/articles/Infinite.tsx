"use client";

import { listArticles } from "@/actions";
import { ArticleSummary } from "@/types";
import useSWRInfinite from "swr/infinite";
import * as ArticleList from "@/components/ArticleList";
import { useNow } from "@/now";

const LIMIT = 40;

export default function Infinite(p: { initialItems: ArticleSummary[] }) {
  const now = useNow().toISOString();
  const list = useSWRInfinite(
    (index, previous) => {
      if (index !== 0 && (previous?.length ?? 0) < LIMIT) return null;
      const before = previous?.[previous.length - 1]?.publishedAt ?? now;
      const prevId = previous?.[previous.length - 1]?.id ?? null;
      return ["articles", { before, prevId, limit: LIMIT }];
    },
    ([, { before, prevId, limit }]) => listArticles(before, limit, prevId),
    { fallbackData: [p.initialItems], revalidateOnMount: false },
  );
  const isEnd =
    list.data !== undefined && list.data[list.data.length - 1]?.length < LIMIT;
  const flatList = list.data?.flat() ?? [];
  return (
    <>
      <ArticleList.Container>
        {flatList.map((article) => (
          <ArticleList.Item
            key={article.id}
            item={article}
            hrefPrefix="/articles"
          />
        ))}
      </ArticleList.Container>
      <p className="text-center py-4 text-gray-500">
        {isEnd ? (
          "쿵... 바닥에 닿았다"
        ) : (
          <button
            onClick={() => void list.setSize(list.size + 1)}
            disabled={list.isValidating}
            className="button"
          >
            더 보기
          </button>
        )}
      </p>
    </>
  );
}

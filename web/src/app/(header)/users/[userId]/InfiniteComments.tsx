"use client";

import { listUserComments } from "@/actions";
import { UserComment } from "@/types";
import useSWRInfinite from "swr/infinite";
import * as CommentList from "@/components/CommentList";
import { useNow } from "@/now";

const LIMIT = 40;

export default function InfiniteComments(p: { authorId: string; initialItems: UserComment[] }) {
  const now = useNow().toISOString();
  const list = useSWRInfinite(
    (index, previous) => {
      if (index !== 0 && (previous?.length ?? 0) < LIMIT) return null;
      const before = previous?.[previous.length - 1]?.createdAt ?? now;
      const prevId = previous?.[previous.length - 1]?.id ?? null;
      return ["comments", { before, prevId, limit: LIMIT, authorId: p.authorId }];
    },
    ([, { authorId, before, prevId, limit }]) => listUserComments(authorId, before, limit, prevId),
    { fallbackData: [p.initialItems], revalidateOnMount: false },
  );
  const isEnd =
    list.data !== undefined && list.data[list.data.length - 1]?.length < LIMIT;
  const flatList = list.data?.flat() ?? [];
  return (
    <>
      <CommentList.Container>
        {flatList.map((comment) => (
          <CommentList.Item key={comment.id} comment={comment} />
        ))}
      </CommentList.Container>
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

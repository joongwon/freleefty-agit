"use client";

import useSWRInfinite from "swr/infinite";
import * as CommentList from "@/components/CommentList";
import { useNow } from "@/now";
import { listAllComments } from "@/actions/comments";
import { Comment } from "@/types";

const LIMIT = 40;

export default function Infinite(p: { initialItems: Comment[] }) {
  const now = useNow().toISOString();
  const list = useSWRInfinite(
    (index, previous) => {
      if (index !== 0 && (previous?.length ?? 0) < LIMIT) return null;
      const before = previous?.[previous.length - 1]?.created_at ?? now;
      const prevId = previous?.[previous.length - 1]?.id ?? null;
      return ["comments", { before, prevId, limit: LIMIT }];
    },
    ([, { before, prevId, limit }]) => listAllComments({ before, limit, prevId }),
    { fallbackData: [p.initialItems], revalidateOnMount: false },
  );
  const isEnd =
    list.data !== undefined && list.data[list.data.length - 1]?.length < LIMIT;
  const flatList = list.data?.flat() ?? [];
  return (
    <>
      <CommentList.Container>
        {flatList.map((comment) => (
          <CommentList.Item
            key={comment.id}
            comment={comment}
          />
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

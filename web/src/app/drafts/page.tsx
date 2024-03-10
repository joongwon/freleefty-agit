"use client";
import useSWR from "swr";
import { gAuthState } from "@/auth";
import { useHookstate } from "@hookstate/core";
import { listOrCreateDraft } from "@/actions";
import { useRouter } from "next/navigation";
import * as ArticleList from "@/components/ArticleList";

export default function ListDrafts() {
  const authState = useHookstate(gAuthState);
  const shouldFetch = authState.type.get() === "login" ? "yes" : null;
  const res = useSWR(
    shouldFetch,
    () => {
      if (gAuthState.value.type !== "login") throw new Error("Not logged in");
      return listOrCreateDraft(gAuthState.value.token);
    },
    {
      onSuccess: (data) => {
        if (!Array.isArray(data)) {
          router.replace(`/drafts/${data.id}`);
        }
      },
    },
  );
  const router = useRouter();

  if (!shouldFetch) {
    return <main>일지를 쓰려면 로그인하세요.</main>;
  }
  if (res.error) {
    return <main>저장된 초안 목록을 불러오는 중 오류가 발생했습니다.</main>;
  }
  if (!res.data || !Array.isArray(res.data)) {
    return <main>저장된 초안 목록을 불러오는 중...</main>;
  }
  return (
    <main>
      <h1>저장된 초안 목록</h1>
      <ArticleList.Container>
        {res.data.map((draft) => (
          <ArticleList.DraftItem key={draft.id} draft={draft} />
        ))}
      </ArticleList.Container>
    </main>
  );
}

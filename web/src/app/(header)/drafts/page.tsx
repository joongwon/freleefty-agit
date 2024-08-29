"use client";
import useSWR from "swr";
import { gAuthState } from "@/auth";
import { useHookstate } from "@hookstate/core";
import { createDraft, listDrafts } from "@/actions";
import { useRouter } from "next/navigation";
import * as ArticleList from "@/components/ArticleList";
import useSWRMutation from "swr/mutation";

export default function ListDrafts() {
  const authState = useHookstate(gAuthState);
  const swrKey = authState.type.get() === "login" ? "drafts" : null;
  const list = useSWR(swrKey, () => {
    if (gAuthState.value.type !== "login") throw new Error("Not logged in");
    return listDrafts(gAuthState.value.token);
  });
  const create = useSWRMutation(
    swrKey,
    () => {
      if (gAuthState.value.type !== "login") throw new Error("Not logged in");
      return createDraft(gAuthState.value.token);
    },
    {
      revalidate: false,
      onSuccess: (data) => {
        router.push(`/drafts/${data.id}`);
      },
      onError: () => {
        alert("새 초안을 만드는 중 오류가 발생했습니다.");
      },
    },
  );
  const router = useRouter();

  if (!swrKey) {
    return <main>일지를 쓰려면 로그인하세요.</main>;
  }
  if (list.error) {
    return <main>저장된 초안 목록을 불러오는 중 오류가 발생했습니다.</main>;
  }
  if (!list.data || !Array.isArray(list.data)) {
    return <main>저장된 초안 목록을 불러오는 중...</main>;
  }
  return (
    <main>
      <header className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">초안 목록</h1>
        <button
          className="button"
          onClick={() => {
            void create.trigger();
          }}
        >
          새 초안
        </button>
      </header>
      <ArticleList.Container>
        {list.data.length > 0 ? (
          list.data.map((draft) => (
            <ArticleList.DraftItem key={draft.id} draft={draft} />
          ))
        ) : (
          <ArticleList.Message>저장된 초안이 없습니다.</ArticleList.Message>
        )}
      </ArticleList.Container>
    </main>
  );
}

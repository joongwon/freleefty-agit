"use client";
import useSWR from "swr";
import { gAuthState } from "@/auth";
import { useHookstate } from "@hookstate/core";
import { getDraft, publishDraft } from "@/actions";
import { parseSafeInt } from "@/utils";
import Viewer from "@/components/Viewer";
import styles from "./page.module.scss";
import classNames from "classnames/bind";
import Link from "next/link";
import { useState } from "react";
import useSWRMutation from "swr/mutation";
import { useRouter } from "next/navigation";

const cx = classNames.bind(styles);

export default function DraftPreview(p: { params: { draftId: string } }) {
  const draftId = parseSafeInt(p.params.draftId);
  const authState = useHookstate(gAuthState);

  // key for draft SWR
  const swrKey =
    authState.type.value === "login" && draftId !== null
      ? ([draftId, "draft"] as const)
      : null;

  // fetch draft
  const res = useSWR(swrKey, ([draftId]) => {
    if (gAuthState.value.type !== "login")
      throw new Error("non-login state found in useSWR([draftId, 'draft'])");
    return getDraft(gAuthState.value.token, draftId);
  });

  const [notes, setNotes] = useState("");

  const router = useRouter();

  const publish = useSWRMutation(
    [draftId, "publish"] as const,
    ([draftId], opt: { arg: string }) => {
      if (notes.length === 0) {
        alert("변경사항을 적어주세요");
        return;
      }
      if (gAuthState.value.type !== "login") {
        alert("먼저 로그인하세요");
        return;
      }
      if (!res.data) {
        alert("초안을 찾을 수 없습니다");
        return;
      }
      if (!confirm("발행하시겠습니까?")) return;
      return publishDraft(gAuthState.value.token, draftId, opt.arg);
    },
    {
      revalidate: false,
      onSuccess: (data) => {
        if (typeof data === "number") {
          router.push(`/articles/${data}`);
        } else {
          alert("발행 중 오류가 발생했습니다");
        }
      },
    },
  );
  const publishDisabled = notes.length === 0 || !res.data || publish.isMutating;

  if (authState.value.type === "loading") {
    return <main>로그인 중...</main>;
  } else if (authState.value.type === "anon") {
    return <main>초안을 읽으려면 로그인하세요</main>;
  } else if (res.error) {
    return <main>초안을 불러오는 중 오류가 발생했습니다</main>;
  } else if (res.isLoading) {
    return <main>초안을 불러오는 중...</main>;
  } else if (!res.data) {
    return <main>초안을 찾을 수 없습니다</main>;
  } else {
    return (
      <main className={cx("preview")}>
        <h1>
          {res.data.title} <span className={cx("small")}>(미리보기)</span>
        </h1>
        <Viewer content={res.data.content} />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            publish.trigger(notes);
          }}
        >
          <input
            type="text"
            placeholder="변경사항을 짧게 적어주세요"
            required
            maxLength={255}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <section className={cx("buttons")}>
            <Link href={`/drafts/${draftId}`} className={cx("edit")}>
              계속 수정
            </Link>
            <button
              className={cx("publish", { disabled: publishDisabled })}
              type="submit"
            >
              발행
            </button>
            <Link href="/drafts">초안 목록</Link>
          </section>
        </form>
      </main>
    );
  }
}

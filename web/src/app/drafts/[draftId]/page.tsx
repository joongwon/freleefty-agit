"use client";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { gAuthState } from "@/auth";
import { useHookstate } from "@hookstate/core";
import { getDraft, updateDraft, publishDraft } from "@/actions";
import { parseSafeInt } from "@/utils";
import { useState, useEffect } from "react";
import Link from "next/link";
import classNames from "classnames/bind";
import styles from "./page.module.scss";
import { useRouter } from "next/navigation";

const cx = classNames.bind(styles);

export default function EditDraft(p: { params: { draftId: string } }) {
  const draftId = parseSafeInt(p.params.draftId);
  const authState = useHookstate(gAuthState);

  // title and content; undefined if not changed
  const [title, setTitle] = useState<string>();
  const [content, setContent] = useState<string>();

  // key for draft SWR
  const swrKey =
    authState.type.value === "login" && draftId !== null
      ? ([draftId, "draft"] as const)
      : null;

  // fetch draft
  const res = useSWR(
    swrKey,
    ([draftId]) => {
      if (gAuthState.value.type !== "login")
        throw new Error("non-login state found in useSWR([draftId, 'draft'])");
      return getDraft(gAuthState.value.token, draftId);
    },
    {
      onSuccess: (data) => {
        if (data) {
          setTitle((title) => (data.title !== title ? title : undefined));
          setContent((content) =>
            data.content !== content ? content : undefined,
          );
        }
      },
    },
  );

  // displayed title and content
  const dTitle = title ?? res.data?.title ?? "";
  const dContent = content ?? res.data?.content ?? "";

  // update draft
  const update = useSWRMutation(
    swrKey,
    (
      [draftId],
      opt: {
        arg: { title: string; content: string; token: string; publish?: true };
      },
    ) => updateDraft(opt.arg.token, draftId, opt.arg.title, opt.arg.content),
  );

  const router = useRouter();

  // publish draft
  const publish = useSWRMutation(
    swrKey,
    ([draftId], opt: { arg: { token: string } }) =>
      publishDraft(opt.arg.token, draftId),
    {
      onSuccess: (data) => {
        if (typeof data === "number") {
          router.replace(`/articles/${data}`);
        }
      }
    }
  );

  // ask before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (title || content) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [title, content]);

  const errorMessage = (() => {
    if (authState.type.value !== "login") return "일지를 쓰려면 로그인하세요";
    if (draftId === null || res.data === null || update.data === "NotFound")
      return "일지를 찾을 수 없습니다";
    if (res.isLoading) return "저장된 일지를 불러오는 중...";
    if (res.error) return "일지를 불러오는 중 오류가 발생했습니다";
    if (update.error) return "일지를 저장하는 중 오류가 발생했습니다";
    if (publish.error) return "일지를 발행하는 중 오류가 발생했습니다";
    return null;
  })();

  /* cannot edit before loaded */
  const editDisabled = res.data === null;

  /*
   * cannot submit:
   * - before loaded or during validation
   * - not changed
   * - during submission or publishing
   */
  const submitDisabled =
    res.isValidating ||
    (!title && !content) ||
    update.isMutating ||
    publish.isMutating;

  /*
   * cannot publish:
   * - before loaded or during validation
   * - changed
   * - during submission or publishing
   */
  const publishDisabled =
    res.isValidating ||
    title !== undefined ||
    content !== undefined ||
    update.isMutating ||
    publish.isMutating;

  return (
    <main className={cx("draft")}>
      <h1>일지 쓰기</h1>
      <p>{errorMessage}</p>
      <form
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          type="text"
          value={dTitle}
          onChange={(e) => setTitle(e.target.value)}
          disabled={editDisabled}
        />
        <textarea
          value={dContent}
          onChange={(e) => setContent(e.target.value)}
          disabled={editDisabled}
        />
      </form>
      <section className={cx("buttons")}>
        <button className={cx("save")} disabled={submitDisabled} onClick={() => {
          if (gAuthState.value.type !== "login")
            throw new Error("non-login state found in onSubmit");
          void update.trigger({
            title: dTitle,
            content: dContent,
            token: gAuthState.value.token,
          });
        }}>
          저장
        </button>
        <button
          className={cx("publish")}
          type="button"
          onClick={() => {
            if (gAuthState.value.type !== "login")
              throw new Error("non-login state found in publish onClick");
            void publish.trigger({ token: gAuthState.value.token });
          }}
          disabled={publishDisabled}
        >
          발행
        </button>
        <Link href="/drafts">목록</Link>
      </section>
    </main>
  );
}

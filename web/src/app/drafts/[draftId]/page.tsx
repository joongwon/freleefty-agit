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
      // prevent not found error before navigating
      revalidate: false,
      onSuccess: (data) => {
        if (typeof data === "number") {
          router.replace(`/articles/${data}`);
        }
      },
    },
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
    if (publish.data === "Bad") return "발행하려면 제목을 입력하세요";
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
    (title === undefined && content === undefined) ||
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
      <input
        className={cx("title")}
        type="text"
        value={dTitle}
        onChange={(e) => setTitle(e.target.value)}
        disabled={editDisabled}
      />
      <textarea
        className={cx("content")}
        value={dContent}
        onChange={(e) => setContent(e.target.value)}
        disabled={editDisabled}
      />
      <section className={cx("buttons")}>
        <p className={cx("error")}>{errorMessage}</p>
        <button
          className={cx("save", { disabled: submitDisabled })}
          title={submitDisabled ? "저장할 변경사항이 없습니다" : "초안 임시 저장"}
          onClick={() => {
            if (submitDisabled) {
              alert("저장할 변경사항이 없습니다");
              return;
            }
            if (gAuthState.value.type !== "login")
              throw new Error("non-login state found in onSubmit");
            publish.reset();
            void update.trigger({
              title: dTitle,
              content: dContent,
              token: gAuthState.value.token,
            });
          }}
        >
          저장
        </button>
        <button
          className={cx("publish", { disabled: publishDisabled })}
          type="button"
          title={publishDisabled ? "발행하려면 우선 저장하세요" : "발행하여 공개하기"}
          onClick={() => {
            if (publishDisabled) {
              alert("발행하려면 우선 저장하세요");
              return;
            }
            if (gAuthState.value.type !== "login")
              throw new Error("non-login state found in publish onClick");
            if (confirm("발행하시겠습니까? 발행 이후에는 수정할 수 없습니다.")) {
              publish.reset();
              void publish.trigger({ token: gAuthState.value.token });
            }
          }}
        >
          발행
        </button>
        <Link href="/drafts" title="초안 목록으로 돌아가기">목록</Link>
      </section>
    </main>
  );
}

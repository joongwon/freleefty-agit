"use client";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { gAuthState } from "@/auth";
import { useHookstate } from "@hookstate/core";
import { getDraft, updateDraft, deleteDraft } from "@/actions";
import { parseSafeInt } from "@/utils";
import { useState, useEffect } from "react";
import Link from "next/link";
import classNames from "classnames/bind";
import styles from "./page.module.scss";
import { useRouter } from "next/navigation";
import TextareaAutosize from "react-textarea-autosize";
import { useRef } from "react";
import getCaretCoordinates from "textarea-caret";
import type { MaybeNotFound } from "@/db";

const cx = classNames.bind(styles);

export default function EditDraft(p: { params: { draftId: string } }) {
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

  // title and content; undefined before loaded
  const [sTitle, setTitle] = useState<string>();
  const [sContent, setContent] = useState<string>();

  if (res.data && (sTitle === undefined || sContent === undefined)) {
    setTitle(res.data.title);
    setContent(res.data.content);
  }
  const title = sTitle ?? res.data?.title ?? "";
  const content = sContent ?? res.data?.content ?? "";

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

  // delete draft
  const del = useSWRMutation(
    swrKey,
    ([draftId], opt: { arg: { token: string } }) =>
      deleteDraft(opt.arg.token, draftId),
    {
      // prevent not found error before navigating
      revalidate: false,
      onSuccess: (data: MaybeNotFound) => {
        if (data === "Ok") {
          router.replace("/drafts");
        }
      },
    },
  );

  // autosave 3 seconds after last change
  useEffect(() => {
    if (
      res.data &&
      (title !== res.data.title || content !== res.data.content)
    ) {
      const timeout = setTimeout(() => {
        if (gAuthState.value.type !== "login") return;
        void update.trigger({
          title: title,
          content: content,
          token: gAuthState.value.token,
        });
      }, 3000);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [title, content, res.data, update]);

  const updateData: MaybeNotFound | undefined = update.data;
  const delData: MaybeNotFound | undefined = del.data;
  const errorMessage = (() => {
    if (authState.type.value !== "login") return "일지를 쓰려면 로그인하세요";
    if (draftId === null || res.data === null || updateData === "NotFound")
      return "초안을 찾을 수 없습니다";
    if (res.isLoading) return "저장된 일지를 불러오는 중...";
    if (res.error) return "초안을 불러오는 중 오류가 발생했습니다";
    if (update.error) return "초안을 저장하는 중 오류가 발생했습니다";
    if (delData === "NotFound") return "이미 삭제된 초안입니다";
    if (del.error) return "초안을 삭제하는 중 오류가 발생했습니다";
    return null;
  })();

  /* cannot edit before loaded (undefined) or not found (null) */
  const editDisabled = !res.data;

  const changed = title !== res.data?.title || content !== res.data?.content;

  /*
   * cannot submit:
   * - before loaded or during validation
   * - not found
   * - not changed
   * - during submission or publishing
   */
  const submitDisabled =
    res.isValidating ||
    res.data === null ||
    !changed ||
    update.isMutating ||
    del.isMutating;

  const delDisabled = res.data === null || del.isMutating || update.isMutating;

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <main className={cx("draft")}>
      <input
        className={cx("title")}
        type="text"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
        }}
        disabled={editDisabled}
        placeholder="(제목 없음)"
      />
      <TextareaAutosize
        className={cx("content")}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
        }}
        disabled={editDisabled}
        placeholder="(빈 일지)"
        minRows={10}
        onHeightChange={() => {
          if (!textareaRef.current || !window.visualViewport) return;
          const textareaTop = textareaRef.current.getBoundingClientRect().top;
          const caretTop =
            getCaretCoordinates(
              textareaRef.current,
              textareaRef.current.selectionStart,
            ).top + textareaTop;
          const viewportHeight = window.visualViewport.height;
          const scrollY = caretTop - viewportHeight / 2;
          if (scrollY < 0) return;
          window.scrollTo({
            top: window.scrollY + scrollY,
            behavior: "smooth",
          });
        }}
        ref={textareaRef}
      />
      <section className={cx("buttons")}>
        <button
          className={cx("save", { disabled: submitDisabled })}
          title={
            submitDisabled ? "저장할 변경사항이 없습니다" : "초안 임시 저장"
          }
          onClick={() => {
            if (submitDisabled) {
              alert("저장할 변경사항이 없습니다");
              return;
            }
            if (gAuthState.value.type !== "login")
              throw new Error("non-login state found in onSubmit");
            del.reset();
            void update.trigger({
              title: title,
              content: content,
              token: gAuthState.value.token,
            });
          }}
        >
          {update.isMutating
            ? "저장 중..."
            : !changed && updateData === "Ok"
              ? "저장됨"
              : "저장"}
        </button>
        <Link
          className={cx("preview", {
            disabled: update.isMutating || del.isMutating || changed,
          })}
          title={changed ? "우선 저장하세요" : "검토 후 발행"}
          href={changed ? "" : `/drafts/${draftId}/preview`}
        >
          검토 후 발행
        </Link>
        <button
          className={cx("delete", { disabled: delDisabled })}
          type="button"
          title="초안 삭제"
          onClick={() => {
            if (gAuthState.value.type !== "login")
              throw new Error("non-login state found in delete onClick");
            if (delDisabled) {
              alert("삭제할 수 없습니다");
              return;
            }
            if (confirm("삭제하시겠습니까?")) {
              update.reset();
              void del.trigger({ token: gAuthState.value.token });
            }
          }}
        >
          삭제
        </button>
        {res.data?.articleId && (
          <Link
            href={`/articles/${res.data.articleId}`}
            title="이 초안이 덮어씌울 일지의 최신 발행판"
          >
            발행판
          </Link>
        )}
        <Link href="/drafts" title="초안 목록으로 돌아가기">
          목록
        </Link>
      </section>
      {errorMessage && <p className={cx("error")}>{errorMessage}</p>}
    </main>
  );
}

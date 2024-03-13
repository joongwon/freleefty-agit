"use client";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { gAuthState } from "@/auth";
import { useHookstate } from "@hookstate/core";
import { getDraft, updateDraft, publishDraft, deleteDraft } from "@/actions";
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

  // delete draft
  const del = useSWRMutation(
    swrKey,
    ([draftId], opt: { arg: { token: string } }) =>
      deleteDraft(opt.arg.token, draftId),
    {
      // prevent not found error before navigating
      revalidate: false,
      onSuccess: (data) => {
        if (data === "Ok") {
          router.replace("/drafts?noredirect=true");
        }
      },
    },
  );

  // autosave 5 seconds after last change
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (title !== undefined || content !== undefined) {
        if (gAuthState.value.type !== "login") return;
        void update.trigger({
          title: dTitle,
          content: dContent,
          token: gAuthState.value.token,
        });
      }
    }, 3000);
    return () => {
      clearTimeout(timeout);
    };
  }, [dTitle, dContent, title, content]);

  const errorMessage = (() => {
    if (authState.type.value !== "login") return "일지를 쓰려면 로그인하세요";
    if (draftId === null || res.data === null || update.data === "NotFound")
      return "일지를 찾을 수 없습니다";
    if (res.isLoading) return "저장된 일지를 불러오는 중...";
    if (res.error) return "일지를 불러오는 중 오류가 발생했습니다";
    if (update.error) return "일지를 저장하는 중 오류가 발생했습니다";
    if (publish.data === "Bad") return "발행하려면 제목을 입력하세요";
    if (publish.error) return "일지를 발행하는 중 오류가 발생했습니다";
    if (del.data === "NotFound") return "이미 삭제된 일지입니다";
    if (del.error) return "일지를 삭제하는 중 오류가 발생했습니다";
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
    publish.isMutating ||
    del.isMutating;

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
    res.data?.title === "" ||
    update.isMutating ||
    publish.isMutating ||
    del.isMutating;

  const delDisabled = del.isMutating || publish.isMutating || update.isMutating;

  return (
    <main className={cx("draft")}>
      <input
        className={cx("title")}
        type="text"
        value={dTitle}
        onChange={(e) => {
          setTitle(e.target.value);
        }}
        disabled={editDisabled}
        placeholder="(제목 없음)"
      />
      <textarea
        className={cx("content")}
        value={dContent}
        onChange={(e) => {
          setContent(e.target.value);
        }}
        disabled={editDisabled}
        placeholder="(빈 일지)"
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
            publish.reset();
            del.reset();
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
          title={
            res.data?.title === ""
              ? "발행하려면 제목을 입력하세요"
              : publishDisabled
                ? "발행하려면 우선 저장하세요"
                : "발행하여 공개"
          }
          onClick={() => {
            if (publishDisabled) {
              alert("발행하려면 우선 저장하세요");
              return;
            }
            if (gAuthState.value.type !== "login")
              throw new Error("non-login state found in publish onClick");
            if (
              confirm("발행하시겠습니까? 발행 이후에는 수정할 수 없습니다.")
            ) {
              update.reset();
              del.reset();
              void publish.trigger({ token: gAuthState.value.token });
            }
          }}
        >
          발행
        </button>
        <button
          className={cx("delete")}
          type="button"
          title="초안 삭제"
          onClick={() => {
            if (gAuthState.value.type !== "login")
              throw new Error("non-login state found in delete onClick");
            if (delDisabled) {
              return;
            }
            if (confirm("삭제하시겠습니까?")) {
              update.reset();
              publish.reset();
              void del.trigger({ token: gAuthState.value.token });
            }
          }}
        >
          삭제
        </button>
        <Link href="/drafts" title="초안 목록으로 돌아가기">
          목록
        </Link>
      </section>
      {title === undefined && content === undefined && update.data === "Ok" && (
        <p className={cx("save")}>저장됨</p>
      )}
      {update.isMutating && <p className={cx("save")}>저장 중...</p>}
      {errorMessage && <p className={cx("error")}>{errorMessage}</p>}
    </main>
  );
}

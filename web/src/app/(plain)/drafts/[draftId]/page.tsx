"use client";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { gAuthState } from "@/auth";
import { useHookstate } from "@hookstate/core";
import { getDraft, updateDraft, deleteDraft } from "@/actions/drafts";
import { createFile, deleteFile } from "@/actions/files";
import { parseSafeInt } from "@/utils";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TextareaAutosize from "react-textarea-autosize";
import { useRef } from "react";
import getCaretCoordinates from "textarea-caret";
import { DELETE } from "@/components/icons";

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
    return getDraft({ token: gAuthState.value.token }, { id: draftId });
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
    ) =>
      updateDraft(
        { token: opt.arg.token },
        { id: draftId },
        { title: opt.arg.title, content: opt.arg.content },
      ),
  );

  const router = useRouter();

  // delete draft
  const del = useSWRMutation(
    swrKey,
    ([draftId], opt: { arg: { token: string } }) =>
      deleteDraft({ token: opt.arg.token }, { id: draftId }),
    {
      // prevent not found error before navigating
      revalidate: false,
      onSuccess: (data) => {
        if (data.type === "Ok") {
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
        const nTitle = title.normalize();
        const nContent = content.normalize();
        setTitle(nTitle);
        setContent(nContent);
        void update.trigger({
          title: nTitle,
          content: nContent,
          token: gAuthState.value.token,
        });
      }, 3000);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [title, content, res.data, update]);

  const updateData = update.data;
  const delData = del.data;
  const errorMessage = (() => {
    if (authState.type.value !== "login") return "일지를 쓰려면 로그인하세요";
    if (draftId === null || res.data === null || updateData === "NotFound")
      return "초안을 찾을 수 없습니다";
    if (res.isLoading) return "저장된 일지를 불러오는 중...";
    if (res.error) return "초안을 불러오는 중 오류가 발생했습니다";
    if (update.error) return "초안을 저장하는 중 오류가 발생했습니다";
    if (delData?.type === "NotFound") return "이미 삭제된 초안입니다";
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
    <main className="flex flex-col gap-2 p-4 min-w-0 w-screen max-w-screen-md">
      <input
        className="input focus:outline-none focus:bg-gray-100 text-2xl font-bold"
        type="text"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
        }}
        disabled={editDisabled}
        placeholder="(제목 없음)"
      />
      <TextareaAutosize
        className="input focus:outline-none focus:bg-gray-100 resize-none"
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
      <section>
        {res.data?.files.length !== 0 ? (
          <ul className="list-disc mb-2 ml-4">
            {res.data?.files.map((file) => (
              <li key={file.id}>
                <a
                  className="hover:underline"
                  href={`/files/private/${file.id}/${file.name}`}
                  title={file.name}
                >
                  {file.name}
                </a>
                <DeleteFileButton swrKey={swrKey} fileId={file.id} />
              </li>
            ))}
          </ul>
        ) : (
          <p>첨부 파일이 없습니다</p>
        )}
        <FileForm swrKey={swrKey} />
      </section>
      <section className="flex gap-2 justify-end">
        <button
          className={`button ${submitDisabled ? "button-disabled" : "button-green"}`}
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
            const nTitle = title.normalize();
            const nContent = content.normalize();
            setTitle(nTitle);
            setContent(nContent);
            void update.trigger({
              title: nTitle,
              content: nContent,
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
          className={`button ${update.isMutating || del.isMutating || changed ? "button-disabled" : "button-blue"}`}
          title={changed ? "우선 저장하세요" : "검토 후 발행"}
          href={changed ? "" : `/drafts/${draftId}/preview`}
        >
          검토 후 발행
        </Link>
        <button
          className={`button ${delDisabled ? "button-disabled" : "button-red"}`}
          type="button"
          title="초안 삭제"
          onClick={() => {
            if (gAuthState.value.type !== "login")
              throw new Error("non-login state found in delete onClick");
            if (delDisabled) {
              alert("초안을 삭제할 수 없습니다");
              return;
            }
            const message = res.data?.published
              ? "초안을 삭제하시겠습니까? 이미 발행된 일지는 삭제되지 않습니다."
              : "초안을 삭제하시겠습니까?";
            if (confirm(message)) {
              update.reset();
              void del.trigger({ token: gAuthState.value.token });
            }
          }}
        >
          초안 삭제
        </button>
      </section>
      <section className="flex gap-2 justify-end">
        {res.data?.published && (
          <Link
            className="button"
            href={`/articles/${res.data.article_id}`}
            title="이 초안이 덮어씌울 일지의 최신 발행판"
          >
            발행판
          </Link>
        )}
        <Link className="button" href="/drafts" title="초안 목록으로 돌아가기">
          목록
        </Link>
      </section>
      {errorMessage && <p className="text-red-600">{errorMessage}</p>}
    </main>
  );
}

function FileForm(p: { swrKey: readonly [number, "draft"] | null }) {
  const [file, setFile] = useState<{ data: File; name: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useSWRMutation(
    p.swrKey,
    ([draftId], opt: { arg: { data: File; name: string } }) => {
      if (gAuthState.value.type !== "login")
        throw new Error("non-login state found in uploadFile");
      const formData = new FormData();
      formData.append("file", opt.arg.data);
      return createFile(
        { token: gAuthState.value.token },
        { draft: { id: draftId }, name: opt.arg.name },
        formData,
      );
    },
    {
      onSuccess: (data) => {
        switch (data) {
          case "NotFound":
            alert("초안을 찾을 수 없습니다");
            break;
          case "Conflict":
            alert("이미 같은 이름의 파일이 있습니다");
            break;
          case "TooLarge":
            alert("파일이 너무 큽니다");
            break;
          case "Ok":
            setFile(null);
            break;
        }
      },
    },
  );
  return !file ? (
    <form>
      <input
        type="file"
        hidden={true}
        ref={fileRef}
        onChange={(e) => {
          if (e.target.files) {
            setFile({ data: e.target.files[0], name: e.target.files[0].name });
          }
        }}
      />
      <button
        type="button"
        className="button"
        onClick={() => {
          if (fileRef.current) {
            fileRef.current.click();
          }
        }}
      >
        파일 추가
      </button>
    </form>
  ) : (
    <form className="border border-gray-300 p-2">
      <dl>
        <dt>원래 이름</dt>
        <dd>{file.data.name}</dd>
        <dt>올릴 이름</dt>
        <dd>
          <input
            className="input"
            type="text"
            value={file.name}
            onChange={(e) => {
              setFile({ data: file.data, name: e.target.value });
            }}
          />
        </dd>
      </dl>
      <button
        type="submit"
        className="button button-blue"
        onClick={(e) => {
          e.preventDefault();
          if (file.name === "") {
            alert("파일명을 입력하세요");
            return;
          }
          if (upload.isMutating) return;
          void upload.trigger({ data: file.data, name: file.name });
        }}
      >
        업로드
      </button>
      <button
        type="button"
        className="button button-red m-2"
        onClick={() => {
          setFile(null);
        }}
      >
        취소
      </button>
    </form>
  );
}

function DeleteFileButton(p: {
  swrKey: readonly [number, "draft"] | null;
  fileId: number;
}) {
  const del = useSWRMutation(
    p.swrKey,
    () => {
      if (gAuthState.value.type !== "login")
        throw new Error("non-login state found in deleteFile");
      return deleteFile({ token: gAuthState.value.token }, { id: p.fileId });
    },
    {
      onSuccess: (data) => {
        switch (data) {
          case "Forbidden":
            alert("파일을 지울 수 없습니다");
            break;
          case "Ok":
            break;
        }
      },
    },
  );
  return (
    <button
      className="ml-2 text-red-600 hover:text-red-800 align-text-top text-lg"
      title="삭제"
      onClick={() => {
        if (gAuthState.value.type !== "login")
          throw new Error("non-login state found in deleteFile onClick");
        if (del.isMutating) return;
        if (!confirm("파일을 삭제하시겠습니까?")) return;
        void del.trigger();
      }}
    >
      {DELETE}
    </button>
  );
}

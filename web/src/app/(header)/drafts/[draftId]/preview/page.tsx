"use client";
import useSWR from "swr";
import { gAuthState } from "@/auth";
import { useHookstate } from "@hookstate/core";
import { getUserNewArticleNotify } from "@/actions/users";
import { getDraft, publishDraft } from "@/actions/drafts";
import { parseSafeInt } from "@/utils";
import Viewer from "@/components/Viewer";
import Link from "next/link";
import { useEffect, useState } from "react";
import useSWRMutation from "swr/mutation";
import { useRouter } from "next/navigation";
import { DraftsId } from "@/nndb/public/Drafts";

export default function DraftPreview(p: { params: { draftId: string } }) {
  const draftId = parseSafeInt(p.params.draftId);
  const authState = useHookstate(gAuthState);

  // key for draft SWR
  const swrKey =
    authState.type.value === "login" && draftId !== null
      ? ([draftId as DraftsId, "draft"] as const)
      : null;

  // fetch draft
  const res = useSWR(swrKey, ([draftId]) => {
    if (gAuthState.value.type !== "login")
      throw new Error("non-login state found in useSWR([draftId, 'draft'])");
    return getDraft({ token: gAuthState.value.token }, { id: draftId });
  });

  // SWR cache is not needed; always most fresh setting is fetched
  const [notifySetting, setNotifySetting] = useState<{ value: boolean } | null>(
    null,
  );
  const token = authState.value.type === "login" ? authState.value.token : null;
  useEffect(() => {
    if (token) {
      void getUserNewArticleNotify({ token }).then((data) => {
        if (data.type === "Ok") setNotifySetting({ value: data.notify });
        else setNotifySetting({ value: true }); // ignore error
      });
    }
  }, [token]);
  const [notes, setNotes] = useState("");
  const [notify, setNotify] = useState<{ value: boolean } | null>(null);
  const [rememberNotify, setRememberNotify] = useState(false);
  const finalNotify = notify?.value ?? notifySetting?.value ?? true;

  const [thumbnail, setThumbnail] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [thumbnailStatus, setThumbnailStatus] = useState<
    "loading" | "error" | "ok"
  >("loading");
  // update thumbnail after draft data loaded
  if (res.data && thumbnail === null && thumbnailStatus === "loading") {
    const newThumbnail =
      res.data.files.find((f) => f.mime_type.startsWith("image/")) ?? null;
    if (newThumbnail === null)
      // if no image, then null / ok
      setThumbnailStatus("ok");
    // if any image, then first / loading
    else setThumbnail(newThumbnail);
  }

  const router = useRouter();

  const publish = useSWRMutation(
    swrKey,
    async (
      [draftId],
      opt: {
        arg: {
          notes: string;
          notify: boolean;
          rememberNotify: boolean;
          thumbnailId?: number;
        };
      },
    ) => {
      if (gAuthState.value.type !== "login")
        throw new Error("non-login state found in publishDraft mutation");
      const publishRes = await publishDraft(
        { token: gAuthState.value.token },
        {
          id: draftId,
          notes: opt.arg.notes,
          notify: opt.arg.notify,
          rememberNotify: opt.arg.rememberNotify,
          thumbnailId: opt.arg.thumbnailId ?? null,
        },
      );
      return publishRes;
    },
    {
      revalidate: false,
      onSuccess: (data) => {
        if (data.type === "Ok") {
          router.push(`/articles/${data.articleId}`);
        } else {
          alert("발행 중 오류가 발생했습니다");
        }
      },
    },
  );

  const publishDisabled =
    !res.data || publish.isMutating || thumbnailStatus !== "ok";

  if (authState.value.type === "loading") {
    return <main>로그인 중...</main>;
  } else if (authState.value.type === "anon") {
    return <main>초안을 읽으려면 로그인하세요</main>;
  } else if (res.error) {
    return <main>초안을 불러오는 중 오류가 발생했습니다</main>;
  } else if (res.isLoading || notifySetting === null) {
    return <main>초안을 불러오는 중...</main>;
  } else if (!res.data) {
    return <main>초안을 찾을 수 없습니다</main>;
  } else {
    return (
      <main>
        <h1 className="text-3xl font-bold">
          {res.data.title}{" "}
          <span className="text-sm text-gray-500">(미리보기)</span>
        </h1>
        <Viewer
          content={res.data.content}
          files={res.data.files}
          fileSuffix="/files/private"
        />
        <form
          className="border-t border-gray-200 mt-4 pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (gAuthState.value.type !== "login") {
              alert("먼저 로그인하세요");
              return;
            }
            if (draftId === null || !res.data) {
              alert("초안을 찾을 수 없습니다");
              return;
            }
            if (thumbnailStatus === "loading") {
              alert("썸네일이 이미지인지 확인 중입니다");
              return;
            }
            if (thumbnailStatus === "error") {
              alert("썸네일이 이미지가 아닙니다");
              return;
            }
            if (!confirm("발행하시겠습니까?")) return;

            void publish.trigger({
              notes,
              notify: finalNotify,
              rememberNotify,
              thumbnailId: thumbnail?.id,
            });
          }}
        >
          <input
            className="input"
            type="text"
            placeholder="변경사항을 짧게 적어주세요"
            maxLength={255}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          {res.data.files.length > 0 && (
            <label className="flex items-center gap-2 mt-2 flex-wrap justify-end">
              <span>썸네일</span>
              <select
                value={thumbnail?.id ?? ""}
                disabled={thumbnailStatus === "loading"}
                onChange={(e) => {
                  if (e.target.value === "") {
                    setThumbnail(null);
                    setThumbnailStatus("ok");
                  } else {
                    const id = parseInt(e.target.value);
                    const file = res.data!.files.find((f) => f.id === id)!;
                    setThumbnail(file);
                    setThumbnailStatus("loading");
                  }
                }}
                className={`p-1 pb-0 border border-gray-300 rounded-md flex-1 bg-white ${thumbnail === null ? "text-gray-500" : ""}`}
              >
                <option value="">없음</option>
                {res.data.files
                  .filter((f) => f.mime_type.startsWith("image/"))
                  .map((file) => (
                    <option key={file.id} value={file.id}>
                      {file.name}
                    </option>
                  ))}
              </select>
              {thumbnail && thumbnailStatus !== "error" && (
                <img
                  src={`/files/private/${thumbnail?.id}/${thumbnail?.name}`}
                  alt={thumbnail?.name}
                  className="w-8 h-8 object-cover rounded"
                  onLoad={() => setThumbnailStatus("ok")}
                  onError={() => setThumbnailStatus("error")}
                />
              )}
              {thumbnail === null ? null : thumbnailStatus === "loading" ? (
                <span className="text-gray-500">이미지인지 확인중...</span>
              ) : thumbnailStatus === "error" ? (
                <span className="text-red-500">이미지가 아닙니다</span>
              ) : (
                <span className="text-green-500">썸네일로 쓸 수 있습니다</span>
              )}
            </label>
          )}
          <label className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              checked={finalNotify}
              onChange={(e) => {
                setNotify({ value: e.target.checked });
                setRememberNotify(false);
              }}
            />
            <span>새글 알림 보내기</span>
          </label>
          <label className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              checked={rememberNotify}
              onChange={(e) => setRememberNotify(e.target.checked)}
            />
            <span>알림 설정 기억</span>
          </label>
          <p className="text-sm text-gray-500">
            {finalNotify
              ? rememberNotify
                ? "앞으로도 새글 알림을 보냅니다"
                : "이번에만 새글 알림을 보냅니다"
              : rememberNotify
                ? "앞으로도 알림 없이 조용히 발행합니다"
                : "이번에만 알림 없이 조용히 발행합니다"}
          </p>
          <section className="mt-2 flex justify-end gap-2">
            <Link href={`/drafts/${draftId}`} className="button button-blue">
              계속 수정
            </Link>
            <button
              className={`button ${publishDisabled ? "button-disabled" : "button-green"}`}
              type="submit"
            >
              발행
            </button>
            <Link href="/drafts" className="button">
              초안 목록
            </Link>
          </section>
        </form>
      </main>
    );
  }
}

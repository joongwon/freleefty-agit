"use client";
import { COMMENT, FAVORITE, MORE } from "@/components/icons";
import Link from "next/link";
import type { Article } from "@/types";
import {
  deleteArticle,
  createComment,
  listLikers,
  unlikeArticle,
  likeArticle,
  editArticle,
  getArticleDraftId,
} from "@/actions";
import { gAuthState } from "@/auth";
import { useHookstate } from "@hookstate/core";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import moment from "moment";

export default function Buttons(p: { article: Article }) {
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const auth = useHookstate(gAuthState);
  const commentDisabled = auth.value.type !== "login";
  if (commentDisabled && isCommentOpen) {
    setIsCommentOpen(false);
  }
  const likes = useLikes(p.article.id);

  return (
    <>
      <p className="text-sm text-gray-500 h-5">
        {likes.data && likes.data.length > 0 && (
          <>
            {likes.data.map((e, i, arr) => (
              <span key={e.userId} title={moment(e.createdAt).fromNow()}>
                {e.userName}
                {i < arr.length - 1 && ", "}
              </span>
            ))}
            님이 이 일지에 공감합니다
          </>
        )}
      </p>
      <section className="flex gap-2 mt-1 mb-4 items-center">
        <button
          onClick={() => {
            if (commentDisabled) alert("로그인 후 댓글을 달 수 있습니다");
            else setIsCommentOpen(!isCommentOpen);
          }}
          className="button flex gap-1 items-center"
          title={
            commentDisabled ? "로그인 후 댓글을 달 수 있습니다" : "댓글 달기"
          }
        >
          {COMMENT} {p.article.comments.length}
        </button>
        <LikeButton article={p.article} />
        <hr className="border-none flex-1" />
        <AuthorMenu article={p.article} />
        <Link href="/articles" title="모든 일지 목록" className="button">
          목록
        </Link>
      </section>
      {isCommentOpen && (
        <CommentForm
          articleId={p.article.id}
          afterSubmit={() => setIsCommentOpen(false)}
        />
      )}
    </>
  );
}

function CommentForm(p: { articleId: number; afterSubmit: () => void }) {
  const auth = useHookstate(gAuthState);
  const [comment, setComment] = useState("");
  const handleComment = async () => {
    if (auth.value.type !== "login") {
      throw new Error("non-login state detected in handleComment");
    }
    try {
      await createComment(auth.value.token, p.articleId, comment);
      p.afterSubmit();
    } catch (e) {
      console.error(e);
      alert("댓글 등록 중 오류가 발생했습니다.");
    }
  };
  return (
    <form
      className="flex gap-2 my-4 md:flex-row flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        void handleComment();
      }}
    >
      <input
        className="input flex-1"
        required
        minLength={1}
        maxLength={1023}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button className="button md:w-16" type="submit">
        등록
      </button>
    </form>
  );
}

function useLikes(articleId: number) {
  return useSWR([articleId, "like"], async ([id]) => listLikers(id));
}

function LikeButton(p: { article: Article }) {
  const auth = useHookstate(gAuthState);
  const likes = useLikes(p.article.id);
  const userId = auth.value.type === "login" ? auth.value.profile.id : null;
  const userInLike = likes.data?.some((e) => e.userId === userId) ?? false;
  const canClick = auth.value.type === "login" && likes.data !== undefined;
  const toggleLike = useSWRMutation(
    [p.article.id, "like"],
    async ([articleId], opt: { arg: { like: boolean } }) => {
      if (auth.value.type !== "login") {
        throw new Error("non-login state detected in like button");
      }
      return {
        req: opt.arg.like,
        res: opt.arg.like
          ? await likeArticle(auth.value.token, articleId)
          : await unlikeArticle(auth.value.token, articleId),
      } as const;
    },
    {
      onError: (e) => {
        console.error(e);
        alert("공감 처리 중 오류가 발생했습니다.");
      },
      onSuccess: (data) => {
        if (data.res === "InvalidAction") {
          if (data.req === true) {
            alert("이미 공감한 일지입니다.");
          } else {
            alert("아직 공감하지 않은 일지입니다.");
          }
        }
      },
    },
  );

  return (
    <>
      <button
        className={`button flex gap-1 items-center text-red-500 ${userInLike ? "" : "symbol-no-fill"}`}
        title={
          !canClick
            ? "로그인 후 공감할 수 있습니다."
            : userInLike
              ? "공감 취소"
              : "공감"
        }
        onClick={() => {
          if (!canClick) {
            alert("로그인 후 공감할 수 있습니다.");
            return;
          }
          void toggleLike.trigger({ like: !userInLike });
        }}
      >
        {FAVORITE} {likes.data?.length}
      </button>
    </>
  );
}

function AuthorMenu(p: { article: Article }) {
  const auth = useHookstate(gAuthState);
  const router = useRouter();
  const swrKey =
    auth.value.type === "login" ? ([p.article.id, "draftId"] as const) : null;
  const draftId = useSWR(swrKey, async ([id]) => {
    if (auth.value.type !== "login") {
      throw new Error("non-login state detected in author menu");
    }
    return await getArticleDraftId(auth.value.token, id);
  });
  const handleDeleteArticle = async () => {
    if (auth.value.type !== "login") {
      throw new Error("non-login state detected in handleDeleteArticle");
    }
    if (!confirm("정말로 삭제하시겠습니까?")) {
      return;
    }
    try {
      const res = await deleteArticle(auth.value.token, p.article.id);
      switch (res) {
        case "Ok":
          router.push("/articles");
          return;
        case "NotFound":
          alert("이미 삭제된 일지입니다.");
          return;
        case "Forbidden":
          alert("삭제할 권한이 없습니다.");
          return;
      }
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };
  const handleUpdateArticle = async () => {
    if (auth.value.type !== "login") {
      throw new Error("non-login state detected in handleUpdateArticle");
    }
    const res = await editArticle(auth.value.token, p.article.id);
    switch (res) {
      case "NotFound":
        alert("일지를 찾을 수 없습니다");
        return;
      case "Forbidden":
        alert("수정할 권한이 없습니다");
        return;
      default:
        router.push(`/drafts/${res}`);
        return;
    }
  };

  const isAuthor =
    auth.value.type === "login" && auth.value.profile.id === p.article.authorId;

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const close = () => {
      setIsOpen(false);
      window.removeEventListener("click", close);
    };
    setTimeout(() => {
      window.addEventListener("click", close);
    }, 500);
    return () => {
      window.removeEventListener("click", close);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center">
        {MORE}
      </button>
      <menu
        className={`absolute right-full top-1/2 -translate-y-1/2
          flex justify-center items-center gap-2 p-2 bg-gray-100 rounded-md mr-2
          text-nowrap text-sm
          after:absolute after:top-1/2 after:left-full after:-translate-y-1/2
          after:border-4 after:border-transparent after:border-l-gray-100
        ${isOpen ? "" : "hidden"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {!isAuthor ||
        draftId.isLoading ||
        draftId.error ? null : !draftId.data ? (
          <>
            <li>
              <button
                title="개정판 초안 만들기"
                className="button"
                onClick={() => {
                  void handleUpdateArticle();
                }}
              >
                수정
              </button>
            </li>
            <li>
              <button
                title="삭제"
                className="button button-red"
                onClick={() => {
                  void handleDeleteArticle();
                }}
              >
                삭제
              </button>
            </li>
          </>
        ) : (
          <li>
            <Link
              href={`/drafts/${draftId.data}`}
              title="수정중인 개정판으로 이동"
              className="button"
            >
              개정판 초안 편집
            </Link>
          </li>
        )}
        <li>
          {p.article.editionsCount > 1 ? (
            <Link
              href={`/editions/${p.article.editionId}`}
              title="이 일지로서 발행한 판의 목록"
              className="button"
            >
              다른 판 ({p.article.editionsCount})
            </Link>
          ) : (
            <span className="button button-disabled">(초판입니다)</span>
          )}
        </li>
      </menu>
    </div>
  );
}

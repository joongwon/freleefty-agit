"use client";
import { COMMENT, FAVORITE } from "@/components/icons";
import Link from "next/link";
import classnames from "classnames/bind";
import styles from "./page.module.scss";
import type { Article } from "db";
import type { MaybeNotFoundForbidden } from "@/db";
import {
  deleteArticle,
  createComment,
  listLikers,
  unlikeArticle,
  likeArticle,
} from "@/actions";
import { gAuthState } from "@/auth";
import { useHookstate } from "@hookstate/core";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import moment from "moment";

const cx = classnames.bind(styles);

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
      {likes.data && likes.data.length > 0 && (
        <p className={cx("likes")}>
          {likes.data.map((e, i, arr) => (
            <span key={e.user.id} title={moment(e.createdAt).fromNow()}>
              {e.user.name}
              {i < arr.length - 1 && ", "}
            </span>
          ))}
          님이 이 일지에 공감합니다
        </p>
      )}
      <section className={cx("buttons")}>
        <button
          onClick={() => {
            if (commentDisabled) alert("로그인 후 댓글을 달 수 있습니다");
            else setIsCommentOpen(!isCommentOpen);
          }}
          className={cx({ disabled: commentDisabled })}
          title={
            commentDisabled ? "로그인 후 댓글을 달 수 있습니다" : "댓글 달기"
          }
        >
          {COMMENT} {p.article.comments.length}
        </button>
        <LikeButton article={p.article} />
        <hr />
        <DeleteButton article={p.article} />
        <Link href="/articles" title="모든 일지 목록">
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
      className={cx("comment-form")}
      onSubmit={(e) => {
        e.preventDefault();
        void handleComment();
      }}
    >
      <textarea
        required
        minLength={1}
        maxLength={1023}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button type="submit">등록</button>
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
  const userInLike = likes.data?.some((e) => e.user.id === userId) ?? false;
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
      };
    },
    {
      onError: (e) => {
        console.error(e);
        alert("공감 처리 중 오류가 발생했습니다.");
      },
      onSuccess: (data) => {
        if (data.res === 0) {
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
        className={cx("like", { liked: userInLike, disabled: !canClick })}
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

function DeleteButton(p: { article: Article }) {
  const auth = useHookstate(gAuthState);
  const router = useRouter();
  const handleDeleteArticle = async () => {
    if (auth.value.type !== "login") {
      throw new Error("non-login state detected in handleDeleteArticle");
    }
    if (!confirm("정말로 삭제하시겠습니까?")) {
      return;
    }
    try {
      const res: MaybeNotFoundForbidden = await deleteArticle(auth.value.token, p.article.id);
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

  const canDeleteArticle =
    auth.value.type === "login" &&
    auth.value.profile.id === p.article.author.id;
  return (
    canDeleteArticle && (
      <button
        title="삭제"
        className={cx("delete")}
        onClick={() => {
          void handleDeleteArticle();
        }}
      >
        삭제
      </button>
    )
  );
}

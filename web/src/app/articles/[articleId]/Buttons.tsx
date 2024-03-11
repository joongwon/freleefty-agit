"use client";
import { COMMENT, FAVORITE } from "@/components/icons";
import Link from "next/link";
import classnames from "classnames/bind";
import styles from "./page.module.scss";
import type { Article } from "db";
import { deleteArticle, createComment, listLikers, unlikeArticle, likeArticle } from "@/actions";
import { gAuthState } from "@/auth";
import { useHookstate } from "@hookstate/core";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

const cx = classnames.bind(styles);

export default function Buttons(p: { article: Article }) {
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const auth = useHookstate(gAuthState);
  const commentDisabled = auth.value.type !== "login";
  if (commentDisabled && isCommentOpen) {
    setIsCommentOpen(false);
  }

  return (
    <>
      <section className={cx("buttons")}>
        <button
          onClick={() => setIsCommentOpen(!isCommentOpen)}
          disabled={commentDisabled}
        >
          {COMMENT} {p.article.comments.length}
        </button>
        <LikeButton article={p.article} />
        <hr />
        <Link href="/articles">목록</Link>
        <DeleteButton article={p.article} />
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

function LikeButton(p: { article: Article }) {
  const auth = useHookstate(gAuthState);
  const likes = useSWR([p.article.id, "like"], async ([articleId]) => listLikers(articleId));
  const userId = auth.value.type === "login" ? auth.value.profile.id : null;
  const userInLike = likes.data?.some((liker) => liker === userId) ?? false;
  const canClick = auth.value.type === "login" && likes.data !== undefined;
  const toggleLike = useSWRMutation([p.article.id, "like"], async ([articleId], opt: { arg: { like: boolean }}) => {
    if (auth.value.type !== "login") {
      throw new Error("non-login state detected in like button");
    }
    return {
      req: opt.arg.like,
      res: opt.arg.like ? await likeArticle(auth.value.token, articleId) : await unlikeArticle(auth.value.token, articleId),
    };
  }, {
    onError: (e) => {
      console.error(e);
      alert("추천 처리 중 오류가 발생했습니다.");
    },
    onSuccess: (data) => {
      if (data.res === 0) {
        if (data.req === true) {
          alert("이미 추천한 일지입니다.");
        } else {
          alert("아직 추천하지 않은 일지입니다.");
        }
      }
    }
  });

  return <button className={cx("like", {liked: userInLike})} disabled={!canClick}
    onClick={() => {
      void toggleLike.trigger({ like: !userInLike });
    }}>
    {FAVORITE} {likes.data ? likes.data.length : "…"}
  </button>;
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

  const canDeleteArticle =
    auth.value.type === "login" &&
    auth.value.profile.id === p.article.author.id;
  return (canDeleteArticle && (
    <button
      className={cx("delete")}
      onClick={() => {
        if (auth.value.type !== "login") {
          throw new Error(
            "non-login state detected in delete article button",
          );
        }
        void handleDeleteArticle();
      }}
    >
      삭제
    </button>
  ));
}

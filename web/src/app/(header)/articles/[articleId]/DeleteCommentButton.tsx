"use client";
import type { ArticleComment } from "@/types";
import { gAuthState } from "@/auth";
import { useHookstate } from "@hookstate/core";
import { deleteComment } from "@/actions";

export default function DeleteCommentButton(p: {
  articleId: number;
  comment: ArticleComment;
}) {
  const auth = useHookstate(gAuthState);
  const canDelete =
    auth.value.type === "login" && auth.value.profile.id === p.comment.authorId;
  const handleDelete = async () => {
    if (auth.value.type !== "login") {
      throw new Error("non-login state detected in handleDelete");
    }
    if (!confirm("정말로 삭제하시겠습니까?")) {
      return;
    }
    try {
      const res = await deleteComment(
        auth.value.token,
        p.articleId,
        p.comment.id,
      );
      switch (res) {
        case "Ok":
          return;
        case "NotFound":
          alert("이미 삭제된 댓글입니다.");
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
  return canDelete ? (
    <button
      onClick={() => void handleDelete()}
      className="button button-red md:absolute md:right-0 md:top-0 h-fit m-2 md:hidden group-hover:block"
    >
      삭제
    </button>
  ) : null;
}

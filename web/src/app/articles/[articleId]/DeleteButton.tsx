"use client";

import styles from "./page.module.scss";
import classnames from "classnames/bind";
import { gAuthState } from "@/auth";
import { useHookstate } from "@hookstate/core";
import { deleteArticle } from "@/actions";
const cx = classnames.bind(styles);

async function handleDelete(token: string, id: number) {
  try {
    const res = await deleteArticle(token, id);
    switch (res) {
      case "Ok":
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
}

export default function DeleteButton(p: { authorId: string; id: number }) {
  const auth = useHookstate(gAuthState);
  if (auth.value.type === "login" && auth.value.profile.id === p.authorId) {
    const token = auth.value.token;
    return (
      <button
        className={cx("delete")}
        onClick={() => void handleDelete(token, p.id)}
      >
        삭제
      </button>
    );
  } else {
    return null;
  }
}

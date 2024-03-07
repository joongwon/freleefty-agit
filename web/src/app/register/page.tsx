"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { createUser } from "@/actions";
import Link from "next/link";
import styles from "./page.module.scss";
import classNames from "classnames/bind";
import { PageProps, onlyString } from "@/utils";
import { useHookstate } from "@hookstate/core";
import { gAuthState, putRefreshToken } from "@/auth";

const cx = classNames.bind(styles);

export default function Register(p: PageProps) {
  const state = onlyString(p.searchParams.from);
  const from = state?.startsWith("/") ? state : "/";

  const router = useRouter();

  // 회원가입을 위한 일회용코드. 이름 등이 충돌하는 경우 재발급됨.
  const [code, setCode] = useState(onlyString(p.searchParams.code) ?? null);

  // input
  const [name, setName] = useState(onlyString(p.searchParams.name) ?? "");
  const [id, setId] = useState("");

  // 오류가 발생하는 경우 다시 로그인하도록 안내
  const [status, setStatus] = useState<"ok" | "fatal" | "naverIdConflict">(
    p.searchParams.code ? "ok" : "fatal",
  );

  // 마지막 회원가입 요청에서 발생한 충돌
  const [conflict, setConflict] = useState<"UserId" | "Name" | null>(null);

  // exhuastive check를 위한 함수, 만일 호출된다면 사용자에게 오류로 안내
  const checkExhaustive = (_x: never) => setStatus("fatal");

  const domId = useId();
  const auth = useHookstate(gAuthState);

  return status !== "ok" ? (
    <main>
      <h1>사용자 등록</h1>
      {status === "naverIdConflict" ? (
        <p>이미 사용중인 아이디입니다. 다시 로그인하세요.</p>
      ) : status === "fatal" ? (
        <p>오류가 발생했습니다. 다시 로그인하세요.</p>
      ) : null}
      <nav>
        <ul>
          <li>
            <Link href={from ? `/login?from=${state}` : "/login"}>
              다시 로그인
            </Link>
          </li>
          {from ? (
            <li>
              <Link href={from}>돌아가기</Link>
            </li>
          ) : (
            <li>
              <Link href="/">대문으로</Link>
            </li>
          )}
        </ul>
      </nav>
    </main>
  ) : (
    <main>
      <h1>사용자 등록</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code) {
            setCode(null);
            createUser(code, id, name)
              .then((res) => {
                if (res.type === "success") {
                  auth.set({
                    type: "login",
                    token: res.accessToken,
                    profile: res.profile,
                  });
                  putRefreshToken(res.refreshToken);
                  router.replace(from);
                } else if (res.type === "conflict") {
                  if (res.conflict === "NaverId") {
                    // 네이버 아이디가 충돌하는 경우 처음부터 다시 로그인 시도
                    setStatus("naverIdConflict");
                  } else {
                    setConflict(res.conflict);
                    setCode(res.code);
                  }
                } else {
                  checkExhaustive(res);
                }
              })
              .catch((e) => {
                console.error(e);
                setStatus("fatal");
              });
          }
        }}
      >
        <label htmlFor={`id-${domId}`}>아이디</label>
        <input
          id={`id-${domId}`}
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
        <label htmlFor={`name-${domId}`}>이름</label>
        <input
          id={`name-${domId}`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button disabled={code === null} type="submit">
          등록
        </button>
      </form>
      <p className={cx("conflict")}>
        {conflict === "UserId"
          ? "이미 사용중인 아이디입니다."
          : conflict === "Name"
            ? "이미 사용중인 이름입니다."
            : null}
      </p>
    </main>
  );
}

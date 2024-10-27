"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { createUser } from "@/actions/auth";
import Link from "next/link";
import { PageProps, onlyString } from "@/utils";
import { gAuthState } from "@/auth";

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
  const [conflict, setConflict] = useState<"Id" | "Name" | null>(null);
  const conflictMessage =
    conflict === "Id"
      ? "이미 사용중인 아이디입니다."
      : conflict === "Name"
        ? "이미 사용중인 이름입니다."
        : null;

  const domId = useId();

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
      <h1 className="text-2xl font-bold my-2">사용자 등록</h1>
      <form
        className="flex flex-col gap-2 border border-gray-300 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (code) {
            setCode(null);
            createUser({ code, id, name })
              .then((res) => {
                switch (res.type) {
                  case "success":
                    gAuthState.set({
                      type: "login",
                      token: res.accessToken,
                      profile: res.profile,
                    });
                    router.replace(from);
                    break;
                  case "fatal":
                    setStatus("naverIdConflict");
                    break;
                  case "error":
                    setConflict(res.conflict);
                    setCode(res.code);
                    break;
                }
              })
              .catch((e) => {
                console.error(e);
                setStatus("fatal");
              });
          }
        }}
      >
        <label htmlFor={`id-${domId}`}>아이디 (숫자 또는 영문 1~20자)</label>
        <input
          className="input"
          id={`id-${domId}`}
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          minLength={1}
          maxLength={20}
          pattern="[a-zA-Z0-9]+"
          required
        />
        <label htmlFor={`name-${domId}`}>
          이름 (연속된 공백이 없는 1~20자)
        </label>
        <input
          className="input"
          id={`name-${domId}`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={1}
          maxLength={20}
          pattern="[^\s]+( [^\s]+)*"
          required
        />
        <button
          disabled={code === null}
          type="submit"
          className="button text-black w-fit self-center"
        >
          등록
        </button>
      </form>
      <p className="text-red-600">{conflictMessage}</p>
    </main>
  );
}

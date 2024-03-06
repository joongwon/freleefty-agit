"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { tryLogin, TryLoginResult } from "@/actions";
import { tokenStore } from "@/token";
import { PageProps, onlyString } from "@/utils";
import { hookstate, useHookstate } from "@hookstate/core";
import { useRouter } from "next/navigation";

let requested = false;
let gResult: TryLoginResult | null = null;
let gError = false;

const gLoginState = hookstate({ status: "loading" as const } as { status: "loading" | "error" | "idle" } | { status: "done"; result: TryLoginResult });

export default function NaverCallback(p: PageProps) {
  const code = onlyString(p.searchParams.code);

  const [error, setError] = useState(code === undefined);

  // 오직 사이트 내에서만 redirect되도록 필터링
  const state = onlyString(p.searchParams.state);
  const from = state?.startsWith("/") ? state : null;

  const token = useHookstate(tokenStore());
  const loginState = useHookstate(gLoginState);

  const router = useRouter();

  useEffect(() => {
    if (code && !loginState.promised && loginState.get().status === "loading") {
      const task = async () => {
        try {
          const result = await tryLogin(code);
          return { status: "done" as const, result };
        } catch (e) {
          return { status: "error" as const };
        }
      };
      loginState.set(task());
    }
  }, [code, loginState]);
  useEffect(() => {
    if (loginState.promised) return;
    if (loginState.value.status === "done") {
      const result = loginState.value.result;
      if (result.type === "login") {
        token.set({ status: "token", token: result.token });
        router.replace(from ?? "/");
      } else if (result.type === "register") {
        router.replace(
          "/register?name=" +
            encodeURIComponent(result.naverName) +
            "&code=" +
            encodeURIComponent(result.registerCode) +
            "&from=" +
            encodeURIComponent(from ?? "/"),
        );
      }
      loginState.set({ status: "idle" });
    } else if (loginState.value.status === "error") {
      setError(true);
      loginState.set({ status: "idle" });
    }
  }, [loginState]);

  return !error && code ? (
    <main>로그인 중...</main>
  ) : (
    <main>
      <p>로그인 중 오류가 발생했습니다</p>
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
  );
}

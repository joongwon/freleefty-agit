"use client";

import Link from "next/link";
import { useEffect } from "react";
import { tryLogin } from "@/actions";
import { PageProps, onlyString } from "@/utils";
import { hookstate, useHookstate } from "@hookstate/core";
import { useRouter } from "next/navigation";
import { gAuthState, putRefreshToken } from "@/auth";

type LoginState =
  | { type: "loading" | "error" | "redirect" | "login" }
  | { type: "register"; name: string; code: string };

const gLoginState = hookstate<LoginState>({ type: "loading" });

let initLoginCalled = false;
async function initLogin() {
  if (initLoginCalled) return;
  initLoginCalled = true;

  // clean possible old tokens
  // popRefreshToken(); // this is done in InitToken (src/auth.ts)

  const searchParams = new URLSearchParams(location.search);
  const code = onlyString(searchParams.get("code"));
  if (!code) {
    gLoginState.set({ type: "error" });
    return;
  }

  const res = await tryLogin(code).catch(() => null);
  if (!res) {
    gLoginState.set({ type: "error" });
  } else if (res.type === "login") {
    putRefreshToken(res.refreshToken);
    gAuthState.set({
      type: "login",
      token: res.accessToken,
      profile: res.profile,
    });
    gLoginState.set({ type: "login" });
  } else if (res.type === "register") {
    gLoginState.set({
      type: "register",
      name: res.naverName,
      code: res.registerCode,
    });
  }
}

export default function NaverCallback(p: PageProps) {
  // 오직 사이트 내에서만 redirect되도록 필터링
  const state = onlyString(p.searchParams.state);
  const from = state?.startsWith("/") ? state : null;

  const login = useHookstate(gLoginState);
  const router = useRouter();

  useEffect(() => {
    void initLogin();
  }, []);

  // routing
  useEffect(() => {
    switch (login.value.type) {
      case "login":
        router.replace(from ?? "/");
        login.set({ type: "redirect" });
        break;
      case "register":
        router.replace(
          "/register?name=" +
            encodeURIComponent(login.value.name) +
            "&code=" +
            encodeURIComponent(login.value.code) +
            "&from=" +
            encodeURIComponent(from ?? "/"),
        );
        login.set({ type: "redirect" });
        break;
      default:
        break;
    }
  }, [login, from, router]);

  switch (login.value.type) {
    case "loading":
      return <main>로그인 중...</main>;
    case "redirect":
      return <main>리다이렉트 중...</main>;
    case "error":
      return (
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
}

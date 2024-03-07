"use client";

import { logout } from "@/actions";
import { useRouter } from "next/navigation";
import { useHookstate } from "@hookstate/core";
import { gAuthState, popRefreshToken } from "@/auth";

function handleLogout() {
  const refreshToken = popRefreshToken();
  if (refreshToken) {
    void logout(refreshToken);
  }
  gAuthState.set({ type: "anon" });
}

function handleLogin(router: ReturnType<typeof useRouter>) {
  // manual navigation with current URL in `from` query
  if (window.location.pathname.startsWith("/login")) {
    return;
  } else if (window.location.pathname.startsWith("/register")) {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const from = urlSearchParams.get("from") ?? "/";
    router.push(`/login?from=${encodeURIComponent(from)}`);
  } else {
    const from =
      window.location.pathname + window.location.search + window.location.hash;
    router.push(`/login?from=${encodeURIComponent(from)}`);
  }
}

export default function AuthMenu() {
  const router = useRouter();
  const authState = useHookstate(gAuthState);

  switch (authState.value.type) {
    case "loading":
      return <menu>사용자 확인중...</menu>;
    case "anon":
      return (
        <menu>
          <li>
            <a
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                handleLogin(router);
              }}
            >
              로그인
            </a>
          </li>
        </menu>
      );
    case "login":
      return (
        <menu>
          <li>{authState.value.profile.name}님 환영합니다!</li>
          <li>
            <button
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }}
            >
              로그아웃
            </button>
          </li>
        </menu>
      );
  }
}

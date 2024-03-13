"use client";

import { logout } from "@/actions";
import { useRouter } from "next/navigation";
import { useHookstate } from "@hookstate/core";
import { gAuthState, popRefreshToken } from "@/auth";
import Link from "next/link";

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
          <li><span className="name">{authState.value.profile.name}</span><span>님 환영합니다!</span></li>
          <li>
            <Link href="/drafts">일지 쓰기</Link>
          </li>
          <li>
            <button onClick={() => handleLogout()}>로그아웃</button>
          </li>
        </menu>
      );
  }
}

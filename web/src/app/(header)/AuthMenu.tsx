"use client";

import { logout, devLogin } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { useHookstate } from "@hookstate/core";
import { gAuthState } from "@/auth";
import Link from "next/link";

function handleLogout() {
  void logout();
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

function Menu(p: { children: React.ReactNode }) {
  return (
    <menu className="flex flex-wrap min-w-0 text-gray-600">{p.children}</menu>
  );
}

function Item(p: { children: React.ReactNode }) {
  return (
    <li className="before:content-['·'] first:before:content-none before:mx-2 min-w-0 flex">
      {p.children}
    </li>
  );
}

export default function AuthMenu() {
  const router = useRouter();
  const authState = useHookstate(gAuthState);

  switch (authState.value.type) {
    case "loading":
      return <menu>사용자 확인중...</menu>;
    case "anon":
      return (
        <Menu>
          <Item>
            <a
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                handleLogin(router);
              }}
            >
              로그인
            </a>
          </Item>
          {process.env.NODE_ENV === "development" && (
            <Item>
              <button
                onClick={() => {
                  void devLogin().then((r) =>
                    gAuthState.set({
                      type: "login",
                      token: r.accessToken,
                      profile: r.profile,
                    }),
                  );
                }}
              >
                개발모드 로그인
              </button>
            </Item>
          )}
        </Menu>
      );
    case "login":
      return (
        <Menu>
          <Item>
            <Link
              href={`/users/${authState.value.profile.id}`}
              className="whitespace-nowrap inline-block min-w-0 text-ellipsis overflow-hidden underline"
            >
              {authState.value.profile.name}
            </Link>
            <span className="whitespace-nowrap">님 환영합니다!</span>
          </Item>
          <Item>
            <Link href="/drafts">일지 쓰기</Link>
          </Item>
          <Item>
            <Link href="/settings">설정</Link>
          </Item>
          <Item>
            <button onClick={() => handleLogout()}>로그아웃</button>
          </Item>
        </Menu>
      );
  }
}

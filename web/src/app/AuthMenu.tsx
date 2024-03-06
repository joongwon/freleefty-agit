"use client";

import { getProfile, logout } from "@/actions";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { tokenStore } from "@/token";
import { useHookstate } from "@hookstate/core";
import { useEffect } from "react";
import { refresh } from "@/actions";

function clientLogout() {
  tokenStore().set({ status: "token", token: null });
  void logout();
}

let refreshed = false;

export default function AuthMenu() {
  const router = useRouter();
  const tokenState = useHookstate(tokenStore());
  // token store is initialized by AuthMenu component
  useEffect(() => {
    if (refreshed) return;
    refreshed = true;
    if (!tokenState.promised && tokenState.get().status === "initial") {
      refresh().then((token) => {
        tokenState.set({ status: "token", token });
      }).catch(() =>
        tokenState.set({ status: "token", token: null })
      );
    }
  }, [tokenState]);

  const profile = useSWR(tokenState.value.token ? "yes" : null, () => getProfile(tokenState.value.token!), {
    onError: () => {
      // 프로필을 받아오지 못한 경우 로그아웃
      clientLogout();
    }
  });

  return tokenState.value.status === "initial" || (tokenState.value.token && profile.isLoading) ? (
    /* 토큰을 받아오는 중 또는 프로필을 받아오는 중 */
    <menu>
      <li>사용자 확인중...</li>
    </menu>
  ) : !tokenState.value.token || !profile.data ? (
    /* 토큰이 없거나 프로필을 받아오지 못한 경우 */
    <menu>
      <li>
        <a
          href="/login"
          onClick={(e) => {
            // manual navigation with current URL in `from` query
            e.preventDefault();
            if (window.location.pathname.startsWith("/login")) {
              return;
            } else if (window.location.pathname.startsWith("/register")) {
              const urlSearchParams = new URLSearchParams(window.location.search);
              const from = urlSearchParams.get("from") ?? "/";
              router.push(`/login?from=${encodeURIComponent(from)}`);
            } else {
              const from =
                window.location.pathname +
                window.location.search +
                window.location.hash;
              router.push(`/login?from=${encodeURIComponent(from)}`);
            }
          }}
        >
          로그인
        </a>
      </li>
    </menu>
  ) : (
    /* 토큰이 있고 프로필을 받아온 경우 */
    <menu>
      <li>
        {profile.data.name}님 환영합니다!
      </li>
      <li>
        <a
          href="/logout"
          onClick={(e) => {
            e.preventDefault();
            clientLogout();
            // TODO: navigation
          }}
        >
          로그아웃
        </a>
      </li>
    </menu>
  );
}

"use client";
import { PageProps, onlyString } from "@/utils";
import { gAuthState } from "@/auth";
import { useHookstate } from "@hookstate/core";

function useAuthUrl(clientId: string, from?: string) {
  const state = encodeURIComponent(from ?? "/");
  const host = window.location.origin;
  return `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    `${host}/login/naver/callback`,
  )}&state=${state}`;
}

export default function Login(p: PageProps & { clientId: string }) {
  const authState = useHookstate(gAuthState);
  const authUrl = useAuthUrl(p.clientId, onlyString(p.searchParams.from));
  switch (authState.value.type) {
    case "loading":
      return <main>로딩중...</main>;
    case "login":
      return <main>이미 로그인되어 있습니다</main>;
    case "anon":
      return (
        <main>
          <h1>로그인</h1>
          <p>네이버 아이디로 로그인하여 일지를 쓰고 반응을 남겨보세요</p>
          <a href={authUrl}>
            <img
              src="/img/naverLogin.png"
              alt="네이버 아이디로 로그인"
              width="225"
              height="60"
            />
          </a>
        </main>
      );
  }
}

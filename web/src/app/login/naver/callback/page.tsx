"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { host } from "@/host";

export default function NaverCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"init" | "invalid">("init");

  // code가 없는 경우 로그인 실패; 다시 로그인하도록 유도
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const from = state?.startsWith(host) ? state.slice(host.length) : null;
  if (status === "init" && !code) {
    setStatus("invalid");
    return;
  }
  return (
    status === "init" ? (
      <main>로그인 중...</main>
    ) : status === "invalid" ? (
      <main>
        <p>잘못된 접근입니다</p>
        <nav>
          <ul>
            <li><Link href={from ? `/login?from=${state}` : "/login"}>다시 로그인</Link></li>
            {from ? <li><Link href={from}>돌아가기</Link></li> : <li><Link href="/">대문으로</Link></li>}
          </ul>
        </nav>
      </main>
    ) : null
  );
}

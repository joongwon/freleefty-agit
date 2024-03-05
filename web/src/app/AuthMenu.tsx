"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthMenu() {
  const router = useRouter();
  return (
    <menu>
      <li>
        <a href="/login"
          onClick={(e) => {
            // manual navigation with current URL in `from` query
            e.preventDefault();
            const from = window.location.toString();
            router.push(`/login?from=${encodeURIComponent(from)}`);
          }}>로그인</a>
      </li>
    </menu>
  );
}

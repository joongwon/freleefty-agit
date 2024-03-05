"use client";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.scss";
import classNames from "classnames/bind";
import naverLogin from "./naverLogin.png";
import Image from "next/image";
import { host } from "@/host";

const cx = classNames.bind(styles);

function useAuthUrl() {
  const clientId = process.env.NEXT_PUBLIC_NAVER_ID;
  if (!clientId) {
    throw new Error("NAVER_ID is not defined");
  }
  const from = useSearchParams().get("from");
  const state = encodeURIComponent(from ?? "/");
  return `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    `${host}/login/naver/callback`
  )}&state=${state}`;
}

export default function Login() {
  return (
    <main className={cx("login")}>
      <h1>로그인</h1>
      <a href={useAuthUrl()}>
        <Image src={naverLogin} alt="네이버 아이디로 로그인" width="225" height="60"/>
      </a>
    </main>
  );
}

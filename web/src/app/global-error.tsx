"use client";
import { Metadata } from "next";
import "./global.scss";
import "./layout.scss";

export const metadata: Metadata = {
  title: "왼손잡이해방연대 아지트",
  description: "오른손도 자주 씁니다",
};

export default function RootLayout(p: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body>
        <header>
          <a href="/">
            <h1>왼손잡이해방연대 아지트</h1>
          </a>
        </header>
        <main>
          <h1>알 수 없는 오류!</h1>
          <button onClick={() => p.reset()}>다시 시도</button>
          <p>오류가 계속되면 아래 내용을 관리자에게 문의하세요</p>
          <p>{p.error.message}</p>
          <p>digest: {p.error.digest}</p>
        </main>
      </body>
    </html>
  );
}

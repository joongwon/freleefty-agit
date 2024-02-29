import { Metadata } from "next";
import Link from "next/link";
import { ReactNode } from "react";
import "./global.scss";
import "./layout.scss";

export const metadata: Metadata = {
  title: "왼손잡이해방연대 아지트",
  description: "오른손도 자주 씁니다",
};

export default function RootLayout(p: {
  children: ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body>
        <header>
          <Link href="/">왼손잡이해방연대 아지트</Link>
          <menu>{/* TODO */}TODO</menu>
        </header>
        <nav>
          <ul>
            <li><Link href="/">소개</Link></li>
            <li><Link href="/articles">모든 일지</Link></li>
          </ul>
        </nav>
        {p.children}
      </body>
    </html>
  );
}

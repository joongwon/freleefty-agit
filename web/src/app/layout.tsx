import { Metadata } from "next";
import Link from "next/link";
import { ReactNode } from "react";
import "./global.scss";
import "./layout.scss";
import AuthMenu from "./AuthMenu";
import { InitToken } from "@/auth";
import NavMenu from "./NavMenu";
import Header from "./Header";

export const metadata: Metadata = {
  title: "왼손잡이해방연대 아지트",
  description: "오른손도 자주 씁니다",
};

export default function RootLayout(p: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body>
        <Header>
          <Link href="/">
            <h1>왼손잡이해방연대 아지트</h1>
          </Link>
          <AuthMenu />
        </Header>
        <NavMenu />
        <div id="top" style={{ position: "absolute" }} />
        {p.children}
      </body>
      <InitToken />
    </html>
  );
}

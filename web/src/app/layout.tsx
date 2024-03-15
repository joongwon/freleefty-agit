import { Metadata } from "next";
import { ReactNode } from "react";
import "./global.scss";
import { InitToken } from "@/auth";

export const metadata: Metadata = {
  title: {
    template: "%s | 왼손잡이해방연대 아지트",
    default: "왼손잡이해방연대 아지트",
  },
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
      <body>{p.children}</body>
      <InitToken />
    </html>
  );
}

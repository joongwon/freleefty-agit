import Link from "next/link";
import { ReactNode } from "react";
import AuthMenu from "./AuthMenu";
import NavMenu from "./NavMenu";
import Header from "./Header";

export default function HeaderLayout(p: { children: ReactNode }) {
  return (
    <>
      <Header>
        <Link href="/">
          <h1>왼손잡이해방연대 아지트</h1>
        </Link>
        <AuthMenu />
      </Header>
      <NavMenu />
      <div id="top" style={{ position: "absolute" }} />
      {p.children}
    </>
  );
}

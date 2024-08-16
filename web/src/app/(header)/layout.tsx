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
          <h1 className="text-2xl font-bold">왼손잡이해방연대 아지트</h1>
        </Link>
        <AuthMenu />
      </Header>
      <div className="flex flex-row last:*:flex-1 last:*:m-4 last:*:min-w-0 gap-4 items-start">
        <NavMenu />
        {p.children}
      </div>
    </>
  );
}

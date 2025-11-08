"use client";

import Link from "next/link";
import { useState } from "react";
import { MENU, CLOSE, GOTO_TOP } from "@/components/icons";

function Button(p: {
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={p.onClick}
      className="bg-white rounded-full border my-2 size-12 flex items-center justify-center md:hidden"
    >
      {p.children}
    </button>
  );
}

export default function NavMenu() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <nav
      className="fixed bottom-0 right-0 m-8 flex flex-col text-xl md:static md:inset-auto md:m-0 md:text-base md:bg-gray-200 md:p-4 md:shadow-lg z-10"
      onClick={(e) => {
        if (e.target instanceof HTMLAnchorElement) {
          setIsOpen(false);
        }
      }}
    >
      <div
        className={`fixed bg-white/75 inset-0 -z-10 transition duration-500 md:hidden${isOpen ? " opacity-1" : " animate-disappear opacity-0"}`}
        onClick={() => setIsOpen(false)}
      />
      <ul
        className={`absolute right-0 bottom-full whitespace-nowrap text-right transition duration-500 md:static md:inset-auto md:block md:text-left md:opacity-100 md:translate-y-0 md:animate-none ${isOpen ? "opacity-100" : "animate-disappear opacity-0 translate-y-1/4"}`}
      >
        <li>
          <Link href="/">소개</Link>
        </li>
        <li>
          <Link href="/articles">모든 일지</Link>
        </li>
        <li>
          <Link href="/comments">최근 댓글</Link>
        </li>
      </ul>
      <Button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        {isOpen ? CLOSE : MENU}
      </Button>
      <Button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        {GOTO_TOP}
      </Button>
    </nav>
  );
}

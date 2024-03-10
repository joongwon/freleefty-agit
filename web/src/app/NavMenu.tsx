"use client";

import Link from "next/link";
import { useState } from "react";
import { MENU, CLOSE } from "@/components/icons";

export default function NavMenu() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <nav
        className={isOpen ? "open" : "closed"}
        onClick={(e) => {
          if (e.target instanceof HTMLAnchorElement) {
            setIsOpen(false);
          }
        }}
      >
        <ul>
          <li>
            <Link href="/">소개</Link>
          </li>
          <li>
            <Link href="/articles">모든 일지</Link>
          </li>
        </ul>
        <button
          className="open-menu"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          {isOpen ? CLOSE : MENU}
        </button>
      </nav>
    </>
  );
}

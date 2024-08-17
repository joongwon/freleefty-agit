"use client";

import { ReactNode, useEffect, useRef, useState, useMemo } from "react";

export default function Header(p: { children: ReactNode }) {
  // translateY value to render
  const [{ transY }, setStyle] = useState({
    transY: 0,
  });

  // header
  const ref = useRef<HTMLElement | null>(null);

  // last scrollY used for calculating transY
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    // scroll handler; uses requestAnimationFrame for performance
    let ticking = false;
    let currentScrollY = window.scrollY;
    const scrollHandler = () => {
      currentScrollY = Math.min(
        Math.max(window.scrollY, 0),
        document.documentElement.scrollHeight - window.innerHeight,
      );
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        // height + spare for shadow
        const headerHeight = (ref.current?.offsetHeight ?? 0) + 5;

        // calculate transY according to scroll direction
        const scrollDelta = currentScrollY - lastScrollY.current;
        if (scrollDelta > 20) {
          setStyle({ transY: -headerHeight });
          lastScrollY.current = currentScrollY;
        } else if (scrollDelta < -20) {
          setStyle({ transY: 0 });
          lastScrollY.current = currentScrollY;
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", scrollHandler);
    return () => window.removeEventListener("scroll", scrollHandler);
  }, []);

  // prevent transition setting multiple times
  const style = useMemo(
    () => ({
      transform: `translateY(${transY}px)`,
    }),
    [transY],
  );
  return (
    <header
      className="flex flex-wrap justify-between items-center z-10
        bg-gray-200 p-4 transition-transform top-0 sticky shadow-lg duration-500"
      ref={ref}
      style={style}
    >
      {p.children}
    </header>
  );
}

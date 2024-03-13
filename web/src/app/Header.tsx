"use client";

import { ReactNode, useEffect, useRef, useState, useMemo } from "react";

export default function Header(p: { children: ReactNode }) {
  // calculated from media query
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const listener = (e: { matches: boolean }) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", listener);
    listener(mediaQuery);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

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
      currentScrollY = Math.min(Math.max(window.scrollY, 0), document.documentElement.scrollHeight - window.innerHeight);
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
    if (isMobile) {
      window.addEventListener("scroll", scrollHandler);
      return () => window.removeEventListener("scroll", scrollHandler);
    }
  }, [isMobile]);

  // prevent transition setting multiple times
  const style = useMemo(
    () => ({
      transform: `translateY(${isMobile ? transY : 0}px)`,
    }),
    [isMobile, transY],
  );
  return (
    <header ref={ref} style={style}>
      {p.children}
    </header>
  );
}

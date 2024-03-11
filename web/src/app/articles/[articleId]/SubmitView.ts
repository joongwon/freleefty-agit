"use client";
import { useEffect, useRef } from "react";
import { submitView } from "@/actions";

export default function SubmitView(p: { viewToken: string }) {
  const submittedRef = useRef(false);
  useEffect(() => {
    // Count as viewed only when user stays on the page for more than 1 second
    const timeout = setTimeout(() => {
      if (submittedRef.current) {
        return;
      }
      submittedRef.current = true;
      submitView(p.viewToken);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [p.viewToken]);
  return null;
}

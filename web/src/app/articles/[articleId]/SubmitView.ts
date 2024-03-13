"use client";
import { useEffect, useRef } from "react";
import { submitView } from "@/actions";
import { gAuthState } from "@/auth";

export default function SubmitView(p: { viewToken: string; authorId: string }) {
  const submittedRef = useRef(false);
  useEffect(() => {
    // Count as viewed only when user stays on the page for more than 1 second
    const timeout = setTimeout(() => {
      if (submittedRef.current) {
        return;
      }
      if (
        gAuthState.value.type === "login" &&
        gAuthState.value.profile.id === p.authorId
      ) {
        return;
      }
      submittedRef.current = true;
      // don't care about the result
      void submitView(p.viewToken);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [p.viewToken]);
  return null;
}

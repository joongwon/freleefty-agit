"use client";
import { useEffect, useRef } from "react";
import { submitView } from "@/actions";

export default function SubmitView(p: { viewToken: string }) {
  const submittedRef = useRef(false);
  useEffect(() => {
    if (submittedRef.current) {
      return;
    }
    submittedRef.current = true;
    submitView(p.viewToken);
  }, [p.viewToken]);
  return null;
}

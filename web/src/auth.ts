"use client";

import { hookstate } from "@hookstate/core";
import { useEffect } from "react";
import { refresh } from "@/actions";
import type { User } from "@/types";

type AuthState =
  | { type: "loading" }
  | { type: "anon" }
  | { type: "login"; token: string; profile: User };

export const gAuthState = hookstate<AuthState>({ type: "loading" });

// executed once by InitToken effect to initialize token
let initTokenCalled = false;
async function initToken() {
  if (initTokenCalled) return;
  initTokenCalled = true;

  scheduleRefresh();

  // landed on login callback page
  if (location.pathname === "/login/naver/callback") {
    // remove possibily remainig previous token
    gAuthState.set({ type: "anon" });
    return;
  }

  // refresh
  const res = await refresh().catch(() => null);
  if (!res) {
    gAuthState.set({ type: "anon" });
    return;
  }

  // save token
  gAuthState.set({
    type: "login",
    token: res.accessToken,
    profile: res.profile,
  });
}

function scheduleRefresh() {
  const task = async () => {
    if (gAuthState.get().type !== "login") return;
    const res = await refresh().catch(() => null);
    if (!res) {
      gAuthState.set({ type: "anon" });
      return;
    }
    gAuthState.set({
      type: "login",
      token: res.accessToken,
      profile: res.profile,
    });
  };

  // refresh every 50 minutes (token expires in 1 hour)
  setInterval(() => void task(), 50 * 60 * 1000);
}

export function setProfile(profile: User) {
  const auth = gAuthState.get();
  if (auth.type !== "login") return;
  gAuthState.set({
    ...auth,
    profile,
  });
}

// invoke token initialization when nextjs app renders
export function InitToken() {
  useEffect(() => {
    void initToken();
  }, []);
  return null;
}

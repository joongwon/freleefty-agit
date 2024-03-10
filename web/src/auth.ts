"use client";

import { hookstate } from "@hookstate/core";
import { useEffect } from "react";
import { refresh } from "@/actions";
import { User } from "db";

type AuthState =
  | { type: "loading" }
  | { type: "anon" }
  | { type: "login"; token: string; profile: User };

export const gAuthState = hookstate<AuthState>({ type: "loading" });

// pop refresh token from local storage
export function popRefreshToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  localStorage.removeItem("refreshToken");
  return refreshToken;
}

// put refresh token to local storage
export function putRefreshToken(refreshToken: string) {
  localStorage.setItem("refreshToken", refreshToken);
}

// executed once by InitToken effect to initialize token
let initTokenCalled = false;
async function initToken() {
  if (initTokenCalled) return;
  initTokenCalled = true;

  scheduleRefresh();

  // find refresh token in local storage
  const refreshToken = popRefreshToken();
  if (!refreshToken) {
    gAuthState.set({ type: "anon" });
    return;
  }

  // refresh
  const res = await refresh(refreshToken).catch(() => null);
  if (!res) {
    gAuthState.set({ type: "anon" });
    return;
  }

  // save token
  putRefreshToken(res.refreshToken);
  gAuthState.set({
    type: "login",
    token: res.accessToken,
    profile: res.profile,
  });

}

function scheduleRefresh() {
  const task = async () => {
    if (gAuthState.get().type !== "login") return;
    const refreshToken = popRefreshToken();
    if (!refreshToken) {
      gAuthState.set({ type: "anon" });
      return;
    }
    const res = await refresh(refreshToken).catch(() => null);
    if (!res) {
      gAuthState.set({ type: "anon" });
      return;
    }
    putRefreshToken(res.refreshToken);
    gAuthState.set({
      type: "login",
      token: res.accessToken,
      profile: res.profile,
    });
  };

  // refresh every 50 minutes (token expires in 1 hour)
  setInterval(() => void task(), 50 * 60 * 1000);
}

// invoke token initialization when nextjs app renders
export function InitToken() {
  useEffect(() => {
    void initToken();
  }, []);
  return null;
}

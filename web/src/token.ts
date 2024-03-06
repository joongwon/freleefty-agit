import { hookstate } from '@hookstate/core';

function initTokenState() {
  return hookstate({ status: "initial" } as { status: "initial"; token?: undefined } | { status: "token"; token: string | null });
}

let tokenState: ReturnType<typeof initTokenState> | undefined;

export function tokenStore() {
  if (!tokenState) {
    tokenState = initTokenState();
  }
  return tokenState;
}

import { cookies } from "next/headers";

export function getRefreshTokenCookie() {
  const refreshTokenCookie = cookies().get("refreshToken");
  if (!refreshTokenCookie) {
    return null;
  }
  return refreshTokenCookie.value;
}

export function setRefreshTokenCookie(refreshToken: string) {
  cookies().set("refreshToken", refreshToken, {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
  });
}


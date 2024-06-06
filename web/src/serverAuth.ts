import { cookies } from "next/headers";

export function getRefreshToken() {
  const refreshTokenCookie = cookies().get("refreshToken");
  if (!refreshTokenCookie) {
    return null;
  }
  return refreshTokenCookie.value;
}

export function setRefreshToken(refreshToken: string) {
  cookies().set("refreshToken", refreshToken, {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
  });
}


import { cookies } from "next/headers";
import * as Queries from "@/queries_sql";
import { z } from "zod";
import { getEnv } from "@/env";
import * as jwt from "jsonwebtoken";

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

export type JwtPayload = { id: string; role: Queries.role };

export async function decodeToken(token: string): Promise<JwtPayload> {
  const JWT_SECRET = getEnv().JWT_SECRET;
  return await new Promise<JwtPayload>((resolve, reject) =>
    jwt.verify(token, JWT_SECRET, (err, decoded) =>
      decoded
        ? resolve(decoded as JwtPayload)
        : reject(err ?? new Error("Unreachable")),
    ),
  );
}

export const authSchema = z
  .object({
    token: z.string(),
  })
  .transform((data) => decodeToken(data.token));

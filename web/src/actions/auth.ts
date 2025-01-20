"use server";

import { z } from "zod";
import { getEnv } from "@/env";
import { getClientEnv } from "@/clientEnv";
import { getRedis } from "@/db";
import { randomUUID } from "crypto";
import { User } from "@/types";
import * as jwt from "jsonwebtoken";
import {
  setRefreshTokenCookie,
  getRefreshTokenCookie,
  JwtPayload,
} from "@/serverAuth";
import { getNNDB } from "@/db";
import { UsersId } from "@/nndb/public/Users";

export { tryLogin, logout, refresh, createUser, devLogin };
export type { TryLoginResult };

const tryLoginSchema = z.object({
  code: z.string(),
});

type TryLoginResult = Awaited<ReturnType<typeof tryLogin>>;

async function tryLogin(payload: z.infer<typeof tryLoginSchema>) {
  const { code } = tryLoginSchema.parse(payload);

  // 네이버 access token을 받아오기
  const client_id = getClientEnv().NAVER_ID;
  const client_secret = getEnv().NAVER_SECRET;
  const res = await fetch("https://nid.naver.com/oauth2.0/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      state: "state",
      client_id,
      client_secret,
    }),
  });
  if (!res.ok) {
    throw new Error("Failed to get access token from Naver");
  }
  const data = (await res.json()) as { access_token?: string };
  const access_token = data.access_token;
  if (!access_token) {
    throw new Error("Failed to get access token from Naver");
  }

  // 네이버 프로필 정보를 받아오기
  const profileRes = await fetch("https://openapi.naver.com/v1/nid/me", {
    headers: {
      Authorization: "Bearer " + access_token,
    },
  });
  if (!profileRes.ok) {
    throw new Error("Failed to get profile from Naver");
  }
  const profileData = (await profileRes.json()) as {
    response: { id: string; nickname?: string };
  };
  const naverId = profileData.response.id;
  const naverName = profileData.response.nickname ?? "";

  // 네이버 아이디로 사용자가 등록되어 있는지 확인
  const user = await getNNDB()
    .selectFrom("users")
    .select(["id", "role", "name"])
    .where("naver_id", "=", naverId)
    .executeTakeFirst();

  if (!user) {
    // 등록되어 있지 않다면, 가입 페이지로 이동
    const registerCode = await makeRegisterCode(naverId);
    return { type: "register" as const, registerCode, naverName };
  } else {
    // 등록되어 있다면, 로그인 처리
    const res = await login(user);
    return { type: "login" as const, ...res };
  }
}

const createUserSchema = z.object({
  code: z.string(),
  id: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[a-zA-Z0-9]+$/)
    .brand<"UsersId">(),
  name: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[^\s]+( [^\s]+)*$/)
    .transform((x) => x.normalize()),
});

async function createUser(payload: z.infer<typeof createUserSchema>) {
  const { code, id, name } = createUserSchema.parse(payload);

  const redis = await getRedis();

  const naverId = await redis.getDel("register:" + code);
  if (!naverId) {
    throw new Error("Register code is expired");
  }

  try {
    await getNNDB()
      .insertInto("users")
      .values({ naver_id: naverId, id, name })
      .execute();
    return {
      type: "success",
      ...(await login({ id, role: "user", name })),
    } as const;
  } catch (e) {
    const constraint = (e as { constraint?: string })?.constraint;
    const conflict =
      constraint === "users_naver_id_key"
        ? "NaverId"
        : constraint === "users_name_key"
          ? "Name"
          : constraint === "users_id_key"
            ? "Id"
            : null;
    switch (conflict) {
      case "NaverId":
        return { type: "fatal", conflict } as const;
      case "Name":
      case "Id": {
        const code = await makeRegisterCode(naverId);
        return { type: "error", conflict, code } as const;
      }
      default:
        throw e;
    }
  }
}

async function refresh() {
  const refreshToken = getRefreshTokenCookie();
  if (!refreshToken) {
    return null;
  }

  const redis = await getRedis();
  const userId = await redis.getDel("refreshToken:" + refreshToken);
  if (!userId) {
    return null;
  }

  const profile = await getNNDB()
    .selectFrom("users")
    .select(["id", "role", "name"])
    .where("id", "=", <UsersId>userId)
    .executeTakeFirst();

  if (!profile) {
    return null;
  }
  return await login(profile);
}

async function logout() {
  const refreshToken = getRefreshTokenCookie();
  if (!refreshToken) {
    return;
  }

  const redis = await getRedis();
  await redis.del("refreshToken:" + refreshToken);
}

async function makeRegisterCode(naverId: string) {
  const redis = await getRedis();
  const registerCode = randomUUID();
  await redis.set("register:" + registerCode, naverId, { EX: 5 * 60 });
  return registerCode;
}

async function login(profile: User) {
  const JWT_SECRET = getEnv().JWT_SECRET;
  const payload: JwtPayload = { id: profile.id, role: profile.role };
  const accessToken = await new Promise<string>((resolve, reject) =>
    jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" }, (err, token) =>
      token !== undefined
        ? resolve(token)
        : reject(err ?? new Error("Unreachable")),
    ),
  );
  const refreshToken = randomUUID();
  const redis = await getRedis();
  await redis.set("refreshToken:" + refreshToken, profile.id, {
    EX: 7 * 24 * 60 * 60,
  });
  setRefreshTokenCookie(refreshToken);
  return { accessToken, profile };
}

async function devLogin() {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("This function is only available in development mode");
  }
  const profile = await getNNDB()
    .selectFrom("users")
    .select(["id", "role", "name"])
    .where("id", "=", <UsersId>"test")
    .executeTakeFirst();
  if (!profile) {
    throw new Error("User not found");
  }
  return await login(profile);
}

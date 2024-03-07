"use server";

import { getDB, getRedis } from "@/db";
import * as jwt from "jsonwebtoken";
import * as uuid from "uuid";
import { getEnv } from "@/env";

export async function tryLogin(code: string) {
  // 네이버 access token을 받아오기
  const client_id = getEnv().NEXT_PUBLIC_NAVER_ID;
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
  const db = getDB();
  const user = await db.getUserByNaverId(naverId);

  if (!user) {
    // 등록되어 있지 않다면, 가입 페이지로 이동
    const registerCode = await makeRegisterCode(naverId);
    return { type: "register" as const, registerCode, naverName };
  } else {
    // 등록되어 있다면, 로그인 처리
    const res = await login(user.id);
    return { type: "login" as const, ...res };
  }
}

async function login(userId: string) {
  const db = getDB();
  const profile = await db.getUserById(userId);
  if (!profile) {
    throw new Error("User not found");
  }
  const JWT_SECRET = getEnv().JWT_SECRET;
  const accessToken = await new Promise<string>((resolve, reject) =>
    jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "1h" }, (err, token) =>
      token ? resolve(token) : reject(err),
    ),
  );
  const refreshToken = uuid.v4();
  const redis = await getRedis();
  await redis.set("refreshToken:" + refreshToken, userId, {
    EX: 7 * 24 * 60 * 60,
  });
  return { accessToken, refreshToken, profile };
}

async function makeRegisterCode(naverId: string) {
  const redis = await getRedis();
  const registerCode = uuid.v4();
  await redis.set("register:" + registerCode, naverId, { EX: 5 * 60 });
  return registerCode;
}

export type TryLoginResult = Awaited<ReturnType<typeof tryLogin>>;

export async function createUser(code: string, id: string, name: string) {
  const db = getDB();
  const redis = await getRedis();

  const naverId = await redis.getDel("register:" + code);
  if (!naverId) {
    throw new Error("Register code is expired");
  }

  const conflict = await db.createUser(naverId, id, name);
  if (conflict === "NaverId") {
    // 이미 사용중인 네이버 아이디, 로그인 재시도
    return { type: "conflict" as const, conflict };
  } else if (conflict !== null) {
    // 다른 충돌로 가입 실패, code 재발급 후 다시 시도
    const code = await makeRegisterCode(naverId);
    return { type: "conflict" as const, conflict, code };
  } else {
    // 가입 성공
    const res = await login(id);
    return { type: "success" as const, ...res };
  }
}

export async function refresh(refreshToken: string) {
  const redis = await getRedis();
  const userId = await redis.getDel("refreshToken:" + refreshToken);
  if (!userId) {
    return null;
  }

  return await login(userId);
}

export async function logout(refreshToken: string) {
  const redis = await getRedis();
  await redis.del("refreshToken:" + refreshToken);
}

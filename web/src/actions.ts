"use server";

import { getDB, getRedis, UserConflict } from "@/db";
import * as jwt from "jsonwebtoken";
import { getEnv } from "@/env";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

const stringSchema = z.string();
const numberSchema = z.number();

export async function tryLogin(codeRaw: string) {
  const code = stringSchema.parse(codeRaw);

  // 네이버 access token을 받아오기
  const client_id = getEnv().NAVER_ID;
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
  const refreshToken = randomUUID();
  const redis = await getRedis();
  await redis.set("refreshToken:" + refreshToken, userId, {
    EX: 7 * 24 * 60 * 60,
  });
  return { accessToken, refreshToken, profile };
}

async function decodeToken(token: string) {
  const JWT_SECRET = getEnv().JWT_SECRET;
  return await new Promise<{ id: string }>((resolve, reject) =>
    jwt.verify(token, JWT_SECRET, (err, decoded) =>
      decoded ? resolve(decoded as { id: string }) : reject(err),
    ),
  );
}

async function makeRegisterCode(naverIdRaw: string) {
  const naverId = stringSchema.parse(naverIdRaw);

  const redis = await getRedis();
  const registerCode = randomUUID();
  await redis.set("register:" + registerCode, naverId, { EX: 5 * 60 });
  return registerCode;
}

export type TryLoginResult = Awaited<ReturnType<typeof tryLogin>>;

const userIdSchema = z
  .string()
  .min(1)
  .max(20)
  .regex(/^[a-zA-Z0-9]+$/);
const userNameSchema = z
  .string()
  .min(1)
  .max(20)
  .regex(/^[^\s]+( [^\s]+)*$/);

export async function createUser(
  codeRaw: string,
  idRaw: string,
  nameRaw: string,
) {
  const code = stringSchema.parse(codeRaw);
  const id = userIdSchema.parse(idRaw);
  const name = userNameSchema.parse(nameRaw);

  const db = getDB();
  const redis = await getRedis();

  const naverId = await redis.getDel("register:" + code);
  if (!naverId) {
    throw new Error("Register code is expired");
  }

  const conflict: UserConflict | null = await db.createUser(naverId, id, name);
  if (conflict === "NaverId") {
    // 이미 사용중인 네이버 아이디, 로그인 재시도
    return { type: "fatal" as const, conflict: conflict };
  } else if (conflict !== null) {
    // 다른 오류로 가입 실패, code 재발급 후 다시 시도
    const code = await makeRegisterCode(naverId);
    return { type: "error" as const, conflict: conflict, code };
  } else {
    // 가입 성공
    const res = await login(id);
    return { type: "success" as const, ...res };
  }
}

export async function refresh(refreshTokenRaw: string) {
  const refreshToken = stringSchema.parse(refreshTokenRaw);

  const redis = await getRedis();
  const userId = await redis.getDel("refreshToken:" + refreshToken);
  if (!userId) {
    return null;
  }

  return await login(userId);
}

export async function logout(refreshTokenRaw: string) {
  const refreshToken = stringSchema.parse(refreshTokenRaw);

  const redis = await getRedis();
  await redis.del("refreshToken:" + refreshToken);
}

export async function listDrafts(tokenRaw: string) {
  const token = stringSchema.parse(tokenRaw);

  const db = getDB();
  const userId = (await decodeToken(token)).id;
  return await db.listDrafts(userId);
}

export async function getDraft(tokenRaw: string, idRaw: number) {
  const token = stringSchema.parse(tokenRaw);
  const id = numberSchema.parse(idRaw);

  const db = getDB();
  const userId = (await decodeToken(token)).id;
  return await db.getDraft(id, userId);
}

const draftTitleSchema = z.string().max(255);
export async function updateDraft(
  tokenRaw: string,
  idRaw: number,
  titleRaw: string,
  contentRaw: string,
) {
  const token = stringSchema.parse(tokenRaw);
  const id = numberSchema.parse(idRaw);
  const title = draftTitleSchema.parse(titleRaw);
  const content = stringSchema.parse(contentRaw);

  const db = getDB();
  const userId = (await decodeToken(token)).id;
  return await db.updateDraft(id, userId, title, content);
}

export async function deleteDraft(tokenRaw: string, idRaw: number) {
  const token = stringSchema.parse(tokenRaw);
  const id = numberSchema.parse(idRaw);

  const db = getDB();
  const userId = (await decodeToken(token)).id;
  return await db.deleteDraft(id, userId);
}

export async function createDraft(tokenRaw: string) {
  const token = stringSchema.parse(tokenRaw);

  const db = getDB();
  const userId = (await decodeToken(token)).id;
  return await db.createDraft(userId);
}

export async function deleteArticle(tokenRaw: string, idRaw: number) {
  const token = stringSchema.parse(tokenRaw);
  const id = numberSchema.parse(idRaw);

  const db = getDB();
  const userId = (await decodeToken(token)).id;
  const res = await db.deleteArticle(id, userId);
  revalidatePath("/articles");
  return res;
}

export async function publishDraft(
  tokenRaw: string,
  idRaw: number,
  notesRaw: string,
) {
  const token = stringSchema.parse(tokenRaw);
  const id = numberSchema.parse(idRaw);
  const notes = stringSchema.parse(notesRaw);

  const db = getDB();
  const userId = (await decodeToken(token)).id;
  const res = await db.publishDraft(id, userId, notes);
  revalidatePath("/articles");
  return res;
}

const commentContentSchema = z.string().min(1).max(1023);
export async function createComment(
  tokenRaw: string,
  articleIdRaw: number,
  contentRaw: string,
) {
  const token = stringSchema.parse(tokenRaw);
  const articleId = numberSchema.parse(articleIdRaw);
  const content = commentContentSchema.parse(contentRaw);

  const db = getDB();
  const userId = (await decodeToken(token)).id;
  const res = await db.createComment(articleId, userId, content);
  revalidatePath(`/articles/${articleId}`);
  return res;
}

export async function deleteComment(
  tokenRaw: string,
  articleIdRaw: number,
  idRaw: number,
) {
  const token = stringSchema.parse(tokenRaw);
  const articleId = numberSchema.parse(articleIdRaw);
  const id = numberSchema.parse(idRaw);

  const db = getDB();
  const userId = (await decodeToken(token)).id;
  const res = await db.deleteComment(id, userId);
  revalidatePath(`/articles/${articleId}`);
  return res;
}

export async function submitView(viewTokenRaw: string) {
  const viewToken = stringSchema.parse(viewTokenRaw);

  const redis = await getRedis();
  const rawArticleId = await redis.getDel(`view:${viewToken}`);
  if (!rawArticleId) {
    return;
  }
  const articleId = parseInt(rawArticleId);
  const db = getDB();
  await db.createViewLog(articleId);
}

export async function likeArticle(tokenRaw: string, articleIdRaw: number) {
  const token = stringSchema.parse(tokenRaw);
  const articleId = numberSchema.parse(articleIdRaw);

  const db = getDB();
  const userId = (await decodeToken(token)).id;
  const res = await db.likeArticle(articleId, userId);
  revalidatePath(`/articles/${articleId}`);
  return res;
}

export async function unlikeArticle(tokenRaw: string, articleIdRaw: number) {
  const token = stringSchema.parse(tokenRaw);
  const articleId = numberSchema.parse(articleIdRaw);

  const db = getDB();
  const userId = (await decodeToken(token)).id;
  const res = await db.unlikeArticle(articleId, userId);
  revalidatePath(`/articles/${articleId}`);
  return res;
}

export async function listLikers(articleIdRaw: number) {
  const articleId = numberSchema.parse(articleIdRaw);

  const db = getDB();
  return await db.listLikers(articleId);
}

export async function devLogin() {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("This function is only available in development mode");
  }
  return await login("test");
}

export async function editArticle(tokenRaw: string, articleIdRaw: number) {
  const token = stringSchema.parse(tokenRaw);
  const articleId = numberSchema.parse(articleIdRaw);

  const db = getDB();
  const userId = (await decodeToken(token)).id;
  return await db.editArticle(userId, articleId);
}

export async function getArticleDraftId(
  tokenRaw: string,
  articleIdRaw: number,
) {
  const token = stringSchema.parse(tokenRaw);
  const articleId = numberSchema.parse(articleIdRaw);

  const db = getDB();
  const userId = (await decodeToken(token)).id;
  return await db.getArticleDraftId(userId, articleId);
}

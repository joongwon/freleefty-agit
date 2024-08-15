"use server";

import { getRedis } from "@/db";
import * as jwt from "jsonwebtoken";
import { getEnv } from "@/env";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import fs from "fs";
import { Writable } from "stream";
import { setRefreshTokenCookie, getRefreshTokenCookie } from "@/serverAuth";
import * as newdb from "@/newdb";
import * as Queries from "@/queries_sql";
import { User } from "@/types";
import path from "path";

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
  const user = await newdb.option(Queries.getUserByNaverId, { naverId });

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

async function login(profile: User) {
  const JWT_SECRET = getEnv().JWT_SECRET;
  const accessToken = await new Promise<string>((resolve, reject) =>
    jwt.sign(
      { id: profile.id },
      JWT_SECRET,
      { expiresIn: "1h" },
      (err, token) => (token ? resolve(token) : reject(err)),
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
  const name = userNameSchema.parse(nameRaw).normalize();

  const redis = await getRedis();

  const naverId = await redis.getDel("register:" + code);
  if (!naverId) {
    throw new Error("Register code is expired");
  }

  try {
    await newdb.execute(Queries.createUser, { naverId, id, name });
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

export async function refresh() {
  const refreshToken = getRefreshTokenCookie();
  if (!refreshToken) {
    return null;
  }

  const redis = await getRedis();
  const userId = await redis.getDel("refreshToken:" + refreshToken);
  if (!userId) {
    return null;
  }

  const profile = await newdb.option(Queries.getUserById, { userId });

  if (!profile) {
    return null;
  }
  return await login(profile);
}

export async function logout() {
  const refreshToken = getRefreshTokenCookie();
  if (!refreshToken) {
    return;
  }

  const redis = await getRedis();
  await redis.del("refreshToken:" + refreshToken);
}

export async function listDrafts(tokenRaw: string) {
  const token = stringSchema.parse(tokenRaw);
  const userId = (await decodeToken(token)).id;

  return await newdb.list(Queries.listDrafts, { authorId: userId });
}

export async function getDraft(tokenRaw: string, idRaw: number) {
  const token = stringSchema.parse(tokenRaw);
  const id = numberSchema.parse(idRaw);
  const userId = (await decodeToken(token)).id;

  return await newdb.tx(async ({ first, list }) => {
    const draft = await first(Queries.getDraft, { id, authorId: userId });
    if (!draft) {
      return null;
    }

    const files = await list(Queries.listDraftFiles, { id });

    return { ...draft, files };
  });
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
  const title = draftTitleSchema.parse(titleRaw).normalize();
  const content = stringSchema.parse(contentRaw).normalize();
  const userId = (await decodeToken(token)).id;

  return (
    await newdb.option(Queries.updateDraft, { id, userId, title, content })
  )?.ok
    ? "Ok"
    : "NotFound";
}

const draftFilesPath = (id: number) =>
  path.join(getEnv().UPLOAD_DIR, "d", id.toString());
const editionFilesPath = (id: number) =>
  path.join(getEnv().UPLOAD_DIR, "e", id.toString());

export async function deleteDraft(tokenRaw: string, idRaw: number) {
  const token = stringSchema.parse(tokenRaw);
  const id = numberSchema.parse(idRaw);
  const userId = (await decodeToken(token)).id;

  const res = await newdb.tx(async ({ first, execute }) => {
    const deleteResult = await first(Queries.deleteDraft, { id, userId });
    if (!deleteResult) {
      return { type: "NotFound" } as const;
    }
    await execute(Queries.deleteArticleIfNoEditions, {
      id: deleteResult.articleId,
    });

    return { type: "Ok", files: draftFilesPath(id) } as const;
  });

  if (res.type !== "Ok") {
    return res.type;
  }
  await fs.promises.rmdir(draftFilesPath(id), { recursive: true });
  return "Ok";
}

export async function createDraft(tokenRaw: string) {
  const token = stringSchema.parse(tokenRaw);
  const userId = (await decodeToken(token)).id;

  return await newdb.unique(Queries.createDraft, { authorId: userId });
}

export async function deleteArticle(tokenRaw: string, idRaw: number) {
  const token = stringSchema.parse(tokenRaw);
  const id = numberSchema.parse(idRaw);
  const userId = (await decodeToken(token)).id;

  const res = await newdb.tx(async ({ first, list, execute }) => {
    const authorId = (await first(Queries.getArticleAuthorId, { id }))
      ?.authorId;
    if (authorId === undefined) {
      return { type: "NotFound" } as const;
    } else if (authorId !== userId) {
      return { type: "Forbidden" } as const;
    }

    const draft = await first(Queries.getDraftIdOfArticle, { id, userId });
    const editions = await list(Queries.listEditionIds, { id });
    await execute(Queries.deleteArticle, { id });
    return {
      type: "Ok",
      files: [
        ...(draft ? [draftFilesPath(draft.id)] : []),
        ...editions.map((e) => editionFilesPath(e.id)),
      ],
    } as const;
  });

  if (res.type !== "Ok") {
    return res.type;
  }

  await Promise.all(
    res.files.map((path) => fs.promises.rmdir(path, { recursive: true })),
  );
  revalidatePath("/articles");
  return "Ok";
}

export async function publishDraft(
  tokenRaw: string,
  idRaw: number,
  notesRaw: string,
) {
  const token = stringSchema.parse(tokenRaw);
  const id = numberSchema.parse(idRaw);
  const notes = stringSchema.parse(notesRaw).normalize();
  const userId = (await decodeToken(token)).id;

  const res = await newdb.tx(async ({ first, unique, execute }) => {
    const hasTitle = await first(Queries.draftHasTitle, { id, userId });
    if (hasTitle === null) {
      return { type: "NotFound" } as const;
    } else if (!hasTitle.hasTitle) {
      return { type: "NoTitle" } as const;
    }

    const files = await unique(Queries.countDraftFiles, { id });

    const { articleId, editionId } = await unique(
      Queries.createEditionFromDraft,
      { draftId: id, notes },
    );

    await execute(Queries.moveDraftFilesToEdition, { draftId: id, editionId });
    await execute(Queries.deleteDraft, { id, userId });

    if (files.count !== 0) {
      await fs.promises.rename(draftFilesPath(id), editionFilesPath(editionId));
    }

    return { type: "Ok", articleId } as const;
  });
  revalidatePath("/articles");
  if (res.type !== "Ok") {
    return res.type;
  }
  return res.articleId;
}

const commentContentSchema = z.string().min(1).max(1023);
export async function createComment(
  tokenRaw: string,
  articleIdRaw: number,
  contentRaw: string,
) {
  const token = stringSchema.parse(tokenRaw);
  const articleId = numberSchema.parse(articleIdRaw);
  const content = commentContentSchema.parse(contentRaw).normalize();

  const userId = (await decodeToken(token)).id;

  await newdb.execute(Queries.createComment, {
    articleId,
    authorId: userId,
    content,
  });

  revalidatePath(`/articles/${articleId}`);
  return "Ok";
}

export async function deleteComment(
  tokenRaw: string,
  articleIdRaw: number,
  idRaw: number,
) {
  const token = stringSchema.parse(tokenRaw);
  const articleId = numberSchema.parse(articleIdRaw);
  const id = numberSchema.parse(idRaw);
  const userId = (await decodeToken(token)).id;

  const res = await newdb.tx(async ({ first, execute }) => {
    const authorId = (await first(Queries.getCommentAuthorId, { id }))
      ?.authorId;
    if (authorId === undefined) {
      return { type: "NotFound" } as const;
    } else if (authorId !== userId) {
      return { type: "Forbidden" } as const;
    }

    await execute(Queries.deleteComment, { id });
    return { type: "Ok" } as const;
  });
  revalidatePath(`/articles/${articleId}`);
  return res.type;
}

export async function submitView(viewTokenRaw: string) {
  const viewToken = stringSchema.parse(viewTokenRaw);

  const redis = await getRedis();
  const rawArticleId = await redis.getDel(`view:${viewToken}`);
  if (!rawArticleId) {
    return;
  }
  const articleId = parseInt(rawArticleId);
  await newdb.execute(Queries.createViewLog, { articleId });
}

export async function likeArticle(tokenRaw: string, articleIdRaw: number) {
  const token = stringSchema.parse(tokenRaw);
  const articleId = numberSchema.parse(articleIdRaw);
  const userId = (await decodeToken(token)).id;

  try {
    await newdb.execute(Queries.createLike, { articleId, userId });
  } catch (e) {
    if ((e as { constraint?: string })?.constraint === "likes_pkey") {
      return "InvalidAction";
    }
    throw e;
  }
  revalidatePath(`/articles/${articleId}`);
  return "Ok";
}

export async function unlikeArticle(tokenRaw: string, articleIdRaw: number) {
  const token = stringSchema.parse(tokenRaw);
  const articleId = numberSchema.parse(articleIdRaw);
  const userId = (await decodeToken(token)).id;

  const res = await newdb.option(Queries.deleteLike, { articleId, userId });
  revalidatePath(`/articles/${articleId}`);
  return res?.deleted ? "Ok" : "InvalidAction";
}

export async function listLikers(articleIdRaw: number) {
  const articleId = numberSchema.parse(articleIdRaw);

  return await newdb.list(Queries.listLikes, { articleId });
}

export async function devLogin() {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("This function is only available in development mode");
  }
  const profile = await newdb.option(Queries.getUserById, { userId: "test" });
  if (!profile) {
    throw new Error("User not found");
  }
  return await login(profile);
}

export async function editArticle(tokenRaw: string, articleIdRaw: number) {
  const token = stringSchema.parse(tokenRaw);
  const articleId = numberSchema.parse(articleIdRaw);
  const userId = (await decodeToken(token)).id;

  const res = await newdb.tx(async ({ first, unique, list }) => {
    const authorId = (
      await first(Queries.getArticleAuthorId, { id: articleId })
    )?.authorId;
    if (authorId === undefined) {
      return { type: "NotFound" } as const;
    } else if (authorId !== userId) {
      return { type: "Forbidden" } as const;
    }

    const draft = await unique(Queries.createDraftFromArticle, { articleId });
    const edition = await unique(Queries.getLastEditionId, { id: articleId });
    const files = await list(Queries.copyEditionFilesToDraft, {
      editionId: edition.id,
      draftId: draft.id,
    });

    await Promise.all(
      files.map(async ({ oldId, newId, name }) => {
        const oldPath = path.join(
          editionFilesPath(edition.id),
          oldId.toString(),
          name,
        );
        const newDir = path.join(draftFilesPath(draft.id), newId.toString());
        const newPath = path.join(newDir, name);
        await fs.promises.mkdir(newDir, { recursive: true });
        await fs.promises.link(oldPath, newPath);
      }),
    );

    return { type: "Ok", draftId: draft.id } as const;
  });

  if (res.type !== "Ok") {
    return res.type;
  }

  return res.draftId;
}

export async function getArticleDraftId(
  tokenRaw: string,
  articleIdRaw: number,
) {
  const token = stringSchema.parse(tokenRaw);
  const articleId = numberSchema.parse(articleIdRaw);

  const userId = (await decodeToken(token)).id;
  return (
    (
      await newdb.option(Queries.getDraftIdOfArticle, {
        id: articleId,
        userId,
      })
    )?.id ?? null
  );
}

const fileNameSchema = z
  .string()
  .max(255)
  .regex(/^[^/\\.][^/\\]*$/);
export async function createFile(
  tokenRaw: string,
  draftIdRaw: number,
  fileNameRaw: string,
  formData: FormData,
) {
  const token = stringSchema.parse(tokenRaw);
  const draftId = numberSchema.parse(draftIdRaw);
  const fileName = fileNameSchema.parse(fileNameRaw).normalize();
  if (!(formData instanceof FormData)) {
    throw new Error("Invalid form data");
  }
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Invalid file");
  }
  if (file.size > 1024 * 1024 * 10) {
    return "TooLarge" as const;
  }

  const userId = (await decodeToken(token)).id;
  const uploadStream = file.stream();
  const tmpFileName = path.join(getEnv().UPLOAD_DIR, randomUUID());
  const uploadPromise = (async () => {
    const stream = Writable.toWeb(fs.createWriteStream(tmpFileName));
    await uploadStream.pipeTo(stream);
    return tmpFileName;
  })();
  const result = await newdb.tx(async ({ first, unique }) => {
    const author = await first(Queries.getDraftAuthorId, { id: draftId });
    if (author?.authorId !== userId) {
      return "NotFound" as const;
    }
    try {
      const { id: fileId } = await unique(Queries.createFile, {
        draftId,
        name: fileName,
        mimeType: file.type,
      });
      const newDir = path.join(draftFilesPath(draftId), fileId.toString());
      const newPath = path.join(newDir, fileName);
      const oldPath = await uploadPromise;
      await fs.promises.mkdir(newDir, { recursive: true });
      await fs.promises.rename(oldPath, newPath);
      return "Ok" as const;
    } catch (e) {
      if ((e as { constraint?: string })?.constraint === "files_name_key") {
        return "Conflict" as const;
      }
      throw e;
    }
  });
  if (result !== "Ok") {
    await uploadStream.cancel();
  }
  return result;
}

export async function deleteFile(tokenRaw: string, fileId: number) {
  const token = stringSchema.parse(tokenRaw);
  const userId = (await decodeToken(token)).id;

  const res = await newdb.tx(async ({ first, execute }) => {
    const fileInfo = await first(Queries.getFileInfo, { id: fileId });
    if (fileInfo?.authorId !== userId) {
      return { type: "Forbidden" } as const;
    }
    await execute(Queries.deleteFile, { id: fileId });
    const filePath = path.join(
      draftFilesPath(fileInfo.draftId),
      fileId.toString(),
    );
    await fs.promises.rmdir(filePath, { recursive: true });
    return { type: "Ok" } as const;
  });
  return res.type;
}

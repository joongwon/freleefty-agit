import { getRefreshTokenCookie } from "@/serverAuth";
import { getNNDB, getRedis } from "@/db";
import { parseSafeInt } from "@/utils";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import { getEnv } from "@/env";
import { Readable } from "stream";

export async function GET(
  _: Request,
  p: { params: { fileId: string; fileName: string } },
) {
  const fileId = parseSafeInt(p.params.fileId);
  const fileName = p.params.fileName;
  if (!fileId || !fileName) {
    return NextResponse.json(
      { error: "Invalid fileId or fileName" },
      { status: 400 },
    );
  }
  const refreshToken = getRefreshTokenCookie();
  if (!refreshToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const redis = await getRedis();
  const userId = await redis.get("refreshToken:" + refreshToken);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const fileInfo = await getNNDB()
    .selectFrom("files")
    .innerJoin("drafts", "files.draft_id", "drafts.id")
    .innerJoin("articles", "drafts.article_id", "articles.id")
    .select("author_id")
    .select("name")
    .select("draft_id")
    .select("mime_type")
    .where("files.id", "=", fileId)
    .executeTakeFirst();
  if (!fileInfo) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  if (fileInfo.name !== fileName) {
    return NextResponse.redirect(`/files/private/${fileId}/${fileInfo.name}`);
  }
  const uploadDir = getEnv().UPLOAD_DIR;
  const filePath = `${uploadDir}/d/${fileInfo.draft_id}/${fileId}/${fileInfo.name}`;
  const fileHandle = await fs.open(filePath).catch(() => null);
  if (!fileHandle) {
    return NextResponse.json({ error: "Cannot open file" }, { status: 500 });
  }
  const fileStream = Readable.toWeb(
    fileHandle.createReadStream(),
  ) as ReadableStream;
  const res = new Response(fileStream);
  res.headers.set("Content-Type", fileInfo.mime_type);
  if (fileInfo.mime_type.startsWith("image/")) {
    res.headers.set("Content-Disposition", "inline");
  } else {
    res.headers.set(
      "Content-Disposition",
      `attachment; filename="${fileInfo.name}"`,
    );
  }
  const fileSize = await fileHandle.stat().then((stat) => stat.size);
  res.headers.set("Content-Length", `${fileSize}`);
  return res;
}

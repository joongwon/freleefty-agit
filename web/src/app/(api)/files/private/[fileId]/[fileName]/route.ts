import { getRefreshToken } from "@/serverAuth";
import { getRedis, getDB } from "@/db";
import { parseSafeInt } from "@/utils";

export async function GET(
  request: Request,
  p: { params: { fileId: string; fileName: string } }
) {
  const fileId = parseSafeInt(p.params.fileId);
  const fileName = p.params.fileName;
  if (!fileId || !fileName) {
    return new Response("Bad Request", { status: 400 });
  }
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return new Response("Unauthorized", { status: 401 });
  }
  const redis = await getRedis();
  const userId = await redis.get("refreshToken:" + refreshToken);
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }
  const db = getDB();
  const fileInfo = await db.getFileInfo(fileId, userId);
  if (!fileInfo) {
    return new Response("Not Found", { status: 404 });
  }
  if (fileInfo.name !== fileName) {
    // TODO
  }
}

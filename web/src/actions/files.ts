"use server";
import { z } from "zod";
import { authSchema } from "@/serverAuth";
import { draftIdSchema } from "@/schemas";
import * as Files from "@/files";
import { getNNDB } from "@/db";

const createFileSchema = z.object({
  draft: draftIdSchema,
  name: z
    .string()
    .max(255)
    .regex(/^[^/\\.][^/\\]*$/),
});

export async function createFile(
  auth: z.input<typeof authSchema>,
  payload: z.input<typeof createFileSchema>,
  formData: FormData,
) {
  const { id: userId } = await authSchema.parseAsync(auth);
  const {
    draft: { id: draftId },
    name: fileName
  } = createFileSchema.parse(payload);
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

  const upload = Files.uploadFile(file);
  const result = await getNNDB().transaction().execute(async (tx) => {
    const author = await tx
      .selectFrom("drafts")
      .innerJoin("articles", "drafts.article_id", "articles.id")
      .select("author_id")
      .where("id", "=", draftId)
      .executeTakeFirst();
    if (author?.author_id !== userId) {
      return "NotFound" as const;
    }
    try {
      const { id: fileId } = await tx
        .insertInto("files")
        .values({ draft_id: draftId, name: fileName, mime_type: file.type })
        .returning("id")
        .executeTakeFirstOrThrow();
      await upload.rename({ draftId, fileId, fileName });
      return "Ok" as const;
    } catch (e) {
      if ((e as { constraint?: string })?.constraint === "files_name_key") {
        return "Conflict" as const;
      }
      throw e;
    }
  });
  if (result !== "Ok") {
    await upload.cancel();
  }
  return result;
}

const fileIdSchema = z.object({
  id: z.number(),
});
export async function deleteFile(
  auth: z.input<typeof authSchema>,
  file: z.input<typeof fileIdSchema>,
) {
  const { id: userId } = await authSchema.parseAsync(auth);
  const { id: fileId } = await fileIdSchema.parseAsync(file);

  const res = await getNNDB().transaction().execute(async (tx) => {
    const fileInfo = await tx
      .selectFrom("files")
      .innerJoin("drafts", "files.draft_id", "drafts.id")
      .innerJoin("articles", "drafts.article_id", "articles.id")
      .select(["draft_id", "author_id"])
      .where("id", "=", fileId)
      .executeTakeFirst();
    if (!fileInfo || fileInfo.author_id !== userId || fileInfo.draft_id === null) {
      return { type: "Forbidden" } as const;
    }
    await tx.deleteFrom("files").where("id", "=", fileId).execute();
    await Files.deleteOneDraftFile({ draftId: fileInfo.draft_id, fileId });
    return { type: "Ok" } as const;
  });
  return res.type;
}

"use server";
import { z } from "zod";
import { authSchema } from "@/serverAuth";
import { draftIdSchema } from "@/schemas";
import * as newdb from "@/newdb";
import * as Queries from "@/queries_sql";
import * as Files from "@/files";

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
  const { id: draftId } = await draftIdSchema.parseAsync(payload);
  const { name: fileName } = createFileSchema.parse(payload);
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

  const res = await newdb.tx(async ({ first, execute }) => {
    const fileInfo = await first(Queries.getFileInfo, { id: fileId });
    if (fileInfo?.authorId !== userId) {
      return { type: "Forbidden" } as const;
    }
    await execute(Queries.deleteFile, { id: fileId });
    await Files.deleteOneDraftFile({ draftId: fileInfo.draftId, fileId });
    return { type: "Ok" } as const;
  });
  return res.type;
}

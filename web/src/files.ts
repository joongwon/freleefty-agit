import { getEnv } from "@/env";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { Writable } from "stream";

const draftFilesPath = (id: number) =>
  path.join(getEnv().UPLOAD_DIR, "d", id.toString());
const editionFilesPath = (id: number) =>
  path.join(getEnv().UPLOAD_DIR, "e", id.toString());

export async function deleteDraftFiles(id: number) {
  await fs.promises.rm(draftFilesPath(id), { recursive: true, force: true });
}

export async function deleteOneDraftFile(p: {
  draftId: number;
  fileId: number;
}) {
  const filePath = path.join(draftFilesPath(p.draftId), p.fileId.toString());
  await fs.promises.rm(filePath, { recursive: true, force: true });
}

export async function deleteEditionFiles(id: number) {
  await fs.promises.rm(editionFilesPath(id), { recursive: true, force: true });
}

export async function moveDraftFilesToEdition(p: {
  draftId: number;
  editionId: number;
}) {
  await fs.promises.rename(
    draftFilesPath(p.draftId),
    editionFilesPath(p.editionId),
  );
}

export async function linkEditionFilesToDraft(p: {
  editionId: number;
  draftId: number;
  files: { oldId: number; newId: number; name: string }[];
}) {
  await Promise.all(
    p.files.map(async ({ oldId, newId, name }) => {
      const oldPath = path.join(
        editionFilesPath(p.editionId),
        oldId.toString(),
        name,
      );
      const newDir = path.join(draftFilesPath(p.draftId), newId.toString());
      const newPath = path.join(newDir, name);
      await fs.promises.mkdir(newDir, { recursive: true });
      await fs.promises.link(oldPath, newPath);
    }),
  );
}

export function uploadFile(file: File) {
  const uploadStream = file.stream();
  const tmpFileName = path.join(getEnv().UPLOAD_DIR, randomUUID());
  const stream = Writable.toWeb(fs.createWriteStream(tmpFileName));
  const promise = uploadStream.pipeTo(stream);
  return {
    rename: async (p: {
      draftId: number;
      fileId: number;
      fileName: string;
    }) => {
      await promise;
      const newDir = path.join(draftFilesPath(p.draftId), p.fileId.toString());
      const newPath = path.join(newDir, p.fileName);
      const oldPath = tmpFileName;
      await fs.promises.mkdir(newDir, { recursive: true });
      await fs.promises.rename(oldPath, newPath);
    },
    cancel: () => uploadStream.cancel(),
  };
}

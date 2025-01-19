import { parseSafeInt } from "@/utils";
import { notFound } from "next/navigation";
import * as ArticleList from "@/components/ArticleList";
import Viewer from "@/components/Viewer";
import Link from "next/link";
import { getEnv } from "@/env";
import { cache } from "react";
import { getNNDB } from "@/db";

const getEdition = cache(async (editionId: number) => {
  return await getNNDB().transaction().execute(async tx => {
    const edition = await tx.selectFrom("editions")
      .where("id", "=", editionId)
      .select("id")
      .select("article_id")
      .select("title")
      .select("content")
      .select("notes")
      .select("published_at")
      .executeTakeFirst();
    if (!edition) {
      return null;
    }

    const editions = await tx.selectFrom("editions")
      .where("article_id", "=", edition.article_id)
      .select("id")
      .select("title")
      .select("notes")
      .execute();

    const files = await tx.selectFrom("files")
      .where("edition_id", "=", editionId)
      .select("id")
      .select("name")
      .execute();

    return { ...edition, editions, files };
  });
});

export default async function Edition(p: { params: { editionId: string } }) {
  const editionId = parseSafeInt(p.params.editionId);
  if (editionId === null) {
    return notFound();
  }

  const edition = await getEdition(editionId);

  if (!edition) {
    return notFound();
  }

  const staticUrl = getEnv().STATIC_URL;

  return (
    <main>
      <header className="flex justify-between md:items-end mb-4 md:flex-row flex-col items-start">
        <h1 className="text-2xl font-bold">
          일지 {edition.article_id}호의 개정판
        </h1>
        <Link className="underline" href={`/articles/${edition.article_id}`}>
          본문 보기
        </Link>
      </header>
      <ArticleList.Container>
        {edition.editions.map((edition, i) => (
          <ArticleList.EditionItem
            key={edition.id}
            edition={edition}
            selected={edition.id === editionId}
            latest={i === 0}
          />
        ))}
      </ArticleList.Container>
      <section className="border border-gray-200 p-4 rounded-xl my-4">
        <h1 className="text-3xl font-bold">{edition.title}</h1>
        <Viewer
          content={edition.content}
          files={edition.files}
          fileSuffix={`${staticUrl}/${edition.id}`}
        />
      </section>
    </main>
  );
}

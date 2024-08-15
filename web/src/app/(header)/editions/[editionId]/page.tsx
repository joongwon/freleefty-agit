import { parseSafeInt } from "@/utils";
import { notFound } from "next/navigation";
import * as ArticleList from "@/components/ArticleList";
import Viewer from "@/components/Viewer";
import Link from "next/link";
import styles from "./page.module.scss";
import classNames from "classnames/bind";
import { getEnv } from "@/env";
import { cache } from "react";
import * as Queries from "@/queries_sql";
import * as newdb from "@/newdb";

const cx = classNames.bind(styles);

const getEdition = cache(async (editionId: number) => {
  return newdb.tx(async ({ first , list}) => {
    const edition = await first(Queries.getEdition, { id: editionId });
    if (edition === null) {
      return null;
    }

    const editions = await list(Queries.listEditions, { articleId: edition.articleId });
    const files = await list(Queries.listEditionFiles, { id: editionId });
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
    <main className={cx("edition")}>
      <header>
        <h1>일지 {edition.articleId}호의 개정판</h1>
        <Link href={`/articles/${edition.articleId}`}>본문 보기</Link>
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
      <section className={cx("content")}>
        <h1>{edition.title}</h1>
        <Viewer content={edition.content} files={edition.files} fileSuffix={`${staticUrl}/${edition.id}`} />
      </section>
    </main>
  );
}

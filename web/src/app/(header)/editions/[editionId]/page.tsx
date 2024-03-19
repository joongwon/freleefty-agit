import { getDB } from "@/db";
import { parseSafeInt } from "@/utils";
import { notFound } from "next/navigation";
import * as ArticleList from "@/components/ArticleList";
import Viewer from "@/components/Viewer";
import Link from "next/link";
import styles from "./page.module.scss";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

export default async function Edition(p: { params: { editionId: string } }) {
  const editionId = parseSafeInt(p.params.editionId);
  if (editionId === null) {
    return notFound(); }

  const db = getDB();
  const edition = await db.getEdition(editionId);

  if (!edition) {
    return notFound();
  }

  return (
    <main className={cx("edition")}>
      <header>
        <h1>일지 {edition.articleId}호의 개정판</h1>
        <Link href={`/articles/${edition.articleId}`}>본문 보기</Link>
      </header>
      <ArticleList.Container>
        {edition.editions.map((edition, i) => (
          <ArticleList.EditionItem key={edition.id} edition={edition} selected={edition.id === editionId} latest={i === 0} />
        ))}
      </ArticleList.Container>
      <section className={cx("content")}>
        <h1>{edition.title}</h1>
        <Viewer content={edition.content} />
      </section>
    </main>
  );
}

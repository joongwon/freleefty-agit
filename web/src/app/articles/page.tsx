import { getDB } from "@/db";
import * as ArticleList from "@/components/ArticleList";
import styles from "./page.module.scss";
import classnames from "classnames/bind";

const cx = classnames.bind(styles);

export default async function ListArticles() {
  const db = getDB();
  const articles = await db.listArticles();
  return (
    <main className={cx("all-articles")}>
      <h1>모든 일지</h1>
      <ArticleList.Container>
        {articles.map((article) => (
          <ArticleList.Item key={article.id} article={article} />
        ))}
      </ArticleList.Container>
    </main>
  );
}

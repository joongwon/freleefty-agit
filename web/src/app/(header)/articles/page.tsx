import * as ArticleList from "@/components/ArticleList";
import styles from "./page.module.scss";
import classnames from "classnames/bind";
import * as newdb  from "@/newdb";
import { listArticles } from "@/queries.sql";

export const dynamic = "force-dynamic";
const cx = classnames.bind(styles);

export default async function ListArticles() {
  const articles = await newdb.list(listArticles, undefined);
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

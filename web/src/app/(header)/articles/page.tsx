import * as ArticleList from "@/components/ArticleList";
import * as newdb from "@/newdb";
import * as Queries from "@/queries_sql";

export const dynamic = "force-dynamic";

export default async function ListArticles() {
  const articles = await newdb.list(Queries.listArticles, undefined);
  return (
    <main>
      <h1 className="text-4xl font-bold">모든 일지</h1>
      <ArticleList.Container>
        {articles.map((article) => (
          <ArticleList.Item key={article.id} item={article} />
        ))}
      </ArticleList.Container>
    </main>
  );
}

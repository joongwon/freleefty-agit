import * as newdb from "@/newdb";
import * as Queries from "@/queries_sql";
import Infinite from "./Infinite";

export const dynamic = "force-dynamic";

export default async function ListArticles() {
  const articles = await newdb.list(Queries.listArticles, {
    before: (new Date()).toISOString(),
    limit: 40,
  });
  return (
    <main>
      <h1 className="text-4xl font-bold">모든 일지</h1>
      <Infinite initialItems={articles} />
    </main>
  );
}

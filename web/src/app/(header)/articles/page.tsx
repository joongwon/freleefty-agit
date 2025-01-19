import { makeListArticlesQuery } from "@/queries";
import Infinite from "./Infinite";
import { getNNDB } from "@/db";

export const dynamic = "force-dynamic";

export default async function ListArticles() {
  const articles = await makeListArticlesQuery(getNNDB(), {
    before: new Date().toISOString(),
    limit: 40,
    prevId: null,
  }).execute();
  return (
    <main>
      <h1 className="text-4xl font-bold">모든 일지</h1>
      <Infinite initialItems={articles} />
    </main>
  );
}

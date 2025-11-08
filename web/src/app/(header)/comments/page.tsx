import { makeListAllCommentsQuery } from "@/queries";
import { getNNDB } from "@/db";
import { PgTimestamp } from "@/nndb/utils";
import Infinite from "./Infinite";

export const dynamic = "force-dynamic";

export default async function ListArticles() {
  const comments = await makeListAllCommentsQuery(getNNDB(), {
    before: new Date().toISOString() as PgTimestamp,
    limit: 40,
    prevId: null,
  }).execute();
  return (
    <main>
      <h1 className="text-4xl font-bold">최근 댓글</h1>
      <Infinite initialItems={comments} />
    </main>
  );
}

import {
  getUserById,
  listArticlesByAuthor,
  listUserComments,
} from "@/queries_sql";
import { notFound } from "next/navigation";
import * as newdb from "@/newdb";
import { PageProps } from "@/utils";
import Link from "next/link";
import InfiniteArticles from "./InfiniteArticles";
import InfiniteComments from "./InfiniteComments";

export default async function UserPage(
  p: { params: { userId: string } } & PageProps,
) {
  const userId = p.params.userId;
  const user = await newdb.option(getUserById, { userId });

  if (user === null) {
    return notFound();
  }

  const sectionRaw = p.searchParams.section;
  const section = sectionRaw === "comments" ? "comments" : "articles";
  const contents =
    section === "comments" ? (
      <InfiniteComments
        authorId={user.id}
        initialItems={await newdb.list(listUserComments, {
          authorId: user.id,
          before: new Date().toISOString(),
          limit: 40,
        })}
      />
    ) : (
      <InfiniteArticles
        authorId={user.id}
        initialItems={await newdb.list(listArticlesByAuthor, {
          authorId: user.id,
          before: new Date().toISOString(),
          limit: 40,
        })}
      />
    );

  const role = (() => {
    switch (user.role) {
      case "admin":
        return "관리자";
      case "user":
        return "일반 사용자";
    }
  })();

  const info = [
    ["이름", user.name],
    [
      "아이디",
      // eslint-disable-next-line react/jsx-key
      <code>{user.id}</code>,
    ],
    ["직책", role],
  ] as const;

  const sections = [
    ["일지", "articles"],
    ["댓글", "comments"],
  ] as const;

  return (
    <main>
      <h1 className="text-2xl font-bold">
        {user.name}
        <span className="text-gray-500">@{user.id}</span>
      </h1>
      <table className="w-full my-4">
        <colgroup>
          <col className="w-16" />
          <col />
        </colgroup>
        <tbody>
          {info.map(([key, value]) => (
            <tr key={key} className="border-b">
              <th className="text-gray-500 text-right pr-2">{key}</th>
              <td className="text-gray-900">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <nav>
        <ul className="flex gap-2">
          {sections.map(([name, value]) => (
            <li
              key={value}
              className={`text-xl ${value === section ? "font-bold text-black" : "text-gray-400"}`}
            >
              <Link href={`?section=${value}`}>{name}</Link>
            </li>
          ))}
        </ul>
      </nav>
      {contents}
    </main>
  );
}

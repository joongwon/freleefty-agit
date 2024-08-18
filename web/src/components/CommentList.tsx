"use client";
import { ArticleComment, UserComment } from "@/types";
import Time from "@/components/Time";
import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";

export function Container(p: { children: ReactNode }) {
  return <section className="mt-4 mb-8">{p.children}</section>;
}

export function Item(p: {
  comment: UserComment | ArticleComment;
  after?: ReactNode;
}) {
  const [hash, setHash] = useState("");
  useEffect(() => {
    setHash(window.location.hash);
    const listener = () => setHash(window.location.hash);
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, []);

  return (
    <article
      id={`comment-${p.comment.id}`}
      className={`border-b border-gray-300 first:border-t p-1 group relative flex ${hash === `#comment-${p.comment.id}` ? "bg-yellow-50" : ""}`}
    >
      <div className="flex-1">
        <p>{p.comment.content}</p>
        <footer className="text-sm text-gray-500">
          {"authorName" in p.comment && p.comment.authorName && (
            <>
              <Link href={`/users/${p.comment.authorId}`}>
                {p.comment.authorName}
              </Link>
              {", "}
            </>
          )}
          {"articleTitle" in p.comment && p.comment.articleTitle && (
            <>
              「
              <Link
                href={`/articles/${p.comment.articleId}#comment-${p.comment.id}`}
                className="text-gray-700 hover:underline"
              >
                {p.comment.articleTitle}
              </Link>
              」 by{" "}
              <Link href={`/users/${p.comment.articleAuthorId}`}>
                {p.comment.articleAuthorName}
              </Link>
              {", "}
            </>
          )}
          <Time>{p.comment.createdAt}</Time>
        </footer>
      </div>
      {p.after}
    </article>
  );
}

export function Empty(p: { children: ReactNode }) {
  return <p className="text-center text-gray-500">{p.children}</p>;
}

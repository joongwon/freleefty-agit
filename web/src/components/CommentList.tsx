"use client";
import Time from "@/components/Time";
import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { Comment } from "@/types";

export function Container(p: { children: ReactNode }) {
  return <section className="mt-4 mb-8">{p.children}</section>;
}

export function Item(p: { comment: Comment; after?: ReactNode }) {
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
          {"author_name" in p.comment && p.comment.author_name && (
            <>
              <Link href={`/users/${p.comment.author_id}`}>
                {p.comment.author_name}
              </Link>
              {", "}
            </>
          )}
          {"article_title" in p.comment && p.comment.article_title && (
            <>
              「
              <Link
                href={`/articles/${p.comment.article_id}#comment-${p.comment.id}`}
                className="text-gray-700 hover:underline"
              >
                {p.comment.article_title}
              </Link>
              」
              {"article_author_name" in p.comment &&
                p.comment.article_author_name && (
                  <>
                    {" by "}
                    <Link href={`/users/${p.comment.articleAuthorId}`}>
                      {p.comment.article_author_name}
                    </Link>
                  </>
                )}
              {", "}
            </>
          )}
          <Time>{p.comment.created_at}</Time>
        </footer>
      </div>
      {p.after}
    </article>
  );
}

export function Empty(p: { children: ReactNode }) {
  return <p className="text-center text-gray-500">{p.children}</p>;
}

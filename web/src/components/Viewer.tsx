"use client";

import { createContext, useContext, useMemo } from "react";
import Markdown, { defaultUrlTransform } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import highlightRescript from "highlightjs-rescript";
import * as Lowlight from "lowlight";
import "highlight.js/styles/github.css";
import { useState } from "react";
import { FileInfo } from "@/types";

const options = ["Markdown", "Text"] as const;
type Option = (typeof options)[number];

const ViewerOptionContext = createContext<{
  type: Option;
  setType: (type: Option) => void;
  content: string;
  files: FileInfo[];
  fileSuffix: string;
} | null>(null);

export function OptionProvider(p: {
  children: React.ReactNode;
  content: string;
  files: FileInfo[];
  fileSuffix: string;
}) {
  const [type, setType] = useState<Option>(() => estimateType(p.content));
  const value = useMemo(
    () => ({
      type,
      setType,
      files: p.files,
      content: p.content,
      fileSuffix: p.fileSuffix,
    }),
    [type, p.content, p.files, p.fileSuffix],
  );
  return (
    <ViewerOptionContext.Provider value={value}>
      {p.children}
    </ViewerOptionContext.Provider>
  );
}

export function Options() {
  const viewerOption = useContext(ViewerOptionContext);
  if (!viewerOption) {
    console.error("ViewerOptionContext not found");
    return null;
  }
  return (
    <section className="absolute right-0 -top-8">
      {options.map((option) => (
        <button
          key={option}
          className={`button
            rounded-none
            first:rounded-l-md last:rounded-r-md
            border-r-0
            last:border-r
          ${viewerOption.type === option ? "bg-gray-200 hover:bg-gray-200" : ""}`}
          onClick={() => viewerOption.setType(option)}
        >
          {option}
        </button>
      ))}
    </section>
  );
}

function estimateType(content: string) {
  // quote("> "), list("* ", "- "), heading("# "), code("`"), link("](")
  const pat = /^([>*-] |#|`)|\]\(/m;
  return pat.test(content) ? "Markdown" : "Text";
}

export function Content() {
  const viewerOption = useContext(ViewerOptionContext);
  if (!viewerOption) {
    console.error("ViewerOptionContext not found");
  }

  const files = viewerOption?.files ?? [];
  const fileSuffix = viewerOption?.fileSuffix ?? "";

  const urlTransform = (url: string) => {
    if (url.startsWith("./")) {
      const fileName = decodeURI(url.slice(2));
      const fileId = files.find((f) => f.name === fileName)?.id;
      if (fileId !== undefined) {
        return `${fileSuffix}/${fileId}/${fileName.normalize()}`;
      } else {
        return "";
      }
    }
    return defaultUrlTransform(url);
  };

  const content = viewerOption?.content ?? "";
  switch (viewerOption?.type ?? "Text") {
    case "Markdown":
      return (
        <Markdown
          urlTransform={urlTransform}
          components={{
            img: ({ node: _node, className = "", ref: _, ...props }) => {
              return (
                <img
                  className={`${className} max-w-full max-h-[75vh]`}
                  {...props}
                />
              );
            },
            pre: ({ node: _node, className = "", ref: _, ...props }) => {
              return <pre className={`not-prose ${className}`} {...props} />;
            },
            code: ({ node: _node, className = "", ref: _, ...props }) => {
              const isPoem = className === "language-poem";
              return (
                <code
                  className={`not-prose ${
                    isPoem ? "font-sans" : "font-mono"
                  } ${className}`}
                  {...props}
                />
              );
            },
          }}
          rehypePlugins={[
            [
              rehypeHighlight,
              {
                languages: { ...Lowlight.common, rescript: highlightRescript },
              },
            ],
          ]}
          className="prose"
        >
          {content}
        </Markdown>
      );
    case "Text":
      return <pre className="font-sans text-wrap text-justify">{content}</pre>;
  }
}

export default function Viewer(p: {
  content: string;
  files: FileInfo[];
  fileSuffix: string;
}) {
  return (
    <article className="relative mt-8">
      <OptionProvider
        content={p.content}
        files={p.files}
        fileSuffix={p.fileSuffix}
      >
        <Options />
        <Content />
        {p.files.length > 0 && (
          <details>
            <summary>첨부파일</summary>
            <ul className="list-disc mb-2 ml-4">
              {p.files.map((file) => (
                <li key={file.id}>
                  <a
                    className="hover:underline"
                    href={`${p.fileSuffix}/${file.id}/${file.name}`}
                  >
                    {file.name}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        )}
      </OptionProvider>
    </article>
  );
}

"use client";

import { createContext, useContext, useMemo } from "react";
import Markdown, { defaultUrlTransform } from "react-markdown";
import styles from "./Viewer.module.scss";
import classNames from "classnames/bind";
import { useState, Fragment } from "react";
import { FileInfo } from "@/types";

const cx = classNames.bind(styles);

const ViewerOptionContext = createContext<{
  type: "markdown" | "text";
  setType: (type: "markdown" | "text") => void;
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
  const [type, setType] = useState<"markdown" | "text">(() =>
    estimateType(p.content),
  );
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
    <section className={cx("options")}>
      <button
        className={cx({
          selected: viewerOption?.type === "markdown",
        })}
        onClick={() => viewerOption?.setType("markdown")}
      >
        Markdown
      </button>
      <button
        className={cx({ selected: viewerOption?.type === "text" })}
        onClick={() => viewerOption?.setType("text")}
      >
        Text
      </button>
    </section>
  );
}

function estimateType(content: string) {
  // quote("> "), list("* "), heading("# "), code("```"), image("!["), link("](")
  const pat = /^([>*-] |#|```|!\[)|\]\(/m;
  return pat.test(content) ? "markdown" : "text";
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
  switch (viewerOption?.type ?? "text") {
    case "markdown":
      return <Markdown urlTransform={urlTransform}>{content}</Markdown>;
    case "text":
      return content.split("\n").map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </Fragment>
      ));
  }
}

export default function Viewer(p: {
  content: string;
  files: FileInfo[];
  fileSuffix: string;
}) {
  return (
    <article className={cx("viewer")}>
      <OptionProvider
        content={p.content}
        files={p.files}
        fileSuffix={p.fileSuffix}
      >
        <Options />
        <Content />
        {p.files.length > 0 && (
          <details className={cx("files")}>
            <summary>첨부파일</summary>
            <ul>
              {p.files.map((file) => (
                <li key={file.id}>
                  <a href={`${p.fileSuffix}/${file.id}/${file.name}`}>
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

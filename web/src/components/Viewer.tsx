"use client";

import { createContext, useContext, useMemo } from "react";
import Markdown from "react-markdown";
import styles from "./Viewer.module.scss";
import classNames from "classnames/bind";
import { useState, Fragment } from "react";

const cx = classNames.bind(styles);

const ViewerOptionContext = createContext<{
  type: "markdown" | "text";
  setType: (type: "markdown" | "text") => void;
  content: string;
} | null>(null);

export function OptionProvider(p: {
  children: React.ReactNode;
  content: string;
}) {
  const [type, setType] = useState<"markdown" | "text">(() =>
    estimateType(p.content),
  );
  const value = useMemo(
    () => ({ type, setType, content: p.content }),
    [type, setType, p.content],
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
  const pat = /^(#|```)/m;
  return pat.test(content) ? "markdown" : "text";
}

export function Content() {
  const viewerOption = useContext(ViewerOptionContext);
  if (!viewerOption) {
    console.error("ViewerOptionContext not found");
  }

  const content = viewerOption?.content ?? "";
  switch (viewerOption?.type ?? "text") {
    case "markdown":
      return <Markdown>{content}</Markdown>;
    case "text":
      return content.split("\n").map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </Fragment>
      ));
  }
}

export default function Viewer(p: { content: string }) {
  return (
    <article className={cx("viewer")}>
      <OptionProvider content={p.content}>
        <Options />
        <Content />
      </OptionProvider>
    </article>
  );
}

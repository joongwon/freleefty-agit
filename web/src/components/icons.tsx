function makeIconJsx(code: string) {
  return (
    <span
      className="material-symbols-outlined"
      dangerouslySetInnerHTML={{ __html: `&#x${code};` }}
    />
  );
}

export const COMMENT = makeIconJsx("e0b9");
export const VISIBILITY = makeIconJsx("e8f4");
export const FAVORITE = makeIconJsx("e87d");
export const ARROW_UP = makeIconJsx("e316");
export const ARROW_DOWN = makeIconJsx("e313");
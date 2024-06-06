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
export const ARROW_RIGHT = makeIconJsx("e315");
export const MENU = makeIconJsx("e5d2");
export const CLOSE = makeIconJsx("e5cd");
export const GOTO_TOP = makeIconJsx("e5d8");
export const MORE = makeIconJsx("e5d3");
export const DELETE = makeIconJsx("e872");

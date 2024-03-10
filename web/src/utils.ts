export type PageProps = {
  searchParams: { [key: string]: string | string[] | undefined };
};
export function onlyString(
  value: string | string[] | undefined | null,
): string | undefined {
  if (typeof value === "string") {
    return value;
  } else {
    return undefined;
  }
}

export function parseSafeInt(s: string) {
  if (!/^[1-9]\d*$/.test(s)) {
    return null;
  }
  const n = parseInt(s);
  if (Number.isSafeInteger(n)) {
    return n;
  }
  return null;
}

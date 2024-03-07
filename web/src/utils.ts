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

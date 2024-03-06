export type PageProps = {
  searchParams: { [key: string]: string | string[] | undefined };
};
export function onlyString(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") {
    return value;
  } else {
    return undefined;
  }
}


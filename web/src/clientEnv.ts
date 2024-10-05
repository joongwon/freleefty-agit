const keys = ["THUMBNAIL_URL", "NAVER_ID"] as const;
const values = [
  process.env.NEXT_PUBLIC_THUMBNAIL_URL,
  process.env.NEXT_PUBLIC_NAVER_ID,
];
type Env = { [key in (typeof keys)[number]]: string };
let env: Env | undefined;
export function getClientEnv() {
  if (env) {
    return env;
  }
  env = {} as Env;
  const notFound: string[] = [];
  for (let i = 0; i < keys.length; i++) {
    const value = values[i];
    if (!value) {
      notFound.push(keys[i]);
    } else {
      env[keys[i]] = value;
    }
  }
  if (notFound.length > 0) {
    throw new Error(`Environment variables not found: ${notFound.join(", ")}`);
  }
  return env;
}

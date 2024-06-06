import "server-only";

const keys = [
  "NAVER_ID",
  "NAVER_SECRET",
  "JWT_SECRET",
  "DATABASE_URL",
  "REDIS_URL",
  "UPLOAD_DIR",
  "STATIC_URL",
] as const;

type Env = { [key in (typeof keys)[number]]: string };

let env: Env | undefined;

export function getEnv() {
  if (!env) {
    env = {} as Env;
    const notFound = [];
    for (const key of keys) {
      const value = process.env[key];
      if (!value) {
        notFound.push(key);
      } else {
        env[key] = value;
      }
    }
    if (notFound.length > 0) {
      throw new Error(
        `Environment variables not found: ${notFound.join(", ")}`,
      );
    }
  }
  return env;
}

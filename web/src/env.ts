const keys = [
  "NEXT_PUBLIC_HOST",
  "NEXT_PUBLIC_NAVER_ID",
  "NAVER_SECRET",
  "JWT_SECRET",
  "DATABASE_URL",
  "REDIS_URL",
] as const;

type Env = { [key in (typeof keys)[number]]: string };

let env: Env | undefined;

export function getEnv() {
  if (!env) {
    env = {} as Env;
    for (const key of keys) {
      const value = process.env[key];
      if (!value) throw new Error(`env.${key} is not defined`);
      env[key] = value;
    }
  }
  return env;
}

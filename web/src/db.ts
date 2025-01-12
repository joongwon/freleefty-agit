import "server-only";
import * as Redis from "redis";
import { Kysely, PostgresDialect } from "kysely";
import DB from "@/nndb/Database";
import { getEnv } from "@/env";
import * as Pg from "pg";

let redis: Redis.RedisClientType | null = null;

export async function getRedis() {
  if (redis === null) {
    const redisUrl = getEnv().REDIS_URL;
    redis = Redis.createClient({ url: redisUrl });
    await redis.connect();
  }
  return redis;
}

// new new database
let nndb: Kysely<DB> | null = null;

export function getNNDB() {
  if (nndb === null) {
    nndb = new Kysely<DB>({
      dialect: new PostgresDialect({
        pool: new Pg.Pool({
          connectionString: getEnv().DATABASE_URL,
        }),
      }),
    });
  }
  return nndb;
}

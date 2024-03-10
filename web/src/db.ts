import { QueryEngine } from "db";
import * as Redis from "redis";
import { getEnv } from "@/env";

let db: QueryEngine | null = null;
let redis: Redis.RedisClientType | null = null;

export function getDB(): QueryEngine {
  if (db === null) {
    const dbUrl = getEnv().DATABASE_URL;
    db = QueryEngine.new(dbUrl);
  }
  return db;
}

export async function getRedis() {
  if (redis === null) {
    const redisUrl = getEnv().REDIS_URL;
    redis = Redis.createClient({ url: redisUrl });
    await redis.connect();
  }
  return redis;
}

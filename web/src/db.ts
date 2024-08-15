import "server-only";
import * as Redis from "redis";
import { getEnv } from "@/env";

let redis: Redis.RedisClientType | null = null;

export async function getRedis() {
  if (redis === null) {
    const redisUrl = getEnv().REDIS_URL;
    redis = Redis.createClient({ url: redisUrl });
    await redis.connect();
  }
  return redis;
}

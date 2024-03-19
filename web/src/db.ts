import "server-only";
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

// types for bypassing '@typescript-eslint/no-unsafe-enum-comparison'
// This is more type safe by enabling proper switch exhaustiveness checking
export type UserConflict = "NaverId" | "Name" | "Id";
export type MaybeNotFound = "Ok" | "NotFound";
export type MaybeNotFoundForbidden = "Ok" | "NotFound" | "Forbidden";
export type NotFoundForbidden = "NotFound" | "Forbidden";
export type BadRequest = "Ok" | "Bad";

/*
// This is a type check to make sure that the types are the same as the one in db.ts
// Uncomment and run tsc to check if the types are the same

import type * as DbTypes from "db";

function _unused_type_check(
  x: DbTypes.UserConflict,
  y: DbTypes.MaybeNotFound,
  z: DbTypes.MaybeNotFoundForbidden,
  w: DbTypes.BadRequest,
) {
  const a: UserConflict = x;
  const b: MaybeNotFound = y;
  const c: MaybeNotFoundForbidden = z;
  const d: BadRequest = w;

  const A: keyof typeof DbTypes.UserConflict = a;
  const B: keyof typeof DbTypes.MaybeNotFound = b;
  const C: keyof typeof DbTypes.MaybeNotFoundForbidden = c;
  const D: keyof typeof DbTypes.BadRequest = d;

  return A + B + C + D;
}
*/

import "server-only";
import * as Pg from "pg";
import { getEnv } from "./env";
import type * as PgTyped from "@pgtyped/runtime";

Pg.types.setTypeParser(Pg.types.builtins.INT8, v => parseInt(v, 10));
Pg.types.setTypeParser(Pg.types.builtins.TIMESTAMP, v => v);

type Query<T, U> = PgTyped.TaggedQuery<{ params: T, result: U }> | PgTyped.PreparedQuery<T, U>;

const pool = new Pg.Pool({
  connectionString: getEnv().DATABASE_URL,
});

export const tx = async <T>(f: (client: {
  list: <T, U>(q: Query<T, U>, params: T) => Promise<U[]>,
  first: <T, U>(q: Query<T, U>, params: T) => Promise<U | null>,
  execute: <T, U>(q: Query<T, U>, params: T) => Promise<void>,
}) => Promise<T>) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const list = async <T, U>(q: Query<T, U>, params: T) => q.run(params, client);
    const first = async <T, U>(q: Query<T, U>, params: T) => (await list(q, params))[0] ?? null;
    const execute = async <T, U>(q: Query<T, U>, params: T) => void await list(q, params);
    const result = await f({list, first, execute});
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export const list = async <T, U>(q: Query<T, U>, params: T) => {
  const client = await pool.connect();
  try {
    return await q.run(params, client);
  } finally {
    client.release();
  }
}

export const first = async <T, U>(q: Query<T, U>, params: T) => {
  return (await list(q, params))[0] ?? null;
}

export const execute = async <T, U>(q: Query<T, U>, params: T) => {
  await list(q, params);
}

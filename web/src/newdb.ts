import "server-only";
import * as Pg from "pg";
import { getEnv } from "./env";
import type * as PgTyped from "@pgtyped/runtime";

Pg.types.setTypeParser(Pg.types.builtins.INT8, (v) => parseInt(v, 10));
Pg.types.setTypeParser(Pg.types.builtins.TIMESTAMP, (v) => v);

type Query<T, U> =
  | PgTyped.TaggedQuery<{ params: T; result: U }>
  | PgTyped.PreparedQuery<T, U>;

let pool: Pg.Pool | undefined;

function connectPool() {
  if (pool === undefined)
    pool = new Pg.Pool({
      connectionString: getEnv().DATABASE_URL,
    });
  return pool.connect();
}

export const tx = async <T>(
  f: (client: {
    list: <T, U>(q: Query<T, U>, params: T) => Promise<U[]>;
    first: <T, U>(q: Query<T, U>, params: T) => Promise<U | null>;
    execute: <T, U>(q: Query<T, U>, params: T) => Promise<void>;
    unique: <T, U>(q: Query<T, U>, params: T) => Promise<U>;
  }) => Promise<T>,
) => {
  const client = await connectPool();
  try {
    await client.query("BEGIN");
    const list = async <T, U>(q: Query<T, U>, params: T) =>
      q.run(params, client);
    const first = async <T, U>(q: Query<T, U>, params: T) =>
      (await list(q, params))[0] ?? null;
    const execute = async <T, U>(q: Query<T, U>, params: T) =>
      void (await list(q, params));
    const unique = async <T, U>(q: Query<T, U>, params: T) => {
      const result = await list(q, params);
      if (result.length !== 1) {
        throw new Error("unique query returned more than one result");
      }
      return result[0];
    };
    const result = await f({ list, first, execute, unique });
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

export const list = async <T, U>(q: Query<T, U>, params: T) => {
  const client = await connectPool();
  try {
    return await q.run(params, client);
  } finally {
    client.release();
  }
};

export const option = async <T, U>(q: Query<T, U>, params: T) => {
  const result = await list(q, params);
  if (result.length > 1) {
    throw new Error("option query returned more than one result");
  }
  return result[0] ?? null;
};

export const unique = async <T, U>(q: Query<T, U>, params: T) => {
  const result = await list(q, params);
  if (result.length !== 1) {
    throw new Error("unique query returned more than one result");
  }
  return result[0];
};

export const execute = async <T, U>(q: Query<T, U>, params: T) => {
  await list(q, params);
};

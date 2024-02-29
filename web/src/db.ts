import { QueryEngine } from "db";

let db: QueryEngine | null = null;

export function getDB(): QueryEngine {
  if (db === null) {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl === undefined) {
      throw new Error("DATABASE_URL is not defined");
    }
    db = QueryEngine.new(dbUrl);
  }
  return db;
}

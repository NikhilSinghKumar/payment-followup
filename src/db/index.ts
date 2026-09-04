import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema-with-relations";

const isDbConfigured = Boolean(process.env.DATABASE_URL);

let db: any;

if (isDbConfigured) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 3000,
  });

  const originalQuery = pool.query.bind(pool);

  let schemaEnsured = false;
  let schemaEnsuringPromise: Promise<void> | null = null;
  const ensureSchema = async () => {
    if (schemaEnsured) return;
    if (!schemaEnsuringPromise) {
      schemaEnsuringPromise = (async () => {
        try {
          await (originalQuery as any)(
            `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_opening_balance BOOLEAN NOT NULL DEFAULT false;`,
          );
          await (originalQuery as any)(
            `ALTER TABLE payments ADD COLUMN IF NOT EXISTS sub_client_id INTEGER REFERENCES client_sub_clients(id) ON DELETE SET NULL;`,
          );
          schemaEnsured = true;
        } catch (e: any) {
          console.warn("[DB Schema Sync]", e?.message);
        } finally {
          schemaEnsuringPromise = null;
        }
      })();
    }
    await schemaEnsuringPromise;
  };

  // Run on startup
  ensureSchema().catch(() => {});

  pool.query = (async (...args: any[]) => {
    if (!schemaEnsured) {
      await ensureSchema();
    }
    try {
      return await (originalQuery as any)(...args);
    } catch (err: any) {
      if (
        err.code === "ECONNREFUSED" ||
        err.code === "ENOTFOUND" ||
        err.code === "ETIMEDOUT" ||
        err.message?.includes("connect")
      ) {
        console.warn(
          "[AI Studio] Database offline — returning empty query result",
        );
        return { rows: [], rowCount: 0, fields: [], command: "" };
      }
      throw err;
    }
  }) as any;

  db = drizzle(pool, { schema });
} else {
  console.warn("[AI Studio] Database URL not provided — mock active");
  const createChainable = (resolvedValue: any = []): any => {
    const handler: ProxyHandler<any> = {
      get(target, prop) {
        if (prop === "then") {
          return (resolve: any) => resolve(resolvedValue);
        }
        if (prop === "catch") {
          return () => createChainable(resolvedValue);
        }
        if (prop === "finally") {
          return () => createChainable(resolvedValue);
        }
        return (...args: any[]) => createChainable(resolvedValue);
      },
      apply(target, thisArg, argArray) {
        return createChainable(resolvedValue);
      },
    };
    return new Proxy(() => {}, handler);
  };

  const queryProxy = new Proxy(
    {},
    {
      get(_, model) {
        return {
          findMany: async () => [],
          findFirst: async () => null,
          findUnique: async () => null,
          count: async () => 0,
        };
      },
    },
  );

  db = new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === "query") return queryProxy;
        if (prop === "select") return () => createChainable([]);
        if (prop === "insert") return () => createChainable([]);
        if (prop === "update") return () => createChainable([]);
        if (prop === "delete") return () => createChainable([]);
        if (prop === "execute") return async () => ({ rows: [] });
        if (prop === "transaction") return async (cb: any) => cb(db);
        return () => createChainable([]);
      },
    },
  );
}

export { db };

import { createRequire } from 'node:module';

interface QueryResult<ResultRow = unknown> {
  rows: ResultRow[];
}

interface PostgresPool {
  query<ResultRow>(
    text: string,
    values?: readonly unknown[],
  ): Promise<QueryResult<ResultRow>>;
}

const require = createRequire(import.meta.url);
const { Pool } = require('pg') as {
  Pool: new (config?: { connectionString?: string }) => PostgresPool;
};

export interface DatabaseClient {
  query<ResultRow>(
    text: string,
    values?: readonly unknown[],
  ): Promise<QueryResult<ResultRow>>;
}

export const createDatabaseClient = (): DatabaseClient => {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool(
    connectionString === undefined ? undefined : { connectionString },
  );

  return {
    query: (text, values) => pool.query(text, values),
  };
};

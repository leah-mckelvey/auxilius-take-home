import { Pool, type QueryResult } from 'pg';

export interface DatabaseClient {
  query<ResultRow>(text: string): Promise<QueryResult<ResultRow>>;
}

export const createDatabaseClient = (): DatabaseClient => {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool(
    connectionString === undefined ? undefined : { connectionString },
  );

  return {
    query: (text) => pool.query(text),
  };
};

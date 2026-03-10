declare module 'pg' {
  export interface QueryResult<ResultRow = unknown> {
    rows: ResultRow[];
  }

  export class Pool {
    constructor(config?: { connectionString?: string });

    query<ResultRow = unknown>(text: string): Promise<QueryResult<ResultRow>>;
  }
}

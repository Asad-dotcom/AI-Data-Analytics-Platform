import { Pool, QueryResult, QueryResultRow } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ai_analytics';

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

export const db = {
  /**
   * Executes a parameterized SQL query against the PostgreSQL pool.
   * Always use parameterized queries ($1, $2, etc.) to prevent SQL injection.
   */
  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const res = await pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      // Log queries in development mode for easy debugging
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Database Query] Duration: ${duration}ms | Rows: ${res.rowCount} | SQL: ${text.replace(/\s+/g, ' ').substring(0, 100)}...`);
      }
      
      return res;
    } catch (error) {
      console.error('[Database Error] Failed to execute query:', { text, error });
      throw error;
    }
  },

  /**
   * Expose the underlying pool to allow transactions or advanced connections.
   */
  pool,
};

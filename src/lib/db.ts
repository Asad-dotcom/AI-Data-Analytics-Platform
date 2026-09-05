import { Pool, QueryResult, QueryResultRow } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ai_analytics';

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

let isInitialized = false;

async function ensureTablesExist() {
  if (isInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        sql_query TEXT,
        sql_result JSONB,
        chart_config JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS datasets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        original_filename VARCHAR(255) NOT NULL,
        r2_key TEXT NOT NULL,
        table_name VARCHAR(255) NOT NULL,
        row_count INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    isInitialized = true;
  } catch (error) {
    console.error('[Database Init Error] Failed to ensure tables exist:', error);
  }
}

export const db = {
  /**
   * Executes a parameterized SQL query against the PostgreSQL pool.
   * Always use parameterized queries ($1, $2, etc.) to prevent SQL injection.
   */
  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    if (!isInitialized) {
      await ensureTablesExist();
    }
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

import { db } from '@/lib/db';

export const QueryService = {
  /**
   * Executes a read-only, validated SQL query against the PostgreSQL database.
   * Enforces a safety LIMIT cap of 1000 rows if none is explicitly specified.
   */
  async executeQuery(sql: string): Promise<unknown[]> {
    let targetSql = sql.trim();

    // If query ends in semicolon, strip it to append safety limit cleanly
    if (targetSql.endsWith(';')) {
      targetSql = targetSql.slice(0, -1).trim();
    }

    // Safety check: Append LIMIT if not already present to prevent crashing on giant datasets
    if (!/LIMIT\s+\d+/i.test(targetSql)) {
      targetSql = `${targetSql} LIMIT 1000`;
    }

    try {
      const res = await db.query(targetSql);
      return res.rows;
    } catch (error) {
      console.error('[Query Service] SQL execution error:', { sql: targetSql, error });
      throw new Error(`Failed to execute data query. Please review request. details: ${(error as Error).message}`);
    }
  },
};

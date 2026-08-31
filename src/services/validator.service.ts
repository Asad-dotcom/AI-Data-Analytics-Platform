export const SqlValidatorService = {
  /**
   * Validates a dynamically generated SQL query.
   * Ensures it is read-only, target-specific, and has no destructive operations.
   */
  validate(sql: string, expectedTableName: string): { isValid: boolean; error?: string } {
    const cleanSql = sql.trim();

    // 1. Must start with SELECT
    if (!/^SELECT/i.test(cleanSql)) {
      return { isValid: false, error: 'Security breach: Only read-only SELECT statements are allowed.' };
    }

    // 2. Check for prohibited SQL operation keywords
    const prohibitedKeywords = [
      'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'CREATE',
      'REPLACE', 'GRANT', 'REVOKE', 'EXECUTE', 'MERGE', 'UPSERT', 'COPY',
      'INTO', 'WRITING', 'PG_SLEEP', 'SESSION_USER', 'CURRENT_USER', 'SYSTEM_USER',
    ];

    for (const keyword of prohibitedKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(cleanSql)) {
        return { isValid: false, error: `Security breach: Prohibited SQL keyword detected: "${keyword}".` };
      }
    }

    // 3. Prevent multi-statement query execution (stacking query injection)
    const statements = cleanSql.split(';').map((s) => s.trim()).filter(Boolean);
    if (statements.length > 1) {
      return { isValid: false, error: 'Security breach: Executing multiple stacked SQL statements is prohibited.' };
    }

    // 4. Extract table names in FROM and JOIN clauses to ensure it only queries the user's dataset table
    const tableRegex = /(?:FROM|JOIN)\s+["']?([a-zA-Z0-9_]+)["']?/gi;
    let match;
    const tablesFound: string[] = [];
    
    while ((match = tableRegex.exec(cleanSql)) !== null) {
      tablesFound.push(match[1]);
    }

    const sanitizedTablesFound = tablesFound.map((t) => t.toLowerCase());
    const targetTable = expectedTableName.toLowerCase();

    for (const tbl of sanitizedTablesFound) {
      if (tbl !== targetTable) {
        return {
          isValid: false,
          error: `Security breach: Query references unauthorized table "${tbl}". Query must restrict data retrieval to "${expectedTableName}".`,
        };
      }
    }

    // 5. Prevent system information exposure
    if (/pg_/i.test(cleanSql) || /information_schema/i.test(cleanSql)) {
      return { isValid: false, error: 'Security breach: Reading database catalog tables is prohibited.' };
    }

    return { isValid: true };
  },
};

import { db } from '@/lib/db';
import { parseCSV, sanitizeIdentifier } from '@/utils';

export const ProcessingService = {
  /**
   * Processes a raw CSV string, infers its schema, creates a table in PostgreSQL,
   * and inserts the rows within a transaction.
   * Cleans formatted numbers (e.g. "9,068.21" or "$1,200.00") so PostgreSQL stores clean numeric columns.
   */
  async processAndLoadCsv(datasetId: string, csvContent: string): Promise<{ tableName: string; rowCount: number }> {
    const { headers, rows } = parseCSV(csvContent);
    if (headers.length === 0) {
      throw new Error('CSV file has no headers or data.');
    }

    // 1. Sanitize headers to create safe database column names
    const sanitizedHeaders = headers.map(sanitizeIdentifier);
    
    // Ensure no duplicate header names
    const uniqueHeaders: string[] = [];
    const headerSet = new Set<string>();
    for (const h of sanitizedHeaders) {
      let candidate = h;
      let counter = 1;
      while (headerSet.has(candidate)) {
        candidate = `${h}_${counter}`;
        counter++;
      }
      headerSet.add(candidate);
      uniqueHeaders.push(candidate);
    }

    // 2. Infer data types for each column
    const columnTypes = inferColumnTypes(uniqueHeaders, rows);

    // 3. Generate a unique, safe table name
    const tableName = `ds_table_${datasetId.replace(/-/g, '_')}`;

    // 4. Build CREATE TABLE statement
    const columnDefinitions = uniqueHeaders.map((header, index) => {
      return `"${header}" ${columnTypes[index]}`;
    });

    const createTableSql = `
      CREATE TABLE IF NOT EXISTS "${tableName}" (
        id SERIAL PRIMARY KEY,
        ${columnDefinitions.join(',\n        ')}
      )
    `;

    // 5. Connect and execute transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create the dynamic user data table
      await client.query(createTableSql);

      // 6. Build INSERT statement
      const columnsList = uniqueHeaders.map(h => `"${h}"`).join(', ');
      const placeholdersList = uniqueHeaders.map((_, i) => `$${i + 1}`).join(', ');
      const insertSql = `INSERT INTO "${tableName}" (${columnsList}) VALUES (${placeholdersList})`;

      // Insert rows in batches
      for (const row of rows) {
        const rowParams = uniqueHeaders.map((_, index) => {
          const rawVal = row[index]?.trim();
          if (rawVal === '' || rawVal === undefined) return null;

          const colType = columnTypes[index];
          if (colType === 'INTEGER' || colType === 'DOUBLE PRECISION') {
            const cleaned = cleanNumericString(rawVal);
            if (colType === 'INTEGER') {
              const parsed = parseInt(cleaned, 10);
              return isNaN(parsed) ? null : parsed;
            } else {
              const parsed = parseFloat(cleaned);
              return isNaN(parsed) ? null : parsed;
            }
          }
          return rawVal;
        });

        await client.query(insertSql, rowParams);
      }

      await client.query('COMMIT');
      return { tableName, rowCount: rows.length };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[Processing Service] Failed loading CSV dataset into database:', error);
      throw error;
    } finally {
      client.release();
    }
  },
};

/**
 * Strips currency symbols ($ € £) and thousands separators (,) from number strings.
 */
function cleanNumericString(val: string): string {
  return val.replace(/[$€£,\s]/g, '');
}

/**
 * Basic data type inference helper.
 */
function inferType(val: string): string {
  if (!val) return 'TEXT';
  const cleaned = cleanNumericString(val);
  // Match integer (optionally signed)
  if (/^-?\d+$/.test(cleaned)) return 'INTEGER';
  // Match float/decimal (optionally signed)
  if (/^-?\d+\.\d+$/.test(cleaned)) return 'DOUBLE PRECISION';
  // Match standard ISO/SQL dates (containing dashes/slashes)
  if (!isNaN(Date.parse(val)) && (val.includes('-') || val.includes('/'))) return 'TIMESTAMP';
  return 'TEXT';
}

/**
 * Infers SQL data types for all columns across the CSV rows.
 */
function inferColumnTypes(headers: string[], rows: string[][]): string[] {
  const columnTypes = headers.map(() => 'INTEGER');

  for (const row of rows) {
    for (let i = 0; i < headers.length; i++) {
      const val = row[i]?.trim();
      if (!val) continue;

      const currentInferred = inferType(val);
      const activeType = columnTypes[i];

      if (activeType === 'TEXT' || currentInferred === 'TEXT') {
        columnTypes[i] = 'TEXT';
      } else if (activeType === 'DOUBLE PRECISION' || currentInferred === 'DOUBLE PRECISION') {
        columnTypes[i] = 'DOUBLE PRECISION';
      } else if (activeType === 'TIMESTAMP' || currentInferred === 'TIMESTAMP') {
        if (activeType === 'INTEGER' || activeType === 'DOUBLE PRECISION') {
          columnTypes[i] = 'TEXT';
        } else {
          columnTypes[i] = 'TIMESTAMP';
        }
      }
    }
  }

  return columnTypes;
}

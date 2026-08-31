/**
 * Simple CSV parser that handles basic quoted strings and commas.
 */
export function parseCSV(csvContent: string): { headers: string[]; rows: string[][] } {
  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

/**
 * Sanitizes column names to be valid, safe PostgreSQL identifiers.
 * Prevents SQL injection via column or table names.
 */
export function sanitizeIdentifier(name: string): string {
  const sanitized = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, '_')    // Replace non-alphanumeric with underscores
    .replace(/__+/g, '_')           // Replace multiple underscores with a single one
    .replace(/^_+|_+$/g, '');        // Trim leading/trailing underscores
    
  // Check if it starts with a number, prepending 'col_' if so
  if (/^[0-9]/.test(sanitized)) {
    return `col_${sanitized}`;
  }
  
  // If empty identifier, return a default col name
  return sanitized || 'col_unnamed';
}

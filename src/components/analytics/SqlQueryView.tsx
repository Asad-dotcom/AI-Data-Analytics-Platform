'use client';

import React, { useState } from 'react';
import { Terminal, Table as TableIcon, ChevronDown, ChevronUp } from 'lucide-react';

interface SqlQueryViewProps {
  sqlQuery?: string | null;
  sqlResult?: unknown | null;
}

export const SqlQueryView: React.FC<SqlQueryViewProps> = ({ sqlQuery, sqlResult }) => {
  const [showSql, setShowSql] = useState(false);
  const [showTable, setShowTable] = useState(false);

  const rows = Array.isArray(sqlResult) ? (sqlResult as Record<string, unknown>[]) : [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  if (!sqlQuery && rows.length === 0) return null;

  return (
    <div className="w-full my-3 space-y-2">
      {sqlQuery && (
        <div className="border border-slate-800 rounded-lg bg-slate-950 overflow-hidden">
          <button
            onClick={() => setShowSql(!showSql)}
            className="w-full px-4 py-2 text-xs font-mono flex items-center justify-between text-indigo-400 bg-slate-900/60 hover:bg-slate-900 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              Generated PostgreSQL Query
            </span>
            {showSql ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showSql && (
            <pre className="p-4 text-xs font-mono text-slate-300 bg-slate-950 overflow-x-auto whitespace-pre-wrap border-t border-slate-800">
              {sqlQuery}
            </pre>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <div className="border border-slate-800 rounded-lg bg-slate-950 overflow-hidden">
          <button
            onClick={() => setShowTable(!showTable)}
            className="w-full px-4 py-2 text-xs font-mono flex items-center justify-between text-emerald-400 bg-slate-900/60 hover:bg-slate-900 transition-colors"
          >
            <span className="flex items-center gap-2">
              <TableIcon className="w-3.5 h-3.5 text-emerald-400" />
              Raw Query Results ({rows.length} rows)
            </span>
            {showTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showTable && (
            <div className="p-2 overflow-x-auto max-h-64 border-t border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 font-medium">
                  <tr>
                    {columns.map((col) => (
                      <th key={col} className="px-3 py-2 border-b border-slate-800">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {rows.slice(0, 50).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      {columns.map((col) => (
                        <td key={col} className="px-3 py-1.5 whitespace-nowrap text-slate-300">
                          {String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

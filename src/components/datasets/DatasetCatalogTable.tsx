'use client';

import React from 'react';
import { Database, Trash2, Table as TableIcon, Calendar } from 'lucide-react';
import { Dataset } from '@/types';

interface DatasetCatalogTableProps {
  datasets: Dataset[];
  onDeleteDataset: (id: string) => void;
  onSelectForQuery: (datasetId: string) => void;
}

export const DatasetCatalogTable: React.FC<DatasetCatalogTableProps> = ({
  datasets,
  onDeleteDataset,
  onSelectForQuery,
}) => {
  if (datasets.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl">
        <Database className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-xs text-slate-400">No dataset files registered yet. Upload a CSV, XLSX, or PDF above.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden border border-slate-800 rounded-xl bg-slate-900/60 shadow-lg">
      <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <TableIcon className="w-4 h-4 text-indigo-400" />
          Registered Datasets ({datasets.length})
        </h4>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Filename</th>
              <th className="px-4 py-3">Postgres Table</th>
              <th className="px-4 py-3">Row Count</th>
              <th className="px-4 py-3">Created Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {datasets.map((ds) => (
              <tr key={ds.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate max-w-xs">{ds.originalFilename}</span>
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-indigo-300">{ds.tableName}</td>
                <td className="px-4 py-3 text-slate-300">{ds.rowCount} rows</td>
                <td className="px-4 py-3 text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  {new Date(ds.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => onSelectForQuery(ds.id)}
                    className="px-2.5 py-1 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded text-[11px] font-medium transition-colors"
                  >
                    Query
                  </button>
                  <button
                    onClick={() => onDeleteDataset(ds.id)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    title="Delete Dataset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

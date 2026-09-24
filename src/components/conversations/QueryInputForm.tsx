'use client';

import React, { useState, useRef } from 'react';
import { Send, Paperclip, Database, X, Loader2, Sparkles, CheckCircle2, Trash2 } from 'lucide-react';
import { Dataset } from '@/types';
import { useAuth } from '@/modules/auth/auth.context';
import { FrontendDatasetService } from '@/modules/datasets/dataset.service';

interface QueryInputFormProps {
  datasets: Dataset[];
  selectedDatasetId: string | undefined;
  onSelectDatasetId: (id: string | undefined) => void;
  onSubmitQuery: (query: string) => Promise<void>;
  isLoading: boolean;
  onDatasetUploaded?: (newDataset: Dataset) => void;
  onDeleteDataset?: (datasetId: string) => void;
}

export const QueryInputForm: React.FC<QueryInputFormProps> = ({
  datasets,
  selectedDatasetId,
  onSelectDatasetId,
  onSubmitQuery,
  isLoading,
  onDatasetUploaded,
  onDeleteDataset,
}) => {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showDatasetMenu, setShowDatasetMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const newDataset = await FrontendDatasetService.uploadDataset(token, file);
      if (onDatasetUploaded) {
        onDatasetUploaded(newDataset);
      }
      onSelectDatasetId(newDataset.id);
    } catch (err) {
      console.error('Failed to upload file:', err);
      setUploadError((err as Error).message || 'File upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (datasetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;

    setDeletingId(datasetId);
    try {
      await FrontendDatasetService.deleteDataset(token, datasetId);
      if (selectedDatasetId === datasetId) {
        onSelectDatasetId(undefined);
      }
      if (onDeleteDataset) {
        onDeleteDataset(datasetId);
      }
    } catch (err) {
      console.error('Failed to delete dataset:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading || isUploading) return;

    const currentQuery = query;
    setQuery('');
    await onSubmitQuery(currentQuery);
  };

  return (
    <div className="w-full space-y-2">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv,.xlsx,.xls,.pdf"
        className="hidden"
      />

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg flex items-center justify-between">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="text-rose-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Input Box (ChatGPT style with attached dataset pill) */}
      <form
        onSubmit={handleSubmit}
        className="relative bg-slate-900 border border-slate-800 focus-within:border-indigo-500/80 rounded-2xl p-3 shadow-xl transition-all"
      >
        {/* Attached Dataset Pill / Context Bar */}
        {(selectedDataset || isUploading) && (
          <div className="flex flex-wrap items-center gap-2 mb-2 pb-2 border-b border-slate-800/80">
            {isUploading ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-950/60 border border-indigo-500/30 rounded-lg text-xs text-indigo-300 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Uploading & Processing Dataset...</span>
              </div>
            ) : selectedDataset ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-950/80 border border-indigo-500/40 rounded-lg text-xs text-indigo-200">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-medium truncate max-w-[180px] sm:max-w-[280px]">
                  {selectedDataset.originalFilename}
                </span>
                <span className="text-[10px] text-indigo-400/80">({selectedDataset.rowCount} rows)</span>
                
                {/* Delete dataset icon */}
                <button
                  type="button"
                  onClick={(e) => handleDelete(selectedDataset.id, e)}
                  disabled={deletingId === selectedDataset.id}
                  className="ml-1 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Delete dataset permanently"
                >
                  {deletingId === selectedDataset.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Detach dataset icon */}
                <button
                  type="button"
                  onClick={() => onSelectDatasetId(undefined)}
                  className="text-slate-400 hover:text-white transition-colors border-l border-indigo-500/30 pl-1"
                  title="Detach dataset"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* Text Input Area */}
        <div className="flex items-center gap-2">
          {/* File Upload / Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isLoading}
            className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/80 rounded-xl transition-colors shrink-0 disabled:opacity-50"
            title="Upload CSV, XLSX, or PDF Dataset"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Quick Select Previously Uploaded Datasets */}
          {datasets.length > 0 && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowDatasetMenu(!showDatasetMenu)}
                className={`p-2 rounded-xl text-xs transition-colors flex items-center gap-1 ${
                  selectedDatasetId
                    ? 'text-indigo-400 bg-indigo-950/50 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
                title="Select from uploaded datasets"
              >
                <Database className="w-4 h-4" />
              </button>

              {/* Dataset Popover Menu */}
              {showDatasetMenu && (
                <div className="absolute left-0 bottom-12 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 flex items-center justify-between border-b border-slate-800">
                    <span>Attached Datasets</span>
                    <button onClick={() => setShowDatasetMenu(false)}>
                      <X className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectDatasetId(undefined);
                      setShowDatasetMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                      !selectedDatasetId
                        ? 'bg-indigo-600/20 text-indigo-300 font-medium'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span>General Mode (No Dataset)</span>
                    {!selectedDatasetId && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>

                  <div className="max-h-48 overflow-y-auto space-y-0.5 pt-1 border-t border-slate-800/60">
                    {datasets.map((ds) => (
                      <div
                        key={ds.id}
                        onClick={() => {
                          onSelectDatasetId(ds.id);
                          setShowDatasetMenu(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          selectedDatasetId === ds.id
                            ? 'bg-indigo-600/20 text-indigo-300 font-medium'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate max-w-[170px]">{ds.originalFilename}</span>
                        <div className="flex items-center gap-1">
                          {selectedDatasetId === ds.id && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDelete(ds.id, e)}
                            disabled={deletingId === ds.id}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                            title="Delete dataset"
                          >
                            {deletingId === ds.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Text Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              selectedDataset
                ? `Ask any data question about "${selectedDataset.originalFilename}"...`
                : 'Ask a question or click 📎 to attach a CSV/Excel dataset...'
            }
            disabled={isLoading || isUploading}
            className="flex-1 bg-transparent border-none text-sm text-slate-100 placeholder-slate-500 focus:outline-none py-1.5 px-1"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!query.trim() || isLoading || isUploading}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-all shadow-md shrink-0"
            title="Send Message"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>

      {/* Mode hint text below bar */}
      <div className="flex items-center justify-between px-2 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          {selectedDataset
            ? `SQL Analytics active on ${selectedDataset.originalFilename}`
            : 'General AI Analytics active'}
        </span>
        <span>Supports CSV, XLSX, XLS, PDF</span>
      </div>
    </div>
  );
};

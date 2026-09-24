'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Dataset } from '@/types';
import { useAuth } from '@/modules/auth/auth.context';
import { FrontendDatasetService } from '@/modules/datasets/dataset.service';

interface DatasetUploaderProps {
  onUploadSuccess: (dataset: Dataset) => void;
}

export const DatasetUploader: React.FC<DatasetUploaderProps> = ({ onUploadSuccess }) => {
  const { token } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!token) return;
    setError(null);
    setSuccessMessage(null);

    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.csv') && !ext.endsWith('.xlsx') && !ext.endsWith('.xls') && !ext.endsWith('.pdf')) {
      setError('Supported formats: CSV (.csv), Excel (.xlsx, .xls), and PDF (.pdf).');
      return;
    }

    setIsUploading(true);
    try {
      const dataset = await FrontendDatasetService.uploadDataset(token, file);
      setSuccessMessage(`Successfully uploaded and converted "${dataset.originalFilename}" (${dataset.rowCount} rows processed).`);
      onUploadSuccess(dataset);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-950/20'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
          accept=".csv,.xlsx,.xls,.pdf"
          className="hidden"
        />

        <div className="flex justify-center gap-3 mb-3 text-slate-400">
          <UploadCloud className="w-8 h-8 text-indigo-400" />
          <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
          <FileText className="w-8 h-8 text-amber-400" />
        </div>

        <h3 className="text-sm font-semibold text-slate-200">
          {isUploading ? 'Converting & Processing File...' : 'Upload Dataset (CSV, XLSX, PDF)'}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Drag and drop your spreadsheet or document here, or click to browse files
        </p>

        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-slate-800/80 rounded-full text-[11px] text-slate-400">
          <span>Automatic conversion to plain CSV and PostgreSQL tables</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg flex items-center gap-2 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-lg flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
};

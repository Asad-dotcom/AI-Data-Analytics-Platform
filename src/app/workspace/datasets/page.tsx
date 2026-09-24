'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/modules/auth/auth.context';
import { Dataset } from '@/types';
import { FrontendDatasetService } from '@/modules/datasets/dataset.service';
import { FrontendConversationService } from '@/modules/conversations/conversation.service';
import { DatasetUploader } from '@/components/datasets/DatasetUploader';
import { DatasetCatalogTable } from '@/components/datasets/DatasetCatalogTable';
import { Database } from 'lucide-react';

export default function DatasetsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDatasets = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const list = await FrontendDatasetService.listDatasets(token);
      setDatasets(list);
    } catch (e) {
      console.error('Failed to load datasets:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, [token]);

  const handleUploadSuccess = (newDataset: Dataset) => {
    setDatasets((prev) => [newDataset, ...prev]);
  };

  const handleDeleteDataset = async (datasetId: string) => {
    if (!token) return;
    try {
      await FrontendDatasetService.deleteDataset(token, datasetId);
      setDatasets((prev) => prev.filter((d) => d.id !== datasetId));
    } catch (e) {
      console.error('Failed to delete dataset:', e);
    }
  };

  const handleSelectForQuery = async (datasetId: string) => {
    if (!token) return;
    const targetDataset = datasets.find((d) => d.id === datasetId);
    try {
      const conv = await FrontendConversationService.createConversation(
        token,
        `Analytics: ${targetDataset?.originalFilename || 'Dataset'}`
      );
      router.push(`/workspace/conversations/${conv.id}`);
    } catch (e) {
      console.error('Failed to initialize session:', e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8 py-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Database className="w-6 h-6 text-indigo-400" />
          Dataset Management Catalog
        </h2>
        <p className="text-xs text-slate-400">
          Upload spreadsheets or PDF files to automatically convert them into plain CSV and queryable PostgreSQL database tables.
        </p>
      </div>

      <DatasetUploader onUploadSuccess={handleUploadSuccess} />

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-500">Loading datasets catalog...</div>
      ) : (
        <DatasetCatalogTable
          datasets={datasets}
          onDeleteDataset={handleDeleteDataset}
          onSelectForQuery={handleSelectForQuery}
        />
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/modules/auth/auth.context';
import { Dataset } from '@/types';
import { FrontendDatasetService } from '@/modules/datasets/dataset.service';
import { FrontendConversationService } from '@/modules/conversations/conversation.service';
import { QueryInputForm } from '@/components/conversations/QueryInputForm';
import { Database, Sparkles, LineChart } from 'lucide-react';

export default function WorkspaceHomePage() {
  const { token } = useAuth();
  const router = useRouter();

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    FrontendDatasetService.listDatasets(token)
      .then(setDatasets)
      .catch((e) => console.error('Failed to load datasets:', e));
  }, [token]);

  const handleDatasetUploaded = (newDs: Dataset) => {
    setDatasets((prev) => [newDs, ...prev]);
  };

  const handleDeleteDataset = (datasetId: string) => {
    setDatasets((prev) => prev.filter((d) => d.id !== datasetId));
  };

  const handleSubmitQuery = async (queryText: string) => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      // 1. Create a new conversation session
      const conversation = await FrontendConversationService.createConversation(
        token,
        queryText.slice(0, 30) + '...'
      );

      // 2. Submit the initial query (Dataset Selected or No Dataset)
      await FrontendConversationService.askQuestion(
        token,
        conversation.id,
        queryText,
        selectedDatasetId
      );

      // 3. Navigate to conversation page for results & follow-up chat
      router.push(`/workspace/conversations/${conversation.id}`);
    } catch (e) {
      console.error('Failed to execute query:', e);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-center space-y-8 py-12">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-950/40 border border-indigo-500/30 rounded-full text-xs text-indigo-400 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>AI Data Analytics Workspace</span>
        </div>

        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          What data insights are you looking for today?
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Attach a CSV/Excel dataset using 📎 to run SQL Analytics, or ask any general data question for instant charts and insights.
        </p>
      </div>

      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-2xl space-y-4">
        <QueryInputForm
          datasets={datasets}
          selectedDatasetId={selectedDatasetId}
          onSelectDatasetId={setSelectedDatasetId}
          onSubmitQuery={handleSubmitQuery}
          isLoading={isSubmitting}
          onDatasetUploaded={handleDatasetUploaded}
          onDeleteDataset={handleDeleteDataset}
        />
      </div>

      {/* Suggested Prompts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        <button
          onClick={() =>
            handleSubmitQuery('What are the top 5 global tech companies by revenue growth in 2026?')
          }
          className="p-4 bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 rounded-xl text-left transition-colors space-y-1"
        >
          <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
            <LineChart className="w-3.5 h-3.5" />
            General AI Query
          </div>
          <div className="text-xs text-slate-300">
            &quot;What are the top 5 global tech companies by revenue growth in 2026?&quot;
          </div>
        </button>

        <button
          onClick={() =>
            handleSubmitQuery('Which region has the highest number of active customers?')
          }
          className="p-4 bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 rounded-xl text-left transition-colors space-y-1"
        >
          <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" />
            Dataset Analytics Query
          </div>
          <div className="text-xs text-slate-300">
            &quot;Which region has the highest number of active customers?&quot;
          </div>
        </button>
      </div>
    </div>
  );
}

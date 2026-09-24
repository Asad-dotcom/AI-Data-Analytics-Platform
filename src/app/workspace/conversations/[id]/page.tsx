'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useAuth } from '@/modules/auth/auth.context';
import { Dataset, Message } from '@/types';
import { FrontendDatasetService } from '@/modules/datasets/dataset.service';
import { FrontendConversationService } from '@/modules/conversations/conversation.service';
import { AiResultView } from '@/components/analytics/AiResultView';
import { QueryInputForm } from '@/components/conversations/QueryInputForm';
import { MessageSquare, Sparkles } from 'lucide-react';

export default function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: conversationId } = use(params);
  const { token } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!token || !conversationId) return;

    setIsLoading(true);
    Promise.all([
      FrontendConversationService.getMessages(token, conversationId),
      FrontendDatasetService.listDatasets(token),
    ])
      .then(([fetchedMessages, fetchedDatasets]) => {
        setMessages(fetchedMessages);
        setDatasets(fetchedDatasets);
      })
      .catch((e) => console.error('Failed to load conversation details:', e))
      .finally(() => setIsLoading(false));
  }, [token, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleDatasetUploaded = (newDs: Dataset) => {
    setDatasets((prev) => [newDs, ...prev]);
  };

  const handleDeleteDataset = (datasetId: string) => {
    setDatasets((prev) => prev.filter((d) => d.id !== datasetId));
  };

  const handleFollowUpQuery = async (queryText: string) => {
    if (!token || !conversationId) return;

    // Optimistic user message append
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId,
      role: 'user',
      content: queryText,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);
    setIsSubmitting(true);

    try {
      const replyMessage = await FrontendConversationService.askQuestion(
        token,
        conversationId,
        queryText,
        selectedDatasetId
      );

      setMessages((prev) => [...prev, replyMessage]);
    } catch (e) {
      console.error('Failed to process follow-up question:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col h-full space-y-4">
      {/* Conversation Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span>Analytics Session #{conversationId.slice(0, 8)}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Interactive Chat & Recharts</span>
        </div>
      </div>

      {/* Messages Timeline */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No messages in this session. Ask a question below.</div>
        ) : (
          messages.map((msg) => <AiResultView key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Follow-up Query Input Bar */}
      <div className="pt-2 sticky bottom-0 bg-slate-950 p-4 border-t border-slate-800/80 rounded-xl">
        <QueryInputForm
          datasets={datasets}
          selectedDatasetId={selectedDatasetId}
          onSelectDatasetId={setSelectedDatasetId}
          onSubmitQuery={handleFollowUpQuery}
          isLoading={isSubmitting}
          onDatasetUploaded={handleDatasetUploaded}
          onDeleteDataset={handleDeleteDataset}
        />
      </div>
    </div>
  );
}

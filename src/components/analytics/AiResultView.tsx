'use client';

import React from 'react';
import { ChartConfig, Message } from '@/types';
import { DynamicChartRenderer } from './DynamicChartRenderer';
import { SqlQueryView } from './SqlQueryView';
import { Bot, User as UserIcon, Sparkles } from 'lucide-react';

interface AiResultViewProps {
  message: Message;
}

export const AiResultView: React.FC<AiResultViewProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const chartConfig = message.chartConfig as ChartConfig | null;
  const rows = Array.isArray(message.sqlResult)
    ? (message.sqlResult as Record<string, unknown>[])
    : [];

  const hasChart = !isUser && chartConfig && rows.length > 0;

  return (
    <div
      className={`flex gap-4 p-5 rounded-2xl border transition-all ${
        isUser
          ? 'bg-slate-900/60 border-slate-800 text-slate-100 ml-auto max-w-2xl shadow-md'
          : 'bg-slate-950 border-slate-800/80 text-slate-200 w-full shadow-xl'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
          isUser
            ? 'bg-indigo-600 text-white'
            : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
        }`}
      >
        {isUser ? <UserIcon className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      <div className="flex-1 space-y-4 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-300">
            {isUser ? 'You' : 'AI Data Analytics Assistant'}
            {!isUser && <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
          </span>
          <span className="text-[11px] text-slate-500">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* 1. VISUAL CHART RENDERING FIRST (Front and Center) */}
        {hasChart && (
          <div className="w-full">
            <DynamicChartRenderer chartConfig={chartConfig} data={rows} />
          </div>
        )}

        {/* 2. Textual Narrative Content (Concise & Clean Markdown) */}
        <div className="prose prose-invert max-w-none text-sm text-slate-300 leading-relaxed space-y-2">
          {message.content.split('\n').map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={idx} className="h-2" />;
            if (trimmed.startsWith('###')) {
              return (
                <h4 key={idx} className="text-sm font-bold text-indigo-300 mt-4 mb-1 tracking-wide">
                  {trimmed.replace(/^###\s*/, '')}
                </h4>
              );
            }
            if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
              return (
                <li key={idx} className="ml-4 list-disc text-slate-300">
                  {trimmed.replace(/^[-*]\s*/, '')}
                </li>
              );
            }
            return <p key={idx} className="my-1">{trimmed}</p>;
          })}
        </div>

        {/* 3. SQL Query and Raw Data Table Output (Collapsible/Technical View) */}
        {!isUser && message.sqlQuery && (
          <div className="pt-2 border-t border-slate-900">
            <SqlQueryView sqlQuery={message.sqlQuery} sqlResult={message.sqlResult} />
          </div>
        )}
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Plus } from 'lucide-react';
import { Conversation } from '@/types';

interface ChatHistoryListProps {
  conversations: Conversation[];
  onNewChat: () => void;
}

export const ChatHistoryList: React.FC<ChatHistoryListProps> = ({
  conversations,
  onNewChat,
}) => {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full space-y-4">
      <button
        onClick={onNewChat}
        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md"
      >
        <Plus className="w-4 h-4" />
        New Query Session
      </button>

      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">
          Chat History
        </div>

        {conversations.length === 0 ? (
          <p className="text-xs text-slate-500 px-2 py-4 italic text-center">
            No query conversations yet.
          </p>
        ) : (
          conversations.map((conv) => {
            const isActive = pathname === `/workspace/conversations/${conv.id}`;
            return (
              <Link
                key={conv.id}
                href={`/workspace/conversations/${conv.id}`}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                <span className="truncate flex-1">{conv.title || 'Untitled Session'}</span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

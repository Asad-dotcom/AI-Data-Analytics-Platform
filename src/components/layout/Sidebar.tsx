'use client';

import React from 'react';
import { Conversation } from '@/types';
import { ChatHistoryList } from '../conversations/ChatHistoryList';
import { Sparkles } from 'lucide-react';

interface SidebarProps {
  conversations: Conversation[];
  onNewChat: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ conversations, onNewChat }) => {
  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col h-[calc(100vh-3.5rem)] shrink-0">
      {/* Conversations History List (ChatGPT style) */}
      <div className="flex-1 p-3 overflow-hidden">
        <ChatHistoryList conversations={conversations} onNewChat={onNewChat} />
      </div>

      {/* Footer info */}
      <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5">
        <Sparkles className="w-3 h-3 text-indigo-400" />
        <span>AI Data Engine v1.0</span>
      </div>
    </aside>
  );
};

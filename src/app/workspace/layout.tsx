'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/modules/auth/auth.context';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Conversation } from '@/types';
import { FrontendConversationService } from '@/modules/conversations/conversation.service';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const loadConversations = useCallback(async () => {
    if (!token) {
      setConversations([]);
      return;
    }
    try {
      const list = await FrontendConversationService.listConversations(token);
      setConversations(list);
    } catch (e) {
      console.error('Failed to load user conversations:', e);
      setConversations([]);
    }
  }, [token]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setConversations([]);
      router.push('/login');
    } else if (isAuthenticated && token && user) {
      loadConversations();
    }
  }, [isAuthenticated, isLoading, token, user, router, loadConversations]);

  const handleNewChat = async () => {
    if (!token) return;
    try {
      const newConv = await FrontendConversationService.createConversation(token);
      setConversations((prev) => [newConv, ...prev]);
      router.push(`/workspace/conversations/${newConv.id}`);
    } catch (e) {
      console.error('Failed to initialize new conversation session:', e);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Loading AI Workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar conversations={conversations} onNewChat={handleNewChat} />
        <main className="flex-1 overflow-y-auto bg-slate-950/50 p-6 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}

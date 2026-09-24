'use client';

import React from 'react';
import { useAuth } from '@/modules/auth/auth.context';
import { LogOut, User as UserIcon, Sparkles } from 'lucide-react';
import Link from 'next/link';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Link href="/workspace" className="flex items-center gap-2 font-bold text-white tracking-tight">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <span>AI DATA ANALYTICS</span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>{user.email}</span>
          </div>
        )}

        <button
          onClick={logout}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Log Out
        </button>
      </div>
    </header>
  );
};

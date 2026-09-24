'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '@/modules/auth/auth.context';

export const LandingNavbar: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <nav className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-40">
      <Link href="/" className="flex items-center gap-2.5 font-bold text-white tracking-tight">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
          <Sparkles className="w-4 h-4" />
        </div>
        <span className="text-lg">AI DATA ANALYTICS</span>
      </Link>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <Link
            href="/workspace"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20"
          >
            Go to Workspace
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

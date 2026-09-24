'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Database, BarChart3, Bot } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="py-24 px-6 text-center max-w-5xl mx-auto space-y-8">
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-950/30 text-indigo-400 text-xs font-medium">
        <Bot className="w-3.5 h-3.5" />
        <span>Next-Gen Autonomous AI Data Analytics & Visualization Engine</span>
      </div>

      <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
        Transform Raw Data Into <br />
        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Actionable Insights & Interactive Recharts
        </span>
      </h1>

      <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
        Upload CSV, Excel, or PDF files. Our AI automatically builds PostgreSQL database schemas, executes secure read-only SQL queries, and generates rich, detailed analytical reports alongside interactive Recharts graphs.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link
          href="/register"
          className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-600/25"
        >
          Open App Workspace
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/login"
          className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold text-sm rounded-xl transition-all"
        >
          Log In to Account
        </Link>
      </div>

      {/* Feature Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 text-left">
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
          <Database className="w-6 h-6 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Multi-Format Data Loader</h3>
          <p className="text-xs text-slate-400">Support for CSV, XLSX, and PDF documents with instant PostgreSQL table creation.</p>
        </div>

        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
          <Bot className="w-6 h-6 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Dual AI Reasoning</h3>
          <p className="text-xs text-slate-400">Dataset Mode (SQL execution) & General AI Mode powered by Gemini 2.5.</p>
        </div>

        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
          <BarChart3 className="w-6 h-6 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Dynamic Recharts</h3>
          <p className="text-xs text-slate-400">Automatic generation of Bar, Line, Area, and Pie charts tailored to metrics.</p>
        </div>
      </div>
    </section>
  );
};

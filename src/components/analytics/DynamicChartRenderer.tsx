'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from 'recharts';
import { ChartConfig } from '@/types';
import { BarChart3, TrendingUp, PieChart as PieIcon, Trophy, Sparkles, LayoutGrid } from 'lucide-react';

interface DynamicChartRendererProps {
  chartConfig: ChartConfig;
  data: Record<string, unknown>[];
}

const CINEMATIC_PALETTE = [
  '#6366f1', // Neon Indigo
  '#10b981', // Neon Emerald
  '#f59e0b', // Neon Amber
  '#ec4899', // Neon Rose
  '#0ea5e9', // Neon Cyan
  '#8b5cf6', // Violet
  '#f97316', // Orange
  '#14b8a6', // Teal
];

export const DynamicChartRenderer: React.FC<DynamicChartRendererProps> = ({
  chartConfig,
  data,
}) => {
  if (!data || data.length === 0) {
    return null;
  }

  const sampleRow = data[0] || {};
  const dataKeys = Object.keys(sampleRow);

  if (dataKeys.length === 0) return null;

  // 1. Key Resolution (Matches keys case-insensitively)
  const findMatchingKey = (target: string): string => {
    if (target in sampleRow) return target;
    const lower = target.toLowerCase();
    const found = dataKeys.find((k) => k.toLowerCase() === lower);
    return found || dataKeys[0];
  };

  const resolvedXKey = chartConfig?.xKey
    ? findMatchingKey(chartConfig.xKey)
    : dataKeys.find((k) => typeof sampleRow[k] === 'string') || dataKeys[0];

  let resolvedYKeys: string[] = [];
  if (chartConfig?.yKeys && Array.isArray(chartConfig.yKeys) && chartConfig.yKeys.length > 0) {
    resolvedYKeys = chartConfig.yKeys.map((k) => findMatchingKey(k));
  } else {
    resolvedYKeys = dataKeys.filter(
      (k) => k !== resolvedXKey && typeof sampleRow[k] === 'number'
    );
    if (resolvedYKeys.length === 0 && dataKeys.length > 1) {
      resolvedYKeys = [dataKeys[1]];
    }
  }

  // 2. Data Sanitization & Calculations
  const primaryYKey = resolvedYKeys[0] || dataKeys[1];

  const sanitizedData = data.map((row) => {
    const newRow: Record<string, unknown> = { ...row };
    resolvedYKeys.forEach((key) => {
      const val = row[key];
      if (typeof val === 'string') {
        const parsed = parseFloat(val.replace(/[^0-9.-]+/g, ''));
        newRow[key] = isNaN(parsed) ? 0 : parsed;
      } else if (typeof val !== 'number') {
        newRow[key] = 0;
      }
    });
    return newRow;
  });

  // Calculate Max Value for Graphic Progress Bars
  const maxVal = Math.max(
    ...sanitizedData.map((d) => (typeof d[primaryYKey] === 'number' ? (d[primaryYKey] as number) : 0)),
    1
  );

  // Find Top Performer Item
  const topPerformer = [...sanitizedData].sort((a, b) => {
    const valA = (a[primaryYKey] as number) || 0;
    const valB = (b[primaryYKey] as number) || 0;
    return valB - valA;
  })[0];

  const initialChartType = (chartConfig?.type || 'bar').toLowerCase();
  const [activeTab, setActiveTab] = useState<string>(initialChartType);

  const title = chartConfig?.title || 'Data Analytics Visual';
  const description = chartConfig?.description || 'Cinematic graphic summary of metrics';
  const colors = chartConfig?.colors && chartConfig.colors.length > 0 ? chartConfig.colors : CINEMATIC_PALETTE;

  const renderChartContent = () => {
    switch (activeTab) {
      case 'line':
        return (
          <LineChart data={sanitizedData} margin={{ top: 25, right: 30, left: 10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey={resolvedXKey} stroke="#94a3b8" tick={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 500 }} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#e2e8f0', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '14px',
                color: '#f8fafc',
                boxShadow: '0 10px 30px -5px rgba(0,0,0,0.8)',
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '12px' }} />
            {resolvedYKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[i % colors.length]}
                strokeWidth={3.5}
                dot={{ fill: colors[i % colors.length], r: 6, strokeWidth: 2, stroke: '#0f172a' }}
                activeDot={{ r: 9, stroke: '#ffffff', strokeWidth: 3 }}
              >
                <LabelList dataKey={key} position="top" fill="#f8fafc" fontSize={12} fontWeight={700} offset={10} />
              </Line>
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={sanitizedData} margin={{ top: 25, right: 30, left: 10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey={resolvedXKey} stroke="#94a3b8" tick={{ fill: '#e2e8f0', fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#e2e8f0', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '14px',
                color: '#f8fafc',
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '12px' }} />
            {resolvedYKeys.map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                fill={colors[i % colors.length]}
                stroke={colors[i % colors.length]}
                fillOpacity={0.4}
                strokeWidth={3}
              >
                <LabelList dataKey={key} position="top" fill="#f8fafc" fontSize={12} fontWeight={700} offset={8} />
              </Area>
            ))}
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '14px',
                color: '#f8fafc',
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Pie
              data={sanitizedData}
              dataKey={primaryYKey}
              nameKey={resolvedXKey}
              cx="50%"
              cy="50%"
              outerRadius={110}
              innerRadius={55}
              paddingAngle={5}
              label={({ name, value }) => `${name}: ${value}`}
            >
              {sanitizedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="#0f172a" strokeWidth={3} />
              ))}
            </Pie>
          </PieChart>
        );

      case 'cards':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2">
            {sanitizedData.map((item, idx) => {
              const category = String(item[resolvedXKey] || `Item #${idx + 1}`);
              const val = (item[primaryYKey] as number) || 0;
              const percent = Math.min(Math.round((val / maxVal) * 100), 100);
              const cardColor = colors[idx % colors.length];

              return (
                <div
                  key={idx}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden shadow-lg group hover:border-slate-700 transition-all"
                >
                  <div
                    className="absolute top-0 left-0 h-1 w-full"
                    style={{ backgroundColor: cardColor }}
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-md text-[11px] font-extrabold flex items-center justify-center text-white"
                        style={{ backgroundColor: cardColor }}
                      >
                        0{idx + 1}
                      </span>
                      <span className="text-sm font-bold text-slate-100">{category}</span>
                    </div>
                    {idx === 0 && (
                      <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded-full flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> Top Rank
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-white tracking-tight">{val.toLocaleString()}</span>
                    <span className="text-xs font-semibold text-slate-400">{primaryYKey}</span>
                  </div>

                  {/* Graphic Visual Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${percent}%`, backgroundColor: cardColor }}
                      />
                    </div>
                    <div className="flex justify-end text-[10px] font-semibold text-slate-400">
                      <span>{percent}% of peak</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'bar':
      default:
        return (
          <BarChart data={sanitizedData} margin={{ top: 25, right: 30, left: 10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis
              dataKey={resolvedXKey}
              stroke="#94a3b8"
              tick={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 600 }}
              interval={0}
            />
            <YAxis stroke="#94a3b8" tick={{ fill: '#e2e8f0', fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '14px',
                color: '#f8fafc',
                boxShadow: '0 10px 30px -5px rgba(0,0,0,0.8)',
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '12px' }} />
            {resolvedYKeys.map((key, i) => (
              <Bar key={key} dataKey={key} radius={[8, 8, 0, 0]} maxBarSize={65}>
                {sanitizedData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[(index + i) % colors.length]} />
                ))}
                <LabelList dataKey={key} position="top" fill="#f8fafc" fontSize={12} fontWeight={700} offset={8} />
              </Bar>
            ))}
          </BarChart>
        );
    }
  };

  return (
    <div className="w-full bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 my-2">
      {/* Top Hero Graphic Metric Card */}
      {topPerformer && (
        <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Top Performer</div>
              <div className="text-base font-extrabold text-white">
                {String(topPerformer[resolvedXKey])}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-black text-indigo-300">
              {Number(topPerformer[primaryYKey]).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 capitalize">{primaryYKey}</div>
          </div>
        </div>
      )}

      {/* Header & Graphic Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            {title}
          </h3>
          {description && <p className="text-xs text-slate-400">{description}</p>}
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-xl space-x-1">
          <button
            onClick={() => setActiveTab('bar')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'bar' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Bar</span>
          </button>
          <button
            onClick={() => setActiveTab('area')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'area' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Trend</span>
          </button>
          <button
            onClick={() => setActiveTab('pie')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'pie' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Donut</span>
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'cards' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Graphic</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas or Graphic Cards */}
      <div className="w-full min-h-[22rem]">
        {activeTab === 'cards' ? (
          renderChartContent()
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            {renderChartContent()!}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

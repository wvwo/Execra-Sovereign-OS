import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AnalyticsData } from '../types';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Activity, TrendingUp, Clock, CheckCircle2, Zap, Database,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const ACCENT = '#00e5a0';
const PURPLE = '#7c3aed';
const RED = '#ef4444';
const AMBER = '#f59e0b';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="text-center py-20 text-slate-500">Failed to load analytics.</div>
  );

  const runsChange = data.totalRunsPrev > 0
    ? Math.round(((data.totalRuns - data.totalRunsPrev) / data.totalRunsPrev) * 100)
    : 0;

  const kpis = [
    {
      label: 'Total Runs (30d)',
      value: data.totalRuns.toLocaleString(),
      change: runsChange,
      icon: Activity,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
    },
    {
      label: 'Success Rate',
      value: `${data.successRate}%`,
      change: 0,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
    {
      label: 'Hours Saved',
      value: data.hoursSaved.toLocaleString(),
      change: 0,
      icon: Clock,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Active Workflows',
      value: data.activeWorkflows.toString(),
      change: 0,
      icon: Zap,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      label: 'Records Processed',
      value: data.recordsProcessed.toLocaleString(),
      change: 0,
      icon: Database,
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
    },
    {
      label: 'Uptime',
      value: '99.9%',
      change: 0,
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
    },
  ];

  const pieData = [
    { name: 'Success', value: data.successRate, color: ACCENT },
    { name: 'Failed', value: 100 - data.successRate, color: RED },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Analytics</h1>
        <p className="text-slate-500 mt-1">Performance insights across all your automations</p>
      </div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-slate-900/40 border border-white/5 rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center mb-3`}>
              <kpi.icon className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{kpi.label}</p>
            <p className="text-2xl font-black text-white mt-1">{kpi.value}</p>
            {kpi.change !== 0 && (
              <div className={`flex items-center gap-1 mt-1 text-xs font-bold ${kpi.change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {kpi.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(kpi.change)}% vs last month
              </div>
            )}
          </div>
        ))}
      </motion.div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Daily runs bar chart */}
        <div className="xl:col-span-2 bg-slate-900/40 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Daily Runs — Last 30 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.dailyRuns} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="success" name="Success" fill={ACCENT} radius={[4, 4, 0, 0]} />
              <Bar dataKey="failed" name="Failed" fill={RED} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Success donut */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 flex flex-col">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Success vs Failure</h3>
          <div className="flex-1 flex items-center justify-center">
            <div className="relative">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-black text-white">{data.successRate}%</span>
                <span className="text-xs text-slate-500">success</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                <span className="text-xs text-slate-400">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Cumulative hours saved */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Cumulative Hours Saved</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={data.dailyRuns.map((d, i) => ({
                date: d.date,
                hours: Math.round((data.dailyRuns.slice(0, i + 1).reduce((s, r) => s + r.runs, 0) * 5) / 60),
              }))}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }} labelStyle={{ color: '#94a3b8' }} />
              <Line type="monotone" dataKey="hours" stroke={PURPLE} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top workflows table */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Top Workflows by Usage</h3>
          {data.topWorkflows.length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-8">No workflow data yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topWorkflows.map((wf, i) => (
                <div key={wf.id} className="flex items-center gap-4">
                  <span className="text-xs font-black text-slate-600 w-5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{wf.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${wf.successRate}%`, background: ACCENT }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{wf.successRate}%</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-400">{wf.runCount} runs</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

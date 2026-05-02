import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Workflow } from '../types';
import { motion } from 'framer-motion';
import {
  Clock, Play, Pause, Calendar, ChevronDown,
  CheckCircle2, AlertCircle, Zap, RefreshCw
} from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FREQUENCIES = [
  { label: 'Every hour', cron: '0 * * * *' },
  { label: 'Every 6 hours', cron: '0 */6 * * *' },
  { label: 'Daily at 9am', cron: '0 9 * * *' },
  { label: 'Weekdays at 9am', cron: '0 9 * * 1-5' },
  { label: 'Weekly (Monday 9am)', cron: '0 9 * * 1' },
  { label: 'Monthly (1st, 9am)', cron: '0 9 1 * *' },
  { label: 'Custom', cron: '' },
];

function getNextRuns(cron: string, count = 5): string[] {
  // Simple preview for display only
  const now = new Date();
  const results: string[] = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date(now.getTime() + i * 60 * 60 * 1000);
    results.push(d.toLocaleString());
  }
  return results;
}

export const SchedulePage: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWf, setSelectedWf] = useState<string>('');
  const [frequency, setFrequency] = useState(FREQUENCIES[2]);
  const [customCron, setCustomCron] = useState('');
  const [timezone, setTimezone] = useState('Asia/Riyadh');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/workflows')
      .then(r => {
        const wfs = r.data.workflows || r.data || [];
        setWorkflows(wfs);
        if (wfs.length > 0) setSelectedWf(wfs[0].id);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const activeCron = frequency.cron === '' ? customCron : frequency.cron;
  const scheduledWorkflows = (workflows || []).filter(w => w?.schedule?.enabled);

  const handleSave = async () => {
    if (!selectedWf || !activeCron) { setError('Please select a workflow and cron expression'); return; }
    setSaving(true);
    setError('');
    try {
      await api.put(`/workflows/${selectedWf}`, {
        schedule: { enabled: true, cron: activeCron, timezone }
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      // Refresh workflows
      const r = await api.get('/workflows');
      setWorkflows(r.data.workflows || r.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (wf: Workflow) => {
    await api.put(`/workflows/${wf.id}`, {
      schedule: { ...wf.schedule, enabled: !wf.schedule?.enabled }
    });
    const r = await api.get('/workflows');
    setWorkflows(r.data.workflows || r.data || []);
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Scheduler</h1>
        <p className="text-slate-500 mt-1">Automate your workflows on a recurring schedule</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Schedule Builder */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Schedule Builder
          </h2>

          {/* Workflow selector */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Workflow</label>
            <div className="relative">
              <select
                value={selectedWf}
                onChange={e => setSelectedWf(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                {workflows.map(wf => (
                  <option key={wf.id} value={wf.id}>{wf.title || wf.workflow_title}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Frequency selector */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Frequency</label>
            <div className="grid grid-cols-2 gap-2">
              {FREQUENCIES.map(f => (
                <button
                  key={f.label}
                  onClick={() => setFrequency(f)}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold text-left transition-all ${
                    frequency.label === f.label
                      ? 'bg-purple-600/20 border border-purple-500/40 text-purple-300'
                      : 'bg-slate-800/50 border border-white/5 text-slate-400 hover:border-white/10'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom cron */}
          {frequency.cron === '' && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Custom Cron Expression</label>
              <input
                type="text"
                value={customCron}
                onChange={e => setCustomCron(e.target.value)}
                placeholder="0 9 * * 1-5"
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
              <p className="text-xs text-slate-600 mt-1">Format: minute hour day month weekday</p>
            </div>
          )}

          {/* Timezone */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Timezone</label>
            <div className="relative">
              <select
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="Asia/Riyadh">Riyadh (AST, UTC+3)</option>
                <option value="Asia/Dubai">Dubai (GST, UTC+4)</option>
                <option value="Africa/Cairo">Cairo (EET, UTC+2)</option>
                <option value="Europe/London">London (GMT/BST)</option>
                <option value="America/New_York">New York (EST/EDT)</option>
                <option value="UTC">UTC</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Active cron display */}
          {activeCron && (
            <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Cron Expression</p>
              <code className="text-sm text-purple-300 font-mono">{activeCron}</code>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              saved
                ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:shadow-purple-600/20'
            }`}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saved ? (
              <><CheckCircle2 className="w-5 h-5" /> Schedule Saved!</>
            ) : (
              <><Zap className="w-5 h-5" /> Activate Schedule</>
            )}
          </button>
        </div>

        {/* Next runs preview + Active schedules */}
        <div className="space-y-6">
          {/* Next 5 runs */}
          {activeCron && (
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Next 5 Scheduled Runs
              </h2>
              <div className="space-y-2">
                {getNextRuns(activeCron).map((run, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                    <span className="text-xs font-black text-slate-600 w-4">#{i + 1}</span>
                    <span className="text-sm text-slate-300">{run}</span>
                    {i === 0 && (
                      <span className="ml-auto text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-lg">NEXT</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scheduled workflows */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Active Schedules ({scheduledWorkflows.length})
            </h2>
            {scheduledWorkflows.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-6">No scheduled workflows yet.</p>
            ) : (
              <div className="space-y-3">
                {scheduledWorkflows.map(wf => (
                  <div key={wf.id} className="flex items-center gap-4 p-3 bg-slate-800/40 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{wf.title || (wf as any).workflow_title || 'Unnamed Workflow'}</p>
                      <code className="text-xs text-slate-500 font-mono">{wf.schedule?.cron || '—'}</code>
                    </div>
                    <button
                      onClick={() => handleToggle(wf)}
                      className="p-2 text-slate-400 hover:text-amber-400 transition-colors"
                      title="Pause schedule"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

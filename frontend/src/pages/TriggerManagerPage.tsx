import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, Webhook, Mail, FolderOpen, Plus, Power, Trash2, X, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

type TriggerType = 'MANUAL' | 'SCHEDULE' | 'WEBHOOK' | 'EMAIL' | 'FILE_WATCH';

interface Trigger {
  id: string;
  workflowId: string;
  type: TriggerType;
  config: Record<string, unknown>;
  isActive: boolean;
  lastFired?: string;
  fireCount: number;
  createdAt: string;
}

const TRIGGER_ICONS: Record<TriggerType, React.ElementType> = {
  MANUAL: Zap,
  SCHEDULE: Clock,
  WEBHOOK: Webhook,
  EMAIL: Mail,
  FILE_WATCH: FolderOpen,
};

const TRIGGER_COLORS: Record<TriggerType, string> = {
  MANUAL: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  SCHEDULE: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  WEBHOOK: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  EMAIL: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  FILE_WATCH: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
};

const TRIGGER_LABELS: Record<TriggerType, string> = {
  MANUAL: 'Manual',
  SCHEDULE: 'Schedule (Cron)',
  WEBHOOK: 'Webhook',
  EMAIL: 'Email Trigger',
  FILE_WATCH: 'File Watch',
};

const DEMO_TRIGGERS: Trigger[] = [
  { id: '1', workflowId: 'wf1', type: 'SCHEDULE', config: { cron: '0 9 * * *' }, isActive: true, lastFired: new Date(Date.now() - 3600000).toISOString(), fireCount: 14, createdAt: new Date().toISOString() },
  { id: '2', workflowId: 'wf2', type: 'WEBHOOK', config: { path: '/hooks/invoice' }, isActive: true, lastFired: new Date(Date.now() - 7200000).toISOString(), fireCount: 7, createdAt: new Date().toISOString() },
  { id: '3', workflowId: 'wf1', type: 'EMAIL', config: { subject: 'Daily Report' }, isActive: false, fireCount: 0, createdAt: new Date().toISOString() },
];

export const TriggerManagerPage: React.FC = () => {
  const [triggers, setTriggers] = useState<Trigger[]>(DEMO_TRIGGERS);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState<TriggerType>('SCHEDULE');
  const [configValue, setConfigValue] = useState('');

  const toggleTrigger = async (id: string) => {
    setTriggers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t))
    );
    try {
      await api.patch(`/triggers/${id}/toggle`);
    } catch { /* optimistic update */ }
  };

  const deleteTrigger = async (id: string) => {
    setTriggers((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.delete(`/triggers/${id}`);
    } catch { /* optimistic update */ }
  };

  const fireTrigger = async (id: string) => {
    try {
      await api.post(`/triggers/${id}/fire`);
      setTriggers((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, lastFired: new Date().toISOString(), fireCount: t.fireCount + 1 } : t
        )
      );
    } catch { /* silent */ }
  };

  const addTrigger = () => {
    const newTrigger: Trigger = {
      id: String(Date.now()),
      workflowId: 'new',
      type: selectedType,
      config: { value: configValue },
      isActive: true,
      fireCount: 0,
      createdAt: new Date().toISOString(),
    };
    setTriggers((prev) => [newTrigger, ...prev]);
    setShowWizard(false);
    setWizardStep(1);
    setConfigValue('');
  };

  const CONFIG_PLACEHOLDER: Record<TriggerType, string> = {
    MANUAL: 'No config needed',
    SCHEDULE: '0 9 * * * (cron expression)',
    WEBHOOK: '/hooks/my-endpoint',
    EMAIL: 'Invoice received',
    FILE_WATCH: '/uploads/reports/',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Trigger Manager</h1>
          <p className="text-slate-500 mt-1">Configure what starts your workflows — schedule, webhook, email, or file events.</p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Trigger
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Triggers', value: triggers.length },
          { label: 'Active', value: triggers.filter((t) => t.isActive).length },
          { label: 'Total Fires', value: triggers.reduce((s, t) => s + t.fireCount, 0) },
        ].map((s) => (
          <div key={s.label} className="bg-slate-900/60 border border-white/5 rounded-2xl p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className="text-2xl font-black text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Trigger List */}
      <div className="space-y-3">
        <AnimatePresence>
          {triggers.map((trigger) => {
            const Icon = TRIGGER_ICONS[trigger.type];
            return (
              <motion.div
                key={trigger.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-slate-900/60 border border-white/5 rounded-2xl p-5"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${TRIGGER_COLORS[trigger.type]}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-white text-sm">{TRIGGER_LABELS[trigger.type]}</span>
                      {trigger.isActive ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">ACTIVE</span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">DISABLED</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-mono truncate">
                      {typeof trigger.config === 'object' ? JSON.stringify(trigger.config) : String(trigger.config)}
                    </p>
                    {trigger.lastFired && (
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        Last fired: {new Date(trigger.lastFired).toLocaleString()} · {trigger.fireCount} total fires
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => fireTrigger(trigger.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-colors flex items-center gap-1"
                      title="Fire now"
                    >
                      <Zap className="w-3 h-3" />
                      Test
                    </button>
                    <button
                      onClick={() => toggleTrigger(trigger.id)}
                      className={`p-2 rounded-lg transition-colors ${trigger.isActive ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-slate-500 hover:bg-slate-700'}`}
                      title={trigger.isActive ? 'Disable' : 'Enable'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTrigger(trigger.id)}
                      className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {triggers.length === 0 && (
          <div className="text-center py-16 text-slate-600">
            <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No triggers configured yet. Create one to automate workflow execution.</p>
          </div>
        )}
      </div>

      {/* Wizard Modal */}
      <AnimatePresence>
        {showWizard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowWizard(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-black/50"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-white">New Trigger — Step {wizardStep}/3</h3>
                <button onClick={() => setShowWizard(false)} className="text-slate-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {wizardStep === 1 && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-400 mb-4">Choose trigger type:</p>
                  {(Object.keys(TRIGGER_ICONS) as TriggerType[]).map((type) => {
                    const Icon = TRIGGER_ICONS[type];
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${selectedType === type ? 'border-purple-500/50 bg-purple-500/10' : 'border-white/5 bg-slate-800/40 hover:bg-slate-800'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${TRIGGER_COLORS[type]}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-white">{TRIGGER_LABELS[type]}</span>
                        {selectedType === type && <CheckCircle className="w-4 h-4 text-purple-400 ml-auto" />}
                      </button>
                    );
                  })}
                  <button onClick={() => setWizardStep(2)} className="mt-2 w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors">
                    Next →
                  </button>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400">Configure <strong className="text-white">{TRIGGER_LABELS[selectedType]}</strong>:</p>
                  <input
                    type="text"
                    value={configValue}
                    onChange={(e) => setConfigValue(e.target.value)}
                    placeholder={CONFIG_PLACEHOLDER[selectedType]}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50"
                    disabled={selectedType === 'MANUAL'}
                  />
                  <div className="flex gap-3">
                    <button onClick={() => setWizardStep(1)} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-400 font-bold hover:bg-slate-700 transition-colors">← Back</button>
                    <button onClick={() => setWizardStep(3)} className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors">Test →</button>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-xl">
                    <p className="text-sm font-bold text-emerald-400 mb-2">Configuration Preview</p>
                    <p className="text-xs text-slate-300">Type: <strong>{TRIGGER_LABELS[selectedType]}</strong></p>
                    {configValue && <p className="text-xs text-slate-300">Config: <code className="font-mono">{configValue}</code></p>}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setWizardStep(2)} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-400 font-bold hover:bg-slate-700 transition-colors">← Back</button>
                    <button onClick={addTrigger} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors">Save Trigger</button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

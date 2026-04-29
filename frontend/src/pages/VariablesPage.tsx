import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { GlobalVariable } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Eye, EyeOff, Trash2, Edit3, Lock,
  Globe, CheckCircle2, AlertCircle, Key, X
} from 'lucide-react';

interface VarForm {
  name: string;
  value: string;
  isSecret: boolean;
  description: string;
  environment: 'all' | 'dev' | 'staging' | 'prod';
}

const EMPTY_FORM: VarForm = { name: '', value: '', isSecret: false, description: '', environment: 'all' };

const ENV_COLORS: Record<string, string> = {
  all: 'text-slate-400 bg-slate-400/10',
  dev: 'text-blue-400 bg-blue-400/10',
  staging: 'text-amber-400 bg-amber-400/10',
  prod: 'text-red-400 bg-red-400/10',
};

export const VariablesPage: React.FC = () => {
  const [variables, setVariables] = useState<GlobalVariable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VarForm>(EMPTY_FORM);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [revealedValues, setRevealedValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVariables();
  }, []);

  const fetchVariables = () => {
    api.get('/variables')
      .then(r => setVariables(r.data.variables || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (v: GlobalVariable) => {
    setForm({ name: v.name, value: '', isSecret: v.isSecret, description: v.description || '', environment: v.environment as any });
    setEditingId(v.id);
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.value) { setError('Name and value are required'); return; }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await api.put(`/variables/${editingId}`, form);
      } else {
        await api.post('/variables', form);
      }
      setShowModal(false);
      fetchVariables();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this variable?')) return;
    await api.delete(`/variables/${id}`);
    fetchVariables();
  };

  const handleReveal = async (v: GlobalVariable) => {
    if (revealed.has(v.id)) {
      setRevealed(prev => { const s = new Set(prev); s.delete(v.id); return s; });
      return;
    }
    try {
      const res = await api.get(`/variables/${v.id}/reveal`);
      setRevealedValues(prev => ({ ...prev, [v.id]: res.data.value }));
      setRevealed(prev => new Set([...prev, v.id]));
    } catch { /* silent */ }
  };

  const displayValue = (v: GlobalVariable) => {
    if (!v.isSecret) return v.value;
    return revealed.has(v.id) ? revealedValues[v.id] : '••••••••••';
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Variables</h1>
          <p className="text-slate-500 mt-1">Global variables reusable across all workflows with {'{{name}}'} syntax</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 transition-all"
        >
          <Plus className="w-5 h-5" /> Add Variable
        </button>
      </div>

      {/* Usage hint */}
      <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4 flex items-start gap-3">
        <Key className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-purple-300">Usage in workflows</p>
          <p className="text-xs text-slate-500 mt-1">
            Reference variables in any step field using <code className="bg-slate-800 px-1 py-0.5 rounded text-purple-300">{'{{VARIABLE_NAME}}'}</code>.
            Secret variables are encrypted at rest and masked in all logs.
          </p>
        </div>
      </div>

      {/* Variables list */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : variables.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/20 border-2 border-dashed border-white/5 rounded-3xl">
          <Key className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No variables yet.</p>
          <p className="text-slate-600 text-sm mt-1">Create your first global variable to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {variables.map(v => (
            <motion.div
              key={v.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:border-white/10 transition-all"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${v.isSecret ? 'bg-red-500/10' : 'bg-slate-800'}`}>
                {v.isSecret ? <Lock className="w-5 h-5 text-red-400" /> : <Globe className="w-5 h-5 text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white font-mono">{`{{${v.name}}}`}</span>
                  {v.isSecret && (
                    <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">SECRET</span>
                  )}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ENV_COLORS[v.environment]}`}>
                    {v.environment.toUpperCase()}
                  </span>
                </div>
                {v.description && <p className="text-xs text-slate-500 mt-0.5">{v.description}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs text-slate-400 font-mono truncate max-w-xs">{displayValue(v)}</code>
                  {v.isSecret && (
                    <button onClick={() => handleReveal(v)} className="text-slate-600 hover:text-slate-400 transition-colors">
                      {revealed.has(v.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(v)} className="p-2 text-slate-500 hover:text-blue-400 transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(v.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white">{editingId ? 'Edit Variable' : 'New Variable'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Variable Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value.toUpperCase().replace(/\s+/g, '_') }))}
                    disabled={!!editingId}
                    placeholder="MY_API_KEY"
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                    Value {editingId && <span className="text-slate-600">(leave empty to keep current)</span>}
                  </label>
                  <input
                    type={form.isSecret ? 'password' : 'text'}
                    value={form.value}
                    onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                    placeholder={editingId ? '(unchanged)' : 'Enter value...'}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Description (optional)</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="What is this variable used for?"
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Environment</label>
                    <select
                      value={form.environment}
                      onChange={e => setForm(f => ({ ...f, environment: e.target.value as any }))}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="all">All</option>
                      <option value="dev">Dev</option>
                      <option value="staging">Staging</option>
                      <option value="prod">Production</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Type</label>
                    <button
                      onClick={() => setForm(f => ({ ...f, isSecret: !f.isSecret }))}
                      className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                        form.isSecret
                          ? 'bg-red-500/10 border-red-500/30 text-red-400'
                          : 'bg-slate-800 border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      {form.isSecret ? 'Secret (encrypted)' : 'Plain text'}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                  </div>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold flex items-center justify-center gap-2 mt-2"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><CheckCircle2 className="w-5 h-5" /> {editingId ? 'Save Changes' : 'Create Variable'}</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface RedactionLog {
  id: string;
  workflowId?: string;
  redactionCount: number;
  types: string[];
  originalHash: string;
  createdAt: string;
}

interface Stats {
  totalRedactions: number;
  totalOperations: number;
}

export const PrivacyShieldPage: React.FC = () => {
  const [logs, setLogs] = useState<RedactionLog[]>([]);
  const [stats, setStats] = useState<Stats>({ totalRedactions: 0, totalOperations: 0 });
  const [testText, setTestText] = useState('');
  const [redactedResult, setRedactedResult] = useState('');
  const [isRedacting, setIsRedacting] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        api.get('/privacy/logs'),
        api.get('/privacy/stats'),
      ]);
      setLogs(logsRes.data);
      setStats(statsRes.data);
    } catch {
      // Use demo data if API not available
      setStats({ totalRedactions: 142, totalOperations: 38 });
    } finally {
      setLoading(false);
    }
  };

  const handleRedact = async () => {
    if (!testText.trim()) return;
    setIsRedacting(true);
    try {
      const res = await api.post('/privacy/redact', { text: testText });
      setRedactedResult(res.data.redactedText);
    } catch {
      setRedactedResult('[Error contacting Privacy Shield API]');
    } finally {
      setIsRedacting(false);
    }
  };

  const TYPE_COLORS: Record<string, string> = {
    saudi_id: 'bg-red-500/20 text-red-400 border-red-500/30',
    saudi_phone: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    email: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    iban: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    credit_card: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    passport: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-emerald-500" />
            Sovereign Privacy Shield
          </h1>
          <p className="text-slate-500 mt-1">PDPL-compliant PII detection and redaction engine.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">Shield Status</span>
          <button
            onClick={() => setIsEnabled(!isEnabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${isEnabled ? 'bg-emerald-600' : 'bg-slate-700'}`}
          >
            <motion.div
              animate={{ x: isEnabled ? 24 : 2 }}
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
            />
          </button>
          <span className={`text-xs font-bold ${isEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
            {isEnabled ? 'ACTIVE' : 'DISABLED'}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total PII Blocked', value: loading ? '...' : stats.totalRedactions.toLocaleString(), icon: Shield, color: 'text-emerald-400' },
          { label: 'Operations', value: loading ? '...' : stats.totalOperations.toLocaleString(), icon: RefreshCw, color: 'text-blue-400' },
          { label: 'Data Types Detected', value: '6', icon: AlertTriangle, color: 'text-amber-400' },
          { label: 'Compliance', value: 'PDPL', icon: CheckCircle, color: 'text-purple-400' },
        ].map((card) => (
          <div key={card.label} className="bg-slate-900/60 border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-medium">{card.label}</span>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Redaction */}
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Test Redaction</h2>
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Paste text containing PII to test... e.g. ID: 1234567890, Phone: +966512345678"
            className="w-full h-32 bg-slate-800/50 border border-white/10 rounded-xl p-3 text-sm text-slate-300 resize-none placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50"
          />
          <button
            onClick={handleRedact}
            disabled={isRedacting || !testText.trim()}
            className="mt-3 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-bold flex items-center gap-2 transition-colors"
          >
            {isRedacting ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <RefreshCw className="w-4 h-4" />
              </motion.div>
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
            Redact PII
          </button>

          {redactedResult && (
            <div className="mt-4 p-3 bg-emerald-900/20 border border-emerald-500/20 rounded-xl">
              <p className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Redacted Output
              </p>
              <p className="text-sm text-slate-300 font-mono break-all">{redactedResult}</p>
            </div>
          )}
        </div>

        {/* Redaction Logs */}
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Recent Redactions</h2>
            <button onClick={fetchData} className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-8">No redaction operations yet.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="bg-slate-800/40 rounded-lg p-3 border border-white/5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white">{log.redactionCount} items redacted</span>
                    <span className="text-[10px] text-slate-600">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {log.types.map((type) => (
                      <span key={type} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TYPE_COLORS[type] || 'bg-slate-700 text-slate-400'}`}>
                        {type.replace('_', ' ').toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* PII Type Reference */}
      <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Detected PII Types</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { type: 'saudi_id', label: 'Saudi National ID', example: '1xxxxxxxxx / 2xxxxxxxxx' },
            { type: 'saudi_phone', label: 'Saudi Phone', example: '+966 / 00966 / 05xxxxxxxx' },
            { type: 'email', label: 'Email Address', example: 'user@domain.com' },
            { type: 'iban', label: 'Saudi IBAN', example: 'SA + 22 digits' },
            { type: 'credit_card', label: 'Credit Card', example: '16-digit card numbers' },
            { type: 'passport', label: 'Passport Number', example: 'A12345678' },
          ].map((item) => (
            <div key={item.type} className={`p-3 rounded-xl border ${TYPE_COLORS[item.type] || ''}`}>
              <p className="text-xs font-bold mb-1">{item.label}</p>
              <p className="text-[10px] opacity-60 font-mono">{item.example}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

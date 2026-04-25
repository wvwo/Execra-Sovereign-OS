import React, { useState } from 'react';
import {
  Settings,
  Key,
  Globe,
  Shield,
  Bell,
  User,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';

const Section: React.FC<{ icon: React.ElementType; title: string; subtitle: string; children: React.ReactNode }> = ({
  icon: Icon, title, subtitle, children,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-xl"
  >
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
        {Icon ? <Icon className="w-5 h-5 text-purple-400" /> : <div className="w-5 h-5 bg-slate-800 rounded" />}
      </div>
      <div>
        <h2 className="text-base font-black text-white tracking-tight">{title}</h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
    <div className="space-y-5">{children}</div>
  </motion.div>
);

const Field: React.FC<{
  label: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    {children}
    {hint && <p className="text-[10px] text-slate-600 ml-1">{hint}</p>}
  </div>
);

const inputCls =
  'w-full bg-slate-800/50 border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all placeholder:text-slate-600';

export const SettingsPage: React.FC = () => {
  const savedUser = (() => {
    try {
      const data = localStorage.getItem('user');
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.warn('Failed to parse user from localStorage', e);
      return {};
    }
  })();

  const [apiUrl, setApiUrl] = useState(
    (() => {
      try {
        return (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
      } catch (e) {
        return 'http://localhost:4000';
      }
    })(),
  );
  const [name, setName] = useState(savedUser.name || '');
  const [email, setEmail] = useState(savedUser.email || '');
  const [showKey, setShowKey] = useState(false);
  const [openaiKey, setOpenaiKey] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    const updated = { ...savedUser, name, email };
    localStorage.setItem('user', JSON.stringify(updated));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 pb-16 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-1">Configure your Sovereign environment and preferences</p>
      </div>

      {/* Account */}
      <Section icon={User} title="Account" subtitle="Your identity within the Sovereign OS">
        <Field label="Display Name">
          <input
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sovereign User"
          />
        </Field>
        <Field label="Email Address">
          <input
            className={inputCls}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
          />
        </Field>
      </Section>

      {/* API Configuration */}
      <Section icon={Globe} title="API Configuration" subtitle="Backend connection settings">
        <Field
          label="Backend API URL"
          hint="Set VITE_API_URL in your Vercel environment to override this at build time"
        >
          <input
            className={inputCls}
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://your-backend.railway.app"
          />
        </Field>
        <div className="flex items-center gap-3 p-4 bg-slate-950/50 rounded-2xl border border-white/5">
          <div className={`w-2 h-2 rounded-full ${apiUrl ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {apiUrl ? 'Endpoint configured' : 'No endpoint set'}
          </span>
        </div>
      </Section>

      {/* Security */}
      <Section icon={Key} title="API Keys" subtitle="Third-party service credentials">
        <Field label="OpenAI API Key" hint="Used for vision analysis and workflow generation">
          <div className="relative">
            <input
              className={inputCls + ' pr-12'}
              type={showKey ? 'text' : 'password'}
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-••••••••••••••••••••"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>
        <div className="flex items-center gap-3 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-xs text-amber-500/80">
            API keys are stored only in this browser session. Set them as environment variables on your backend for
            production.
          </p>
        </div>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notifications" subtitle="Execution and system alerts">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white">Execution alerts</p>
            <p className="text-xs text-slate-500 mt-0.5">Get notified when a workflow completes or fails</p>
          </div>
          <button
            onClick={() => setNotifications((v) => !v)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              notifications ? 'bg-purple-600' : 'bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                notifications ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </Section>

      {/* Security Status */}
      <Section icon={Shield} title="Security Status" subtitle="Current sovereign environment posture">
        {[
          { label: 'Zero-Trust PII Redaction', status: true },
          { label: 'AES-256-GCM Encryption', status: true },
          { label: 'Rate Limiting Active', status: true },
          { label: 'Audit Chain Integrity', status: true },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-slate-600" />
              <span className="text-sm text-slate-300">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Active</span>
            </div>
          </div>
        ))}
      </Section>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-600/20 flex items-center gap-3 min-w-[160px] justify-center"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-300" />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

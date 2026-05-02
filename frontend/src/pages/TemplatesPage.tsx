import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { Template } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search, Download, Eye, Star, Grid3x3,
  ChevronRight, X, Play, CheckCircle2, MoreVertical,
  Edit2, Trash2, Copy, ExternalLink, Globe, Lock, ShoppingBag
} from 'lucide-react';

const CATEGORIES = ['All', 'Data Transfer', 'Scraping', 'Monitoring', 'Forms', 'Communication', 'Reporting'];
const CATEGORY_COLORS: Record<string, string> = {
  'Data Transfer': 'text-blue-400 bg-blue-400/10',
  'Scraping': 'text-amber-400 bg-amber-400/10',
  'Monitoring': 'text-green-400 bg-green-400/10',
  'Forms': 'text-purple-400 bg-purple-400/10',
  'Communication': 'text-cyan-400 bg-cyan-400/10',
  'Reporting': 'text-rose-400 bg-rose-400/10',
};

const TABS = ['Library', 'My Templates', 'Marketplace'] as const;
type Tab = typeof TABS[number];

// Marketplace placeholder data
const MARKETPLACE_TEMPLATES = [
  { id: 'm1', icon: '🛒', name: 'Amazon Price Tracker', author: 'Ahmad Al-Rashid', price: 0, downloads: 1240, rating: 4.8, category: 'Monitoring', description: 'Track product prices on Amazon and get alerts on drops.' },
  { id: 'm2', icon: '📊', name: 'Google Sheets Sync', author: 'Fatima Khalid', price: 9.99, downloads: 873, rating: 4.6, category: 'Data Transfer', description: 'Sync any web table to Google Sheets automatically.' },
  { id: 'm3', icon: '📧', name: 'Email Lead Extractor', author: 'Mohammed Saleh', price: 0, downloads: 2100, rating: 4.9, category: 'Scraping', description: 'Extract leads from any website and export as CSV.' },
  { id: 'm4', icon: '🔔', name: 'Stock Alert Bot', author: 'Sara Al-Amri', price: 4.99, downloads: 445, rating: 4.4, category: 'Monitoring', description: 'Monitor stock levels and send alerts when below threshold.' },
  { id: 'm5', icon: '📝', name: 'Form Auto-Filler', author: 'Khalid Ibrahim', price: 0, downloads: 3300, rating: 4.7, category: 'Forms', description: 'Auto-fill repetitive government and bank forms.' },
  { id: 'm6', icon: '📈', name: 'Sales Report Generator', author: 'Nora Al-Zahrani', price: 14.99, downloads: 220, rating: 4.5, category: 'Reporting', description: 'Pull data from multiple sources and generate PDF reports.' },
];

interface OptionsMenuProps {
  template: Template;
  onEdit: () => void;
  onRun: () => void;
  onCopy: () => void;
  onDelete?: () => void;
}

const OptionsMenu: React.FC<OptionsMenuProps> = ({ template, onEdit, onRun, onCopy, onDelete }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            className="absolute right-0 top-full mt-1 w-44 bg-slate-800 border border-white/10 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => { onRun(); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" /> Run Now
            </button>
            <button
              onClick={() => { onEdit(); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-blue-400" /> Edit
            </button>
            <button
              onClick={() => { onCopy(); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-purple-400" /> Duplicate
            </button>
            {onDelete && (
              <>
                <div className="my-1 border-t border-white/5" />
                <button
                  onClick={() => { onDelete(); setOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const TemplatesPage: React.FC = () => {
  const { i18n } = useTranslation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filtered, setFiltered] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<Tab>('Library');
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<Template | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [imported, setImported] = useState<Map<string, { workflowId: string; date: Date }>>(new Map());
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/templates')
      .then(r => {
        const list = r.data.templates || [];
        setTemplates(list);
        setFiltered(list);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    let result = templates;
    if (activeCategory !== 'All') result = result.filter(t => t.category === activeCategory);
    if (search) result = result.filter(t =>
      (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [templates, activeCategory, search]);

  const handleImport = async (template: Template): Promise<string | null> => {
    setImporting(template.id);
    try {
      const res = await api.post(`/templates/${template.id}/import`);
      const workflowId = res.data.workflow?.id || res.data.id;
      setImported(prev => new Map(prev).set(template.id, { workflowId, date: new Date() }));
      return workflowId;
    } catch (err) {
      console.error('Import failed', err);
      return null;
    } finally {
      setImporting(null);
    }
  };

  const handleRun = async (template: Template) => {
    const info = imported.get(template.id);
    if (info) {
      navigate(`/execute/${info.workflowId}`);
      return;
    }
    const workflowId = await handleImport(template);
    if (workflowId) {
      setTimeout(() => navigate(`/execute/${workflowId}`), 300);
    }
  };

  const handleEdit = async (template: Template) => {
    const info = imported.get(template.id);
    if (info) {
      navigate(`/editor/${info.workflowId}`);
      return;
    }
    const workflowId = await handleImport(template);
    if (workflowId) {
      setTimeout(() => navigate(`/editor/${workflowId}`), 300);
    }
  };

  const handleUseTemplate = async (template: Template) => {
    const workflowId = await handleImport(template);
    if (workflowId) {
      setTimeout(() => navigate(`/editor/${workflowId}`), 800);
    }
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString(
      i18n.language === 'ar' ? 'ar-SA' : 'en-US',
      { year: 'numeric', month: 'short', day: 'numeric' }
    );

  const myTemplates = filtered.filter(t => imported.has(t.id));

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Template Library</h1>
          <p className="text-slate-500 mt-1">Production-ready automation blueprints — import and run in seconds</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/40 border border-white/5 px-4 py-2 rounded-xl">
          <Grid3x3 className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-400">{templates.length} templates</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900/40 border border-white/5 rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === tab
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'Library' && <Globe className="w-3.5 h-3.5" />}
            {tab === 'My Templates' && <Lock className="w-3.5 h-3.5" />}
            {tab === 'Marketplace' && <ShoppingBag className="w-3.5 h-3.5" />}
            {tab}
            {tab === 'My Templates' && imported.size > 0 && (
              <span className="ml-1 bg-purple-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                {imported.size}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Marketplace Tab */}
      {activeTab === 'Marketplace' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-300">
            <ShoppingBag className="w-5 h-5 shrink-0" />
            <span>Community-built templates. Developers earn from every download. <button className="underline font-bold ml-1">Publish yours →</button></span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {MARKETPLACE_TEMPLATES.map(t => (
              <div key={t.id} className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 hover:border-blue-500/30 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">{t.icon}</div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${CATEGORY_COLORS[t.category] || 'text-slate-400 bg-slate-400/10'}`}>
                      {t.category}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${t.price === 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-amber-400 bg-amber-400/10'}`}>
                      {t.price === 0 ? 'Free' : `$${t.price}`}
                    </span>
                  </div>
                </div>
                <h3 className="text-base font-black text-white mb-1">{t.name}</h3>
                <p className="text-xs text-purple-400 mb-2">by {t.author}</p>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{t.description}</p>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5 text-xs text-slate-600">
                  <span>⭐ {t.rating}</span>
                  <span>↓ {t.downloads.toLocaleString()}</span>
                </div>
                <button className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  <Download className="w-4 h-4" />
                  {t.price === 0 ? 'Download Free' : `Buy $${t.price}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Library + My Templates Tabs */}
      {activeTab !== 'Marketplace' && (
        <>
          {/* Search + Category Filter */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search templates..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-900/40 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeCategory === cat
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                      : 'bg-slate-900/40 border border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* My Templates empty state */}
          {activeTab === 'My Templates' && myTemplates.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Lock className="w-12 h-12 text-slate-700 mb-4" />
              <p className="text-slate-500 font-bold">No imported templates yet</p>
              <p className="text-slate-600 text-sm mt-1">Import templates from the Library tab to see them here</p>
              <button
                onClick={() => setActiveTab('Library')}
                className="mt-4 px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-500 transition-colors"
              >
                Browse Library
              </button>
            </div>
          )}

          {/* Grid */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {(activeTab === 'My Templates' ? myTemplates : filtered).map((template) => {
                const importInfo = imported.get(template.id);
                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 hover:border-purple-500/30 transition-all group relative"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-3xl">{template.icon}</div>
                      <div className="flex items-center gap-2">
                        {template.isOfficial && (
                          <span className="flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-400/10 px-2 py-1 rounded-lg">
                            <Star className="w-3 h-3 fill-current" /> Official
                          </span>
                        )}
                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${CATEGORY_COLORS[template.category] || 'text-slate-400 bg-slate-400/10'}`}>
                          {template.category}
                        </span>
                        <OptionsMenu
                          template={template}
                          onRun={() => handleRun(template)}
                          onEdit={() => handleEdit(template)}
                          onCopy={() => handleUseTemplate(template)}
                          onDelete={importInfo ? () => {
                            setImported(prev => { const m = new Map(prev); m.delete(template.id); return m; });
                          } : undefined}
                        />
                      </div>
                    </div>

                    {/* Template name — with fallback */}
                    <h3 className="text-base font-black text-white mb-2">
                      {template.name || template.description?.slice(0, 40) || 'Untitled Template'}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{template.description}</p>

                    {/* Import date (My Templates) */}
                    {importInfo && (
                      <p className="text-[10px] text-slate-600 mt-2">
                        Imported: {formatDate(importInfo.date)}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                      <span className="text-xs text-slate-600 flex items-center gap-1">
                        <Play className="w-3 h-3" /> {(template.useCount || 0).toLocaleString()} uses
                      </span>
                      {(template.workflow as any)?.steps && (
                        <span className="text-xs text-slate-600">
                          · {(template.workflow as any).steps.length} steps
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <button
                        onClick={() => setPreview(template)}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:border-white/10 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </button>
                      <button
                        onClick={() => handleEdit(template)}
                        disabled={importing === template.id}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 transition-all disabled:opacity-50"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleRun(template)}
                        disabled={importing === template.id}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
                          importInfo
                            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/30'
                            : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:shadow-purple-600/20'
                        }`}
                      >
                        {importing === template.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <><Play className="w-3.5 h-3.5" /> Run</>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{preview.icon}</span>
                  <div>
                    <h2 className="text-xl font-black text-white">
                      {preview.name || 'Untitled Template'}
                    </h2>
                    <p className="text-xs text-slate-500">{preview.description}</p>
                  </div>
                </div>
                <button onClick={() => setPreview(null)} className="p-2 text-slate-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 mb-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Workflow Steps</p>
                {((preview.workflow as any)?.steps || []).map((step: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-xl">
                    <span className="text-xs font-black text-slate-600 w-5 shrink-0 mt-0.5">{i + 1}</span>
                    <div>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded mr-2 ${
                        step.action === 'click' ? 'bg-amber-400/10 text-amber-400' :
                        step.action === 'type' ? 'bg-green-400/10 text-green-400' :
                        step.action === 'extract' ? 'bg-purple-400/10 text-purple-400' :
                        step.action === 'navigate' ? 'bg-blue-400/10 text-blue-400' :
                        'bg-slate-400/10 text-slate-400'
                      }`}>{step.action}</span>
                      <span className="text-sm text-slate-300">{step.description}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { handleEdit(preview); setPreview(null); }}
                  className="py-3 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" /> Open in Editor
                </button>
                <button
                  onClick={() => { handleRun(preview); setPreview(null); }}
                  className="py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" /> Run Now
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

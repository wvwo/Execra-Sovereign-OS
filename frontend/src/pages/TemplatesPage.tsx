import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Template } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search, Download, Eye, Star, Grid3x3,
  ChevronRight, X, Play, CheckCircle2
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

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filtered, setFiltered] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<Template | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [imported, setImported] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/templates')
      .then(r => {
        setTemplates(r.data.templates || []);
        setFiltered(r.data.templates || []);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    let result = templates;
    if (activeCategory !== 'All') result = result.filter(t => t.category === activeCategory);
    if (search) result = result.filter(t =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [templates, activeCategory, search]);

  const handleImport = async (template: Template) => {
    setImporting(template.id);
    try {
      const res = await api.post(`/templates/${template.id}/import`);
      setImported(prev => new Set([...prev, template.id]));
      setTimeout(() => navigate(`/editor/${res.data.workflow.id}`), 800);
    } catch (err) {
      console.error('Import failed', err);
    } finally {
      setImporting(null);
    }
  };

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
          {filtered.map((template) => (
            <motion.div
              key={template.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 hover:border-purple-500/30 transition-all group"
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
                </div>
              </div>

              <h3 className="text-base font-black text-white mb-2">{template.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{template.description}</p>

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

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => setPreview(template)}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:border-white/10 transition-all"
                >
                  <Eye className="w-4 h-4" /> Preview
                </button>
                <button
                  onClick={() => handleImport(template)}
                  disabled={importing === template.id || imported.has(template.id)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    imported.has(template.id)
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:shadow-purple-600/20'
                  }`}
                >
                  {importing === template.id ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : imported.has(template.id) ? (
                    <><CheckCircle2 className="w-4 h-4" /> Imported</>
                  ) : (
                    <><Download className="w-4 h-4" /> Use Template</>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
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
                    <h2 className="text-xl font-black text-white">{preview.name}</h2>
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

              <button
                onClick={() => { handleImport(preview); setPreview(null); }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" /> Import & Open Editor
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

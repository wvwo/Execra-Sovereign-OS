import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Download, Upload, Star, Search, Filter, TrendingUp, Zap, Globe, Shield, X, CheckCircle, Tag } from 'lucide-react';

const SAMPLE_ACTIONS = [
  { id: 'cheap-flight', name: 'Cheap Flight Hunter', nameAr: 'صائد الرحلات الرخيصة', author: 'TravelBot', category: 'travel', rating: 4.8, downloads: 2340, price: 'Free', description: 'Scans 20+ airlines for the cheapest flights to your destination.', descriptionAr: 'يبحث في +20 شركة طيران لإيجاد أرخص الرحلات إلى وجهتك.', steps: [{ action: 'navigate', url: 'https://www.google.com/travel/flights' }, { action: 'type', selector: 'input[aria-label="Where to?"]', value: '{{destination}}' }, { action: 'extract', selector: '.pIav2d' }], tags: ['travel', 'flights', 'savings'] },
  { id: 'stock-analyzer', name: 'Stock Analyzer Pro', nameAr: 'محلل الأسهم الاحترافي', author: 'FinanceAI', category: 'finance', rating: 4.9, downloads: 5120, price: '$4.99', description: 'Real-time stock analysis with AI-powered insights and alerts.', descriptionAr: 'تحليل أسهم لحظي بتقارير ذكاء اصطناعي وتنبيهات فورية.', steps: [{ action: 'navigate', url: 'https://finance.yahoo.com' }, { action: 'extract', selector: '.trending-list' }], tags: ['finance', 'stocks', 'AI'] },
  { id: 'social-scheduler', name: 'Social Post Scheduler', nameAr: 'جدولة منشورات التواصل', author: 'MediaFlow', category: 'social', rating: 4.6, downloads: 1890, price: 'Free', description: 'Schedule and auto-post content across Twitter, LinkedIn, and Instagram.', descriptionAr: 'جدولة ونشر تلقائي للمحتوى عبر تويتر ولينكدإن وانستقرام.', steps: [{ action: 'navigate', url: 'https://twitter.com/compose/tweet' }], tags: ['social', 'marketing', 'automation'] },
  { id: 'price-tracker', name: 'Amazon Price Tracker', nameAr: 'تتبع أسعار أمازون', author: 'DealHunter', category: 'shopping', rating: 4.7, downloads: 8900, price: 'Free', description: 'Track Amazon product prices and get alerts when prices drop.', descriptionAr: 'تتبع أسعار منتجات أمازون واحصل على تنبيهات عند انخفاض الأسعار.', steps: [{ action: 'navigate', url: 'https://www.amazon.com' }, { action: 'extract', selector: '.a-price-whole' }], tags: ['shopping', 'deals', 'alerts'] },
  { id: 'resume-builder', name: 'AI Resume Builder', nameAr: 'باني السيرة الذاتية', author: 'CareerAI', category: 'productivity', rating: 4.5, downloads: 3200, price: '$2.99', description: 'Auto-generate tailored resumes from your LinkedIn profile.', descriptionAr: 'إنشاء سيرة ذاتية مخصصة تلقائياً من ملفك على لينكدإن.', steps: [{ action: 'navigate', url: 'https://www.linkedin.com/in/me' }, { action: 'extract', selector: '.experience-section' }], tags: ['career', 'resume', 'AI'] },
  { id: 'news-digest', name: 'Daily News Digest', nameAr: 'ملخص الأخبار اليومي', author: 'InfoStream', category: 'news', rating: 4.4, downloads: 6700, price: 'Free', description: 'Compile top news from 10+ sources into a single summary report.', descriptionAr: 'تجميع أهم الأخبار من +10 مصادر في تقرير ملخص واحد.', steps: [{ action: 'navigate', url: 'https://news.google.com' }, { action: 'extract', selector: 'article h3' }], tags: ['news', 'summary', 'daily'] },
];

const CATEGORIES = ['all', 'travel', 'finance', 'social', 'shopping', 'productivity', 'news'];

export default function ActionMarket({ onInstall, lang = 'en', theme = 'dark' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [installedActions, setInstalledActions] = useState([]);
  const [showPublish, setShowPublish] = useState(false);
  const [publishForm, setPublishForm] = useState({ name: '', description: '', steps: '' });

  const isAr = lang === 'ar';

  const filteredActions = SAMPLE_ACTIONS.filter(action => {
    const matchesSearch = (isAr ? action.nameAr : action.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (isAr ? action.descriptionAr : action.description).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || action.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInstall = (action) => {
    setInstalledActions(prev => [...prev, action.id]);
    if (onInstall) onInstall(action);
  };

  const handlePublish = () => {
    try {
      const steps = JSON.parse(publishForm.steps);
      const newAction = {
        id: 'user-' + Date.now(),
        name: publishForm.name,
        nameAr: publishForm.name,
        author: 'You',
        category: 'productivity',
        rating: 0,
        downloads: 0,
        price: 'Free',
        description: publishForm.description,
        descriptionAr: publishForm.description,
        steps,
        tags: ['community'],
      };
      SAMPLE_ACTIONS.push(newAction);
      setShowPublish(false);
      setPublishForm({ name: '', description: '', steps: '' });
    } catch (e) {
      alert('Invalid JSON steps format');
    }
  };

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-[#0c0c14]' : 'bg-white';
  const cardBorder = isDark ? 'border-slate-800' : 'border-slate-200';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const inputBg = isDark ? 'bg-[#0B0F14]' : 'bg-slate-50';
  const inputBorder = isDark ? 'border-slate-700' : 'border-slate-300';

  return (
    <section className={`py-24 px-4 relative overflow-hidden border-t ${isDark ? 'border-slate-800/50 bg-[#050508]' : 'border-slate-200 bg-gradient-to-b from-slate-50 to-white'}`} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-[400px] h-[400px] ${isDark ? 'bg-violet-900/10' : 'bg-violet-200/30'} blur-[120px] rounded-full`} />
        <div className={`absolute bottom-1/4 right-1/4 w-[300px] h-[300px] ${isDark ? 'bg-blue-900/10' : 'bg-blue-200/30'} blur-[100px] rounded-full`} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${isDark ? 'bg-violet-900/30 border-violet-500/30' : 'bg-violet-100 border-violet-300'} border text-xs font-bold ${isDark ? 'text-violet-300' : 'text-violet-700'} mb-6 uppercase tracking-widest`}>
            <ShoppingCart className="w-3 h-3" />
            {isAr ? 'متجر الأفعال العالمي' : 'Execra Action Store'}
          </div>
          <h2 className={`text-4xl md:text-5xl font-black ${textPrimary} mb-4 tracking-tight`}>
            {isAr ? 'متجر الأفعال' : 'Action Store'}
          </h2>
          <p className={`${textSecondary} max-w-2xl mx-auto text-lg font-medium`}>
            {isAr ? 'أتمتة بنقرة واحدة مبنية من المجتمع. ثبت واستخدم فوراً.' : 'Community-built one-tap automations. Install and use instantly.'}
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className={`flex flex-col sm:flex-row gap-4 mb-8 p-4 rounded-2xl ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'} border backdrop-blur-sm`}>
          <div className="relative flex-1">
            <Search className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث عن أتمتة...' : 'Search automations...'}
              className={`w-full ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-xl ${inputBg} ${textPrimary} border ${inputBorder} text-sm outline-none focus:border-violet-500 transition-colors`}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                  selectedCategory === cat
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                    : isDark ? 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? (isAr ? 'الكل' : 'All') : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Publish Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowPublish(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 active:scale-95"
          >
            <Upload className="w-4 h-4" />
            {isAr ? 'انشر فعلك' : 'Publish Your Action'}
          </button>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredActions.map((action, i) => {
              const isInstalled = installedActions.includes(action.id);
              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className={`group ${cardBg} border ${cardBorder} rounded-2xl p-6 hover:border-violet-500/50 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(139,92,246,0.1)] flex flex-col justify-between relative overflow-hidden`}
                >
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-violet-500/10 border-violet-500/20' : 'bg-violet-100 border-violet-200'} border flex items-center justify-center`}>
                        <Zap className={`w-5 h-5 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs font-black px-2 py-1 rounded border ${action.price === 'Free'
                          ? isDark ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-700 bg-emerald-100 border-emerald-200'
                          : isDark ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-amber-700 bg-amber-100 border-amber-200'
                        }`}>{action.price}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className={`text-[10px] font-bold ${textSecondary}`}>{action.rating}</span>
                        </div>
                      </div>
                    </div>

                    <h3 className={`text-lg font-black ${textPrimary} mb-1 leading-tight`}>
                      {isAr ? action.nameAr : action.name}
                    </h3>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-violet-300/80' : 'text-violet-600'}`}>
                      {isAr ? 'بواسطة' : 'By'} {action.author}
                    </p>
                    <p className={`text-sm ${textSecondary} leading-relaxed mb-4`}>
                      {isAr ? action.descriptionAr : action.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {action.tags.map(tag => (
                        <span key={tag} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                          <Tag className="w-2 h-2 inline mr-0.5" />{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="flex items-center justify-between relative z-10 pt-4 border-t border-slate-800/30">
                    <span className={`text-[10px] font-bold ${textSecondary} flex items-center gap-1`}>
                      <Download className="w-3 h-3" /> {action.downloads.toLocaleString()} {isAr ? 'تحميل' : 'installs'}
                    </span>
                    <button
                      onClick={() => handleInstall(action)}
                      disabled={isInstalled}
                      className={`px-4 py-2 rounded-lg text-xs font-black transition-all active:scale-95 ${
                        isInstalled
                          ? isDark ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20'
                      }`}
                    >
                      {isInstalled ? (
                        <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {isAr ? 'مثبت' : 'Installed'}</span>
                      ) : (
                        <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {isAr ? 'تثبيت' : 'Install'}</span>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Publish Modal */}
      <AnimatePresence>
        {showPublish && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`w-full max-w-lg ${isDark ? 'bg-[#0c0c14] border-slate-700' : 'bg-white border-slate-300'} border rounded-2xl p-8 relative shadow-2xl`}>
              <button onClick={() => setShowPublish(false)} className={`absolute top-4 ${isAr ? 'left-4' : 'right-4'} ${textSecondary} hover:${textPrimary} transition-colors`}>
                <X className="w-5 h-5" />
              </button>
              <h3 className={`text-2xl font-black ${textPrimary} mb-6 flex items-center gap-2`}>
                <Upload className="w-6 h-6 text-violet-500" />
                {isAr ? 'انشر أتمتة جديدة' : 'Publish New Action'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={`text-xs font-bold ${textSecondary} uppercase tracking-wider block mb-2`}>{isAr ? 'اسم الفعل' : 'Action Name'}</label>
                  <input type="text" value={publishForm.name} onChange={e => setPublishForm(p => ({ ...p, name: e.target.value }))} placeholder={isAr ? 'مثال: حجز طيران رخيص' : 'e.g. Cheap Flight Finder'} className={`w-full ${inputBg} ${textPrimary} border ${inputBorder} rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500 transition-colors`} />
                </div>
                <div>
                  <label className={`text-xs font-bold ${textSecondary} uppercase tracking-wider block mb-2`}>{isAr ? 'الوصف' : 'Description'}</label>
                  <textarea value={publishForm.description} onChange={e => setPublishForm(p => ({ ...p, description: e.target.value }))} placeholder={isAr ? 'ماذا يفعل هذا الفعل؟' : 'What does this action do?'} className={`w-full ${inputBg} ${textPrimary} border ${inputBorder} rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500 h-20 resize-none transition-colors`} />
                </div>
                <div>
                  <label className={`text-xs font-bold ${textSecondary} uppercase tracking-wider block mb-2`}>{isAr ? 'الخطوات (JSON)' : 'Steps (JSON)'}</label>
                  <textarea value={publishForm.steps} onChange={e => setPublishForm(p => ({ ...p, steps: e.target.value }))} placeholder='[{"action": "navigate", "url": "..."}]' className={`w-full ${inputBg} ${textPrimary} border ${inputBorder} rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500 h-28 resize-none font-mono transition-colors`} />
                </div>
                <button onClick={handlePublish} className="w-full py-3 rounded-xl font-black bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white transition-all shadow-lg shadow-violet-500/20 active:scale-[0.98]">
                  {isAr ? 'نشر الآن' : 'Publish Now'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

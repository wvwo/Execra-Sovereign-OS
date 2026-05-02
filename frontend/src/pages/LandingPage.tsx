import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Video, Brain, Zap, Shield, Globe, ArrowRight,
  Check, Star, ChevronRight, Play, X
} from 'lucide-react';

const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className = ''
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const USE_CASES = [
  { icon: '📧', title: 'Email Processing', titleAr: 'معالجة البريد', desc: 'Extract data from emails and sync to spreadsheets automatically' },
  { icon: '🔍', title: 'Web Scraping', titleAr: 'استخراج البيانات', desc: 'Collect leads, prices, and data from any website at scale' },
  { icon: '📊', title: 'Report Generation', titleAr: 'إنشاء التقارير', desc: 'Download and compile reports from multiple portals daily' },
  { icon: '📝', title: 'Form Automation', titleAr: 'أتمتة النماذج', desc: 'Fill repetitive registration and application forms in seconds' },
  { icon: '💰', title: 'Price Monitoring', titleAr: 'مراقبة الأسعار', desc: 'Track competitor prices and get alerts when they change' },
  { icon: '🔄', title: 'CRM Sync', titleAr: 'مزامنة CRM', desc: 'Keep your CRM and internal systems perfectly synchronized' },
];

const COMPARISON = [
  { feature: 'No-code setup', featureAr: 'إعداد بدون كود', autopilot: true, bardeen: 'partial', zapier: false, uipath: false },
  { feature: 'Works without APIs', featureAr: 'يعمل بدون API', autopilot: true, bardeen: true, zapier: false, uipath: true },
  { feature: 'Arabic language support', featureAr: 'دعم اللغة العربية', autopilot: true, bardeen: false, zapier: false, uipath: false },
  { feature: 'Learn by recording', featureAr: 'تعلم بالتسجيل', autopilot: true, bardeen: false, zapier: false, uipath: false },
  { feature: 'Self-healing automation', featureAr: 'أتمتة ذاتية الإصلاح', autopilot: true, bardeen: false, zapier: false, uipath: true },
  { feature: 'AI step assistant', featureAr: 'مساعد AI', autopilot: true, bardeen: false, zapier: false, uipath: false },
];

const PLANS = [
  { name: 'Free', nameAr: 'مجاني', price: '$0', features: ['5 workflows', '100 runs/month', 'Basic templates', 'Community support'], cta: 'Get Started', accent: false },
  { name: 'Pro', nameAr: 'احترافي', price: '$29', period: '/month', features: ['Unlimited workflows', '5,000 runs/month', 'All 12+ templates', 'AI assistant', 'Priority support', 'Scheduling'], cta: 'Start Free Trial', accent: true },
  { name: 'Enterprise', nameAr: 'مؤسسات', price: 'Custom', features: ['Unlimited everything', 'On-premise option', 'SLA guarantee', 'Dedicated support', 'Custom integrations'], cta: 'Contact Sales', accent: false },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Demo Video Modal */}
      <AnimatePresence>
        {showDemo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowDemo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
            >
              <button
                onClick={() => setShowDemo(false)}
                className="absolute top-3 right-3 z-10 p-2 bg-black/60 rounded-full text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <video
                src="/demo.mp4"
                controls
                autoPlay
                className="w-full aspect-video"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-purple-400">Execra</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/login')} className="text-sm font-bold text-slate-400 hover:text-white transition-colors">
            Sign In
          </button>
          <button
            onClick={() => navigate('/register')}
            className="text-sm font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:shadow-purple-600/20 transition-all"
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-8 text-center relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto relative"
        >
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-8">
            <Star className="w-4 h-4 text-purple-400 fill-current" />
            <span className="text-xs font-bold text-purple-400">الذكاء الاصطناعي يتعلم من تسجيل شاشتك</span>
          </div>

          {/* Arabic headline */}
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-4 font-sans" dir="rtl">
            سجّل مرة واحدة
            <span className="block bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              أتمتة إلى الأبد
            </span>
          </h1>

          <p className="text-xl text-slate-400 mb-4 max-w-2xl mx-auto" dir="rtl">
            أنشئ أتمتة المتصفح من تسجيل فيديو — دون كتابة كود واحد
          </p>
          <p className="text-base text-slate-500 mb-10 max-w-xl mx-auto">
            Record your screen once. Our AI watches, understands, and builds a replayable automation script.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="group flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-lg hover:shadow-2xl hover:shadow-purple-600/30 transition-all"
            >
              ابدأ مجاناً
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => setShowDemo(true)}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
            >
              <Play className="w-5 h-5" /> Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto">
            {[
              { value: '10x', label: 'Faster setup vs competitors', labelAr: 'أسرع من المنافسين' },
              { value: '99%', label: 'Works on any website', labelAr: 'يعمل على أي موقع' },
              { value: '0', label: 'Lines of code needed', labelAr: 'سطور كود مطلوبة' },
            ].map((s) => (
              <div key={s.value} className="text-center">
                <p className="text-3xl font-black bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">{s.value}</p>
                <p className="text-xs text-slate-600 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="py-20 px-8">
        <FadeIn className="text-center mb-16">
          <h2 className="text-3xl font-black mb-3">كيف يعمل؟ <span className="text-slate-500">How It Works</span></h2>
          <p className="text-slate-500">Three simple steps to full automation</p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { step: '01', icon: Video, title: 'Record', titleAr: 'سجّل', desc: 'Screen record yourself doing the task manually — just once', color: 'from-purple-600 to-purple-400' },
            { step: '02', icon: Brain, title: 'AI Analyzes', titleAr: 'الذكاء يفهم', desc: 'Our AI watches the recording and extracts every action and element', color: 'from-blue-600 to-cyan-400' },
            { step: '03', icon: Zap, title: 'Automates', titleAr: 'ينفّذ تلقائياً', desc: 'One click runs your workflow reliably, forever, on any schedule', color: 'from-emerald-600 to-teal-400' },
          ].map((item, i) => (
            <FadeIn key={item.step} delay={i * 0.15}>
              <div className="relative p-8 bg-slate-900/40 border border-white/5 rounded-3xl hover:border-white/10 transition-all group">
                <div className="absolute top-4 right-4 text-6xl font-black text-white/3 select-none">{item.step}</div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 shadow-xl`}>
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-black text-white mb-1">{item.title}</h3>
                <p className="text-sm font-bold text-slate-500 mb-3" dir="rtl">{item.titleAr}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-8 bg-slate-900/20">
        <FadeIn className="text-center mb-12">
          <h2 className="text-3xl font-black mb-3">حالات الاستخدام <span className="text-slate-500">Use Cases</span></h2>
        </FadeIn>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {USE_CASES.map((uc, i) => (
            <FadeIn key={uc.title} delay={i * 0.08}>
              <div className="p-6 bg-slate-900/40 border border-white/5 rounded-2xl hover:border-purple-500/20 hover:bg-purple-500/5 transition-all group cursor-pointer">
                <div className="text-3xl mb-4">{uc.icon}</div>
                <h3 className="font-black text-white mb-0.5">{uc.title}</h3>
                <p className="text-xs font-bold text-purple-400 mb-2" dir="rtl">{uc.titleAr}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{uc.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-20 px-8">
        <FadeIn className="text-center mb-12">
          <h2 className="text-3xl font-black mb-3">مقارنة مع المنافسين <span className="text-slate-500">vs Competitors</span></h2>
        </FadeIn>
        <FadeIn>
          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-sm font-bold text-slate-500">Feature / الميزة</th>
                  <th className="p-4 text-center">
                    <span className="text-sm font-black text-purple-400">Execra</span>
                  </th>
                  <th className="p-4 text-center text-sm font-bold text-slate-600">Bardeen</th>
                  <th className="p-4 text-center text-sm font-bold text-slate-600">Zapier</th>
                  <th className="p-4 text-center text-sm font-bold text-slate-600">UiPath</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.feature} className={`border-b border-white/5 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                    <td className="p-4">
                      <p className="text-sm font-bold text-white">{row.feature}</p>
                      <p className="text-xs text-slate-600" dir="rtl">{row.featureAr}</p>
                    </td>
                    {[row.autopilot, row.bardeen, row.zapier, row.uipath].map((val, j) => (
                      <td key={j} className="p-4 text-center">
                        {val === true ? (
                          <Check className={`w-5 h-5 mx-auto ${j === 0 ? 'text-emerald-400' : 'text-slate-500'}`} />
                        ) : val === 'partial' ? (
                          <span className="text-amber-400 text-lg">⚠️</span>
                        ) : (
                          <span className="text-slate-700 text-lg">✗</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>
      </section>

      {/* Pricing */}
      <section className="py-20 px-8 bg-slate-900/20">
        <FadeIn className="text-center mb-12">
          <h2 className="text-3xl font-black mb-3">الأسعار <span className="text-slate-500">Pricing</span></h2>
          <p className="text-slate-500">Start free, scale as you grow</p>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {PLANS.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.1}>
              <div className={`p-8 rounded-3xl border transition-all relative ${
                plan.accent
                  ? 'bg-gradient-to-b from-purple-600/20 to-blue-600/10 border-purple-500/30 shadow-xl shadow-purple-500/10'
                  : 'bg-slate-900/40 border-white/5'
              }`}>
                {plan.accent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[10px] font-black px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{plan.name}</p>
                <p className="text-xs text-slate-600" dir="rtl">{plan.nameAr}</p>
                <div className="mt-3 mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  {plan.period && <span className="text-sm text-slate-500">{plan.period}</span>}
                </div>
                <ul className="space-y-2 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-400">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/register')}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    plan.accent
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:shadow-purple-600/20'
                      : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  {plan.cta} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 to-transparent pointer-events-none" />
        <FadeIn className="max-w-2xl mx-auto relative">
          <h2 className="text-4xl font-black mb-4" dir="rtl">
            ابدأ مجاناً اليوم
          </h2>
          <p className="text-xl font-black text-slate-400 mb-2">Start automating in under 5 minutes</p>
          <p className="text-slate-600 mb-10">No credit card. No setup. No code.</p>
          <button
            onClick={() => navigate('/register')}
            className="group inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black text-lg hover:shadow-2xl hover:shadow-purple-600/30 transition-all"
          >
            ابدأ الآن — It's Free
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="py-10 px-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span>Execra © 2026</span>
        </div>
        <div className="flex items-center gap-1 text-slate-700" dir="rtl">
          <Globe className="w-4 h-4" />
          <span>اللغة العربية مدعومة بالكامل</span>
        </div>
      </footer>
    </div>
  );
};

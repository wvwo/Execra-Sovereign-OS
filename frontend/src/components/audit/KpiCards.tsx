import React from 'react';
import { KpiMetrics } from '../../types';
import { motion } from 'framer-motion';
import { 
  Target, 
  Clock, 
  AlertTriangle, 
  ShieldCheck 
} from 'lucide-react';

interface Props {
  metrics: KpiMetrics;
}

export const KpiCards: React.FC<Props> = ({ metrics }) => {
  const cards = [
    { 
      label: 'Sequence Success Rate', 
      value: `${(metrics.success_rate * 100).toFixed(1)}%`, 
      icon: Target, 
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10'
    },
    { 
      label: 'Avg. Latency', 
      value: `${(metrics.avg_processing_time_ms / 1000).toFixed(2)}s`, 
      icon: Clock, 
      color: 'text-blue-400',
      bg: 'bg-blue-400/10'
    },
    { 
      label: 'Error Incidence', 
      value: `${(metrics.error_rate * 100).toFixed(1)}%`, 
      icon: AlertTriangle, 
      color: 'text-orange-400',
      bg: 'bg-orange-400/10'
    },
    { 
      label: 'SLA Status', 
      value: metrics.sla_compliance, 
      icon: ShieldCheck, 
      color: 'text-purple-400',
      bg: 'bg-purple-400/10'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-sm group hover:border-white/10 transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div className={`w-12 h-12 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{card.label}</p>
            <p className="text-2xl font-black text-white mt-1">{card.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

import React from 'react';
import { KpiMetrics } from '../../types';
import { CheckCircle, Clock, AlertOctagon, Shield } from 'lucide-react';

interface Props {
  metrics: KpiMetrics;
}

export const KpiCards: React.FC<Props> = ({ metrics }) => {
  const cards = [
    {
      title: 'نسبة النجاح',
      value: `${(metrics.success_rate * 100).toFixed(1)}%`,
      icon: CheckCircle,
      color: metrics.success_rate >= 0.8 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50',
    },
    {
      title: 'متوسط الوقت',
      value: `${(metrics.avg_processing_time_ms / 1000).toFixed(1)}s`,
      icon: Clock,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'معدل الخطأ',
      value: `${(metrics.error_rate * 100).toFixed(1)}%`,
      icon: AlertOctagon,
      color: metrics.error_rate <= 0.05 ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50',
    },
    {
      title: 'الامتثال',
      value: metrics.sla_compliance === 'PASS' ? 'متوافق' : 'غير متوافق',
      icon: Shield,
      color: metrics.sla_compliance === 'PASS' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.title} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">{card.title}</span>
            <div className={`p-2 rounded-lg ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
};

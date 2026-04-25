import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
// Assuming these exist or will be created
import { KpiCards } from '../components/audit/KpiCards';
import { IntegrityVerifier } from '../components/audit/IntegrityVerifier';
import { Shield, FileCheck } from 'lucide-react';

export const AuditPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await api.get('/audit/query?limit=1000');
      return res.data;
    }
  });

  const verifyIntegrity = async () => {
    const res = await api.get(`/audit/verify/${selectedDate}`);
    return res.data;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة الرقابة والامتثال</h1>
        <p className="text-gray-500">مراقبة الأحداث والتحقق من سلامة السجلات (ISO 27001)</p>
      </div>

      <KpiCards metrics={{success_rate: 0.95, avg_processing_time_ms: 12000, error_rate: 0.02, sla_compliance: 'PASS'}} />

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary-600" />
            <h2 className="text-lg font-semibold">التحقق من سلامة السلسلة</h2>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <IntegrityVerifier date={selectedDate} onVerify={verifyIntegrity} />
          </div>
        </div>
        <p className="text-sm text-gray-500">
          يتحقق من أن سجلات التدقيق لم يتم العبث بها باستخدام سلسلة SHA-256 (Blockchain-style).
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          <FileCheck className="w-5 h-5 text-gray-400" />
          <h2 className="font-semibold">سجل الأحداث</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
        ) : (
          <div className="p-4">جدول السجلات هنا...</div>
        )}
      </div>
    </div>
  );
};

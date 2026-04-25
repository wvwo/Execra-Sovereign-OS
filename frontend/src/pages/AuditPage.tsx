import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { KpiCards } from '../components/audit/KpiCards';
import { IntegrityVerifier } from '../components/audit/IntegrityVerifier';
import { 
  Shield, 
  FileCheck, 
  Activity, 
  Search, 
  Download, 
  Filter,
  Lock,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export const AuditPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await api.get('/audit/query?limit=100');
      return res.data;
    }
  });

  const verifyIntegrity = async () => {
    const res = await api.get(`/audit/verify/${selectedDate}`);
    return res.data;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Sovereign Audit Vault</h1>
          <p className="text-slate-500 mt-1">ISO 27001 Compliant Real-time Event Monitoring & Integrity Verification</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-slate-900/40 border border-white/5 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white transition-all flex items-center gap-2 text-sm font-bold">
            <Download className="w-4 h-4" /> Export logs
          </button>
          <button className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-purple-600/20 text-sm flex items-center gap-2">
            <Shield className="w-4 h-4" /> Forensic View
          </button>
        </div>
      </div>

      <KpiCards metrics={{success_rate: 0.998, avg_processing_time_ms: 840, error_rate: 0.002, sla_compliance: 'PASS'}} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Integrity Verification Card */}
        <div className="lg:col-span-1 bg-slate-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden h-fit">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Lock className="w-24 h-24 text-emerald-500" />
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-500" />
              </div>
              <h2 className="text-lg font-black text-white">Chain Integrity</h2>
            </div>

            <p className="text-sm text-slate-500 leading-relaxed">
              Verify that audit logs haven't been tampered with using SHA-256 chain verification.
            </p>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Target Sequence Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
              <IntegrityVerifier date={selectedDate} onVerify={verifyIntegrity} />
            </div>
            
            <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                <span className="text-slate-500">Node Status</span>
                <span className="text-emerald-500">Synchronized</span>
              </div>
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full w-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Event Logs Table */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/20">
            <div className="flex items-center gap-3">
              <FileCheck className="w-5 h-5 text-purple-400" />
              <h2 className="font-black text-white uppercase tracking-widest text-sm">Security Event Feed</h2>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input 
                  type="text" 
                  placeholder="Filter events..." 
                  className="bg-slate-950 border border-white/5 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <button className="p-1.5 bg-slate-950 border border-white/5 rounded-lg text-slate-500 hover:text-white transition-colors">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
            {isLoading ? (
              <div className="p-20 text-center space-y-4">
                <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Parsing audit sequence...</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-900 z-10 shadow-sm">
                  <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Event</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Severity</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(logs || []).map((log: any, i: number) => (
                    <motion.tr 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: i * 0.02 }}
                      key={i} 
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-white uppercase">{log.event_type}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {log.action}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`
                          text-[9px] font-black px-2 py-0.5 rounded border uppercase
                          ${log.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                            log.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                            'bg-blue-500/10 text-blue-400 border-blue-500/20'}
                        `}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-white">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

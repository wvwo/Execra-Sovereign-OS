import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Workflow } from '../types';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Play, 
  Edit3, 
  Trash2, 
  Clock, 
  ExternalLink,
  Search,
  Filter,
  MoreVertical,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WorkflowsPage: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const res = await api.get('/workflows');
      const data = res.data;
      setWorkflows(Array.isArray(data) ? data : data.workflows || []);

    } catch (err) {
      console.error('Failed to fetch workflows', err);
    } finally {
      setIsLoading(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Automation Fleet</h1>
          <p className="text-slate-500 mt-1">Manage and orchestrate your autonomous agents</p>
        </div>
        <button 
          onClick={() => navigate('/upload')}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Deploy New Agent
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Active Workflows', value: workflows.length, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Total Executions', value: '1,284', icon: Play, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Uptime Score', value: '99.9%', icon: Clock, color: 'text-purple-400', bg: 'bg-purple-400/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl flex items-center gap-6">
            <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text"
            placeholder="Search workflows by name or URL..."
            className="w-full bg-slate-900/40 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          />
        </div>
        <button className="bg-slate-900/40 border border-white/5 p-3 rounded-xl text-slate-400 hover:text-white transition-colors">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : workflows.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/20 border-2 border-dashed border-white/5 rounded-3xl">
          <p className="text-slate-500 font-medium">No agents found in your fleet.</p>
          <button onClick={() => navigate('/upload')} className="text-purple-400 font-bold mt-2 hover:underline">Start your first automation</button>
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {workflows.map((wf) => (
            <motion.div 
              key={wf.id}
              variants={item}
              className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 hover:border-purple-500/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full ${wf.status === 'active' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'} animate-pulse`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-white truncate">{wf.workflow_title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                    <p className="text-xs text-slate-500 truncate">{wf.start_url}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/5">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Steps</p>
                  <p className="text-sm font-bold text-white mt-1">{wf.steps.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</p>
                  <p className={`text-xs font-bold mt-1 uppercase ${wf.status === 'active' ? 'text-emerald-400' : 'text-slate-400'}`}>{wf.status}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Created</p>
                  <p className="text-sm font-bold text-white mt-1">{new Date(wf.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button 
                  onClick={() => navigate(`/execute/${wf.id}`)}
                  className="bg-white/5 hover:bg-purple-600/10 hover:text-purple-400 border border-white/5 hover:border-purple-500/20 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" /> Run Agent
                </button>
                <button 
                  onClick={() => navigate(`/editor/${wf.id}`)}
                  className="bg-white/5 hover:bg-blue-600/10 hover:text-blue-400 border border-white/5 hover:border-blue-500/20 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" /> Edit Script
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

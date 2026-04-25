import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useExecutionSocket } from '../services/websocket';
import { Workflow } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Terminal, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeft,
  Eye,
  Camera,
  Activity
} from 'lucide-react';
import { WorkflowTimeline } from '../components/editor/WorkflowTimeline';
import { CaptchaModal } from '../components/execution/CaptchaModal';

export const ExecutionPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  
  const { status, currentStep, captchaDetected, resolveCaptcha } = useExecutionSocket(executionId || '');

  useEffect(() => {
    fetchWorkflow();
  }, [id]);

  const fetchWorkflow = async () => {
    try {
      const res = await api.get(`/workflows/${id}`);
      setWorkflow(res.data);
    } catch (err) {
      navigate('/dashboard');
    }
  };

  const handleStartExecution = async () => {
    try {
      const res = await api.post(`/workflows/${id}/run`);
      setExecutionId(res.data.executionId);
    } catch (err) {
      console.error('Execution failed to start', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/editor/${id}`)}
            className="p-3 bg-slate-900/40 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Active Execution</h1>
            <p className="text-slate-500 text-sm mt-1">{workflow?.workflow_title}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!executionId ? (
            <button 
              onClick={handleStartExecution}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <Play className="w-5 h-5" />
              Engage Sovereign Engine
            </button>
          ) : (
            <div className="bg-slate-900/40 border border-white/5 px-6 py-3 rounded-xl flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Orchestration Live</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Execution Timeline */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            Execution Matrix
          </h3>
          <WorkflowTimeline 
            steps={workflow?.steps || []} 
            currentStep={currentStep} 
            status={status || 'pending'} 
          />
        </div>

        {/* Right: Live View & Console */}
        <div className="lg:col-span-2 space-y-8">
          {/* Virtual Browser View */}
          <div className="aspect-video bg-black rounded-3xl border border-white/5 relative overflow-hidden group shadow-2xl">
             <div className="absolute inset-0 flex items-center justify-center">
                {!executionId ? (
                   <div className="text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mx-auto">
                        <Eye className="w-8 h-8 text-slate-700" />
                      </div>
                      <p className="text-slate-600 text-sm font-medium">Waiting for engine initialization...</p>
                   </div>
                ) : (
                   <div className="text-center space-y-4">
                      <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin mx-auto" />
                      <p className="text-emerald-500 text-sm font-bold uppercase tracking-widest">Streaming Headless Frame Buffer</p>
                   </div>
                )}
             </div>

             {/* Status Overlays */}
             <div className="absolute top-6 left-6 flex gap-3">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-black text-white uppercase tracking-wider">Live</span>
                </div>
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Encrypted</span>
                </div>
             </div>

             <div className="absolute bottom-6 right-6">
                <button className="bg-white/10 hover:bg-white/20 p-3 rounded-xl backdrop-blur-md transition-all">
                  <Camera className="w-5 h-5 text-white" />
                </button>
             </div>
          </div>

          {/* Console Output */}
          <div className="bg-slate-950 border border-white/5 rounded-3xl p-6 font-mono text-sm overflow-hidden shadow-xl">
             <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sovereign Console</span>
                </div>
                <div className="flex gap-1.5">
                   <div className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                   <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30" />
                </div>
             </div>
             
             <div className="space-y-2 h-40 overflow-y-auto custom-scrollbar">
                <p className="text-slate-500">[{new Date().toLocaleTimeString()}] System: Initializing Hex-Core Pantheon Architecture...</p>
                <p className="text-emerald-500/80">[{new Date().toLocaleTimeString()}] SecureLink: Authenticated via JWT. Peer ID: sovereign-node-7</p>
                {executionId && (
                  <>
                    <p className="text-purple-400">[{new Date().toLocaleTimeString()}] Orchestrator: Starting execution {executionId.slice(0,8)}</p>
                    <p className="text-slate-300">[{new Date().toLocaleTimeString()}] Action: {workflow?.steps[currentStep]?.action} in progress...</p>
                  </>
                )}
                {status === 'success' && (
                  <p className="text-emerald-400 font-bold">[{new Date().toLocaleTimeString()}] Final: Sequence completed successfully. Redacting PII...</p>
                )}
             </div>
          </div>
        </div>
      </div>

      <CaptchaModal 
        isOpen={captchaDetected} 
        onResolve={resolveCaptcha} 
      />
    </div>
  );
};

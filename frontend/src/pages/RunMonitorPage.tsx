import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Workflow, WorkflowExecution, ExecutionLogEntry } from '../types';
import { useExecutionSocket } from '../services/websocket';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Play, Square, RefreshCw, CheckCircle2,
  XCircle, Clock, AlertCircle, Terminal, Variable,
  ChevronDown, Share2
} from 'lucide-react';

const LOG_COLORS: Record<string, string> = {
  info: 'text-slate-400',
  action: 'text-emerald-400',
  success: 'text-emerald-300',
  error: 'text-red-400',
  warn: 'text-amber-400',
  extract: 'text-purple-400',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4 text-slate-500" />,
  running: <div className="w-4 h-4 rounded-full bg-purple-500 animate-ping" />,
  success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  failed: <XCircle className="w-4 h-4 text-red-400" />,
  skipped: <ChevronDown className="w-4 h-4 text-slate-600" />,
};

export const RunMonitorPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [logs, setLogs] = useState<ExecutionLogEntry[]>([]);
  const [extractedVars, setExtractedVars] = useState<Record<string, string>>({});
  const [stepStatuses, setStepStatuses] = useState<Record<number, string>>({});
  const [isStarting, setIsStarting] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const { status, currentStep } = useExecutionSocket(executionId || '');

  useEffect(() => {
    api.get(`/workflows/${id}`)
      .then(r => setWorkflow(r.data))
      .catch(() => navigate('/dashboard'));
  }, [id]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    if (!status) return;
    if (status === 'success') {
      setLogs(prev => [...prev, {
        timestamp: new Date().toISOString(),
        level: 'success',
        message: '✅ Workflow completed successfully',
      }]);
    } else if (status === 'failure' || status === 'failed') {
      setLogs(prev => [...prev, {
        timestamp: new Date().toISOString(),
        level: 'error',
        message: '❌ Workflow execution failed',
      }]);
    }
    if (currentStep !== undefined && workflow) {
      setStepStatuses(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(k => {
          if (updated[Number(k)] === 'running') updated[Number(k)] = 'success';
        });
        updated[currentStep] = 'running';
        return updated;
      });
      const step = workflow.steps[currentStep];
      if (step) {
        setLogs(prev => [...prev, {
          timestamp: new Date().toISOString(),
          level: 'action',
          message: `▶ Step ${currentStep + 1}: ${step.description} [${step.action}]`,
          step_id: step.step_id,
        }]);
      }
    }
  }, [status, currentStep]);

  const handleStart = async () => {
    setIsStarting(true);
    setLogs([]);
    setStepStatuses({});
    setExtractedVars({});
    try {
      const res = await api.post(`/execute/${id}/run`);
      setExecutionId(res.data.executionId);
      setLogs([{
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `🚀 Execution started — ID: ${res.data.executionId}`,
      }]);
    } catch (err: unknown) {
      setLogs([{
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Failed to start: ${err instanceof Error ? err.message : 'Unknown error'}`,
      }]);
    } finally {
      setIsStarting(false);
    }
  };

  const isRunning = status === 'running';
  const isComplete = status === 'success' || status === 'failure' || status === 'failed';
  const completedSteps = Object.values(stepStatuses).filter(s => s === 'success').length;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/editor/${id}`)} className="p-3 bg-slate-900/40 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">{workflow?.title || workflow?.workflow_title}</h1>
            <p className="text-slate-500 text-sm mt-0.5">Live Execution Monitor</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {executionId && (
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900/40 border border-white/5 text-slate-400 hover:text-white transition-all">
              <Share2 className="w-4 h-4" /> Share Report
            </button>
          )}
          {!isRunning ? (
            <button
              onClick={handleStart}
              disabled={isStarting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 transition-all active:scale-95"
            >
              {isStarting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              {isStarting ? 'Starting...' : (isComplete ? 'Run Again' : 'Start Execution')}
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Running</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {executionId && (
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Progress</span>
            <span className="text-xs font-bold text-white">{completedSteps} / {workflow?.steps.length || 0} steps</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${workflow?.steps.length ? (completedSteps / workflow.steps.length) * 100 : 0}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Step timeline */}
        <div className="xl:col-span-1 bg-slate-900/40 border border-white/5 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Step Timeline</h3>
          <div className="space-y-1 max-h-[480px] overflow-y-auto pr-1">
            {(workflow?.steps || []).map((step, i) => {
              const stepStatus = stepStatuses[i] || (executionId ? 'pending' : 'idle');
              return (
                <div
                  key={step.step_id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                    stepStatus === 'running' ? 'bg-purple-500/10 border border-purple-500/20' :
                    stepStatus === 'success' ? 'bg-emerald-500/5' :
                    stepStatus === 'failed' ? 'bg-red-500/5' :
                    'opacity-50'
                  }`}
                >
                  <div className="shrink-0 w-4 h-4 flex items-center justify-center">
                    {stepStatus === 'running' ? (
                      <div className="w-3 h-3 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
                    ) : stepStatus === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : stepStatus === 'failed' ? (
                      <XCircle className="w-4 h-4 text-red-400" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-slate-700" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{step.description}</p>
                    <span className="text-[10px] text-slate-600">{step.action}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Console + Variables */}
        <div className="xl:col-span-2 space-y-4">
          {/* Console */}
          <div className="bg-slate-950 border border-white/5 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-slate-900/50">
              <Terminal className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Console</span>
              <div className="ml-auto flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
            </div>
            <div className="p-4 font-mono text-xs space-y-1 max-h-72 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-slate-700">$ Awaiting execution...</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-slate-700 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString('en', { hour12: false })}
                    </span>
                    <span className={LOG_COLORS[log.level] || 'text-slate-400'}>{log.message}</span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* Extracted variables */}
          {Object.keys(extractedVars).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/40 border border-purple-500/20 rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Variable className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest">Extracted Variables</h3>
              </div>
              <div className="space-y-2">
                {Object.entries(extractedVars).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-3 p-2 bg-purple-500/5 rounded-lg">
                    <code className="text-xs text-purple-300 font-mono">{`{{${k}}}`}</code>
                    <span className="text-slate-400 text-xs">=</span>
                    <code className="text-xs text-white font-mono truncate">{v}</code>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Completion summary */}
          <AnimatePresence>
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-2xl border ${status === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}
              >
                <div className="flex items-center gap-3">
                  {status === 'success' ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-red-400 shrink-0" />
                  )}
                  <div>
                    <p className={`font-black text-lg ${status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {status === 'success' ? 'Execution Successful!' : 'Execution Failed'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {completedSteps} of {workflow?.steps.length} steps completed
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

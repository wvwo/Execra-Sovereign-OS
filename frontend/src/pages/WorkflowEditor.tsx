import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Workflow, WorkflowStep } from '../types';
import { motion } from 'framer-motion';
import { 
  Save, 
  Play, 
  ArrowLeft, 
  Plus, 
  Shield, 
  Code,
  Settings,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { StepCard } from '../components/editor/StepCard';

export const WorkflowEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

  useEffect(() => {
    fetchWorkflow();
  }, [id]);

  const fetchWorkflow = async () => {
    try {
      const res = await api.get(`/workflows/${id}`);
      setWorkflow(res.data);
    } catch (err) {
      console.error('Failed to fetch workflow', err);
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStep = (index: number, updatedStep: WorkflowStep) => {
    if (!workflow) return;
    const newSteps = [...workflow.steps];
    newSteps[index] = updatedStep;
    setWorkflow({ ...workflow, steps: newSteps });
  };

  const handleAddStep = () => {
    if (!workflow) return;
    const newStep: WorkflowStep = {
      step_id: workflow.steps.length + 1,
      action: 'navigate',
      description: 'New step',
      target_url: 'https://'
    };
    setWorkflow({ ...workflow, steps: [...workflow.steps, newStep] });
  };

  const handleSave = async () => {
    if (!workflow) return;
    setIsSaving(true);
    try {
      await api.patch(`/workflows/${id}`, workflow);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Accessing Neural Archive...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-3 bg-slate-900/40 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <input 
                type="text"
                value={workflow?.workflow_title}
                onChange={(e) => setWorkflow(prev => prev ? { ...prev, workflow_title: e.target.value } : null)}
                className="text-2xl font-black text-white bg-transparent border-none focus:outline-none focus:ring-0 w-full"
              />
            </div>
            <p className="text-slate-500 text-sm mt-1">Editing autonomous execution sequence</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all
              ${saveStatus === 'success' 
                ? 'bg-emerald-500 text-white' 
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
              }
            `}
          >
            {saveStatus === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {isSaving ? 'Synchronizing...' : saveStatus === 'success' ? 'Synchronized' : 'Save Changes'}
          </button>
          <button 
            onClick={() => navigate(`/execute/${id}`)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 transition-all active:scale-95"
          >
            <Play className="w-5 h-5" />
            Engage Agent
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-2 px-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Sequence Matrix</h3>
            <span className="text-[10px] font-black text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded border border-purple-500/20">
              {workflow?.steps.length} TOTAL ACTIONS
            </span>
          </div>

          <div className="space-y-4">
            {workflow?.steps.map((step, index) => (
              <StepCard 
                key={index}
                index={index}
                step={step}
                onUpdate={(updated) => handleUpdateStep(index, updated)}
                onDelete={() => {
                  const newSteps = workflow.steps.filter((_, i) => i !== index);
                  setWorkflow({ ...workflow, steps: newSteps });
                }}
              />
            ))}

            <button 
              onClick={handleAddStep}
              className="w-full py-8 border-2 border-dashed border-white/5 rounded-3xl text-slate-500 hover:text-purple-400 hover:border-purple-500/20 hover:bg-purple-500/5 transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold uppercase tracking-widest">Append Action</span>
            </button>
          </div>
        </div>

        {/* Sidebar / Settings */}
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              Sovereign Safeguards
            </h3>
            
            <div className="space-y-4">
              {[
                { label: 'Stealth Execution', desc: 'Mimic human movement', active: true },
                { label: 'Ghost Proxying', desc: 'Local node rotation', active: true },
                { label: 'Auto-Healing', desc: 'Resilient DOM adaptation', active: true },
                { label: 'PII Redaction', desc: 'Zero-Trust scrubbing', active: true },
              ].map((guard, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div>
                    <p className="text-xs font-bold text-white">{guard.label}</p>
                    <p className="text-[10px] text-slate-500">{guard.desc}</p>
                  </div>
                  <div className="w-8 h-4 bg-emerald-500/20 border border-emerald-500/50 rounded-full relative">
                    <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Execution Metadata
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Architecture</span>
                <span className="text-white font-mono">Hex-Core v7</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Security Layer</span>
                <span className="text-white font-mono">Military AES-256</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Synced</span>
                <span className="text-white font-mono">Just Now</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Workflow, WorkflowStep, ActionType } from '../types';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, Play, ArrowLeft, Plus, Sparkles, Code2,
  CheckCircle2, Undo2, Redo2, Search, HelpCircle
} from 'lucide-react';
import { StepEditor } from '../components/editor/StepEditor';
import { AIAssistant } from '../components/editor/AIAssistant';

// Sortable wrapper around StepEditor
const SortableStep: React.FC<{
  id: string;
  step: WorkflowStep;
  index: number;
  onChange: (s: WorkflowStep) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  availableVariables?: string[];
}> = ({ id, step, index, onChange, onDelete, onDuplicate, availableVariables }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style}>
      <StepEditor
        step={step}
        index={index}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        onChange={onChange}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        availableVariables={availableVariables}
      />
    </div>
  );
};

export const WorkflowEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');
  const [showAI, setShowAI] = useState(false);
  const [showJSON, setShowJSON] = useState(false);
  const [jsonError, setJsonError] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [history, setHistory] = useState<WorkflowStep[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchWorkflow();
  }, [id]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSaveRef.current?.(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undoRef.current?.(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redoRef.current?.(); }
      if (e.key === '?') setShowHelp(h => !h);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Stable refs for keyboard handler
  const handleSaveRef = React.useRef<() => void>();
  const undoRef = React.useRef<() => void>();
  const redoRef = React.useRef<() => void>();

  const fetchWorkflow = async () => {
    try {
      const res = await api.get(`/workflows/${id}`);
      setWorkflow(res.data);
      setJsonText(JSON.stringify(res.data.steps, null, 2));
    } catch {
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const pushHistory = useCallback((steps: WorkflowStep[]) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, steps].slice(-50);
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const updateSteps = (steps: WorkflowStep[]) => {
    if (!workflow) return;
    pushHistory(workflow.steps);
    setWorkflow(w => w ? { ...w, steps } : null);
    setJsonText(JSON.stringify(steps, null, 2));
  };

  const undo = useCallback(() => {
    if (historyIndex < 0 || !workflow) return;
    const steps = history[historyIndex];
    setWorkflow(w => w ? { ...w, steps } : null);
    setHistoryIndex(i => i - 1);
  }, [historyIndex, history, workflow]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1 || !workflow) return;
    const steps = history[historyIndex + 1];
    setWorkflow(w => w ? { ...w, steps } : null);
    setHistoryIndex(i => i + 1);
  }, [historyIndex, history, workflow]);

  const handleSave = useCallback(async () => {
    if (!workflow) return;
    setIsSaving(true);
    try {
      await api.put(`/workflows/${id}`, { steps: workflow.steps, title: workflow.title || workflow.workflow_title });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch { /* silent */ }
    finally { setIsSaving(false); }
  }, [workflow, id]);

  // Update stable refs
  handleSaveRef.current = handleSave;
  undoRef.current = undo;
  redoRef.current = redo;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !workflow) return;
    const oldIdx = workflow.steps.findIndex(s => `step-${s.step_id}` === active.id);
    const newIdx = workflow.steps.findIndex(s => `step-${s.step_id}` === over.id);
    if (oldIdx !== -1 && newIdx !== -1) updateSteps(arrayMove(workflow.steps, oldIdx, newIdx));
  };

  const handleStepChange = (index: number, updated: WorkflowStep) => {
    if (!workflow) return;
    const steps = [...workflow.steps];
    steps[index] = updated;
    updateSteps(steps);
  };

  const handleDeleteStep = (index: number) => {
    if (!workflow) return;
    updateSteps(workflow.steps.filter((_, i) => i !== index));
  };

  const handleDuplicateStep = (index: number) => {
    if (!workflow) return;
    const maxId = Math.max(...workflow.steps.map(s => s.step_id), 0);
    const copy = { ...workflow.steps[index], step_id: maxId + 1 };
    const steps = [...workflow.steps];
    steps.splice(index + 1, 0, copy);
    updateSteps(steps);
  };

  const handleAddStep = (afterIndex?: number) => {
    if (!workflow) return;
    const maxId = Math.max(...workflow.steps.map(s => s.step_id), 0);
    const newStep: WorkflowStep = {
      step_id: maxId + 1,
      action: 'click' as ActionType,
      description: 'New step',
      target_type: 'text',
      timeout_ms: 5000,
      retry_count: 2,
      on_failure: 'stop',
    };
    const steps = [...workflow.steps];
    if (afterIndex !== undefined) steps.splice(afterIndex + 1, 0, newStep);
    else steps.push(newStep);
    updateSteps(steps);
  };

  const handleJSONApply = () => {
    try {
      const steps = JSON.parse(jsonText);
      if (!Array.isArray(steps)) throw new Error('Root must be an array');
      updateSteps(steps);
      setJsonError('');
      setShowJSON(false);
    } catch (e: unknown) {
      setJsonError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  const availableVariables = (workflow?.steps || [])
    .filter(s => s.action === 'extract' && s.variable_name)
    .map(s => s.variable_name!);

  const filteredSteps = searchFilter
    ? (workflow?.steps || []).filter(s =>
        s.description?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        s.action.includes(searchFilter.toLowerCase())
      )
    : (workflow?.steps || []);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden -mx-8 -mb-8">
      {/* Main editor area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5 bg-slate-900/40 shrink-0 flex-wrap gap-y-2">
          <button onClick={() => navigate('/dashboard')} className="p-2 bg-slate-800/60 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={workflow?.title || workflow?.workflow_title || ''}
            onChange={e => setWorkflow(w => w ? { ...w, title: e.target.value, workflow_title: e.target.value } : null)}
            className="flex-1 min-w-0 text-base font-black text-white bg-transparent border-none focus:outline-none mx-2"
            placeholder="Workflow title..."
          />

          <div className="flex items-center gap-1 shrink-0">
            <button onClick={undo} disabled={historyIndex < 0} title="Undo (Ctrl+Z)" className="p-2 bg-slate-800/60 border border-white/5 rounded-xl text-slate-500 hover:text-white disabled:opacity-30 transition-all">
              <Undo2 className="w-4 h-4" />
            </button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo (Ctrl+Y)" className="p-2 bg-slate-800/60 border border-white/5 rounded-xl text-slate-500 hover:text-white disabled:opacity-30 transition-all">
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <div className="h-5 w-px bg-white/10 shrink-0" />

          <button
            onClick={() => { setShowJSON(!showJSON); setShowAI(false); }}
            className={`p-2 border rounded-xl transition-all ${showJSON ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-slate-800/60 border-white/5 text-slate-500 hover:text-white'}`}
            title="JSON editor"
          >
            <Code2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => { setShowAI(!showAI); setShowJSON(false); }}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-bold transition-all ${showAI ? 'bg-purple-600/20 border-purple-500/30 text-purple-400' : 'bg-slate-800/60 border-white/5 text-slate-500 hover:text-white'}`}
          >
            <Sparkles className="w-4 h-4" /> AI
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              saveStatus === 'success'
                ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
            }`}
          >
            {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :
             saveStatus === 'success' ? <><CheckCircle2 className="w-4 h-4" /> Saved</> :
             <><Save className="w-4 h-4" /> Save</>}
          </button>

          <button
            onClick={() => navigate(`/execute/${id}`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-all"
          >
            <Play className="w-4 h-4" /> Run
          </button>
        </div>

        {/* JSON editor panel */}
        <AnimatePresence>
          {showJSON && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 260, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="shrink-0 border-b border-white/5 overflow-hidden"
            >
              <div className="p-4 h-full flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">Raw JSON Editor</p>
                  <div className="flex items-center gap-2">
                    {jsonError && <p className="text-xs text-red-400">{jsonError}</p>}
                    <button onClick={handleJSONApply} className="text-xs font-bold px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20">
                      Apply
                    </button>
                  </div>
                </div>
                <textarea
                  value={jsonText}
                  onChange={e => setJsonText(e.target.value)}
                  spellCheck={false}
                  className="flex-1 font-mono text-xs text-slate-300 bg-slate-950 border border-white/5 rounded-xl p-3 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Steps scroll area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                placeholder="Filter steps..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full bg-slate-900/40 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              />
            </div>
            <span className="text-xs text-slate-600 shrink-0">{workflow?.steps.length || 0} steps</span>
            <button onClick={() => setShowHelp(h => !h)} className="p-1.5 text-slate-600 hover:text-slate-400">
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          <AnimatePresence>
            {showHelp && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="mb-4 p-4 bg-slate-800/40 border border-white/5 rounded-xl text-xs text-slate-400 grid grid-cols-2 gap-2">
                {[['Ctrl+S','Save'],['Ctrl+Z','Undo'],['Ctrl+Y','Redo'],['?','Toggle shortcuts']].map(([k,d]) => (
                  <div key={k} className="flex items-center gap-2">
                    <code className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">{k}</code>
                    <span>{d}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {filteredSteps.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed border-white/5 rounded-2xl">
              <p className="text-slate-600">{searchFilter ? 'No steps match filter.' : 'No steps yet.'}</p>
              {!searchFilter && (
                <button onClick={() => handleAddStep()} className="text-purple-400 font-bold mt-2 hover:underline text-sm">
                  + Add your first step
                </button>
              )}
            </div>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={(workflow?.steps || []).map(s => `step-${s.step_id}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1.5">
                {filteredSteps.map((step) => {
                  const realIndex = (workflow?.steps || []).indexOf(step);
                  return (
                    <React.Fragment key={`step-${step.step_id}`}>
                      <SortableStep
                        id={`step-${step.step_id}`}
                        step={step}
                        index={realIndex}
                        onChange={(updated) => handleStepChange(realIndex, updated)}
                        onDelete={() => handleDeleteStep(realIndex)}
                        onDuplicate={() => handleDuplicateStep(realIndex)}
                        availableVariables={availableVariables}
                      />
                      {!searchFilter && (
                        <button
                          onClick={() => handleAddStep(realIndex)}
                          className="w-full py-0.5 text-[10px] font-bold text-transparent hover:text-slate-700 transition-colors flex items-center justify-center gap-1 group"
                        >
                          <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity">Insert here</span>
                        </button>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>

          {!searchFilter && (
            <button
              onClick={() => handleAddStep()}
              className="w-full mt-3 py-3 rounded-xl border-2 border-dashed border-white/5 hover:border-purple-500/30 text-slate-600 hover:text-purple-400 transition-all flex items-center justify-center gap-2 font-bold text-sm"
            >
              <Plus className="w-5 h-5" /> Add Step
            </button>
          )}
        </div>
      </div>

      {/* AI Sidebar */}
      <AnimatePresence>
        {showAI && workflow && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="shrink-0 overflow-hidden"
          >
            <div className="w-[360px] h-full">
              <AIAssistant
                workflow={workflow}
                onApplySteps={(steps) => {
                  const maxId = Math.max(...(workflow.steps.map(s => s.step_id)), 0);
                  const renumbered = steps.map((s, i) => ({ ...s, step_id: maxId + i + 1 }));
                  updateSteps([...workflow.steps, ...renumbered]);
                }}
                onApplyWorkflow={(updated) => setWorkflow(updated)}
                onClose={() => setShowAI(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

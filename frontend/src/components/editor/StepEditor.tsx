import React, { useState } from 'react';
import { WorkflowStep, ActionType } from '../../types';
import { ChevronDown, ChevronUp, Copy, Trash2, Play, GripVertical } from 'lucide-react';

const ACTION_COLORS: Record<ActionType, string> = {
  click: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  type: 'bg-green-400/10 text-green-400 border-green-400/20',
  extract: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  navigate: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  press: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',
  wait: 'bg-slate-400/10 text-slate-400 border-slate-400/20',
  scroll: 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20',
  screenshot: 'bg-pink-400/10 text-pink-400 border-pink-400/20',
  condition: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
  loop: 'bg-teal-400/10 text-teal-400 border-teal-400/20',
  api_call: 'bg-violet-400/10 text-violet-400 border-violet-400/20',
  transform: 'bg-rose-400/10 text-rose-400 border-rose-400/20',
  hover: 'bg-lime-400/10 text-lime-400 border-lime-400/20',
  webhook: 'bg-fuchsia-400/10 text-fuchsia-400 border-fuchsia-400/20',
};

const ACTION_ICONS: Record<ActionType, string> = {
  click: '👆', type: '⌨️', extract: '🔍', navigate: '🌐',
  press: '⌨️', wait: '⏳', scroll: '↕️', screenshot: '📸',
  condition: '🔀', loop: '🔄', api_call: '🔌', transform: '⚙️',
  hover: '🖱️', webhook: '🪝',
};

const ACTION_TYPES: ActionType[] = [
  'click', 'type', 'extract', 'navigate', 'press',
  'wait', 'scroll', 'screenshot', 'hover', 'webhook', 'api_call'
];

const TARGET_STRATEGIES = ['text', 'placeholder', 'aria', 'css', 'xpath', 'text_relative', 'role'];

interface StepEditorProps {
  step: WorkflowStep;
  index: number;
  isDragging: boolean;
  dragHandleProps?: Record<string, unknown>;
  onChange: (step: WorkflowStep) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onTestStep?: () => void;
  availableVariables?: string[];
}

export const StepEditor: React.FC<StepEditorProps> = ({
  step, index, isDragging, dragHandleProps,
  onChange, onDelete, onDuplicate, onTestStep, availableVariables = []
}) => {
  const [expanded, setExpanded] = useState(false);

  const colorClass = ACTION_COLORS[step.action] || 'bg-slate-400/10 text-slate-400 border-slate-400/20';

  const field = (key: keyof WorkflowStep, label: string, placeholder = '', type = 'text') => (
    <div>
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={(step[key] as string) || ''}
          onChange={e => onChange({ ...step, [key]: e.target.value })}
          placeholder={placeholder}
          className="w-full bg-slate-800/60 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
        />
        {placeholder.includes('{{') && availableVariables.length > 0 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            {availableVariables.slice(0, 2).map(v => (
              <button
                key={v}
                onClick={() => onChange({ ...step, [key]: `{{${v}}}` })}
                className="text-[10px] text-purple-400 hover:text-purple-300 bg-purple-400/10 px-1 py-0.5 rounded"
              >
                {`{{${v}}}`}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`border rounded-xl transition-all ${isDragging ? 'opacity-50 scale-95' : ''} ${
      expanded ? 'border-purple-500/30 bg-slate-900/60' : 'border-white/5 bg-slate-900/30 hover:border-white/10'
    }`}>
      {/* Step header (always visible) */}
      <div className="flex items-center gap-3 p-3">
        <div {...dragHandleProps} className="cursor-grab text-slate-700 hover:text-slate-500 transition-colors shrink-0">
          <GripVertical className="w-4 h-4" />
        </div>

        <span className="text-xs font-black text-slate-600 w-5 shrink-0">{index + 1}</span>

        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border shrink-0 ${colorClass}`}>
          {ACTION_ICONS[step.action]} {step.action}
        </span>

        <p className="flex-1 text-sm text-slate-300 truncate min-w-0">{step.description}</p>

        <div className="flex items-center gap-1 shrink-0">
          {onTestStep && (
            <button onClick={onTestStep} title="Test this step" className="p-1.5 text-slate-600 hover:text-emerald-400 transition-colors">
              <Play className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={onDuplicate} title="Duplicate step" className="p-1.5 text-slate-600 hover:text-blue-400 transition-colors">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} title="Delete step" className="p-1.5 text-slate-600 hover:text-red-400 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 text-slate-500 hover:text-white transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
          {/* Action type selector */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Action Type</label>
            <div className="flex flex-wrap gap-1.5">
              {ACTION_TYPES.map(a => (
                <button
                  key={a}
                  onClick={() => onChange({ ...step, action: a })}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                    step.action === a ? ACTION_COLORS[a] : 'border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-400'
                  }`}
                >
                  {ACTION_ICONS[a]} {a}
                </button>
              ))}
            </div>
          </div>

          {field('description', 'Description', 'What does this step do?')}

          {/* Fields based on action type */}
          {(step.action === 'click' || step.action === 'type' || step.action === 'extract' || step.action === 'hover') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Target Strategy</label>
                <select
                  value={step.target_type || 'text'}
                  onChange={e => onChange({ ...step, target_type: e.target.value as any })}
                  className="w-full bg-slate-800/60 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                >
                  {TARGET_STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {field('target_value', 'Target Value', 'Element text, selector, or label')}
            </div>
          )}

          {step.action === 'type' && field('input_value', 'Input Value', 'Text to type or {{variable_name}}', 'text')}
          {step.action === 'extract' && field('variable_name', 'Save to Variable', 'e.g. extracted_price')}
          {step.action === 'navigate' && field('target_url', 'Target URL', 'https://example.com or {{url_variable}}')}
          {step.action === 'press' && field('target_key', 'Key to Press', 'Enter, Tab, Escape, F5...')}

          {/* Advanced settings */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/5">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Timeout (ms)</label>
              <input
                type="number"
                value={step.timeout_ms || 5000}
                onChange={e => onChange({ ...step, timeout_ms: parseInt(e.target.value) })}
                className="w-full bg-slate-800/60 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Retry Count</label>
              <input
                type="number"
                value={step.retry_count ?? 2}
                onChange={e => onChange({ ...step, retry_count: parseInt(e.target.value) })}
                min={0} max={5}
                className="w-full bg-slate-800/60 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">On Failure</label>
              <select
                value={step.on_failure || 'stop'}
                onChange={e => onChange({ ...step, on_failure: e.target.value as any })}
                className="w-full bg-slate-800/60 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              >
                <option value="stop">Stop</option>
                <option value="continue">Continue</option>
                <option value="retry">Retry</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

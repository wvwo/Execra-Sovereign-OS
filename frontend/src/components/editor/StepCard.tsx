import React from 'react';
import { WorkflowStep } from '../../types';
import { motion } from 'framer-motion';
import { 
  ChevronDown, 
  Trash2, 
  MousePointer2, 
  Type, 
  Globe, 
  Eye, 
  Keyboard, 
  Clock,
  ChevronRight
} from 'lucide-react';

interface Props {
  index: number;
  step: WorkflowStep;
  onUpdate: (step: WorkflowStep) => void;
  onDelete: () => void;
}

export const StepCard: React.FC<Props> = ({ index, step, onUpdate, onDelete }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const getIcon = () => {
    switch (step.action) {
      case 'navigate': return <Globe className="w-5 h-5 text-blue-400" />;
      case 'click': return <MousePointer2 className="w-5 h-5 text-purple-400" />;
      case 'type': return <Keyboard className="w-5 h-5 text-emerald-400" />;
      case 'extract': return <Eye className="w-5 h-5 text-amber-400" />;
      default: return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <motion.div 
      layout
      className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden group hover:border-white/10 transition-all"
    >
      <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center font-bold text-xs text-slate-500">
          {index + 1}
        </div>
        <div className="bg-slate-800/50 p-2 rounded-lg">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-black text-white uppercase tracking-wider">{step.action}</p>
          <p className="text-xs text-slate-500 truncate">{step.description || step.target_url || step.target_value || 'Configure step...'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <ChevronDown className={`w-5 h-5 text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="px-4 pb-6 pt-2 border-t border-white/5 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Action Type</label>
              <select 
                value={step.action}
                onChange={(e) => onUpdate({ ...step, action: e.target.value as any })}
                className="w-full bg-slate-800 border border-white/5 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="navigate">Navigate</option>
                <option value="click">Click</option>
                <option value="type">Type</option>
                <option value="extract">Extract</option>
                <option value="wait">Wait</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Description</label>
              <input 
                type="text"
                value={step.description || ''}
                onChange={(e) => onUpdate({ ...step, description: e.target.value })}
                placeholder="What does this do?"
                className="w-full bg-slate-800 border border-white/5 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {step.action === 'navigate' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Target URL</label>
              <input 
                type="text"
                value={step.target_url || ''}
                onChange={(e) => onUpdate({ ...step, target_url: e.target.value })}
                className="w-full bg-slate-800 border border-white/5 rounded-xl py-2 px-3 text-sm text-white font-mono"
              />
            </div>
          )}

          {(step.action === 'click' || step.action === 'type' || step.action === 'extract') && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Target Value</label>
              <input
                type="text"
                value={step.target_value || ''}
                onChange={(e) => onUpdate({ ...step, target_value: e.target.value })}
                className="w-full bg-slate-800 border border-white/5 rounded-xl py-2 px-3 text-sm text-white font-mono"
              />
            </div>
          )}

          {step.action === 'type' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Input Value</label>
              <input 
                type="text"
                value={step.input_value || ''}
                onChange={(e) => onUpdate({ ...step, input_value: e.target.value })}
                className="w-full bg-slate-800 border border-white/5 rounded-xl py-2 px-3 text-sm text-white"
              />
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

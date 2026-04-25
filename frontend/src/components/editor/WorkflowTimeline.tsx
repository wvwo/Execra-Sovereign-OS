import React from 'react';
import { WorkflowStep } from '../../types';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';

interface Props {
  steps: WorkflowStep[];
  currentStep: number;
  status: string;
}

export const WorkflowTimeline: React.FC<Props> = ({ steps, currentStep, status }) => {
  return (
    <div className="space-y-4">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep || status === 'success';
        const isCurrent = idx === currentStep && status === 'running';

        return (
          <div key={idx} className="flex gap-4 items-start relative">
            {/* Line */}
            {idx < steps.length - 1 && (
              <div 
                className={`absolute left-4 top-8 w-0.5 h-full -ml-px ${
                  isCompleted ? 'bg-emerald-500' : 'bg-slate-800'
                }`} 
              />
            )}

            <div className={`
              z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-500
              ${isCompleted ? 'bg-emerald-500 border-emerald-500' : 
                isCurrent ? 'bg-purple-600 border-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-110' : 
                'bg-slate-900 border-slate-800'}
            `}>
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : isCurrent ? (
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-2 h-2 bg-white rounded-full"
                />
              ) : (
                <span className="text-[10px] font-bold text-slate-500">{idx + 1}</span>
              )}
            </div>

            <div className="flex-1 pt-1">
              <p className={`text-sm font-bold uppercase tracking-wider ${
                isCompleted ? 'text-emerald-400' : isCurrent ? 'text-white' : 'text-slate-500'
              }`}>
                {step.action}
              </p>
              <p className="text-xs text-slate-600 mt-0.5 truncate max-w-xs">
                {step.description || step.target_url || step.target?.value || 'Next step...'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

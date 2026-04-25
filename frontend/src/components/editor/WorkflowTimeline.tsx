import React from 'react';
import { WorkflowStep } from '../../types';
import { StepCard } from './StepCard';

interface Props {
  steps: WorkflowStep[];
  onUpdateStep: (index: number, step: WorkflowStep) => void;
  onDeleteStep: (index: number) => void;
  onReorder: (from: number, to: number) => void;
}

export const WorkflowTimeline: React.FC<Props> = ({ steps, onUpdateStep, onDeleteStep }) => {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <StepCard
          key={`${step.step_id}-${index}`}
          index={index}
          step={step}
          onUpdate={(updated) => onUpdateStep(index, updated)}
          onDelete={() => onDeleteStep(index)}
        />
      ))}
      
      <button
        onClick={() => {
          const newStep: WorkflowStep = {
            step_id: steps.length + 1,
            action: 'wait',
            description: 'خطوة جديدة',
            stealth: { humanize: true, bezier_curves: true },
            audit: { screenshot_before: true, screenshot_after: true },
          };
          onUpdateStep(steps.length, newStep);
        }}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-500 hover:text-primary-600 transition-colors"
      >
        + إضافة خطوة
      </button>
    </div>
  );
};

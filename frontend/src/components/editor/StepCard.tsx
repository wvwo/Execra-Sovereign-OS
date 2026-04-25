import React, { useState } from 'react';
import { WorkflowStep } from '../../types';
import { GripVertical, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  index: number;
  step: WorkflowStep;
  onUpdate: (step: WorkflowStep) => void;
  onDelete: () => void;
}

export const StepCard: React.FC<Props> = ({ index, step, onUpdate, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4 flex items-center gap-3">
        <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
        
        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
          {step.step_id}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium uppercase">
              {step.action}
            </span>
            <span className="text-sm text-gray-700 truncate">
              {step.description || 'لا يوجد وصف'}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        <button
          onClick={onDelete}
          className="p-1 hover:bg-red-50 text-red-500 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">الإجراء</label>
              <select
                value={step.action}
                onChange={(e) => onUpdate({ ...step, action: e.target.value as any })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="navigate">انتقال</option>
                <option value="click">نقر</option>
                <option value="type">كتابة</option>
                <option value="extract">استخراج</option>
                <option value="press">ضغط مفتاح</option>
                <option value="wait">انتظار</option>
                <option value="scroll">تمرير</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">الوصف</label>
              <input
                type="text"
                value={step.description || ''}
                onChange={(e) => onUpdate({ ...step, description: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          {step.target && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">الاستراتيجية</label>
                <select
                  value={step.target.strategy}
                  onChange={(e) => onUpdate({
                    ...step,
                    target: { ...step.target!, strategy: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="text_content">نص</option>
                  <option value="css_selector">CSS Selector</option>
                  <option value="xpath">XPath</option>
                  <option value="placeholder">Placeholder</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">القيمة المستهدفة</label>
                <input
                  type="text"
                  value={step.target.value}
                  onChange={(e) => onUpdate({
                    ...step,
                    target: { ...step.target!, value: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={step.stealth?.humanize ?? true}
                onChange={(e) => onUpdate({
                  ...step,
                  stealth: { ...step.stealth, humanize: e.target.checked }
                })}
                className="rounded border-gray-300"
              />
              محاكاة بشرية
            </label>
            
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={step.audit?.screenshot_before ?? true}
                onChange={(e) => onUpdate({
                  ...step,
                  audit: { ...step.audit, screenshot_before: e.target.checked }
                })}
                className="rounded border-gray-300"
              />
              لقطة قبل
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

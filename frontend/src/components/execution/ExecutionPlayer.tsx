import React, { useEffect, useState } from 'react';
import { Workflow, ExecutionStatus } from '../../types';
import { Play, Pause, RotateCcw, AlertTriangle } from 'lucide-react';
import { CaptchaModal } from './CaptchaModal';
import { useExecutionSocket } from '../../services/websocket';

interface Props {
  workflow: Workflow;
}

export const ExecutionPlayer: React.FC<Props> = ({ workflow }) => {
  const [isRunning, setIsRunning] = useState(false);
  const { status, currentStep, captchaDetected, resolveCaptcha } = useExecutionSocket(workflow.id);

  const startExecution = async () => {
    setIsRunning(true);

    try {
      const res = await fetch(`/api/v1/execute/${workflow.id}/run`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      
    } catch (error) {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{workflow.workflow_title}</h2>
            <p className="text-sm text-gray-500">{workflow.steps.length} خطوة</p>
          </div>
          
          <button
            onClick={startExecution}
            disabled={isRunning}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
              ${isRunning 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'}
            `}
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                جاري التنفيذ...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                تشغيل الأتمتة
              </>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        {status && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>التقدم</span>
              <span>{status.currentStep || 0} / {status.totalSteps}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((status.currentStep || 0) / status.totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Steps Mockup */}
        <div className="space-y-3">
          {workflow.steps.map((step, index) => (
            <div key={step.step_id} className="p-3 border rounded-lg bg-gray-50 flex items-center justify-between">
              <span>{step.action}</span>
              <span>
                {index < (currentStep || 0) ? 'نجاح' :
                index === currentStep ? (status === 'running' ? 'جاري التنفيذ' : 'خطأ') :
                'في الانتظار'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <CaptchaModal
        isOpen={captchaDetected}
        onResolve={resolveCaptcha}
      />
    </div>
  );
};

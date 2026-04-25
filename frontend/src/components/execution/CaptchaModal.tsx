import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onResolved: () => void;
  sessionId: string;
}

export const CaptchaModal: React.FC<Props> = ({ isOpen, onResolved }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">تحقق أمني مطلوب</h3>
        </div>
        
        <p className="text-gray-600 mb-6">
          تم اكتشاف نظام تحقق (CAPTCHA) في الصفحة الحالية. 
          يرجى حله يدويًا في نافذة المتصفح المنبثقة، ثم اضغط "تم الحل" للاستمرار.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800">
            ⚠️ لا نحاول كسر أنظمة الحماية برمجيًا تلقائيًا. هذا يتوافق مع شروط الخدمة ومعايير الأمان.
          </p>
        </div>

        <button
          onClick={onResolved}
          className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          تم الحل — استئناف التنفيذ
        </button>
      </div>
    </div>
  );
};

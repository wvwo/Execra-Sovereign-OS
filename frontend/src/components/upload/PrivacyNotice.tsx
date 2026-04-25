import React from 'react';
import { Shield } from 'lucide-react';

export const PrivacyNotice: React.FC = () => (
  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
    <Shield className="w-4 h-4 text-blue-500" />
    <p className="text-sm text-blue-700">
      🔒 سيتم حذف الفيديو تلقائيًا من خوادمنا فور استخراج خطوات العمل. لا نحتفظ بنسخة.
    </p>
  </div>
);

import React, { useState } from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

interface Props {
  date: string;
  onVerify: () => Promise<any>;
}

export const IntegrityVerifier: React.FC<Props> = ({ date, onVerify }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');

  const handleVerify = async () => {
    setStatus('loading');
    try {
      const result = await onVerify();
      setStatus(result.valid ? 'valid' : 'invalid');
    } catch {
      setStatus('invalid');
    }
  };

  return (
    <button
      onClick={handleVerify}
      disabled={status === 'loading'}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
        ${status === 'valid' ? 'bg-green-100 text-green-700' : ''}
        ${status === 'invalid' ? 'bg-red-100 text-red-700' : ''}
        ${status === 'idle' ? 'bg-primary-600 text-white hover:bg-primary-700' : ''}
        ${status === 'loading' ? 'bg-gray-100 text-gray-400' : ''}
      `}
    >
      {status === 'loading' && <Loader className="w-4 h-4 animate-spin" />}
      {status === 'valid' && <CheckCircle className="w-4 h-4" />}
      {status === 'invalid' && <XCircle className="w-4 h-4" />}
      {status === 'idle' && 'التحقق'}
      {status === 'valid' && 'السلسلة سليمة'}
      {status === 'invalid' && 'تم الكشف عن تلاعب!'}
      {status === 'loading' && 'جاري التحقق...'}
    </button>
  );
};

import React from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  date: string;
  onVerify: () => Promise<any>;
}

export const IntegrityVerifier: React.FC<Props> = ({ date, onVerify }) => {
  const [status, setStatus] = React.useState<'idle' | 'verifying' | 'success' | 'error'>('idle');

  const handleVerify = async () => {
    setStatus('verifying');
    try {
      await onVerify();
      setTimeout(() => setStatus('success'), 1500);
    } catch (e) {
      setStatus('error');
    }
  };

  return (
    <button
      onClick={handleVerify}
      disabled={status === 'verifying'}
      className={`
        px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 text-sm
        ${status === 'success' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 
          status === 'verifying' ? 'bg-slate-800 text-slate-500' :
          'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'}
      `}
    >
      {status === 'verifying' ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <ShieldCheck className="w-4 h-4" />
      )}
      {status === 'verifying' ? 'Verifying Chain...' : 
       status === 'success' ? 'Chain Verified' : 'Verify Chain Integrity'}
    </button>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ExternalLink, ShieldAlert, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onResolve: () => void;
}

export const CaptchaModal: React.FC<Props> = ({ isOpen, onResolve }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-slate-900 border border-yellow-500/30 w-full max-w-lg rounded-[40px] p-10 shadow-[0_0_100px_rgba(234,179,8,0.15)] relative z-10"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                <ShieldAlert className="w-10 h-10 text-yellow-500" />
              </div>
              
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight">Bot Detection Active</h2>
                <p className="text-slate-400 mt-3 leading-relaxed">
                  The target environment has triggered a manual verification challenge. 
                  Please complete the CAPTCHA in the secure virtual frame to continue.
                </p>
              </div>

              <div className="w-full bg-slate-800/50 rounded-2xl p-6 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Manual Intervention Required</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Waiting for response</p>
                  </div>
                </div>
                <button className="p-2 text-slate-400 hover:text-white transition-colors">
                  <ExternalLink className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full pt-4">
                <button 
                  onClick={onResolve}
                  className="bg-yellow-500 text-black font-black py-4 rounded-2xl hover:bg-yellow-400 transition-all active:scale-[0.98] shadow-lg shadow-yellow-500/20"
                >
                  Confirm Resolved
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-slate-800 text-white font-black py-4 rounded-2xl hover:bg-slate-700 transition-all border border-white/5"
                >
                  Abort Mission
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

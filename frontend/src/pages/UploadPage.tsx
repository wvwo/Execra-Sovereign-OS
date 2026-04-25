import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileVideo, 
  Sparkles, 
  Shield, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Zap
} from 'lucide-react';

export const UploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError('');
    setStatus('Initializing VLM Engine...');

    const formData = new FormData();
    formData.append('video', file);

    try {
      const res = await api.post('/process-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.success) {
        setStatus('Sequence Extracted successfully.');
        setTimeout(() => navigate(`/editor/${res.data.workflowId}`), 1000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Processing failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="text-center mb-12">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600 to-blue-600 mb-6 shadow-xl shadow-purple-500/20"
        >
          <Sparkles className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="text-4xl font-black text-white tracking-tight">Generate New Sequence</h1>
        <p className="text-slate-500 mt-2 max-w-lg mx-auto">Upload a screen recording of your manual workflow. Our VLM will decompose it into a robust autonomous script.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Upload Box */}
        <div 
          className={`
            aspect-square rounded-[40px] border-4 border-dashed transition-all duration-500 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden
            ${file 
              ? 'border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_50px_rgba(16,185,129,0.1)]' 
              : 'border-white/5 bg-slate-900/40 hover:border-purple-500/30 hover:bg-purple-500/5'
            }
          `}
        >
          <input 
            type="file" 
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          
          <AnimatePresence mode="wait">
            {file ? (
              <motion.div 
                key="file"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                  <FileVideo className="w-10 h-10" />
                </div>
                <div>
                  <p className="text-white font-bold">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for processing</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="w-20 h-20 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center mx-auto">
                  <Upload className="w-8 h-8 text-slate-500" />
                </div>
                <div>
                  <p className="text-slate-300 font-bold">Drop recording here</p>
                  <p className="text-xs text-slate-600 uppercase tracking-widest mt-1">MP4, MOV, WebM (Max 50MB)</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* Info & Action */}
        <div className="space-y-8">
          <div className="space-y-6">
            {[
              { icon: Shield, label: 'Zero-Trust Local Inference', desc: 'Video frames never leave the sovereign environment.' },
              { icon: CheckCircle2, label: 'Automated Element Detection', desc: 'VLM identifies precise CSS selectors and XPath targets.' },
              { icon: ArrowRight, label: 'Instant Script Generation', desc: 'Convert visual intent into executable Playwright code.' }
            ].map((feature, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{feature.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6">
            <button 
              onClick={handleUpload}
              disabled={!file || isUploading}
              className={`
                w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl transition-all flex items-center justify-center gap-3
                ${!file || isUploading 
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-purple-600/30 active:scale-[0.98]'
                }
              `}
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {status}
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current" />
                  Synthesize Workflow
                </>
              )}
            </button>
            {error && (
              <p className="text-red-400 text-xs mt-4 flex items-center gap-2 justify-center">
                <AlertCircle className="w-4 h-4" /> {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

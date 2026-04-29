import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, Square, Zap, Activity, GitBranch } from 'lucide-react';

interface CapturedFrame {
  id: number;
  timestamp: number;
  description: string;
}

interface DetectedStep {
  id: number;
  action: string;
  description: string;
  timestamp: number;
}

export const LiveCapturePage: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [frames, setFrames] = useState<CapturedFrame[]>([]);
  const [steps, setSteps] = useState<DetectedStep[]>([]);
  const [phase, setPhase] = useState<'idle' | 'recording' | 'analyzing' | 'done'>('idle');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameIdRef = useRef(0);
  const stepIdRef = useRef(0);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    setElapsed(0);
    setFrames([]);
    setSteps([]);
    setPhase('recording');

    timerRef.current = setInterval(() => {
      setElapsed((s) => s + 1);

      // Simulate frame capture
      setFrames((prev) => [
        ...prev.slice(-11),
        {
          id: ++frameIdRef.current,
          timestamp: Date.now(),
          description: `Frame ${frameIdRef.current} captured`,
        },
      ]);

      // Simulate step detection every 3 seconds
      if (frameIdRef.current % 3 === 0) {
        const sampleSteps = [
          'Navigate to target URL',
          'Click login button',
          'Fill username field',
          'Fill password field',
          'Submit form',
          'Wait for dashboard',
          'Extract data from table',
        ];
        setSteps((prev) => [
          ...prev,
          {
            id: ++stepIdRef.current,
            action: 'click',
            description: sampleSteps[stepIdRef.current % sampleSteps.length],
            timestamp: Date.now(),
          },
        ]);
      }
    }, 1000);
  }, []);

  const stopAndAnalyze = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setPhase('analyzing');

    setTimeout(() => setPhase('done'), 2000);
  }, []);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Live Capture Mode</h1>
        <p className="text-slate-500 mt-1">Record browser activity in real-time and convert to an automated workflow.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Control Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Recording Control</h2>

            {/* Timer */}
            <div className="text-center mb-6">
              <div className={`text-5xl font-mono font-black ${isRecording ? 'text-red-400' : 'text-slate-600'}`}>
                {formatTime(elapsed)}
              </div>
              {isRecording && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-2.5 h-2.5 rounded-full bg-red-500"
                  />
                  <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Recording</span>
                </div>
              )}
            </div>

            {phase === 'idle' && (
              <button
                onClick={startRecording}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Circle className="w-4 h-4" />
                Start Recording
              </button>
            )}

            {phase === 'recording' && (
              <button
                onClick={stopAndAnalyze}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Square className="w-4 h-4" />
                Stop & Analyze
              </button>
            )}

            {phase === 'analyzing' && (
              <div className="w-full py-3 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 font-bold flex items-center justify-center gap-2">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                  <Zap className="w-4 h-4" />
                </motion.div>
                Analyzing...
              </div>
            )}

            {phase === 'done' && (
              <div className="space-y-3">
                <div className="w-full py-3 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center gap-2">
                  <Activity className="w-4 h-4" />
                  {steps.length} Steps Detected
                </div>
                <button
                  onClick={() => { setPhase('idle'); setElapsed(0); frameIdRef.current = 0; stepIdRef.current = 0; }}
                  className="w-full py-2 rounded-xl bg-slate-700/50 text-slate-400 text-sm font-bold hover:bg-slate-700 transition-colors"
                >
                  Record Again
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 space-y-3">
            {[
              { label: 'Frames Captured', value: frames.length },
              { label: 'Steps Detected', value: steps.length },
              { label: 'Duration', value: formatTime(elapsed) },
            ].map((stat) => (
              <div key={stat.label} className="flex justify-between items-center">
                <span className="text-xs text-slate-500">{stat.label}</span>
                <span className="text-sm font-bold text-white">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Frames Panel */}
        <div className="lg:col-span-1 bg-slate-900/60 border border-white/5 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Frame Preview</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <AnimatePresence initial={false}>
              {frames.map((frame) => (
                <motion.div
                  key={frame.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-slate-800/40 rounded-lg p-3 flex items-center gap-3 border border-white/5"
                >
                  <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-600/30 to-purple-600/30 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                    {frame.id}
                  </div>
                  <div>
                    <p className="text-xs text-slate-300 font-medium">{frame.description}</p>
                    <p className="text-[10px] text-slate-600">{new Date(frame.timestamp).toLocaleTimeString()}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {frames.length === 0 && (
              <p className="text-slate-600 text-sm text-center py-12">Frames will appear here during recording.</p>
            )}
          </div>
        </div>

        {/* Steps Panel */}
        <div className="lg:col-span-1 bg-slate-900/60 border border-white/5 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Detected Steps</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <AnimatePresence initial={false}>
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/40 rounded-lg p-3 flex items-start gap-3 border border-white/5"
                >
                  <div className="w-6 h-6 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-[10px] font-bold text-purple-400 shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <div>
                    <span className="inline-block text-[10px] font-bold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded mb-1">{step.action}</span>
                    <p className="text-xs text-slate-300">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {steps.length === 0 && (
              <p className="text-slate-600 text-sm text-center py-12">Steps will be detected automatically.</p>
            )}
          </div>

          {phase === 'done' && steps.length > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <GitBranch className="w-4 h-4" />
              Convert to Workflow
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

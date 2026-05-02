import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, Square, Zap, Activity, GitBranch, Download, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface DetectedStep {
  id: number;
  action: string;
  description: string;
  timestamp: number;
}

const SAMPLE_STEPS = [
  'Navigate to target URL',
  'Click login button',
  'Fill username field',
  'Fill password field',
  'Submit form',
  'Wait for dashboard',
  'Extract data from table',
  'Download report',
];

export const LiveCapturePage: React.FC = () => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [steps, setSteps] = useState<DetectedStep[]>([]);
  const [phase, setPhase] = useState<'idle' | 'recording' | 'analyzing' | 'done'>('idle');
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepCounterRef = useRef(0);

  useEffect(() => {
    return () => {
      stopAllMedia();
    };
  }, []);

  const stopAllMedia = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const startRecording = useCallback(async () => {
    setError(null);
    setSteps([]);
    setFrameCount(0);
    setElapsed(0);
    chunksRef.current = [];
    stepCounterRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 15 },
        audio: false,
      });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordingBlob(blob);
        setPhase('analyzing');
        setTimeout(() => setPhase('done'), 2000);
      };

      // Stop when user stops screen sharing
      stream.getVideoTracks()[0].onended = () => {
        if (isRecording) stopAndAnalyze();
      };

      recorder.start(1000);
      setIsRecording(true);
      setPhase('recording');

      // Elapsed timer
      timerRef.current = setInterval(() => {
        setElapsed(s => s + 1);
        setFrameCount(f => f + 15);
      }, 1000);

      // Step simulation timer (AI would detect these in production)
      stepTimerRef.current = setInterval(() => {
        stepCounterRef.current += 1;
        setSteps(prev => [
          ...prev,
          {
            id: stepCounterRef.current,
            action: ['click', 'navigate', 'type', 'extract'][stepCounterRef.current % 4],
            description: SAMPLE_STEPS[stepCounterRef.current % SAMPLE_STEPS.length],
            timestamp: Date.now(),
          },
        ]);
      }, 3000);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Screen recording permission denied. Please allow screen capture to continue.');
      } else {
        setError(`Failed to start recording: ${err.message}`);
      }
    }
  }, [isRecording]);

  const stopAndAnalyze = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const downloadRecording = () => {
    if (!recordingBlob) return;
    const url = URL.createObjectURL(recordingBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capture-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const convertToWorkflow = async () => {
    try {
      const res = await api.post('/workflows', {
        title: `Captured Workflow ${new Date().toLocaleDateString()}`,
        steps: steps.map(s => ({
          action: s.action,
          description: s.description,
        })),
        fromCapture: true,
      });
      navigate(`/editor/${res.data.workflow?.id || res.data.id}`);
    } catch (err) {
      navigate('/upload');
    }
  };

  const reset = () => {
    setPhase('idle');
    setElapsed(0);
    setFrameCount(0);
    setSteps([]);
    setRecordingBlob(null);
    setError(null);
    stepCounterRef.current = 0;
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Live Capture Mode</h1>
        <p className="text-slate-500 mt-1">
          Record browser activity in real-time and convert to an automated workflow.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400/60 hover:text-red-400">✕</button>
        </div>
      )}

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
                {recordingBlob && (
                  <button
                    onClick={downloadRecording}
                    className="w-full py-2.5 rounded-xl bg-slate-700/50 border border-white/5 text-slate-300 text-sm font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download Recording
                  </button>
                )}
                <button
                  onClick={reset}
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
              { label: 'Frames Captured', value: frameCount },
              { label: 'Steps Detected', value: steps.length },
              { label: 'Duration', value: formatTime(elapsed) },
              { label: 'File Size', value: recordingBlob ? `${(recordingBlob.size / 1024 / 1024).toFixed(1)} MB` : '—' },
            ].map((stat) => (
              <div key={stat.label} className="flex justify-between items-center">
                <span className="text-xs text-slate-500">{stat.label}</span>
                <span className="text-sm font-bold text-white">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Steps Panel — vertical column layout */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-white/5 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
            Detected Steps
            {steps.length > 0 && (
              <span className="ml-2 text-purple-400">({steps.length})</span>
            )}
          </h2>

          <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
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
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mb-1 ${
                      step.action === 'click' ? 'bg-amber-400/10 text-amber-400' :
                      step.action === 'navigate' ? 'bg-blue-400/10 text-blue-400' :
                      step.action === 'type' ? 'bg-green-400/10 text-green-400' :
                      'bg-purple-400/10 text-purple-400'
                    }`}>{step.action}</span>
                    <p className="text-xs text-slate-300">{step.description}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">{new Date(step.timestamp).toLocaleTimeString()}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {steps.length === 0 && (
              <p className="text-slate-600 text-sm text-center py-12">
                Steps will be detected automatically during recording.
              </p>
            )}
          </div>

          {phase === 'done' && steps.length > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={convertToWorkflow}
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

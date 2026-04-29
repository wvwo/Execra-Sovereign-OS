import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api';
import { Workflow, WorkflowStep } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Loader, X, ChevronRight, Bot, User } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggested_steps?: WorkflowStep[];
  modified_workflow?: Workflow;
}

const QUICK_PROMPTS = [
  'Add a 2-second wait after the last step',
  'Add error handling if a button is not found',
  'Explain what this workflow does',
  'Find potential failure points',
  'Make this workflow loop through all items',
  'Add a step to take a screenshot at the end',
];

interface AIAssistantProps {
  workflow: Workflow;
  onApplySteps: (steps: WorkflowStep[]) => void;
  onApplyWorkflow: (workflow: Workflow) => void;
  onClose: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  workflow, onApplySteps, onApplyWorkflow, onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm your AI workflow assistant. I can help you:\n• Add or modify steps\n• Add error handling\n• Explain your workflow\n• Find potential issues\n\nWhat would you like to do?`,
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text?: string) => {
    const message = text || input.trim();
    if (!message || isLoading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: message };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await api.post('/ai-assist', { workflow, message });
      const data = res.data;
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.response || 'Done! Check the suggestions below.',
        suggested_steps: data.suggested_steps,
        modified_workflow: data.modified_workflow,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/80 border-l border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-white">AI Assistant</p>
            <p className="text-[10px] text-slate-500">Powered by Claude</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick prompts */}
      <div className="px-4 py-3 border-b border-white/5 shrink-0">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Quick Actions</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.slice(0, 4).map(p => (
            <button
              key={p}
              onClick={() => send(p)}
              className="text-[10px] font-bold px-2 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-all"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${
              msg.role === 'assistant'
                ? 'bg-gradient-to-br from-purple-600 to-blue-600'
                : 'bg-slate-700'
            }`}>
              {msg.role === 'assistant' ? <Bot className="w-3 h-3 text-white" /> : <User className="w-3 h-3 text-white" />}
            </div>
            <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
              <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'assistant'
                  ? 'bg-slate-800/60 text-slate-300'
                  : 'bg-purple-600/20 text-purple-200 border border-purple-500/20'
              }`}>
                {msg.content}
              </div>

              {/* Suggested steps action */}
              {msg.suggested_steps && msg.suggested_steps.length > 0 && (
                <div className="bg-slate-800/40 border border-white/5 rounded-xl p-3 space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {msg.suggested_steps.length} step(s) suggested
                  </p>
                  {msg.suggested_steps.slice(0, 2).map((s, si) => (
                    <div key={si} className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="text-[10px] font-black bg-slate-700 px-1.5 py-0.5 rounded">{s.action}</span>
                      {s.description}
                    </div>
                  ))}
                  <button
                    onClick={() => onApplySteps(msg.suggested_steps!)}
                    className="w-full mt-2 py-1.5 rounded-lg text-xs font-bold bg-purple-600/20 text-purple-400 border border-purple-500/20 hover:bg-purple-600/30 transition-all flex items-center justify-center gap-1"
                  >
                    <ChevronRight className="w-3 h-3" /> Apply to Workflow
                  </button>
                </div>
              )}

              {/* Modified workflow action */}
              {msg.modified_workflow && (
                <button
                  onClick={() => onApplyWorkflow(msg.modified_workflow!)}
                  className="w-full py-1.5 rounded-lg text-xs font-bold bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/30 transition-all flex items-center justify-center gap-1"
                >
                  <ChevronRight className="w-3 h-3" /> Apply Full Workflow Changes
                </button>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="bg-slate-800/60 px-3 py-2 rounded-xl flex items-center gap-2">
              <Loader className="w-4 h-4 text-purple-400 animate-spin" />
              <span className="text-xs text-slate-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask the AI anything about your workflow..."
            disabled={isLoading}
            className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Terminal,
  Calculator,
  FileCode,
  GitFork,
  CheckCircle,
} from 'lucide-react';
import { ChatMessage, StepRecord } from '../types';
import { StepTrajectory } from './StepTrajectory';
import { ApprovalCard } from './ApprovalCard';

interface ChatAreaProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onApproveTool: (toolName: string, toolInput: any, decision: 'approve' | 'reject') => void;
  activeModelName: string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onApproveTool,
  activeModelName,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput('');
    onSendMessage(text);
  };

  const quickPrompts = [
    { label: 'Hello World', icon: Sparkles, text: "Verify that Antigravity agent runtime is active and say 'Hello World!'" },
    { label: 'Check Files & Run Command', icon: Terminal, text: "List workspace files and run 'cat hello.py' to examine the sandbox script." },
    { label: 'Budget Math Calculation', icon: Calculator, text: "Calculate the token cost for 45000 input tokens and 12500 output tokens: (45000 * 0.00015 + 12500 * 0.0006) / 1000" },
    { label: 'Docstring Compliance Audit', icon: FileCode, text: "Analyze docstrings in this function: def run_agent(task: str) -> None: return None" },
    { label: 'Subagent Delegation', icon: GitFork, text: "Delegate an architecture audit task to the CodeReviewer subagent." },
  ];

  return (
    <main className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto px-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
              <Bot className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Google Antigravity Agent Studio</h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Experience the stateful agent loop, hook-based tool approvals, subagent coordination,
              and observability of the Google Antigravity SDK right in your browser.
            </p>

            <div className="w-full space-y-2 text-left">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Quick Test Prompts
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickPrompts.slice(0, 4).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(item.text)}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700 text-left transition-all group"
                  >
                    <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold mb-1">
                      <item.icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {item.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const pendingApprovalStep = msg.steps?.find((s) => s.type === 'approval_request' && s.status === 'pending_approval');

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`flex items-start space-x-3 max-w-3xl ${
                    isUser ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                      isUser
                        ? 'bg-slate-800 border border-slate-700 text-slate-300'
                        : 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
                      <span>{isUser ? 'User Operator' : `Antigravity Agent (${activeModelName})`}</span>
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      {msg.metrics && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-400">{msg.metrics.totalTokens} tokens</span>
                          <span>•</span>
                          <span className="text-amber-400">{msg.metrics.latencyMs}ms</span>
                        </>
                      )}
                    </div>

                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-indigo-600 text-white shadow-sm rounded-tr-none'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                    </div>

                    {/* Step Trajectory */}
                    {msg.steps && msg.steps.length > 0 && (
                      <StepTrajectory steps={msg.steps} />
                    )}

                    {/* Human Approval Intervention Card */}
                    {pendingApprovalStep && (
                      <ApprovalCard
                        step={pendingApprovalStep}
                        onDecision={onApproveTool}
                        isLoading={isLoading}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex items-start space-x-3 max-w-3xl">
            <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-indigo-600 text-white shadow-md">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs rounded-tl-none flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Antigravity agentic loop thinking & verifying policies...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Chip Bar */}
      <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-900/40 flex items-center space-x-2 overflow-x-auto no-scrollbar text-xs">
        <span className="text-slate-500 font-mono text-[10px] shrink-0">Quick Action:</span>
        {quickPrompts.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(item.text)}
            className="shrink-0 px-2.5 py-1 rounded-full border border-slate-800 bg-slate-950/80 hover:bg-slate-800/80 hover:border-slate-700 text-slate-300 text-[11px] flex items-center space-x-1.5 transition-colors"
          >
            <item.icon className="w-3 h-3 text-indigo-400" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/80">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Send an instruction, ask to inspect code, evaluate math, or run shell tools..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>Execute</span>
          </button>
        </form>
      </div>
    </main>
  );
};

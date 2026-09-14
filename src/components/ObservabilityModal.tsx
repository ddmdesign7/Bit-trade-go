import React from 'react';
import { X, Activity, Cpu, Clock, Wrench, Zap, Layers } from 'lucide-react';
import { ObservabilitySummary } from '../types';

interface ObservabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  observability: ObservabilitySummary;
}

export const ObservabilityModal: React.FC<ObservabilityModalProps> = ({
  isOpen,
  onClose,
  observability,
}) => {
  if (!isOpen) return null;

  const totalTokens =
    observability.totalInputTokens +
    observability.totalOutputTokens +
    observability.totalThinkingTokens;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Antigravity Observability & Telemetry</h3>
              <p className="text-xs text-slate-400">Real-time token metrics, latency, and tool invocation tracking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Session Turns</span>
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {observability.totalTurns}
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Total Tokens</span>
              </div>
              <div className="text-xl font-bold font-mono text-cyan-300">
                {totalTokens.toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Avg Latency</span>
              </div>
              <div className="text-xl font-bold font-mono text-amber-300">
                {observability.averageLatencyMs} ms
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Thinking Tokens</span>
              </div>
              <div className="text-xl font-bold font-mono text-emerald-300">
                {observability.totalThinkingTokens.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Token Breakdown */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider">
              Token Distribution
            </h4>
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-slate-400 mb-1 font-mono">
                  <span>Input Tokens</span>
                  <span className="text-slate-200">{observability.totalInputTokens}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${totalTokens ? (observability.totalInputTokens / totalTokens) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1 font-mono">
                  <span>Output Tokens</span>
                  <span className="text-slate-200">{observability.totalOutputTokens}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${totalTokens ? (observability.totalOutputTokens / totalTokens) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1 font-mono">
                  <span>Thinking / Reasoning Tokens</span>
                  <span className="text-slate-200">{observability.totalThinkingTokens}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${totalTokens ? (observability.totalThinkingTokens / totalTokens) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tool Calls Breakdown */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider flex items-center space-x-1.5">
              <Wrench className="w-3.5 h-3.5 text-slate-400" />
              <span>Tool Invocations by Name</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(observability.toolCallsCount).map(([name, count]) => (
                <div
                  key={name}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-xs"
                >
                  <span className="text-indigo-300">{name}</span>
                  <span className="font-bold text-slate-200">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close Telemetry
          </button>
        </div>
      </div>
    </div>
  );
};

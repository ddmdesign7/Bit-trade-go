import React from 'react';
import { Bot, Cpu, ShieldCheck, Sparkles, Activity, RotateCcw } from 'lucide-react';
import { AgentConfig } from '../types';

interface NavbarProps {
  config: AgentConfig;
  onChangeConfig: (newConfig: AgentConfig) => void;
  onResetSession: () => void;
  observabilityTurnCount: number;
  hasGeminiKey: boolean;
  onOpenObservability: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  onChangeConfig,
  onResetSession,
  observabilityTurnCount,
  hasGeminiKey,
  onOpenObservability,
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 flex items-center justify-between shrink-0 z-20">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-950/50">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold tracking-tight text-white">Google Antigravity</h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Agent SDK
            </span>
          </div>
          <p className="text-xs text-slate-400">Autonomous & Interactive Agent Runtime</p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Model selector */}
        <div className="flex items-center bg-slate-800/80 border border-slate-700/70 rounded-lg px-2.5 py-1.5 text-xs text-slate-200">
          <Cpu className="w-3.5 h-3.5 text-indigo-400 mr-2 shrink-0" />
          <select
            aria-label="Active Model"
            value={config.model}
            onChange={(e) => onChangeConfig({ ...config, model: e.target.value })}
            className="bg-transparent border-none text-xs focus:outline-none cursor-pointer pr-2 font-medium"
          >
            <option value="gemini-2.5-flash" className="bg-slate-900 text-slate-200">Gemini 2.5 Flash</option>
            <option value="gemini-2.5-pro" className="bg-slate-900 text-slate-200">Gemini 2.5 Pro</option>
            <option value="gemini-2.0-flash" className="bg-slate-900 text-slate-200">Gemini 2.0 Flash</option>
            <option value="litert/gemma-2-2b" className="bg-slate-900 text-slate-200">LiteRT Gemma 2 (Local)</option>
          </select>
        </div>

        {/* Behavior Mode Toggle */}
        <button
          onClick={() =>
            onChangeConfig({
              ...config,
              agentBehavior: config.agentBehavior === 'autonomous' ? 'interactive' : 'autonomous',
            })
          }
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center space-x-1.5 transition-colors ${
            config.agentBehavior === 'autonomous'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
          }`}
          title="Toggle between Autonomous loop and Interactive human-guided mode"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="capitalize">{config.agentBehavior}</span>
        </button>

        {/* Gemini status */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs border font-medium ${
            hasGeminiKey
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}
          title={hasGeminiKey ? 'Gemini API Key active' : 'Running in Local Antigravity Engine simulation'}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>{hasGeminiKey ? 'Gemini Live' : 'SDK Local Engine'}</span>
        </div>

        {/* Observability Button */}
        <button
          onClick={onOpenObservability}
          className="flex items-center space-x-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 text-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Telemetry ({observabilityTurnCount})</span>
        </button>

        {/* Reset Conversation */}
        <button
          onClick={onResetSession}
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
          title="Reset conversation state"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

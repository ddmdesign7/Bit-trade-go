import React, { useState } from 'react';
import {
  BrainCircuit,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
  GitFork,
  ArrowRight,
} from 'lucide-react';
import { StepRecord } from '../types';

interface StepTrajectoryProps {
  steps: StepRecord[];
}

export const StepTrajectory: React.FC<StepTrajectoryProps> = ({ steps }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!steps || steps.length === 0) return null;

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="my-2.5 rounded-xl border border-slate-800 bg-slate-950/80 p-3 space-y-2 text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-slate-400 font-mono text-[11px]">
        <div className="flex items-center space-x-1.5 text-indigo-400 font-medium">
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>Antigravity Step Trajectory ({steps.length} steps)</span>
        </div>
        <span>Execution Trace</span>
      </div>

      <div className="space-y-2 pt-1">
        {steps.map((step, idx) => {
          const isExpanded = expanded[step.id] ?? (step.type === 'approval_request');

          return (
            <div
              key={step.id || idx}
              className="rounded-lg border border-slate-800/80 bg-slate-900/50 overflow-hidden"
            >
              {/* Header */}
              <div
                onClick={() => toggleExpand(step.id)}
                className="px-2.5 py-1.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  {step.type === 'thinking' && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  )}
                  {step.type === 'tool_call' && (
                    <Wrench className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  {step.type === 'tool_result' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  {step.type === 'approval_request' && (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  {step.type === 'subagent_turn' && (
                    <GitFork className="w-3.5 h-3.5 text-purple-400" />
                  )}

                  <span className="font-semibold text-slate-200 capitalize">
                    {step.type === 'thinking' && 'Reasoning & Planning'}
                    {step.type === 'tool_call' && `Call Tool: ${step.toolName}`}
                    {step.type === 'tool_result' && `Result: ${step.toolName}`}
                    {step.type === 'approval_request' && `Approval Required: ${step.toolName}`}
                    {step.type === 'subagent_turn' && `Delegated: ${step.subagentName}`}
                  </span>

                  {step.status && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        step.status === 'executed' || step.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : step.status === 'pending_approval'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                      }`}
                    >
                      {step.status}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                  {step.latencyMs !== undefined && (
                    <span className="flex items-center font-mono">
                      <Clock className="w-3 h-3 mr-1 text-slate-500" />
                      {step.latencyMs}ms
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Body */}
              {isExpanded && (
                <div className="px-3 py-2 border-t border-slate-800 bg-slate-950/60 font-mono text-[11px] leading-relaxed text-slate-300 space-y-2">
                  {step.thought && (
                    <div className="text-slate-300 font-sans italic">
                      "{step.thought}"
                    </div>
                  )}

                  {step.toolInput && (
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1">
                        Arguments
                      </span>
                      <pre className="p-2 rounded bg-slate-900 border border-slate-800 text-amber-300 overflow-x-auto text-[10px]">
                        {JSON.stringify(step.toolInput, null, 2)}
                      </pre>
                    </div>
                  )}

                  {step.toolOutput !== undefined && (
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1">
                        Tool Output
                      </span>
                      <pre className="p-2 rounded bg-slate-900 border border-slate-800 text-emerald-300 overflow-x-auto text-[10px]">
                        {typeof step.toolOutput === 'string'
                          ? step.toolOutput
                          : JSON.stringify(step.toolOutput, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

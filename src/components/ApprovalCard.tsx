import React from 'react';
import { ShieldAlert, Check, X, Terminal, FileCode } from 'lucide-react';
import { StepRecord } from '../types';

interface ApprovalCardProps {
  step: StepRecord;
  onDecision: (toolName: string, toolInput: any, decision: 'approve' | 'reject') => void;
  isLoading: boolean;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({
  step,
  onDecision,
  isLoading,
}) => {
  return (
    <div className="my-3 rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 p-4 shadow-lg shadow-amber-950/20">
      <div className="flex items-start space-x-3 mb-3">
        <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
            <span>Security Policy Intervention: Operator Approval Required</span>
          </h4>
          <p className="text-xs text-slate-300 mt-1">
            The agent proposes executing tool <code className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300 font-mono">{step.toolName}</code>.
            Because policy enforcement is active, execution is paused until authorized.
          </p>
        </div>
      </div>

      {step.thought && (
        <div className="mb-3 text-xs text-slate-300 italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
          Agent note: "{step.thought}"
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center space-x-1 text-[11px] font-mono text-slate-400 mb-1">
          {step.toolName === 'run_command' ? <Terminal className="w-3.5 h-3.5" /> : <FileCode className="w-3.5 h-3.5" />}
          <span>Proposed Action Arguments:</span>
        </div>
        <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-amber-200 font-mono text-xs overflow-x-auto">
          {JSON.stringify(step.toolInput, null, 2)}
        </pre>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <button
          disabled={isLoading}
          onClick={() => onDecision(step.toolName!, step.toolInput, 'reject')}
          className="px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" />
          <span>Reject & Halt Action</span>
        </button>

        <button
          disabled={isLoading}
          onClick={() => onDecision(step.toolName!, step.toolInput, 'approve')}
          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Authorize Execution</span>
        </button>
      </div>
    </div>
  );
};

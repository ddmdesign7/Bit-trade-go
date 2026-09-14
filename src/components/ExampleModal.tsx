import React, { useState } from 'react';
import { X, Play, Copy, Check, FileCode2, Terminal } from 'lucide-react';
import { SdkExample } from '../types';

interface ExampleModalProps {
  example: SdkExample | null;
  onClose: () => void;
  onRunPrompt: (prompt: string, configUpdates?: any) => void;
}

export const ExampleModal: React.FC<ExampleModalProps> = ({
  example,
  onClose,
  onRunPrompt,
}) => {
  const [copied, setCopied] = useState(false);

  if (!example) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(example.pythonSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = () => {
    onRunPrompt(example.recommendedPrompt, example.defaultConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">{example.title}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-900/40 text-indigo-300 border border-indigo-700/50 font-mono">
                  {example.category}
                </span>
              </div>
              <p className="text-xs text-slate-400">{example.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono text-slate-400 flex items-center">
                <Terminal className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Python SDK Implementation (SDK Source):
              </span>
              <button
                onClick={handleCopy}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 font-mono transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-indigo-200 font-mono text-xs leading-relaxed overflow-x-auto">
              {example.pythonSnippet}
            </pre>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-300 block mb-1">
              Sample Prompt for Sandbox Runtime:
            </span>
            <p className="text-xs text-slate-300 italic">
              "{example.recommendedPrompt}"
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            Loads configuration & executes in studio
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRun}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Load & Run in Sandbox</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

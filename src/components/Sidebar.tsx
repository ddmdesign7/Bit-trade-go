import React, { useState } from 'react';
import {
  Sliders,
  Terminal,
  Shield,
  BookOpen,
  Users,
  Check,
  ChevronRight,
  Sparkles,
  Layers,
  FileCode2,
  Lock,
} from 'lucide-react';
import { AgentConfig, ToolDefinition, SdkExample } from '../types';

interface SidebarProps {
  config: AgentConfig;
  onChangeConfig: (newConfig: AgentConfig) => void;
  availableTools: ToolDefinition[];
  sdkExamples: SdkExample[];
  onSelectExample: (example: SdkExample) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  config,
  onChangeConfig,
  availableTools,
  sdkExamples,
  onSelectExample,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'tools' | 'policy' | 'examples' | 'subagents'>('config');

  const toggleTool = (toolId: string) => {
    const current = config.enabledTools;
    const next = current.includes(toolId)
      ? current.filter((id) => id !== toolId)
      : [...current, toolId];
    onChangeConfig({ ...config, enabledTools: next });
  };

  return (
    <aside className="w-80 border-r border-slate-800 bg-slate-900/60 flex flex-col h-full shrink-0">
      {/* Tab bar */}
      <div className="flex border-b border-slate-800 bg-slate-900/80 p-1 space-x-1 text-xs font-medium">
        <button
          onClick={() => setActiveTab('config')}
          className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center space-x-1 transition-colors ${
            activeTab === 'config'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Agent Configuration"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Config</span>
        </button>

        <button
          onClick={() => setActiveTab('tools')}
          className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center space-x-1 transition-colors ${
            activeTab === 'tools'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Enabled Tools"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Tools ({config.enabledTools.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('policy')}
          className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center space-x-1 transition-colors ${
            activeTab === 'policy'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Safety Policies & Hooks"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Policy</span>
        </button>

        <button
          onClick={() => setActiveTab('examples')}
          className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center space-x-1 transition-colors ${
            activeTab === 'examples'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="SDK Python Examples"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Recipes</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* TAB: CONFIG */}
        {activeTab === 'config' && (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Agent Name</label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => onChangeConfig({ ...config, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">System Instruction (Persona)</label>
              <textarea
                rows={4}
                value={config.systemInstruction}
                onChange={(e) => onChangeConfig({ ...config, systemInstruction: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-[11px] leading-relaxed resize-none"
                placeholder="Define the agent behavior, tone, constraints, and instructions..."
              />
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <label className="block text-slate-400 font-semibold mb-2 flex items-center justify-between">
                <span>Budget & Execution Limits</span>
                <Layers className="w-3.5 h-3.5 text-slate-500" />
              </label>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Max Turns</span>
                    <span className="font-mono text-slate-200">{config.budgetLimits.maxTurns}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    value={config.budgetLimits.maxTurns}
                    onChange={(e) =>
                      onChangeConfig({
                        ...config,
                        budgetLimits: { ...config.budgetLimits, maxTurns: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Max Tokens Per Turn</span>
                    <span className="font-mono text-slate-200">{config.budgetLimits.maxTokens}</span>
                  </div>
                  <input
                    type="range"
                    min="512"
                    max="8192"
                    step="512"
                    value={config.budgetLimits.maxTokens}
                    onChange={(e) =>
                      onChangeConfig({
                        ...config,
                        budgetLimits: { ...config.budgetLimits, maxTokens: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <div className="rounded-lg bg-indigo-950/30 border border-indigo-900/40 p-2.5 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-indigo-200 leading-relaxed">
                  The agent runs within an Antigravity stateful conversation context with automatic binary tool wiring and step trajectory synthesis.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: TOOLS */}
        {activeTab === 'tools' && (
          <div className="space-y-3">
            <div className="text-slate-400 text-[11px]">
              Toggle built-in Antigravity SDK tools or review their execution specifications:
            </div>

            <div className="space-y-2">
              {availableTools.map((tool) => {
                const isEnabled = config.enabledTools.includes(tool.id);
                return (
                  <div
                    key={tool.id}
                    className={`rounded-lg border p-2.5 transition-colors ${
                      isEnabled
                        ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                        : 'bg-slate-950/50 border-slate-800/60 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-semibold text-xs text-indigo-300">
                          {tool.name}
                        </span>
                        {tool.requiresApprovalDefault && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            Approval
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => toggleTool(tool.id)}
                        className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                          isEnabled
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 border border-slate-700 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-1.5">
                      {tool.description}
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Params: {tool.parameters.map((p) => `${p.name}: ${p.type}`).join(', ') || 'None'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: POLICY */}
        {activeTab === 'policy' && (
          <div className="space-y-4">
            <div className="text-slate-400 text-[11px]">
              Antigravity SDK HookRunner policies enable declarative execution guards and human-in-the-loop approvals before tools execute.
            </div>

            <div className="space-y-3">
              <label className="flex items-start space-x-3 p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 cursor-pointer hover:bg-slate-900/60 transition-colors">
                <input
                  type="checkbox"
                  checked={config.policy.requireApprovalForCommands}
                  onChange={(e) =>
                    onChangeConfig({
                      ...config,
                      policy: { ...config.policy, requireApprovalForCommands: e.target.checked },
                    })
                  }
                  className="mt-0.5 accent-indigo-500 rounded"
                />
                <div>
                  <span className="font-medium text-slate-200 block mb-0.5">Require Approval for Commands</span>
                  <p className="text-[11px] text-slate-400">
                    Halts execution before running shell commands (`run_command`) and requests explicit confirmation.
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 cursor-pointer hover:bg-slate-900/60 transition-colors">
                <input
                  type="checkbox"
                  checked={config.policy.requireApprovalForFiles}
                  onChange={(e) =>
                    onChangeConfig({
                      ...config,
                      policy: { ...config.policy, requireApprovalForFiles: e.target.checked },
                    })
                  }
                  className="mt-0.5 accent-indigo-500 rounded"
                />
                <div>
                  <span className="font-medium text-slate-200 block mb-0.5">Require Approval for File Writes</span>
                  <p className="text-[11px] text-slate-400">
                    Guards file creation and mutation operations (`file_ops:write`) with human authorization checks.
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 cursor-pointer hover:bg-slate-900/60 transition-colors">
                <input
                  type="checkbox"
                  checked={config.policy.readOnlyMode}
                  onChange={(e) =>
                    onChangeConfig({
                      ...config,
                      policy: { ...config.policy, readOnlyMode: e.target.checked },
                    })
                  }
                  className="mt-0.5 accent-indigo-500 rounded"
                />
                <div>
                  <span className="font-medium text-slate-200 block mb-0.5">Strict Read-Only Mode</span>
                  <p className="text-[11px] text-slate-400">
                    Disallows all state-modifying actions; limits agent to reading, analysis, and searches.
                  </p>
                </div>
              </label>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] space-y-1 font-mono text-slate-400">
              <div className="flex items-center text-indigo-300 font-semibold mb-1">
                <Lock className="w-3.5 h-3.5 mr-1" />
                Active Policy Hooks
              </div>
              <div>• pre_tool_hook: ApprovalPolicyRunner</div>
              <div>• post_tool_hook: TelemetryAuditor</div>
              <div>• error_hook: ExponentialBackoffRetry</div>
            </div>
          </div>
        )}

        {/* TAB: EXAMPLES */}
        {activeTab === 'examples' && (
          <div className="space-y-3">
            <div className="text-slate-400 text-[11px]">
              Select any SDK recipe from the Python repository to load its agent configuration and test prompt:
            </div>

            <div className="space-y-2">
              {sdkExamples.map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => onSelectExample(ex)}
                  className="p-3 rounded-lg border border-slate-800 bg-slate-950/70 hover:bg-slate-800/80 hover:border-slate-700 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                      {ex.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {ex.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 mb-2">
                    {ex.description}
                  </p>
                  <div className="flex items-center text-[10px] text-indigo-400 font-medium space-x-1">
                    <FileCode2 className="w-3 h-3" />
                    <span>Load Recipe & Sample Prompt</span>
                    <ChevronRight className="w-3 h-3 ml-auto text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

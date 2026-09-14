import React, { useState, useEffect } from 'react';
import { AgentConfig, ChatMessage, ToolDefinition, SdkExample, ObservabilitySummary } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ObservabilityModal } from './components/ObservabilityModal';
import { ExampleModal } from './components/ExampleModal';

const defaultConfig: AgentConfig = {
  id: 'agent_primary',
  name: 'Antigravity Autonomous Core',
  model: 'gemini-2.5-flash',
  systemInstruction: 'You are an autonomous AI agent powered by the Google Antigravity SDK. Analyze requests, invoke necessary tools, respect security policies, and maintain stateful context.',
  agentBehavior: 'autonomous',
  budgetLimits: {
    maxTurns: 10,
    maxTokens: 4096,
    timeoutSeconds: 30,
  },
  policy: {
    requireApprovalForCommands: true,
    requireApprovalForFiles: true,
    readOnlyMode: false,
  },
  enabledTools: ['run_command', 'file_ops', 'eval_math', 'web_search', 'docstring_analyzer', 'subagent_delegate'],
  subagents: [
    {
      id: 'sub_doc',
      name: 'DocReviewer',
      role: 'CodeReviewer',
      model: 'gemini-2.5-pro',
      systemInstruction: 'Specialized subagent for code quality, docstrings, and style guides.',
      allowedTools: ['docstring_analyzer'],
    },
    {
      id: 'sub_search',
      name: 'Researcher',
      role: 'DocResearcher',
      model: 'gemini-2.5-flash',
      systemInstruction: 'Specialized subagent for researching documentation and specs.',
      allowedTools: ['web_search'],
    },
  ],
};

export default function App() {
  const [config, setConfig] = useState<AgentConfig>(defaultConfig);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [availableTools, setAvailableTools] = useState<ToolDefinition[]>([]);
  const [sdkExamples, setSdkExamples] = useState<SdkExample[]>([]);
  const [observability, setObservability] = useState<ObservabilitySummary>({
    totalTurns: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalThinkingTokens: 0,
    averageLatencyMs: 0,
    toolCallsCount: {},
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false);

  // Modals
  const [selectedExample, setSelectedExample] = useState<SdkExample | null>(null);
  const [isObservabilityOpen, setIsObservabilityOpen] = useState<boolean>(false);

  // Initial load
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHasGeminiKey(Boolean(data.hasGeminiKey)))
      .catch((err) => console.error('Health check failed:', err));

    fetch('/api/tools')
      .then((res) => res.json())
      .then((data) => setAvailableTools(data))
      .catch((err) => console.error('Failed to load tools:', err));

    fetch('/api/examples')
      .then((res) => res.json())
      .then((data) => setSdkExamples(data))
      .catch((err) => console.error('Failed to load examples:', err));

    refreshObservability();
  }, []);

  const refreshObservability = async () => {
    try {
      const res = await fetch('/api/observability');
      if (res.ok) {
        const data = await res.json();
        setObservability(data);
      }
    } catch (err) {
      console.error('Failed to refresh observability:', err);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          config,
          conversationHistory: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();

      const agentMessage: ChatMessage = {
        id: `agt_${Date.now()}`,
        role: 'agent',
        content: data.content,
        timestamp: data.timestamp || new Date().toISOString(),
        steps: data.steps || [],
        metrics: data.metrics,
      };

      setMessages((prev) => [...prev, agentMessage]);
      refreshObservability();
    } catch (err: any) {
      console.error('Error executing chat turn:', err);
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'agent',
        content: `Execution error in Antigravity Agent Runtime: ${err.message || 'Unknown network error'}. Please verify connection or retry.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveTool = async (toolName: string, toolInput: any, decision: 'approve' | 'reject') => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/approve-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolName, toolInput, decision }),
      });

      if (!res.ok) throw new Error(`Approval endpoint error: ${res.status}`);

      const data = await res.json();

      // Update the previous message's pending step status
      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.steps) {
          lastMsg.steps = lastMsg.steps.map((s) =>
            s.type === 'approval_request'
              ? { ...s, status: decision === 'approve' ? 'approved' : 'rejected' }
              : s
          );
        }
        return [
          ...updated,
          {
            id: `agt_approval_${Date.now()}`,
            role: 'agent',
            content: data.content,
            timestamp: data.timestamp || new Date().toISOString(),
            steps: data.steps || [],
            metrics: data.metrics,
          },
        ];
      });

      refreshObservability();
    } catch (err: any) {
      console.error('Failed to submit tool approval:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSession = () => {
    setMessages([]);
  };

  const handleSelectExample = (example: SdkExample) => {
    setSelectedExample(example);
  };

  const handleRunExamplePrompt = (prompt: string, configUpdates?: Partial<AgentConfig>) => {
    if (configUpdates) {
      setConfig((prev) => ({
        ...prev,
        ...configUpdates,
        policy: { ...prev.policy, ...(configUpdates.policy || {}) },
      }));
    }
    handleSendMessage(prompt);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navigation */}
      <Navbar
        config={config}
        onChangeConfig={setConfig}
        onResetSession={handleResetSession}
        observabilityTurnCount={observability.totalTurns}
        hasGeminiKey={hasGeminiKey}
        onOpenObservability={() => setIsObservabilityOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Control Panel / Sidebar */}
        <Sidebar
          config={config}
          onChangeConfig={setConfig}
          availableTools={availableTools}
          sdkExamples={sdkExamples}
          onSelectExample={handleSelectExample}
        />

        {/* Center / Right Chat Conversation & Execution View */}
        <ChatArea
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onApproveTool={handleApproveTool}
          activeModelName={config.model}
        />
      </div>

      {/* Observability Telemetry Modal */}
      <ObservabilityModal
        isOpen={isObservabilityOpen}
        onClose={() => setIsObservabilityOpen(false)}
        observability={observability}
      />

      {/* SDK Recipe Inspection Modal */}
      <ExampleModal
        example={selectedExample}
        onClose={() => setSelectedExample(null)}
        onRunPrompt={handleRunExamplePrompt}
      />
    </div>
  );
}

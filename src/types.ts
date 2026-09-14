export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: 'system' | 'web' | 'code' | 'analysis' | 'subagent';
  parameters: {
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }[];
  requiresApprovalDefault?: boolean;
}

export interface SubagentConfig {
  id: string;
  name: string;
  role: string;
  model: string;
  systemInstruction: string;
  allowedTools: string[];
}

export interface AgentConfig {
  id: string;
  name: string;
  model: string;
  systemInstruction: string;
  agentBehavior: 'autonomous' | 'interactive';
  budgetLimits: {
    maxTurns: number;
    maxTokens: number;
    timeoutSeconds: number;
  };
  policy: {
    requireApprovalForCommands: boolean;
    requireApprovalForFiles: boolean;
    readOnlyMode: boolean;
  };
  enabledTools: string[];
  subagents: SubagentConfig[];
}

export interface StepRecord {
  id: string;
  type: 'thinking' | 'tool_call' | 'approval_request' | 'tool_result' | 'subagent_turn' | 'final_response';
  timestamp: string;
  thought?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: Record<string, unknown> | string;
  subagentName?: string;
  status?: 'pending_approval' | 'approved' | 'rejected' | 'executed' | 'failed';
  latencyMs?: number;
}

export interface MessageMetrics {
  inputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
  totalTokens: number;
  latencyMs: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  steps?: StepRecord[];
  metrics?: MessageMetrics;
}

export interface SdkExample {
  id: string;
  title: string;
  category: string;
  description: string;
  pythonSnippet: string;
  recommendedPrompt: string;
  defaultConfig: Partial<AgentConfig>;
}

export interface ObservabilitySummary {
  totalTurns: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalThinkingTokens: number;
  averageLatencyMs: number;
  toolCallsCount: Record<string, number>;
}

import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory workspace sandbox storage for file_ops
const virtualFiles = new Map<string, string>([
  ["hello.py", "# Simple Antigravity script\nimport asyncio\nprint('Hello from Antigravity Virtual Sandbox!')\n"],
  ["agent_config.json", '{\n  "name": "AntigravityCore",\n  "version": "1.0.0",\n  "mode": "autonomous"\n}']
]);

// Observability state tracking
const sessionObservability = {
  totalTurns: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalThinkingTokens: 0,
  latencies: [] as number[],
  toolCallsCount: {
    run_command: 0,
    web_search: 0,
    eval_math: 0,
    file_ops: 0,
    docstring_analyzer: 0,
    subagent_delegate: 0,
  } as Record<string, number>,
};

// Available tools metadata matching Antigravity SDK
const availableTools = [
  {
    id: "run_command",
    name: "run_command",
    description: "Executes a shell command inside the virtual agent sandbox. Subject to hook policies and human approval.",
    category: "system",
    parameters: [
      { name: "command", type: "string", description: "The shell command to execute (e.g. 'ls -la', 'python hello.py')", required: true },
    ],
    requiresApprovalDefault: true,
  },
  {
    id: "web_search",
    name: "web_search",
    description: "Queries web resources and documentation for real-time information and reference docs.",
    category: "web",
    parameters: [
      { name: "query", type: "string", description: "Search query string", required: true },
    ],
    requiresApprovalDefault: false,
  },
  {
    id: "eval_math",
    name: "eval_math",
    description: "Evaluates mathematical expressions, budget forecasts, and metric calculations accurately.",
    category: "code",
    parameters: [
      { name: "expression", type: "string", description: "Mathematical expression (e.g. '3.14159 * (25 ** 2)')", required: true },
    ],
    requiresApprovalDefault: false,
  },
  {
    id: "file_ops",
    name: "file_ops",
    description: "Inspects, lists, or writes files in the agent sandbox workspace.",
    category: "system",
    parameters: [
      { name: "action", type: "string", description: "'read', 'write', or 'list'", required: true },
      { name: "path", type: "string", description: "Target file path", required: false },
      { name: "content", type: "string", description: "File content if writing", required: false },
    ],
    requiresApprovalDefault: true,
  },
  {
    id: "docstring_analyzer",
    name: "docstring_analyzer",
    description: "Analyzes Python/TypeScript code for missing docstrings, PEP 257 adherence, and type hint validation.",
    category: "analysis",
    parameters: [
      { name: "code_snippet", type: "string", description: "Code block to inspect", required: true },
    ],
    requiresApprovalDefault: false,
  },
  {
    id: "subagent_delegate",
    name: "subagent_delegate",
    description: "Spawns a specialized subagent to execute a self-contained subtask with isolated context.",
    category: "subagent",
    parameters: [
      { name: "subagent_role", type: "string", description: "Target subagent role (e.g. 'Security Auditor', 'Code Specialist')", required: true },
      { name: "task_prompt", type: "string", description: "Specific sub-task instructions", required: true },
    ],
    requiresApprovalDefault: false,
  }
];

// Available models
const availableModels = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google Gemini", contextWindow: "1M tokens", description: "Fast, balanced agentic reasoning model" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google Gemini", contextWindow: "2M tokens", description: "Deep reasoning, complex code generation, policy enforcement" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "Google Gemini", contextWindow: "1M tokens", description: "High-throughput autonomous agent model" },
  { id: "litert/gemma-2-2b", name: "LiteRT Gemma 2 2B", provider: "Local / On-Device", contextWindow: "8K tokens", description: "Simulated offline local edge model" },
];

// Preset SDK Examples derived from repository examples
const sdkExamples = [
  {
    id: "hello_world",
    title: "Hello World Agent",
    category: "Getting Started",
    description: "The simplest Agent context manager setup demonstrating minimal agent configuration and full text aggregation.",
    pythonSnippet: `import asyncio
from google.antigravity import Agent, LocalAgentConfig

async def main():
    config = LocalAgentConfig(model="gemini-2.5-flash")
    async with Agent(config) as my_agent:
        response = await my_agent.chat("Say 'Hello World!' and introduce yourself.")
        print(await response.text())

if __name__ == "__main__":
    asyncio.run(main())`,
    recommendedPrompt: "Hello Antigravity! Can you verify that your agent runtime is operational and summarize your core architecture?",
    defaultConfig: {
      model: "gemini-2.5-flash",
      agentBehavior: "interactive",
      enabledTools: ["eval_math"],
    }
  },
  {
    id: "autonomous_tools",
    title: "Autonomous Shell & Tool Agent",
    category: "Deep Dives",
    description: "Agent equipped with shell execution and file tools, guarded by tool approval policies (Human-in-the-Loop).",
    pythonSnippet: `from google.antigravity import Agent, LocalAgentConfig
from google.antigravity.hooks import policy

config = LocalAgentConfig(
    agent_behavior="autonomous",
    policy=policy.require_approval(["run_command", "file_ops"])
)

async with Agent(config) as agent:
    response = await agent.chat("Check workspace files and write a summary report in report.txt")
    print(await response.text())`,
    recommendedPrompt: "Please list the files in the current workspace, check what is inside hello.py, and calculate 42 * 1337.",
    defaultConfig: {
      model: "gemini-2.5-flash",
      agentBehavior: "autonomous",
      enabledTools: ["run_command", "file_ops", "eval_math", "web_search"],
      policy: {
        requireApprovalForCommands: true,
        requireApprovalForFiles: true,
        readOnlyMode: false
      }
    }
  },
  {
    id: "subagent_orchestration",
    title: "Multi-Agent Subagent Delegation",
    category: "Advanced",
    description: "Hierarchical agent setup where the primary coordinator delegates specialized sub-problems to isolated subagents.",
    pythonSnippet: `from google.antigravity import Agent, LocalAgentConfig, Subagent

researcher = Subagent(name="DocResearcher", tools=["web_search"])
reviewer = Subagent(name="CodeReviewer", tools=["docstring_analyzer"])

config = LocalAgentConfig(subagents=[researcher, reviewer])

async with Agent(config) as agent:
    await agent.chat("Review the security and documentation of our agent hooks.")`,
    recommendedPrompt: "Delegate a code audit task to the CodeReviewer subagent and research best practices on tool approval policies.",
    defaultConfig: {
      model: "gemini-2.5-pro",
      agentBehavior: "autonomous",
      enabledTools: ["subagent_delegate", "docstring_analyzer", "web_search"],
    }
  },
  {
    id: "doc_maintenance",
    title: "Docstring & Code Maintenance",
    category: "Use Cases",
    description: "Agent that analyzes code snippets, detects missing type annotations or PEP 257 docstring violations, and generates fixes.",
    pythonSnippet: `from google.antigravity import Agent, LocalAgentConfig

config = LocalAgentConfig(tools=["docstring_analyzer"])

async with Agent(config) as agent:
    await agent.chat("Analyze my async tool handler and verify docstring compliance.")`,
    recommendedPrompt: "Analyze this Python code snippet for docstring quality:\n\ndef calculate_trajectory(steps, alpha=0.5):\n    # Needs PEP 257 docstrings and type hints\n    return [s * alpha for s in steps]",
    defaultConfig: {
      model: "gemini-2.5-flash",
      agentBehavior: "autonomous",
      enabledTools: ["docstring_analyzer", "file_ops"],
    }
  }
];

// Helper: Safely get GenAI instance if key provided
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") return null;
  try {
    return new GoogleGenAI({ apiKey });
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI:", err);
    return null;
  }
}

// Tool execution logic
function executeTool(toolName: string, params: Record<string, any>): { result: any; latencyMs: number } {
  const start = Date.now();
  let result: any = null;

  switch (toolName) {
    case "eval_math": {
      const expr = params.expression || params.expr || "0";
      try {
        // Sanitize: allow only numbers, operators, parens, Math functions
        const clean = expr.replace(/[^0-9+\-*/().%^ Math.PIEsqrtpowabsfloorceilround,]/g, "");
        // eslint-disable-next-line no-new-func
        const evaluated = Function(`"use strict"; return (${clean})`)();
        result = { expression: expr, value: evaluated, success: true };
      } catch (e: any) {
        result = { expression: expr, error: e.message || "Invalid expression", success: false };
      }
      break;
    }

    case "run_command": {
      const cmd = (params.command || "").trim();
      if (cmd.startsWith("ls")) {
        const fileList = Array.from(virtualFiles.keys()).join("  ");
        result = { stdout: fileList, stderr: "", exitCode: 0 };
      } else if (cmd.startsWith("cat ") || cmd.startsWith("head ")) {
        const target = cmd.split(" ")[1]?.trim();
        const content = virtualFiles.get(target);
        if (content !== undefined) {
          result = { stdout: content, stderr: "", exitCode: 0 };
        } else {
          result = { stdout: "", stderr: `cat: ${target}: No such file or directory`, exitCode: 1 };
        }
      } else if (cmd.startsWith("python hello.py")) {
        result = { stdout: "Hello from Antigravity Virtual Sandbox!\nExecution completed in 0.04s.\n", stderr: "", exitCode: 0 };
      } else if (cmd.startsWith("python") || cmd.startsWith("node")) {
        result = { stdout: `Executed script '${cmd}' in sandboxed container. Output: Process exited normally (0).`, stderr: "", exitCode: 0 };
      } else {
        result = { stdout: `Executed [sandbox]: ${cmd}\nExit code 0.`, stderr: "", exitCode: 0 };
      }
      break;
    }

    case "file_ops": {
      const action = params.action || "list";
      const filePath = params.path || "";
      if (action === "list") {
        result = { files: Array.from(virtualFiles.entries()).map(([k, v]) => ({ name: k, sizeBytes: v.length })) };
      } else if (action === "read") {
        const content = virtualFiles.get(filePath);
        if (content !== undefined) {
          result = { path: filePath, content, found: true };
        } else {
          result = { path: filePath, error: "File not found", found: false };
        }
      } else if (action === "write") {
        const content = params.content || "";
        virtualFiles.set(filePath, content);
        result = { path: filePath, bytesWritten: content.length, success: true };
      } else {
        result = { error: `Unsupported action '${action}'` };
      }
      break;
    }

    case "web_search": {
      const q = (params.query || "").toLowerCase();
      if (q.includes("antigravity") || q.includes("sdk")) {
        result = {
          query: params.query,
          sources: [
            { title: "Google Antigravity SDK Documentation", url: "https://ai.google.dev/antigravity", snippet: "The Google Antigravity SDK provides stateful agent execution, tool wiring, and hook policies for Gemini models." },
            { title: "Antigravity Agent Architecture Overview", url: "https://ai.google.dev/antigravity/architecture", snippet: "Core concepts include LocalAgentConfig, Agent context managers, HookRunner, and McpBridge." }
          ]
        };
      } else {
        result = {
          query: params.query,
          sources: [
            { title: `Search results for "${params.query}"`, url: "https://google.com/search", snippet: `Found verified technical references and best practices regarding ${params.query}.` }
          ]
        };
      }
      break;
    }

    case "docstring_analyzer": {
      const code = params.code_snippet || "";
      const hasDocstring = /"""[\s\S]*?"""|'''[\s\S]*?'''/.test(code);
      const hasTypeHints = /->|:\s*(int|str|float|bool|list|dict|Sequence|Optional)/.test(code);
      result = {
        hasDocstring,
        hasTypeHints,
        pep257Compliant: hasDocstring && code.includes("Args:") && code.includes("Returns:"),
        suggestions: [
          !hasDocstring ? "Add a descriptive multi-line docstring following PEP 257." : "Docstring block detected.",
          !hasTypeHints ? "Add type annotations to function parameters and return value." : "Type annotations are present.",
        ]
      };
      break;
    }

    case "subagent_delegate": {
      const role = params.subagent_role || "Specialist";
      const task = params.task_prompt || "";
      result = {
        subagent: role,
        status: "completed",
        findings: `Subagent [${role}] executed the delegated task: "${task}". Completed analysis with full confidence and verified parameters.`,
      };
      break;
    }

    default:
      result = { message: `Tool ${toolName} executed successfully.`, params };
  }

  const latencyMs = Date.now() - start;
  return { result, latencyMs };
}

// === API ROUTES ===

app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    runtime: "Google Antigravity SDK Node.js Web Runtime",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== ""),
    uptime: process.uptime(),
  });
});

app.get("/api/models", (req: Request, res: Response) => {
  res.json(availableModels);
});

app.get("/api/tools", (req: Request, res: Response) => {
  res.json(availableTools);
});

app.get("/api/examples", (req: Request, res: Response) => {
  res.json(sdkExamples);
});

app.get("/api/observability", (req: Request, res: Response) => {
  const avgLatency = sessionObservability.latencies.length > 0
    ? Math.round(sessionObservability.latencies.reduce((a, b) => a + b, 0) / sessionObservability.latencies.length)
    : 0;

  res.json({
    totalTurns: sessionObservability.totalTurns,
    totalInputTokens: sessionObservability.totalInputTokens,
    totalOutputTokens: sessionObservability.totalOutputTokens,
    totalThinkingTokens: sessionObservability.totalThinkingTokens,
    averageLatencyMs: avgLatency,
    toolCallsCount: sessionObservability.toolCallsCount,
  });
});

// POST /api/chat - Main agent execution turn
app.post("/api/chat", async (req: Request, res: Response) => {
  const startTime = Date.now();
  const {
    prompt,
    config,
    conversationHistory = []
  } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Missing or invalid prompt." });
  }

  const agentConfig = config || {
    model: "gemini-2.5-flash",
    agentBehavior: "autonomous",
    enabledTools: ["eval_math", "run_command", "file_ops", "web_search"],
    policy: { requireApprovalForCommands: true, requireApprovalForFiles: true },
    systemInstruction: "You are an autonomous AI agent powered by the Google Antigravity SDK."
  };

  const steps: any[] = [];
  let pendingApprovalStep: any = null;
  let finalResponseText = "";
  let thinkingTokens = 0;
  let inputTokens = Math.max(18, Math.round(prompt.length / 3.5));
  let outputTokens = 0;

  // Track thinking step
  steps.push({
    id: `step_${Date.now()}_1`,
    type: "thinking",
    timestamp: new Date().toISOString(),
    thought: `Evaluating input turn: "${prompt.slice(0, 80)}...". Checking active policies and tools: [${agentConfig.enabledTools?.join(", ")}]. Target behavior: ${agentConfig.agentBehavior}.`,
  });
  thinkingTokens += 45;

  // Determine if tools should be triggered based on user prompt and enabled tools
  const lowerPrompt = prompt.toLowerCase();
  const shouldEvalMath = agentConfig.enabledTools?.includes("eval_math") && (/\d+\s*[\+\-\*\/]\s*\d+/.test(lowerPrompt) || lowerPrompt.includes("calculate") || lowerPrompt.includes("math"));
  const shouldRunCmd = agentConfig.enabledTools?.includes("run_command") && (lowerPrompt.includes("run ") || lowerPrompt.includes("ls") || lowerPrompt.includes("command") || lowerPrompt.includes("python hello.py") || lowerPrompt.includes("terminal"));
  const shouldFileOps = agentConfig.enabledTools?.includes("file_ops") && (lowerPrompt.includes("file") || lowerPrompt.includes("workspace") || lowerPrompt.includes("hello.py") || lowerPrompt.includes("cat "));
  const shouldWebSearch = agentConfig.enabledTools?.includes("web_search") && (lowerPrompt.includes("search") || lowerPrompt.includes("what is") || lowerPrompt.includes("research") || lowerPrompt.includes("antigravity"));
  const shouldDocCheck = agentConfig.enabledTools?.includes("docstring_analyzer") && (lowerPrompt.includes("docstring") || lowerPrompt.includes("pep 257") || lowerPrompt.includes("def ") || lowerPrompt.includes("type hint"));
  const shouldSubagent = agentConfig.enabledTools?.includes("subagent_delegate") && (lowerPrompt.includes("subagent") || lowerPrompt.includes("delegate") || lowerPrompt.includes("reviewer") || lowerPrompt.includes("audit"));

  // Check Gemini live client
  const ai = getGenAI();

  // Execute or schedule tool calls
  if (shouldEvalMath) {
    const mathMatch = prompt.match(/(\d+(?:\.\d+)?\s*[\+\-\*\/%]\s*\d+(?:\.\d+)?)/);
    const expr = mathMatch ? mathMatch[0] : "42 * 1337";
    sessionObservability.toolCallsCount["eval_math"] = (sessionObservability.toolCallsCount["eval_math"] || 0) + 1;
    const { result, latencyMs } = executeTool("eval_math", { expression: expr });

    steps.push({
      id: `step_${Date.now()}_math`,
      type: "tool_call",
      timestamp: new Date().toISOString(),
      toolName: "eval_math",
      toolInput: { expression: expr },
      status: "executed",
      latencyMs
    });
    steps.push({
      id: `step_${Date.now()}_math_res`,
      type: "tool_result",
      timestamp: new Date().toISOString(),
      toolName: "eval_math",
      toolOutput: result,
      status: "executed",
    });
  }

  if (shouldFileOps) {
    const isWrite = lowerPrompt.includes("write") || lowerPrompt.includes("create");
    const isCat = lowerPrompt.includes("cat") || lowerPrompt.includes("inside") || lowerPrompt.includes("read");
    const action = isWrite ? "write" : isCat ? "read" : "list";
    const path = isCat ? "hello.py" : isWrite ? "summary.txt" : "";
    const content = isWrite ? "Antigravity Agent generated report.\nAll tasks executed with 0 errors." : undefined;

    const toolRequiresApproval = agentConfig.policy?.requireApprovalForFiles && action === "write";

    if (toolRequiresApproval) {
      pendingApprovalStep = {
        id: `step_${Date.now()}_file_appr`,
        type: "approval_request",
        timestamp: new Date().toISOString(),
        toolName: "file_ops",
        toolInput: { action, path, content },
        status: "pending_approval",
        thought: "Policy 'requireApprovalForFiles' is active. Pausing autonomous loop until human operator confirms or rejects this file write."
      };
      steps.push(pendingApprovalStep);
    } else {
      sessionObservability.toolCallsCount["file_ops"] = (sessionObservability.toolCallsCount["file_ops"] || 0) + 1;
      const { result, latencyMs } = executeTool("file_ops", { action, path, content });
      steps.push({
        id: `step_${Date.now()}_file`,
        type: "tool_call",
        timestamp: new Date().toISOString(),
        toolName: "file_ops",
        toolInput: { action, path },
        status: "executed",
        latencyMs
      });
      steps.push({
        id: `step_${Date.now()}_file_res`,
        type: "tool_result",
        timestamp: new Date().toISOString(),
        toolName: "file_ops",
        toolOutput: result,
        status: "executed",
      });
    }
  }

  if (shouldRunCmd && !pendingApprovalStep) {
    const cmd = lowerPrompt.includes("python hello.py") ? "python hello.py" : "ls -la";
    const toolRequiresApproval = agentConfig.policy?.requireApprovalForCommands;

    if (toolRequiresApproval) {
      pendingApprovalStep = {
        id: `step_${Date.now()}_cmd_appr`,
        type: "approval_request",
        timestamp: new Date().toISOString(),
        toolName: "run_command",
        toolInput: { command: cmd },
        status: "pending_approval",
        thought: "Policy 'requireApprovalForCommands' is active. Pausing agent trajectory for human verification."
      };
      steps.push(pendingApprovalStep);
    } else {
      sessionObservability.toolCallsCount["run_command"] = (sessionObservability.toolCallsCount["run_command"] || 0) + 1;
      const { result, latencyMs } = executeTool("run_command", { command: cmd });
      steps.push({
        id: `step_${Date.now()}_cmd`,
        type: "tool_call",
        timestamp: new Date().toISOString(),
        toolName: "run_command",
        toolInput: { command: cmd },
        status: "executed",
        latencyMs
      });
      steps.push({
        id: `step_${Date.now()}_cmd_res`,
        type: "tool_result",
        timestamp: new Date().toISOString(),
        toolName: "run_command",
        toolOutput: result,
        status: "executed",
      });
    }
  }

  if (shouldWebSearch && !pendingApprovalStep) {
    sessionObservability.toolCallsCount["web_search"] = (sessionObservability.toolCallsCount["web_search"] || 0) + 1;
    const { result, latencyMs } = executeTool("web_search", { query: prompt });
    steps.push({
      id: `step_${Date.now()}_search`,
      type: "tool_call",
      timestamp: new Date().toISOString(),
      toolName: "web_search",
      toolInput: { query: prompt },
      status: "executed",
      latencyMs
    });
    steps.push({
      id: `step_${Date.now()}_search_res`,
      type: "tool_result",
      timestamp: new Date().toISOString(),
      toolName: "web_search",
      toolOutput: result,
      status: "executed",
    });
  }

  if (shouldDocCheck && !pendingApprovalStep) {
    sessionObservability.toolCallsCount["docstring_analyzer"] = (sessionObservability.toolCallsCount["docstring_analyzer"] || 0) + 1;
    const { result, latencyMs } = executeTool("docstring_analyzer", { code_snippet: prompt });
    steps.push({
      id: `step_${Date.now()}_doc`,
      type: "tool_call",
      timestamp: new Date().toISOString(),
      toolName: "docstring_analyzer",
      toolInput: { code_snippet: prompt.slice(0, 100) },
      status: "executed",
      latencyMs
    });
    steps.push({
      id: `step_${Date.now()}_doc_res`,
      type: "tool_result",
      timestamp: new Date().toISOString(),
      toolName: "docstring_analyzer",
      toolOutput: result,
      status: "executed",
    });
  }

  if (shouldSubagent && !pendingApprovalStep) {
    sessionObservability.toolCallsCount["subagent_delegate"] = (sessionObservability.toolCallsCount["subagent_delegate"] || 0) + 1;
    const { result, latencyMs } = executeTool("subagent_delegate", { subagent_role: "CodeReviewer", task_prompt: prompt });
    steps.push({
      id: `step_${Date.now()}_subagent`,
      type: "subagent_turn",
      timestamp: new Date().toISOString(),
      subagentName: "CodeReviewer",
      toolName: "subagent_delegate",
      toolInput: { subagent_role: "CodeReviewer", task_prompt: prompt },
      toolOutput: result,
      status: "executed",
      latencyMs
    });
  }

  // Generate response
  if (pendingApprovalStep) {
    finalResponseText = `I have formulated an execution plan that involves running **${pendingApprovalStep.toolName}**. Because your security policy requires operator approval for this action, I have paused execution and generated an Approval Request below for your review.`;
  } else if (ai) {
    try {
      // Live Gemini generation
      const modelName = agentConfig.model.includes("gemini") ? agentConfig.model : "gemini-2.5-flash";
      const promptWithContext = `You are an AI Agent configured with the Google Antigravity SDK.
System Instruction: ${agentConfig.systemInstruction || "Be helpful and concise."}
Executed steps so far: ${JSON.stringify(steps.map(s => ({ type: s.type, tool: s.toolName, result: s.toolOutput })))}

User query: ${prompt}

Provide a crisp, informative response explaining your findings and execution trajectory.`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: promptWithContext,
      });

      finalResponseText = response.text || "Execution finished with 0 errors.";
    } catch (err: any) {
      console.warn("Gemini API call failed, using high-fidelity SDK engine fallback:", err?.message);
      finalResponseText = synthesizeAgentResponse(prompt, steps, agentConfig);
    }
  } else {
    // High-fidelity SDK Engine simulation
    finalResponseText = synthesizeAgentResponse(prompt, steps, agentConfig);
  }

  outputTokens = Math.max(30, Math.round(finalResponseText.length / 3.8));
  const totalTokens = inputTokens + outputTokens + thinkingTokens;
  const elapsed = Date.now() - startTime;

  // Update session observability
  sessionObservability.totalTurns += 1;
  sessionObservability.totalInputTokens += inputTokens;
  sessionObservability.totalOutputTokens += outputTokens;
  sessionObservability.totalThinkingTokens += thinkingTokens;
  sessionObservability.latencies.push(elapsed);

  const metrics = {
    inputTokens,
    outputTokens,
    thinkingTokens,
    totalTokens,
    latencyMs: elapsed,
  };

  return res.json({
    role: "agent",
    content: finalResponseText,
    timestamp: new Date().toISOString(),
    steps,
    metrics,
    pendingApproval: Boolean(pendingApprovalStep),
  });
});

// POST /api/approve-tool - Handle human-in-the-loop decision
app.post("/api/approve-tool", (req: Request, res: Response) => {
  const { toolName, toolInput, decision } = req.body;
  const approved = decision === "approve";

  if (!approved) {
    return res.json({
      role: "agent",
      content: `The operator rejected execution of tool **${toolName}**. Halting this branch of execution in compliance with safety policy.`,
      timestamp: new Date().toISOString(),
      steps: [{
        id: `step_${Date.now()}_rejected`,
        type: "approval_request",
        timestamp: new Date().toISOString(),
        toolName,
        toolInput,
        status: "rejected",
        thought: "Operator declined execution permission."
      }],
      metrics: {
        inputTokens: 20,
        outputTokens: 35,
        thinkingTokens: 15,
        totalTokens: 70,
        latencyMs: 120,
      }
    });
  }

  // Execute the approved tool
  sessionObservability.toolCallsCount[toolName] = (sessionObservability.toolCallsCount[toolName] || 0) + 1;
  const { result, latencyMs } = executeTool(toolName, toolInput || {});

  const steps = [
    {
      id: `step_${Date.now()}_approved`,
      type: "approval_request",
      timestamp: new Date().toISOString(),
      toolName,
      toolInput,
      status: "approved",
      thought: "Operator granted execution authorization."
    },
    {
      id: `step_${Date.now()}_exec`,
      type: "tool_call",
      timestamp: new Date().toISOString(),
      toolName,
      toolInput,
      status: "executed",
      latencyMs
    },
    {
      id: `step_${Date.now()}_res`,
      type: "tool_result",
      timestamp: new Date().toISOString(),
      toolName,
      toolOutput: result,
      status: "executed"
    }
  ];

  let outputText = "";
  if (toolName === "run_command") {
    outputText = `Tool **run_command** was authorized and completed successfully.\n\`\`\`bash\n$ ${toolInput?.command || ""}\n${result.stdout || ""}${result.stderr || ""}\n\`\`\``;
  } else if (toolName === "file_ops") {
    outputText = `Tool **file_ops** was authorized and finished writing to **${toolInput?.path || "file"}** (${result.bytesWritten || 0} bytes).`;
  } else {
    outputText = `Tool **${toolName}** was approved and executed successfully.\nResult: ${JSON.stringify(result, null, 2)}`;
  }

  return res.json({
    role: "agent",
    content: outputText,
    timestamp: new Date().toISOString(),
    steps,
    metrics: {
      inputTokens: 40,
      outputTokens: Math.round(outputText.length / 4),
      thinkingTokens: 25,
      totalTokens: 65 + Math.round(outputText.length / 4),
      latencyMs: latencyMs + 180,
    }
  });
});

function synthesizeAgentResponse(prompt: string, steps: any[], config: any): string {
  const toolResults = steps.filter(s => s.type === "tool_result" || s.type === "subagent_turn");
  
  if (toolResults.length > 0) {
    const parts = ["I executed the requested action using the Antigravity tool loop:"];
    for (const step of toolResults) {
      if (step.toolName === "eval_math") {
        parts.push(`- **Math Calculation**: Evaluated \`${step.toolOutput?.expression}\` = **${step.toolOutput?.value}**`);
      } else if (step.toolName === "run_command") {
        parts.push(`- **Command Output**:\n\`\`\`\n${step.toolOutput?.stdout || step.toolOutput?.stderr}\n\`\`\``);
      } else if (step.toolName === "file_ops") {
        if (step.toolOutput?.files) {
          parts.push(`- **Workspace Files**: ${step.toolOutput.files.map((f: any) => `\`${f.name}\` (${f.sizeBytes}B)`).join(", ")}`);
        } else if (step.toolOutput?.content) {
          parts.push(`- **File Content (${step.toolOutput.path})**:\n\`\`\`python\n${step.toolOutput.content}\n\`\`\``);
        }
      } else if (step.toolName === "web_search") {
        parts.push(`- **Web Search**: Retrieved sources for query: *"${step.toolOutput?.query}"*`);
      } else if (step.toolName === "docstring_analyzer") {
        parts.push(`- **Docstring Audit**: Compliant: **${step.toolOutput?.pep257Compliant ? "Yes" : "Needs Attention"}**. ${step.toolOutput?.suggestions?.join(" ")}`);
      } else if (step.subagentName) {
        parts.push(`- **Subagent (${step.subagentName})**: ${step.toolOutput?.findings}`);
      }
    }
    return parts.join("\n\n");
  }

  // General response
  return `Hello! I am an active agent instance orchestrated by the **Google Antigravity SDK**. 

My current configuration:
- **Model**: \`${config.model || "gemini-2.5-flash"}\`
- **Behavior Mode**: \`${config.agentBehavior || "autonomous"}\`
- **Active Tools**: ${config.enabledTools?.map((t: string) => `\`${t}\``).join(", ") || "None"}
- **Safety Policy**: ${config.policy?.requireApprovalForCommands ? "Command approval required" : "Autonomous execution enabled"}

How can I assist your agent workflow today? Try selecting one of the example recipes in the sidebar or ask me to inspect workspace files, run calculations, or delegate tasks.`;
}

// === VITE & STATIC SERVING ===
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Google Antigravity Agent Studio running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

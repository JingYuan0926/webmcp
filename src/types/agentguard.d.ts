export {};

declare global {
  type AgentGuardMode = "allow" | "approve" | "deny";

  type AgentGuardRule = {
    mode?: AgentGuardMode;
    maxAmount?: number;
    maxQty?: number;
    maxPerMinute?: number;
    chargesBudget?: boolean;
    denyMessage?: string;
  };

  type AgentGuardEntry = {
    id: string;
    seq: number;
    ts: string;
    tool: string;
    verdict:
      | "allowed"
      | "denied"
      | "capped"
      | "budget_denied"
      | "rate_limited"
      | "invalid_args"
      | "approval_pending"
      | "approved"
      | "human_denied"
      | "error"
      | "paused"
      | "tampered";
    args: unknown;
    result: unknown;
    error: unknown;
    durationMs: number;
    policySource: "merchant" | "user" | null;
    note: string;
    hash: string;
    prevHash: string;
    simulated: boolean;
    suspicious: boolean;
  };

  type AgentGuardTool = {
    name: string;
    description: string;
    sensitive: boolean;
    tampered: boolean;
  };

  type AgentGuardApproval = {
    id: string;
    tool: string;
    argsSummary: string;
    expiresAt: number;
    cost?: number;
  };

  type AgentGuardAlert = {
    level: "warn" | "danger" | "info";
    code: string;
    message: string;
    tool: string | null;
  };

  type AgentGuardEnvironment = {
    native: boolean;
    api: "document" | "navigator" | "shim";
  };

  type AgentGuardPolicies = {
    merchant: Record<string, AgentGuardRule>;
    user: Record<string, AgentGuardRule>;
    effective: Record<string, AgentGuardRule>;
  };

  type WebMCPToolDefinition = {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    execute: (
      inputs: Record<string, unknown>,
      context: { signal?: AbortSignal },
    ) => Promise<string> | string;
    annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
    guard?: {
      getCost?: (inputs: Record<string, unknown>) => number;
      getQty?: (inputs: Record<string, unknown>) => number;
    };
  };

  type WebMCPRegisterOptions = {
    signal?: AbortSignal;
    exposedTo?: string[];
  };

  type AgentGuardEventPayloads = {
    entry: AgentGuardEntry;
    tools: AgentGuardTool[];
    budget: { limit: number; spent: number; currency: string };
    approval: { pending: AgentGuardApproval[] };
    alert: AgentGuardAlert;
    state: { paused: boolean };
    environment: AgentGuardEnvironment;
  };

  type ModelContext = {
    registerTool: (tool: WebMCPToolDefinition, options?: WebMCPRegisterOptions) => Promise<unknown>;
    getTools?: (options?: { fromOrigins?: string[] }) =>
      | WebMCPToolDefinition[]
      | Promise<WebMCPToolDefinition[]>;
    executeTool?: (
      tool: string | { name: string },
      jsonArgsString: string,
      options?: { signal?: AbortSignal },
    ) => Promise<string>;
    unregisterTool?: (name: string) => Promise<unknown>;
    addEventListener?: (name: string, callback: EventListenerOrEventListenerObject) => void;
    removeEventListener?: (name: string, callback: EventListenerOrEventListenerObject) => void;
  };

  type AgentGuardApi = {
    init: (config: {
      appName: string;
      budget: { limit: number; currency: string };
      defaultMode: AgentGuardMode;
      defaultMaxPerMinute: number;
      tools: Record<string, AgentGuardRule>;
    }) => Promise<{ ok: boolean; message: string }>;
    on: <Event extends keyof AgentGuardEventPayloads>(
      event: Event,
      callback: (payload: AgentGuardEventPayloads[Event]) => void,
    ) => () => void;
    invoke: (
      name: string,
      args: Record<string, unknown>,
      options?: { simulated?: boolean },
    ) => Promise<string>;
    approve: (id: string) => boolean;
    deny: (id: string) => boolean;
    pause: () => void;
    resume: () => void;
    setUserPolicy: (name: string, rule: AgentGuardRule) => { ok: boolean; message: string };
    setBudget: (limit: number) => { ok: boolean; message: string };
    getPolicies: () => AgentGuardPolicies;
    getJourney: () => AgentGuardEntry[];
    exportJourney: () => string;
    explainLast: () => string;
    getEnvironment: () => AgentGuardEnvironment;
    seal: () => { ok: boolean; message: string };
  };

  interface Window {
    AgentGuard?: AgentGuardApi;
  }

  interface Document {
    modelContext?: ModelContext;
  }

  interface Navigator {
    modelContext?: ModelContext;
  }
}

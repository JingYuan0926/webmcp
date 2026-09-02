export {};

declare global {
  type PageControlMode = "allow" | "approve" | "deny";

  type PageControlRule = {
    mode?: PageControlMode;
    maxAmount?: number;
    maxQty?: number;
    maxPerMinute?: number;
    chargesBudget?: boolean;
    denyMessage?: string;
  };

  type PageControlEntry = {
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

  type PageControlTool = {
    name: string;
    label?: string;
    description: string;
    sensitive: boolean;
    tampered: boolean;
  };

  type PageControlApproval = {
    id: string;
    tool: string;
    argsSummary: string;
    expiresAt: number;
    cost?: number;
  };

  type PageControlAlert = {
    level: "warn" | "danger" | "info";
    code: string;
    message: string;
    tool: string | null;
  };

  type PageControlEnvironment = {
    native: boolean;
    api: "document" | "navigator" | "shim";
  };

  type PageControlPolicies = {
    merchant: Record<string, PageControlRule>;
    user: Record<string, PageControlRule>;
    effective: Record<string, PageControlRule>;
  };

  type WebMCPToolDefinition = {
    name: string;
    label?: string;
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

  type PageControlEventPayloads = {
    entry: PageControlEntry;
    tools: PageControlTool[];
    budget: { limit: number; spent: number; currency: string };
    approval: { pending: PageControlApproval[] };
    alert: PageControlAlert;
    state: { paused: boolean };
    environment: PageControlEnvironment;
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

  type PageControlApi = {
    init: (config: {
      appName: string;
      budget: { limit: number; currency: string };
      defaultMode: PageControlMode;
      defaultMaxPerMinute: number;
      tools: Record<string, PageControlRule>;
    }) => Promise<{ ok: boolean; message: string }>;
    registerTool: (
      tool: WebMCPToolDefinition,
      options?: WebMCPRegisterOptions,
    ) => Promise<unknown>;
    on: <Event extends keyof PageControlEventPayloads>(
      event: Event,
      callback: (payload: PageControlEventPayloads[Event]) => void,
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
    setUserPolicy: (
      name: string,
      rule: PageControlRule,
      options?: { humanConfirmed?: boolean },
    ) => { ok: boolean; message: string };
    setBudget: (
      limit: number,
      options?: { humanConfirmed?: boolean },
    ) => { ok: boolean; message: string };
    getPolicies: () => PageControlPolicies;
    getJourney: () => PageControlEntry[];
    exportJourney: () => string;
    explainLast: () => string;
    getEnvironment: () => PageControlEnvironment;
    resetTamperStatus: () => { ok: boolean; message: string };
    seal: () => { ok: boolean; message: string };
  };

  interface Window {
    PageControl?: PageControlApi;
    FastShipDeliveryTracker?: { ready?: Promise<void> };
  }

  interface Document {
    modelContext?: ModelContext;
  }

  interface Navigator {
    modelContext?: ModelContext;
  }
}

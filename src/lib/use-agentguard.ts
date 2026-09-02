"use client";

import { useEffect, useRef, useState } from "react";

export type GuardAlert = AgentGuardAlert & { id: number };

export type GuardSnapshot = {
  entries: AgentGuardEntry[];
  tools: AgentGuardTool[];
  budget: { limit: number; spent: number; currency: string };
  approvals: AgentGuardApproval[];
  alerts: GuardAlert[];
  guardState: { paused: boolean };
  environment: AgentGuardEnvironment;
  available: boolean;
  policies: AgentGuardPolicies;
};

const emptyPolicies: AgentGuardPolicies = { merchant: {}, user: {}, effective: {} };
const MAX_ORDINARY_ALERTS = 20;

export function useAgentGuard(): GuardSnapshot {
  const [entries, setEntries] = useState<AgentGuardEntry[]>([]);
  const [tools, setTools] = useState<AgentGuardTool[]>([]);
  const [budget, setBudget] = useState({ limit: 0, spent: 0, currency: "USD" });
  const [approvals, setApprovals] = useState<AgentGuardApproval[]>([]);
  const [alerts, setAlerts] = useState<GuardAlert[]>([]);
  const nextAlertId = useRef(1);
  const [guardState, setGuardState] = useState({ paused: false });
  const [environment, setEnvironment] = useState<AgentGuardEnvironment>({
    native: false,
    api: "shim",
  });
  const [available, setAvailable] = useState(false);
  const [policyRevision, setPolicyRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let connected = false;
    let interval: number | null = null;
    const cleanups: Array<() => void> = [];

    function connect() {
      const guard = window.AgentGuard;
      if (cancelled || connected || !guard) return;
      connected = true;
      if (interval !== null) {
        window.clearInterval(interval);
        interval = null;
      }
      setAvailable(true);
      setEntries(guard.getJourney());
      setEnvironment(guard.getEnvironment());
      cleanups.push(
        guard.on("entry", (entry) => {
          setEntries((current) => [...current, entry]);
        }),
        guard.on("tools", (nextTools) => {
          setTools(nextTools);
          if (!nextTools.some((tool) => tool.tampered)) {
            setAlerts((current) =>
              current.filter(
                (alert) => alert.code !== "TAMPER" && alert.code !== "LATE_TOOL",
              ),
            );
          }
          setPolicyRevision((revision) => revision + 1);
        }),
        guard.on("budget", (nextBudget) => {
          setBudget(nextBudget);
        }),
        guard.on("approval", (event) => {
          setApprovals(event.pending);
        }),
        guard.on("alert", (alert) => {
          const nextAlert = { ...alert, id: nextAlertId.current };
          nextAlertId.current += 1;
          setAlerts((current) => {
            const updated = [...current, nextAlert];
            const dangerAlerts = updated.filter((item) => item.level === "danger");
            const ordinaryAlerts = updated
              .filter((item) => item.level !== "danger")
              .slice(-MAX_ORDINARY_ALERTS);
            return [...dangerAlerts, ...ordinaryAlerts];
          });
        }),
        guard.on("state", (state) => {
          setGuardState(state);
        }),
        guard.on("environment", (nextEnvironment) => {
          setEnvironment(nextEnvironment);
        }),
      );
    }

    connect();
    if (!connected) interval = window.setInterval(connect, 50);
    return () => {
      cancelled = true;
      if (interval !== null) window.clearInterval(interval);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  void policyRevision;
  const policies =
    typeof window !== "undefined" && window.AgentGuard
      ? window.AgentGuard.getPolicies()
      : emptyPolicies;

  return {
    entries,
    tools,
    budget,
    approvals,
    alerts,
    guardState,
    environment,
    available,
    policies,
  };
}

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

export function useAgentGuard(): GuardSnapshot {
  const [entries, setEntries] = useState<AgentGuardEntry[]>([]);
  const [tools, setTools] = useState<AgentGuardTool[]>([]);
  const [budget, setBudget] = useState({ limit: 0, spent: 0, currency: "RM" });
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
    const cleanups: Array<() => void> = [];

    function connect() {
      const guard = window.AgentGuard;
      if (cancelled || connected || !guard) return;
      connected = true;
      setAvailable(true);
      setEntries(guard.getJourney());
      setEnvironment(guard.getEnvironment());
      cleanups.push(
        guard.on("entry", (entry) => {
          setEntries((current) => [...current, entry]);
        }),
        guard.on("tools", (nextTools) => {
          setTools(nextTools);
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
            const dangerAlerts = current.filter((item) => item.level === "danger");
            const ordinaryAlerts = current.filter((item) => item.level !== "danger");
            const retainedOrdinary = ordinaryAlerts.slice(alert.level === "danger" ? -20 : -19);
            return [...dangerAlerts, ...retainedOrdinary, nextAlert];
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
    const interval = window.setInterval(connect, 50);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
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

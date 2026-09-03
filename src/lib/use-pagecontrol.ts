"use client";

import { useEffect, useRef, useState } from "react";

export type GuardAlert = PageControlAlert & { id: number };

export type GuardSnapshot = {
  entries: PageControlEntry[];
  tools: PageControlTool[];
  budget: { limit: number; spent: number; currency: string };
  approvals: PageControlApproval[];
  alerts: GuardAlert[];
  guardState: { paused: boolean };
  environment: PageControlEnvironment;
  surface: PageControlSurface;
  available: boolean;
  policies: PageControlPolicies;
};

const emptyPolicies: PageControlPolicies = { merchant: {}, user: {}, effective: {} };
const MAX_ORDINARY_ALERTS = 20;

function mergeJourneyEntries(
  current: PageControlEntry[],
  incoming: PageControlEntry[],
): PageControlEntry[] {
  const entriesById = new Map(current.map((entry) => [entry.id, entry]));
  incoming.forEach((entry) => entriesById.set(entry.id, entry));
  return Array.from(entriesById.values()).sort((first, second) => first.seq - second.seq);
}

export function usePageControl(): GuardSnapshot {
  const [entries, setEntries] = useState<PageControlEntry[]>([]);
  const [tools, setTools] = useState<PageControlTool[]>([]);
  const [budget, setBudget] = useState({ limit: 0, spent: 0, currency: "USD" });
  const [approvals, setApprovals] = useState<PageControlApproval[]>([]);
  const [alerts, setAlerts] = useState<GuardAlert[]>([]);
  const nextAlertId = useRef(1);
  const [guardState, setGuardState] = useState({ paused: false });
  const [environment, setEnvironment] = useState<PageControlEnvironment>({
    native: false,
    api: "shim",
  });
  const [surface, setSurface] = useState<PageControlSurface>({ guarded: [], unguarded: [] });
  const [available, setAvailable] = useState(false);
  const [policyRevision, setPolicyRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let connected = false;
    let interval: number | null = null;
    const cleanups: Array<() => void> = [];

    function connect() {
      const guard = window.PageControl;
      if (cancelled || connected || !guard) return;
      connected = true;
      if (interval !== null) {
        window.clearInterval(interval);
        interval = null;
      }
      setAvailable(true);
      setEnvironment(guard.getEnvironment());
      setSurface(guard.getSurface());
      cleanups.push(
        guard.on("entry", (entry) => {
          setEntries((current) => mergeJourneyEntries(current, [entry]));
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
        guard.on("surface", (nextSurface) => {
          setSurface(nextSurface);
        }),
      );
      // Subscribe before taking the snapshot. If a tool finishes between the
      // two operations, the id-based merge keeps exactly one copy instead of
      // dropping the entry or showing it twice.
      setEntries((current) => mergeJourneyEntries(current, guard.getJourney()));
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
    typeof window !== "undefined" && window.PageControl
      ? window.PageControl.getPolicies()
      : emptyPolicies;

  return {
    entries,
    tools,
    budget,
    approvals,
    alerts,
    guardState,
    environment,
    surface,
    available,
    policies,
  };
}

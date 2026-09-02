"use client";

import { useState } from "react";

import type { GuardAlert } from "@/lib/use-pagecontrol";

export function AlertsStrip({ alerts }: { alerts: GuardAlert[] }) {
  const [dismissed, setDismissed] = useState<Set<number>>(() => new Set());
  const active = alerts.filter((alert) => !dismissed.has(alert.id));
  const pinned = active.filter((alert) => alert.level === "danger");
  const recent = active.filter((alert) => alert.level !== "danger").slice(-3);
  const visible = [...pinned, ...recent].sort((left, right) => right.id - left.id);
  if (!visible.length) return null;

  function dismiss(id: number) {
    setDismissed((current) => new Set(current).add(id));
  }

  return (
    <section className="alerts-strip" aria-label="Recent security alerts">
      {visible.map((alert) => (
        <button
          type="button"
          key={alert.id}
          className={`alert-row alert-row--${alert.level}`}
          onClick={() => dismiss(alert.id)}
          aria-label={`Dismiss ${alert.code} alert`}
        >
          <span className="alert-code">{alert.code}</span>
          <span>{alert.message}</span>
          <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
            <path d="m6 6 8 8m0-8-8 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      ))}
    </section>
  );
}

"use client";

import { useEffect, useState, type FormEvent } from "react";

import { formatUSD } from "@/lib/catalog";

const modeRank: Record<AgentGuardMode, number> = { allow: 0, approve: 1, deny: 2 };
const modes: AgentGuardMode[] = ["allow", "approve", "deny"];
const capLabels: Record<"maxAmount" | "maxQty" | "maxPerMinute", string> = {
  maxAmount: "Max amount",
  maxQty: "Max quantity",
  maxPerMinute: "Calls per minute",
};

type CapKey = keyof typeof capLabels;

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
      <rect x="4.5" y="9" width="11" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 9V6.8a3 3 0 0 1 6 0V9" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function PolicyRow({
  name,
  tampered,
  merchant,
  effective,
}: {
  name: string;
  tampered: boolean;
  merchant: AgentGuardRule;
  effective: AgentGuardRule;
}) {
  const currentMode = effective.mode ?? "allow";
  const [mode, setMode] = useState<AgentGuardMode>(currentMode);
  const [caps, setCaps] = useState<Record<CapKey, string>>({
    maxAmount: effective.maxAmount?.toString() ?? "",
    maxQty: effective.maxQty?.toString() ?? "",
    maxPerMinute: effective.maxPerMinute?.toString() ?? "",
  });
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(true);

  useEffect(() => {
    let cancelled = false;
    window.queueMicrotask(() => {
      if (cancelled) return;
      setMode(currentMode);
      setCaps({
        maxAmount: effective.maxAmount?.toString() ?? "",
        maxQty: effective.maxQty?.toString() ?? "",
        maxPerMinute: effective.maxPerMinute?.toString() ?? "",
      });
    });
    return () => {
      cancelled = true;
    };
  }, [currentMode, effective.maxAmount, effective.maxPerMinute, effective.maxQty]);

  const availableModes = modes.filter((candidate) => modeRank[candidate] >= modeRank[currentMode]);
  const visibleCaps = (Object.keys(capLabels) as CapKey[]).filter(
    (key) => merchant[key] !== undefined,
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rule: AgentGuardRule = { mode };
    visibleCaps.forEach((key) => {
      const value = caps[key].trim();
      if (value) rule[key] = Number(value);
    });
    const result = window.AgentGuard?.setUserPolicy(name, rule) ?? {
      ok: false,
      message: "AgentGuard is not available.",
    };
    setOk(result.ok);
    setMessage(result.message);
  }

  return (
    <details className="policy-row">
      <summary>
        <span className="policy-lock"><LockIcon /></span>
        <span className="policy-name">{name}</span>
        <span className="policy-status">
          {tampered ? <span className="tool-risk-badge">Flagged</span> : null}
          <span className={`mode-chip mode-chip--${currentMode}`}>{currentMode}</span>
        </span>
        <svg className="policy-chevron" viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
          <path d="m6 8 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="policy-locked-values">
        <span>Merchant floor</span>
        {typeof merchant.maxAmount === "number" ? <b>{formatUSD(merchant.maxAmount)}</b> : null}
        {typeof merchant.maxQty === "number" ? <b>qty {merchant.maxQty}</b> : null}
        {typeof merchant.maxPerMinute === "number" ? <b>{merchant.maxPerMinute}/min</b> : null}
        {merchant.chargesBudget ? <b>charges budget</b> : null}
      </div>
      <form className="policy-form" onSubmit={submit}>
        <div className="panel-field">
          <label htmlFor={`policy-mode-${name}`}>Tighten mode</label>
          <select id={`policy-mode-${name}`} value={mode} onChange={(event) => setMode(event.target.value as AgentGuardMode)}>
            {availableModes.map((candidate) => (
              <option key={candidate} value={candidate}>{candidate}</option>
            ))}
          </select>
        </div>
        {visibleCaps.map((key) => (
          <div className="panel-field" key={key}>
            <label htmlFor={`policy-${key}-${name}`}>Lower {capLabels[key].toLowerCase()}</label>
            <input
              id={`policy-${key}-${name}`}
              type="text"
              inputMode={key === "maxAmount" ? "decimal" : "numeric"}
              pattern={key === "maxAmount" ? undefined : "[0-9]*"}
              autoComplete="off"
              value={caps[key]}
              onChange={(event) => setCaps((current) => ({ ...current, [key]: event.target.value }))}
            />
          </div>
        ))}
        <button type="submit" className="panel-button panel-button--compact">Apply tighter rule</button>
      </form>
      {message ? <p className={`policy-message${ok ? "" : " is-error"}`} aria-live="polite">{message}</p> : null}
    </details>
  );
}

export function PolicyList({
  tools,
  policies,
  budget,
}: {
  tools: AgentGuardTool[];
  policies: AgentGuardPolicies;
  budget: { limit: number; spent: number; currency: string };
}) {
  const [limit, setLimit] = useState(budget.limit.toString());
  const [budgetMessage, setBudgetMessage] = useState("");
  const [budgetOk, setBudgetOk] = useState(true);

  useEffect(() => {
    let cancelled = false;
    window.queueMicrotask(() => {
      if (!cancelled) setLimit(budget.limit.toString());
    });
    return () => {
      cancelled = true;
    };
  }, [budget.limit]);

  const visibleTools = tools.filter((tool) => !tool.name.startsWith("guard_"));

  function submitBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = window.AgentGuard?.setBudget(Number(limit)) ?? {
      ok: false,
      message: "AgentGuard is not available.",
    };
    setBudgetOk(result.ok);
    setBudgetMessage(result.message);
  }

  return (
    <section className="policy-section" aria-labelledby="policies-title">
      <div className="panel-section-heading">
        <div>
          <p className="panel-eyebrow">Two-tier controls</p>
          <h2 id="policies-title">Policies</h2>
        </div>
        <span className="panel-caption">User can tighten</span>
      </div>
      <div className="policy-list">
        {visibleTools.map((tool) => (
          <PolicyRow
            key={tool.name}
            name={tool.name}
            tampered={tool.tampered}
            merchant={policies.merchant[tool.name] ?? { mode: "allow" }}
            effective={policies.effective[tool.name] ?? { mode: "allow" }}
          />
        ))}
      </div>
      <form className="budget-policy" onSubmit={submitBudget}>
        <div>
          <label htmlFor="budget-limit">Lower session budget</label>
          <span>Current {formatUSD(budget.limit)}</span>
        </div>
        <div className="budget-policy-controls">
          <input
            id="budget-limit"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
          />
          <button type="submit" className="panel-button panel-button--compact">Set</button>
        </div>
        {budgetMessage ? <p className={`policy-message${budgetOk ? "" : " is-error"}`} aria-live="polite">{budgetMessage}</p> : null}
      </form>
    </section>
  );
}

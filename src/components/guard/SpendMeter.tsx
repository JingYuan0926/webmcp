"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { formatUSD } from "@/lib/catalog";

type SpendMeterProps = {
  budget: { limit: number; spent: number; currency: string };
};

export function SpendMeter({ budget }: SpendMeterProps) {
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const [editing, setEditing] = useState(false);
  const [limit, setLimit] = useState(budget.limit.toString());
  const [budgetMessage, setBudgetMessage] = useState("");
  const [budgetOk, setBudgetOk] = useState(true);
  const ratio = budget.limit > 0 ? budget.spent / budget.limit : budget.spent > 0 ? 1 : 0;
  const level = ratio >= 1 ? "danger" : ratio >= 0.7 ? "warn" : "ok";
  const percent = Math.min(100, Math.max(0, ratio * 100));

  useEffect(() => {
    let cancelled = false;
    window.queueMicrotask(() => {
      if (!cancelled) setLimit(budget.limit.toString());
    });
    return () => {
      cancelled = true;
    };
  }, [budget.limit]);

  function submitBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = window.PageControl?.setBudget(Number(limit), { humanConfirmed: true }) ?? {
      ok: false,
      message: "PageControl is not available.",
    };
    setBudgetOk(result.ok);
    setBudgetMessage(result.message);
    if (result.ok) {
      setEditing(false);
      window.queueMicrotask(() => editButtonRef.current?.focus());
    }
  }

  function toggleEditor() {
    setBudgetMessage("");
    setEditing((current) => !current);
  }

  return (
    <section className="guard-section spend-card" aria-labelledby="spend-title">
      <div className="panel-section-heading">
        <div>
          <p className="panel-eyebrow">Session budget</p>
          <h2 id="spend-title">Spend meter</h2>
        </div>
        <strong className={`meter-value meter-value--${level}`}>{formatUSD(budget.spent)}</strong>
      </div>
      <div
        className="meter-track"
        role="meter"
        aria-label="Agent spend"
        aria-valuemin={0}
        aria-valuemax={budget.limit}
        aria-valuenow={Math.min(budget.spent, budget.limit)}
      >
        <span className={`meter-fill meter-fill--${level}`} style={{ width: `${percent}%` }} />
      </div>
      <div className="meter-meta">
        <span>{Math.round(ratio * 100)}% used</span>
        <span className="meter-limit">
          <span>{formatUSD(budget.limit)} limit</span>
          <button
            ref={editButtonRef}
            type="button"
            className="budget-edit-button"
            aria-label="Edit session budget"
            aria-expanded={editing}
            aria-controls="budget-editor"
            title="Edit session budget"
            onClick={toggleEditor}
          >
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
              <path d="m4 13.5-.7 3.2 3.2-.7L15.8 6.7a1.6 1.6 0 0 0 0-2.3l-.2-.2a1.6 1.6 0 0 0-2.3 0L4 13.5Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="m12 5.5 2.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </span>
      </div>
      {editing ? (
        <form id="budget-editor" className="budget-policy" onSubmit={submitBudget}>
          <div>
            <label htmlFor="budget-limit">Set session budget</label>
            <span>Current {formatUSD(budget.limit)}</span>
          </div>
          <div className="budget-policy-controls">
            <input
              id="budget-limit"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={limit}
              aria-invalid={budgetMessage && !budgetOk ? "true" : undefined}
              aria-describedby={budgetMessage ? "budget-message" : undefined}
              onChange={(event) => setLimit(event.target.value)}
            />
            <button type="submit" className="panel-button panel-button--compact">Set</button>
          </div>
          {budgetMessage ? (
            <p id="budget-message" className={`policy-message${budgetOk ? "" : " is-error"}`} aria-live="polite">
              {budgetMessage}
            </p>
          ) : null}
        </form>
      ) : null}
      {!editing && budgetMessage && budgetOk ? (
        <p className="budget-update-message" aria-live="polite">{budgetMessage}</p>
      ) : null}
    </section>
  );
}

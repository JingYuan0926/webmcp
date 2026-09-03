"use client";

import { useEffect, useState } from "react";

import { formatUSD } from "@/lib/catalog";

function Countdown({ expiresAt }: { expiresAt: number }) {
  const [seconds, setSeconds] = useState(() => Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));

  useEffect(() => {
    const tick = () => setSeconds(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt]);

  return <span className="approval-timer">{seconds}s left</span>;
}

export function ApprovalsList({ approvals }: { approvals: PageControlApproval[] }) {
  if (!approvals.length) return null;
  return (
    <section className="guard-section approvals-section" aria-labelledby="approvals-title">
      <div className="panel-section-heading">
        <div>
          <p className="panel-eyebrow">Human checkpoint</p>
          <h2 id="approvals-title">Needs approval</h2>
        </div>
        <span className="panel-count panel-count--warn">{approvals.length}</span>
      </div>
      <div className="approval-list">
        {approvals.map((approval) => (
          <article key={approval.handle} className="approval-card">
            <div className="approval-topline">
              <strong>{approval.tool}</strong>
              <Countdown expiresAt={approval.expiresAt} />
            </div>
            <p className={approval.summary ? "approval-intent" : undefined}>
              {approval.summary ?? approval.argsSummary}
            </p>
            {typeof approval.cost === "number" ? (
              <span className="approval-cost">Cost {formatUSD(approval.cost)}</span>
            ) : null}
            <div className="approval-actions">
              <button
                type="button"
                className="panel-button panel-button--ghost"
                data-pagecontrol-approval-handle={approval.handle}
                data-pagecontrol-decision="deny"
              >
                Block
              </button>
              <button
                type="button"
                className="panel-button panel-button--allow"
                data-pagecontrol-approval-handle={approval.handle}
                data-pagecontrol-decision="approve"
              >
                Run once
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

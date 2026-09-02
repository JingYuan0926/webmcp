"use client";

import { useState } from "react";

import { AlertsStrip } from "@/components/guard/AlertsStrip";
import { ApprovalsList } from "@/components/guard/ApprovalsList";
import { PolicyList } from "@/components/guard/PolicyList";
import { SpendMeter } from "@/components/guard/SpendMeter";
import { Timeline } from "@/components/guard/Timeline";
import { demoSteps, runTestAgent } from "@/lib/demo-agent";
import { usePageControl } from "@/lib/use-pagecontrol";

export function GuardPanel({ onHide }: { onHide: () => void }) {
  const snapshot = usePageControl();
  const [progress, setProgress] = useState<{ step: number; tool: string } | null>(null);
  const [runError, setRunError] = useState("");
  const tampered = snapshot.tools.some((tool) => tool.tampered);
  const status = tampered ? "Tamper detected" : snapshot.guardState.paused ? "Paused" : "Live";
  const ready = snapshot.available && snapshot.tools.some((tool) => tool.name === "list_products");

  async function runSecurityDemo() {
    setRunError("");
    const result = await runTestAgent((step, tool) => setProgress({ step, tool }));
    if (!result.ok) setRunError(result.message);
    setProgress(null);
  }

  function togglePause() {
    if (!window.PageControl) return;
    if (snapshot.guardState.paused) window.PageControl.resume();
    else window.PageControl.pause();
  }

  return (
    <aside className="guard-panel" aria-label="PageControl panel">
      <header className="guard-header">
        <div>
          <div className="guard-wordmark">
            <span className="guard-symbol" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="19" height="19">
                <path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="m9 12 2 2 4-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <strong>PageControl</strong>
          </div>
          <p className="guard-tagline">The in-page trust layer</p>
        </div>
        <div className="guard-header-actions">
          <div className="guard-live">
            <span className={tampered || snapshot.guardState.paused ? "is-alert" : ""} aria-hidden="true" />
            <strong>{status}</strong>
          </div>
          <button
            type="button"
            className="guard-hide-button"
            onClick={onHide}
            aria-label="Hide PageControl panel"
            title="Hide PageControl"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="m14 7-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19 5v14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      {snapshot.environment.native ? (
        <p className="native-webmcp-note" role="status">
          Guarding native agent calls on this page.
        </p>
      ) : null}

      <div className="guard-command-bar" aria-label="Agent controls">
        <button
          type="button"
          className="panel-button panel-button--allow"
          onClick={runSecurityDemo}
          disabled={!ready || Boolean(progress)}
          aria-busy={Boolean(progress)}
        >
          {progress ? `Demo ${progress.step}/${demoSteps.length}: ${progress.tool}` : "Run security demo"}
        </button>
        <button
          type="button"
          className="panel-button panel-button--ghost"
          onClick={togglePause}
          disabled={!snapshot.available}
        >
          {snapshot.guardState.paused ? "Resume agent" : "Pause agent"}
        </button>
        {runError ? <p role="alert">{runError}</p> : null}
      </div>

      {!snapshot.available ? (
        <div className="panel-error" role="status">
          <strong>SDK not loaded</strong>
          <span>The store still works. Reload to reconnect PageControl.</span>
        </div>
      ) : null}
      <SpendMeter budget={snapshot.budget} />
      <ApprovalsList approvals={snapshot.approvals} />
      <Timeline entries={snapshot.entries} />
      <AlertsStrip alerts={snapshot.alerts} />
      <PolicyList
        tools={snapshot.tools}
        policies={snapshot.policies}
      />
    </aside>
  );
}

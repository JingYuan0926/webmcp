"use client";

import { useState } from "react";

import { AgentAuthority } from "@/components/guard/AgentAuthority";
import { AlertsStrip } from "@/components/guard/AlertsStrip";
import { ApprovalsList } from "@/components/guard/ApprovalsList";
import { PolicyList } from "@/components/guard/PolicyList";
import { Timeline } from "@/components/guard/Timeline";
import { ToolSurface } from "@/components/guard/ToolSurface";
import { demoSteps, runTestAgent } from "@/lib/demo-agent";
import { usePageControl } from "@/lib/use-pagecontrol";

export function GuardPanel({ onHide, hidden }: { onHide: () => void; hidden?: boolean }) {
  const snapshot = usePageControl();
  const [progress, setProgress] = useState<{ step: number; tool: string } | null>(null);
  const [runError, setRunError] = useState("");
  const tampered = snapshot.tools.some((tool) => tool.tampered);
  const status = tampered ? "Tamper detected" : snapshot.guardState.paused ? "Paused" : "Live";
  const alerting = tampered || snapshot.guardState.paused;
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
    <div
      id="pagecontrol-panel"
      className="guard-panel-shell"
      role="dialog"
      aria-modal="false"
      aria-labelledby="pagecontrol-title"
      hidden={hidden}
    >
      <button
        type="button"
        className="guard-hide-button"
        onClick={onHide}
        aria-label="Close PageCtrl settings"
        title="Close"
      >
        <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
          <path d="m7 7 10 10m0-10L7 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      <aside className="guard-panel" aria-label="PageCtrl panel">
        <header className="guard-header">
          <div>
            <div className="guard-wordmark">
              <strong id="pagecontrol-title">PageCTRL</strong>
            </div>
            <p className="guard-tagline">Review what your agent can access and do.</p>
          </div>
          {/* Healthy is the default, so it says nothing at all. Paused and
              tamper are the states worth surfacing. */}
          {alerting ? (
            <div className="guard-live">
              <strong>{status}</strong>
            </div>
          ) : (
            <span className="sr-only">{status}</span>
          )}
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
            <span>The store still works. Reload to reconnect PageCTRL.</span>
          </div>
        ) : null}
        <AgentAuthority budget={snapshot.budget} />
        <ApprovalsList approvals={snapshot.approvals} />
        {/* Alerts are current state; the timeline is history. */}
        <AlertsStrip alerts={snapshot.alerts} />
        <Timeline entries={snapshot.entries} />
        <ToolSurface surface={snapshot.surface} />
        <PolicyList
          tools={snapshot.tools}
          policies={snapshot.policies}
        />
      </aside>
    </div>
  );
}

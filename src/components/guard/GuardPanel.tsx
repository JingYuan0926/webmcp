"use client";

import { AlertsStrip } from "@/components/guard/AlertsStrip";
import { ApprovalsList } from "@/components/guard/ApprovalsList";
import { PolicyList } from "@/components/guard/PolicyList";
import { SpendMeter } from "@/components/guard/SpendMeter";
import { Timeline } from "@/components/guard/Timeline";
import { usePageControl } from "@/lib/use-pagecontrol";

export function GuardPanel({ onHide }: { onHide: () => void }) {
  const snapshot = usePageControl();
  const tampered = snapshot.tools.some((tool) => tool.tampered);
  const status = tampered ? "Tamper detected" : snapshot.guardState.paused ? "Paused" : "Live";

  function togglePause() {
    if (!window.PageControl) return;
    if (snapshot.guardState.paused) window.PageControl.resume();
    else window.PageControl.pause();
  }

  return (
    <aside className="guard-panel" aria-label="PageControl panel">
      <header className="guard-header">
        <button
          type="button"
          className="guard-hide-button"
          onClick={onHide}
          aria-label="Hide PageControl panel"
          title="Hide PageControl"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="m14 7-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <div className="guard-wordmark">
            <strong>PageControl</strong>
          </div>
          <p className="guard-tagline">PageControl — the in-page policy layer for WebMCP.</p>
        </div>
        <div className="guard-live">
          <span className={tampered || snapshot.guardState.paused ? "is-alert" : ""} aria-hidden="true" />
          <strong>{status}</strong>
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
          className="panel-button panel-button--ghost"
          onClick={togglePause}
          disabled={!snapshot.available}
        >
          {snapshot.guardState.paused ? "Resume agent" : "Pause agent"}
        </button>
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

"use client";

import { AlertsStrip } from "@/components/guard/AlertsStrip";
import { ApprovalsList } from "@/components/guard/ApprovalsList";
import { ExportRow } from "@/components/guard/ExportRow";
import { PolicyList } from "@/components/guard/PolicyList";
import { SpendMeter } from "@/components/guard/SpendMeter";
import { Timeline } from "@/components/guard/Timeline";
import { useAgentGuard } from "@/lib/use-agentguard";

export function GuardPanel() {
  const snapshot = useAgentGuard();
  const tampered = snapshot.tools.some((tool) => tool.tampered);
  const status = tampered ? "Tamper detected" : snapshot.guardState.paused ? "Paused" : "Live";

  return (
    <aside className="guard-panel" aria-label="AgentGuard control panel">
      <header className="guard-header">
        <div>
          <div className="guard-wordmark">
            <span className="guard-symbol" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="19" height="19">
                <path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="m9 12 2 2 4-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <strong>AgentGuard</strong>
          </div>
          <p className="guard-tagline">The in-page trust layer</p>
          <span
            className={`webmcp-badge panel-webmcp-badge${snapshot.environment.native ? " webmcp-badge--native" : ""}`}
            aria-live="polite"
          >
            {!snapshot.available
              ? "WebMCP: Checking"
              : snapshot.environment.native
              ? "WebMCP: Native"
              : "WebMCP: Shim — demo fallback"}
          </span>
        </div>
        <div className="guard-live">
          <span className={tampered || snapshot.guardState.paused ? "is-alert" : ""} aria-hidden="true" />
          <strong>{status}</strong>
          <small>{snapshot.entries.length} entries</small>
        </div>
      </header>

      {snapshot.environment.native ? (
        <p className="native-webmcp-note" role="status">
          Guarding native agent calls on this page.
        </p>
      ) : null}

      {!snapshot.available ? (
        <div className="panel-error" role="status">
          <strong>SDK not loaded</strong>
          <span>The store still works. Reload to reconnect AgentGuard.</span>
        </div>
      ) : null}
      <SpendMeter budget={snapshot.budget} />
      <ApprovalsList approvals={snapshot.approvals} />
      <Timeline entries={snapshot.entries} />
      <AlertsStrip alerts={snapshot.alerts} />
      <PolicyList
        tools={snapshot.tools}
        policies={snapshot.policies}
        budget={snapshot.budget}
      />
      <ExportRow />
    </aside>
  );
}

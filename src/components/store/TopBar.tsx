"use client";

import { useState } from "react";

import { demoSteps, runTestAgent } from "@/lib/demo-agent";
import { useAgentGuard } from "@/lib/use-agentguard";

export function TopBar() {
  const { tools, alerts, guardState, environment, available } = useAgentGuard();
  const [progress, setProgress] = useState<{ step: number; tool: string } | null>(null);
  const [runError, setRunError] = useState("");
  const tampered = tools.some((tool) => tool.tampered) || alerts.some((alert) => alert.code === "TAMPER");
  const ready = available && tools.some((tool) => tool.name === "list_products");
  const status = !available ? "Loading" : tampered ? "Tamper" : guardState.paused ? "Paused" : "Active";

  async function runDemo() {
    setRunError("");
    const result = await runTestAgent((step, tool) => setProgress({ step, tool }));
    if (!result.ok) setRunError(result.message);
    setProgress(null);
  }

  function togglePause() {
    if (!window.AgentGuard) return;
    if (guardState.paused) window.AgentGuard.resume();
    else window.AgentGuard.pause();
  }

  return (
    <header className="topbar">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">KT</span>
        <div>
          <strong>Kedai Tech</strong>
          <span>Shop together with your agent, safely.</span>
        </div>
      </div>
      <div className="topbar-actions">
        <span className={`guard-pill guard-pill--${status.toLowerCase()}`} aria-live="polite">
          <span aria-hidden="true" />
          {status}
        </span>
        <span
          className={`webmcp-badge${environment.native ? " webmcp-badge--native" : ""}`}
          aria-live="polite"
        >
          WebMCP: {available && environment.native ? "Native" : available ? "Shim" : "Checking"}
        </span>
        <button
          type="button"
          className="button button-primary run-button"
          onClick={runDemo}
          disabled={!ready || Boolean(progress)}
          aria-busy={Boolean(progress)}
        >
          {progress
            ? `Step ${progress.step}/${demoSteps.length} — ${progress.tool}…`
            : "Run test agent"}
        </button>
        <div className="pause-control">
          <span>Pause agent</span>
          <button
            type="button"
            role="switch"
            aria-checked={guardState.paused}
            aria-label={guardState.paused ? "Resume agent" : "Pause agent"}
            className="switch"
            onClick={togglePause}
            disabled={!available}
          >
            <span />
          </button>
        </div>
      </div>
      {runError ? <p className="topbar-error" role="alert">{runError}</p> : null}
    </header>
  );
}

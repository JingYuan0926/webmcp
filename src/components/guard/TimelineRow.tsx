"use client";

import { useState } from "react";

const verdictTone: Record<PageControlEntry["verdict"], "ok" | "warn" | "danger"> = {
  allowed: "ok",
  approved: "ok",
  capped: "warn",
  rate_limited: "warn",
  budget_denied: "warn",
  approval_pending: "warn",
  denied: "danger",
  human_denied: "danger",
  error: "danger",
  tampered: "danger",
  invalid_args: "danger",
  paused: "danger",
};

const timeFormat = new Intl.DateTimeFormat("en-MY", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function renderValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "[unavailable]";
  }
}

function duration(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

export function TimelineRow({ entry }: { entry: PageControlEntry }) {
  const [expanded, setExpanded] = useState(false);
  const detailId = `journey-entry-${entry.id}`;

  return (
    <article className={`timeline-row${entry.suspicious ? " timeline-row--suspicious" : ""}`}>
      <button
        type="button"
        className="timeline-summary"
        aria-expanded={expanded}
        aria-controls={detailId}
        onClick={() => setExpanded((current) => !current)}
      >
        <span className="timeline-seq">#{entry.seq}</span>
        <span className="timeline-main">
          <strong>{entry.tool}</strong>
          <small>
            {timeFormat.format(new Date(entry.ts))}
            {" · "}
            {duration(entry.durationMs)}
          </small>
        </span>
        {entry.suspicious ? <span className="injection-badge">INJECTION?</span> : null}
        <span className={`verdict-chip verdict-chip--${verdictTone[entry.verdict]}`}>{entry.verdict}</span>
        <svg className="timeline-chevron" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
          <path d="m6 8 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {expanded ? (
        <div id={detailId} className="timeline-detail">
          <div>
            <span>Decision</span>
            <pre>{entry.note}</pre>
          </div>
          <div>
            <span>Args · redacted</span>
            <pre>{renderValue(entry.args)}</pre>
          </div>
          <div>
            <span>Result · redacted</span>
            <pre>{renderValue(entry.error ?? entry.result)}</pre>
          </div>
          <div className="hash-pair">
            <span>hash {entry.hash.slice(0, 10)}</span>
            <span>prev {entry.prevHash.slice(0, 10)}</span>
          </div>
        </div>
      ) : null}
    </article>
  );
}

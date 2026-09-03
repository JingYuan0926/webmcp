"use client";

import { useEffect, useMemo, useState } from "react";

import { storeApi } from "@/lib/store";

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

const dateTimeFormat = new Intl.DateTimeFormat("en-MY", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const toolLabels: Record<string, string> = {
  search_products: "Search products",
  list_products: "Browse the catalog",
  get_product: "View product",
  add_to_cart: "Add to cart",
  remove_from_cart: "Remove from cart",
  view_cart: "View cart",
  set_shipping_address: "Change delivery address",
  payment_method_status: "Check payment method",
  checkout: "Place order",
  contact_seller: "Message seller",
  delete_account: "Delete account",
  pagecontrol_explain_block: "Explain blocked action",
  pagecontrol_get_journey: "Read activity history",
  pagecontrol_ready: "Connect PageCTRL",
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function humanizeIdentifier(value: string): string {
  const words = value.replace(/[-_]+/g, " ").trim();
  return words
    ? words.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase())
    : value;
}

function toolLabel(tool: string): string {
  return toolLabels[tool] ?? humanizeIdentifier(tool);
}

function entryContext(entry: PageControlEntry): string | null {
  const args = asRecord(entry.args);
  if (!args) return null;

  if (typeof args.id === "string") {
    const product = storeApi.get(args.id);
    const itemName = product?.name ?? humanizeIdentifier(args.id);
    const quantity = typeof args.qty === "number" && Number.isFinite(args.qty) ? args.qty : null;
    return quantity && quantity > 1 ? `${itemName} × ${quantity}` : itemName;
  }

  if (typeof args.query === "string" && args.query.trim()) {
    const query = args.query.trim();
    return query.length > 42 ? `${query.slice(0, 39)}…` : query;
  }

  return null;
}

function isEmptyObject(value: unknown): boolean {
  const record = asRecord(value);
  return record !== null && Object.keys(record).length === 0;
}

function renderValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "[unavailable]";
  }
}

function relativeTime(timestamp: number, currentTime: number): string {
  if (!Number.isFinite(timestamp)) return "time unavailable";
  const seconds = Math.max(0, Math.floor((currentTime - timestamp) / 1000));
  if (seconds < 2) return "just now";
  if (seconds < 60) return `${seconds} seconds ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

export function TimelineRow({ entry }: { entry: PageControlEntry }) {
  const [expanded, setExpanded] = useState(false);
  const timestamp = useMemo(() => new Date(entry.ts).getTime(), [entry.ts]);
  const [currentTime, setCurrentTime] = useState(timestamp);
  const detailId = `journey-entry-${entry.id}`;
  const context = entryContext(entry);
  const output = entry.error ?? entry.result;
  const noInput = entry.args === null || entry.args === undefined || isEmptyObject(entry.args);
  const noOutput = output === null || output === undefined;

  useEffect(() => {
    const updateTime = () => setCurrentTime(Date.now());
    updateTime();
    const interval = window.setInterval(updateTime, 1_000);
    return () => window.clearInterval(interval);
  }, [timestamp]);

  return (
    <article className={`timeline-row${entry.suspicious ? " timeline-row--suspicious" : ""}`}>
      <button
        type="button"
        className="timeline-summary"
        aria-expanded={expanded}
        aria-controls={detailId}
        onClick={() => setExpanded((current) => !current)}
      >
        <span className="timeline-main">
          <strong>
            {toolLabel(entry.tool)}
            {context ? <span className="timeline-context"> · {context}</span> : null}
          </strong>
          <small>
            <time
              dateTime={entry.ts}
              title={relativeTime(timestamp, currentTime)}
              aria-label={`${dateTimeFormat.format(new Date(entry.ts))}, ${relativeTime(timestamp, currentTime)}`}
            >
              {dateTimeFormat.format(new Date(entry.ts))} · {relativeTime(timestamp, currentTime)}
            </time>
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
            <span>Function</span>
            <pre>{entry.tool}</pre>
          </div>
          <div>
            <span>Decision</span>
            <pre>{entry.note}</pre>
          </div>
          <div>
            <span>Input · sensitive values masked</span>
            <pre>{noInput ? "No input needed." : renderValue(entry.args)}</pre>
          </div>
          <div>
            <span>{entry.error ? "Error" : "Output"} · sensitive values masked</span>
            <pre>{noOutput ? "No output recorded." : renderValue(output)}</pre>
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

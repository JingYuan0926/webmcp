"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

const modeRank: Record<AgentGuardMode, number> = { allow: 0, approve: 1, deny: 2 };
const modes: AgentGuardMode[] = ["allow", "approve", "deny"];
const modeLabels: Record<AgentGuardMode, string> = {
  allow: "Allowed",
  approve: "Ask me",
  deny: "Not allowed",
};
const capCopy: Record<"maxAmount" | "maxQty" | "maxPerMinute", { label: string; help: string }> = {
  maxAmount: {
    label: "Spending limit per action",
    help: "Lower this amount to reduce how much one action may spend.",
  },
  maxQty: {
    label: "Item limit per action",
    help: "Lower this number to reduce how many items one action may handle.",
  },
  maxPerMinute: {
    label: "Usage limit per minute",
    help: "Lower this number to prevent repeated or runaway actions.",
  },
};
const toolUsageOrder = [
  "view_cart",
  "search_products",
  "list_products",
  "get_product",
  "add_to_cart",
  "remove_from_cart",
  "checkout",
  "set_shipping_address",
  "contact_seller",
  "delete_account",
] as const;
const toolUsageRank = new Map<string, number>(toolUsageOrder.map((name, index) => [name, index]));

type CapKey = keyof typeof capCopy;

function humanizeToolName(name: string) {
  const words = name.replace(/^guard_/, "AgentGuard ").replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function ActionIcon({ name }: { name: string }) {
  const shared = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "search_products") {
    return <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="8.5" cy="8.5" r="4.75" {...shared} /><path d="m12 12 4 4" {...shared} /></svg>;
  }
  if (name === "list_products") {
    return <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><rect x="3" y="3" width="5" height="5" rx="1" {...shared} /><rect x="12" y="3" width="5" height="5" rx="1" {...shared} /><rect x="3" y="12" width="5" height="5" rx="1" {...shared} /><rect x="12" y="12" width="5" height="5" rx="1" {...shared} /></svg>;
  }
  if (name === "get_product") {
    return <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="m3.5 6 6.5-3 6.5 3v8L10 17l-6.5-3Z" {...shared} /><path d="m3.5 6 6.5 3 6.5-3M10 9v8" {...shared} /></svg>;
  }
  if (name === "add_to_cart" || name === "remove_from_cart" || name === "view_cart") {
    return (
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
        <path d="M2.5 3.5h2l1.4 8.1h8.4l1.6-5.7H5" {...shared} />
        <circle cx="7.2" cy="15.5" r="1" {...shared} /><circle cx="13.5" cy="15.5" r="1" {...shared} />
        {name === "add_to_cart" ? <path d="M13.5 1.8v4M11.5 3.8h4" {...shared} /> : null}
        {name === "remove_from_cart" ? <path d="M11.5 3.8h4" {...shared} /> : null}
      </svg>
    );
  }
  if (name === "set_shipping_address") {
    return <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M16 8c0 4.4-6 9-6 9s-6-4.6-6-9a6 6 0 0 1 12 0Z" {...shared} /><circle cx="10" cy="8" r="2" {...shared} /></svg>;
  }
  if (name === "checkout") {
    return <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><rect x="2.5" y="4" width="15" height="12" rx="2" {...shared} /><path d="M2.5 8h15M6 12h3" {...shared} /></svg>;
  }
  if (name === "contact_seller") {
    return <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M3 4.5h14v9H9l-4.5 3v-3H3Z" {...shared} /><path d="M6 8h8M6 10.5h5" {...shared} /></svg>;
  }
  if (name === "delete_account") {
    return <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="8" cy="6" r="3" {...shared} /><path d="M2.8 16c.5-3 2.4-4.5 5.2-4.5 1.2 0 2.2.3 3 .8M13 14h4" {...shared} /></svg>;
  }
  if (name === "guard_get_journey") {
    return <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M4 3h12v14H4Z" {...shared} /><path d="M7 7h6M7 10h6M7 13h4" {...shared} /></svg>;
  }
  if (name === "guard_explain_block") {
    return <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="10" cy="10" r="7" {...shared} /><path d="M8.4 7.4a2 2 0 1 1 2.3 3.2c-.7.3-.9.7-.9 1.4M9.8 15h.01" {...shared} /></svg>;
  }
  if (name === "guard_set_budget") {
    return <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="10" cy="10" r="7" {...shared} /><path d="M12.5 7.2c-.6-.5-1.4-.8-2.3-.8-1.3 0-2.2.6-2.2 1.6 0 2.5 4.5 1.1 4.5 3.8 0 1.1-1 1.8-2.5 1.8-.9 0-1.8-.3-2.5-.9M10 5.2v9.6" {...shared} /></svg>;
  }

  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M10 2.5 16 5v4.5c0 3.8-2.5 6.3-6 8-3.5-1.7-6-4.2-6-8V5Z" {...shared} />
      <path d="m7.2 10 1.8 1.8 3.8-4" {...shared} />
    </svg>
  );
}

function PolicyRow({
  name,
  label,
  description,
  tampered,
  merchant,
  effective,
}: {
  name: string;
  label: string;
  description: string;
  tampered: boolean;
  merchant: AgentGuardRule;
  effective: AgentGuardRule;
}) {
  const currentMode = effective.mode ?? "allow";
  const merchantMode = merchant.mode ?? "allow";
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<AgentGuardMode | null>(null);
  const modeTriggerRef = useRef<HTMLButtonElement>(null);
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

  const visibleCaps = (Object.keys(capCopy) as CapKey[]).filter(
    (key) => merchant[key] !== undefined,
  );

  function changeMode(nextMode: AgentGuardMode, humanConfirmed = false) {
    const result = window.AgentGuard?.setUserPolicy(
      name,
      { mode: nextMode },
      humanConfirmed ? { humanConfirmed: true } : undefined,
    ) ?? {
      ok: false,
      message: "AgentGuard is not available.",
    };
    setOk(result.ok);
    setMessage(result.ok ? "" : result.message);
    if (result.ok) {
      setPendingMode(null);
      setModeMenuOpen(false);
      window.queueMicrotask(() => modeTriggerRef.current?.focus());
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rule: AgentGuardRule = {};
    visibleCaps.forEach((key) => {
      const value = caps[key].trim();
      if (value) rule[key] = Number(value);
    });
    const result = window.AgentGuard?.setUserPolicy(name, rule) ?? {
      ok: false,
      message: "AgentGuard is not available.",
    };
    setOk(result.ok);
    setMessage(result.ok ? "Limits saved." : result.message);
  }

  return (
    <article
      className={`policy-row${detailsOpen ? " is-open" : ""}`}
      onKeyDown={(event) => {
        if (event.key === "Escape" && modeMenuOpen) {
          setPendingMode(null);
          setModeMenuOpen(false);
          window.queueMicrotask(() => modeTriggerRef.current?.focus());
        }
      }}
    >
      <div className="policy-row-main">
        <span className="policy-action-icon"><ActionIcon name={name} /></span>
        <button
          type="button"
          className="policy-detail-trigger"
          aria-expanded={detailsOpen}
          aria-controls={`policy-details-${name}`}
          onClick={() => setDetailsOpen((open) => !open)}
        >
          <span className="policy-label">{label}</span>
          <span className="policy-detail-cue">
            {detailsOpen ? "Hide details" : "View details"}
            <svg className="policy-chevron" viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
              <path d="m6 8 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
        <span className="policy-status">
          {tampered ? <span className="tool-risk-badge">Flagged</span> : null}
          <button
            ref={modeTriggerRef}
            type="button"
            className={`policy-mode-trigger mode-chip--${currentMode}`}
            aria-expanded={modeMenuOpen}
            aria-controls={`policy-modes-${name}`}
            onClick={() => {
              setPendingMode(null);
              setModeMenuOpen((open) => !open);
            }}
          >
            {modeLabels[currentMode]}
            <svg viewBox="0 0 20 20" width="12" height="12" aria-hidden="true">
              <path d="m6 8 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </span>
      </div>

      {modeMenuOpen ? (
        <div className="policy-mode-menu" id={`policy-modes-${name}`} role="group" aria-label={`Choose protection for ${label}`}>
          {modes.map((candidate) => {
            const unavailable = modeRank[candidate] < modeRank[merchantMode];
            const reducesProtection = modeRank[candidate] < modeRank[currentMode];
            return (
              <button
                type="button"
                key={candidate}
                className={`policy-mode-option mode-chip--${candidate}${candidate === currentMode ? " is-selected" : ""}`}
                aria-pressed={candidate === currentMode}
                disabled={unavailable}
                title={unavailable ? "The store requires a stricter setting." : undefined}
                onClick={() => {
                  if (reducesProtection) {
                    setPendingMode(candidate);
                    return;
                  }
                  changeMode(candidate);
                }}
              >
                {modeLabels[candidate]}
              </button>
            );
          })}
          {pendingMode ? (
            <div className="policy-confirmation" role="alert">
              <strong>Allow more access?</strong>
              <p>
                Change {label} from {modeLabels[currentMode]} to {modeLabels[pendingMode]}? This reduces protection.
              </p>
              <div>
                <button type="button" className="panel-button panel-button--ghost" onClick={() => setPendingMode(null)}>Keep current</button>
                <button type="button" className="panel-button panel-button--allow" onClick={() => changeMode(pendingMode, true)}>Confirm change</button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      {message && !ok ? <p className="policy-message is-error" aria-live="polite">{message}</p> : null}

      {detailsOpen ? (
        <div className="policy-details" id={`policy-details-${name}`}>
          <dl className="policy-function">
            <div><dt>Function</dt><dd><code>{name}</code></dd></div>
            <div><dt>What it does</dt><dd>{description}</dd></div>
          </dl>
          {visibleCaps.length ? (
            <form className="policy-form" onSubmit={submit}>
              {visibleCaps.map((key) => (
                <div className="panel-field" key={key}>
                  <label htmlFor={`policy-${key}-${name}`}>{capCopy[key].label}</label>
                  <input
                    id={`policy-${key}-${name}`}
                    type="text"
                    inputMode={key === "maxAmount" ? "decimal" : "numeric"}
                    pattern={key === "maxAmount" ? undefined : "[0-9]*"}
                    autoComplete="off"
                    value={caps[key]}
                    aria-describedby={`policy-${key}-${name}-help`}
                    onChange={(event) => setCaps((current) => ({ ...current, [key]: event.target.value }))}
                  />
                  <small id={`policy-${key}-${name}-help`}>{capCopy[key].help}</small>
                </div>
              ))}
              <button type="submit" className="panel-button panel-button--compact">Save safety limits</button>
            </form>
          ) : null}
          {message && ok ? <p className="policy-message" aria-live="polite">{message}</p> : null}
        </div>
      ) : null}
    </article>
  );
}

export function PolicyList({
  tools,
  policies,
}: {
  tools: AgentGuardTool[];
  policies: AgentGuardPolicies;
}) {
  const sortedTools = [...tools].sort((left, right) => {
    const usageOrder = (toolUsageRank.get(left.name) ?? Number.MAX_SAFE_INTEGER) -
      (toolUsageRank.get(right.name) ?? Number.MAX_SAFE_INTEGER);
    if (usageOrder !== 0) return usageOrder;

    const leftLabel = left.label?.trim() || left.name;
    const rightLabel = right.label?.trim() || right.name;
    return leftLabel.localeCompare(rightLabel) || left.name.localeCompare(right.name);
  });
  const storeTools = sortedTools.filter((tool) => !tool.name.startsWith("guard_"));
  const guardTools = sortedTools.filter((tool) => tool.name.startsWith("guard_"));

  function renderPolicyRow(tool: AgentGuardTool) {
    return (
      <PolicyRow
        key={tool.name}
        name={tool.name}
        label={tool.label?.trim() || humanizeToolName(tool.name)}
        description={tool.description}
        tampered={tool.tampered}
        merchant={policies.merchant[tool.name] ?? { mode: "allow" }}
        effective={policies.effective[tool.name] ?? { mode: "allow" }}
      />
    );
  }

  return (
    <section className="policy-section" aria-labelledby="policies-title" aria-describedby="policy-tightening-hint">
      <div className="panel-section-heading">
        <div>
          <p className="panel-eyebrow">Two-tier controls</p>
          <h2 id="policies-title">Policies</h2>
        </div>
      </div>
      <p className="policy-hint" id="policy-tightening-hint">
        Common actions first. Choose a status, or open the action name for details.
      </p>
      <div className="policy-list">
        {storeTools.map(renderPolicyRow)}
        {guardTools.length ? <h3 className="policy-subheading">AgentGuard tools</h3> : null}
        {guardTools.map(renderPolicyRow)}
      </div>
    </section>
  );
}

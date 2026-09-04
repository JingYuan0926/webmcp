"use client";

import {
  useEffect,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import { AuthorityRow } from "@/components/guard/AuthorityRow";
import { LocationIcon, WalletIcon } from "@/components/guard/AuthorityIcons";
import { CardRow } from "@/components/guard/CardRow";
import { formatUSD } from "@/lib/catalog";
import { hasCard, subscribe } from "@/lib/payments-client";
import { flashed, useStore, type Address } from "@/lib/store";

type Row = "budget" | "card" | "address";

/**
 * Everything the shopper has delegated to the agent, in one place: how much it
 * may spend, which card it charges, and where the order ships. Each row shows
 * its current value and expands to an editor.
 */
export function AgentAuthority({
  budget,
}: {
  budget: { limit: number; spent: number; currency: string };
}) {
  const { state, api } = useStore();
  const [openRow, setOpenRow] = useState<Row | null>(null);
  const [cardReady, setCardReady] = useState(() => hasCard());

  useEffect(() => subscribe(() => setCardReady(hasCard())), []);

  function toggle(row: Row) {
    setOpenRow((current) => (current === row ? null : row));
  }

  const missing = [!state.address ? "address" : null, !cardReady ? "card" : null].filter(Boolean);
  const readiness = missing.length
    ? `${missing.join(" and ")} needed`
    : "Ready";

  return (
    <section className="guard-section authority-section" aria-labelledby="authority-title">
      <div className="panel-section-heading">
        <div>
          <p className="panel-eyebrow">This session</p>
          <h2 id="authority-title">Agent authority</h2>
        </div>
        <span className={`panel-caption${missing.length ? " panel-caption--warn" : ""}`}>
          {readiness}
        </span>
      </div>

      <ul className="authority-rows">
        <SpendRow
          budget={budget}
          pending={api.cart().total}
          open={openRow === "budget"}
          onToggle={() => toggle("budget")}
        />
        <CardRow open={openRow === "card"} onToggle={() => toggle("card")} />
        <AddressRow
          key={JSON.stringify(state.address)}
          initialAddress={state.address}
          flashing={flashed(state.lastFlash, "address")}
          onSave={(address) => api.setAddress(address)}
          open={openRow === "address"}
          onToggle={() => toggle("address")}
        />
      </ul>
    </section>
  );
}

function SpendRow({
  budget,
  pending,
  open,
  onToggle,
}: {
  budget: { limit: number; spent: number; currency: string };
  /** What the current cart would spend at checkout. Not yet charged. */
  pending: number;
  open: boolean;
  onToggle: () => void;
}) {
  const [limit, setLimit] = useState(budget.limit.toString());
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(true);

  const ratio = budget.limit > 0 ? budget.spent / budget.limit : budget.spent > 0 ? 1 : 0;
  const percent = Math.min(100, Math.max(0, ratio * 100));

  // The cart is money the agent has lined up but not spent. It is shown as a
  // separate segment so a shopper can see a checkout coming before it happens,
  // and it counts toward the warning level for the same reason.
  const pendingPercent =
    budget.limit > 0 ? Math.min(100 - percent, Math.max(0, (pending / budget.limit) * 100)) : 0;
  const projected = ratio + (budget.limit > 0 ? pending / budget.limit : 0);
  const level = projected >= 1 ? "danger" : projected >= 0.7 ? "warn" : "ok";

  useEffect(() => {
    let cancelled = false;
    window.queueMicrotask(() => {
      if (!cancelled) setLimit(budget.limit.toString());
    });
    return () => {
      cancelled = true;
    };
  }, [budget.limit]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const result = {
      ok: form.getAttribute("data-pagecontrol-result-ok") === "true",
      message:
        form.getAttribute("data-pagecontrol-result-message") ||
        "Use the Set button directly to confirm this budget.",
    };
    form.removeAttribute("data-pagecontrol-result-ok");
    form.removeAttribute("data-pagecontrol-result-message");
    setOk(result.ok);
    setMessage(result.message);
    if (result.ok) onToggle();
  }

  return (
    <AuthorityRow
      label="Spend limit"
      value={
        pending > 0
          ? `${formatUSD(budget.spent)} of ${formatUSD(budget.limit)} · ${formatUSD(pending)} in cart`
          : `${formatUSD(budget.spent)} of ${formatUSD(budget.limit)}`
      }
      tone={level}
      icon={<WalletIcon />}
      full
      editorId="budget-editor"
      editLabel="Edit session budget"
      open={open}
      onToggle={onToggle}
      onSubmit={submit}
      trustedBudgetControl
      meter={
        <div
          className="meter-track"
          role="meter"
          aria-label="Agent spend"
          aria-valuemin={0}
          aria-valuemax={budget.limit}
          aria-valuenow={Math.min(budget.spent, budget.limit)}
        >
          <span className={`meter-fill meter-fill--${level}`} style={{ width: `${percent}%` }} />
          {pendingPercent > 0 ? (
            <span
              className={`meter-fill meter-fill--pending`}
              style={{ width: `${pendingPercent}%` }}
            />
          ) : null}
        </div>
      }
    >
      <div>
        <label htmlFor="budget-limit" className="authority-label">
          Set session budget
        </label>
        <span>{Math.round(ratio * 100)}% used</span>
      </div>
      <div className="budget-policy-controls">
        <input
          id="budget-limit"
          name="limit"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={limit}
          aria-invalid={message && !ok ? "true" : undefined}
          aria-describedby={message ? "budget-message" : undefined}
          onChange={(event) => setLimit(event.target.value)}
        />
        <button type="submit" className="panel-button panel-button--compact">
          Set
        </button>
      </div>
      {message ? (
        <p id="budget-message" className={`policy-message${ok ? "" : " is-error"}`} aria-live="polite">
          {message}
        </p>
      ) : null}
    </AuthorityRow>
  );
}

const blankAddress: Address = { name: "", line1: "", city: "", postcode: "" };

/** Filled in by pressing space in an empty address field. */
const sampleAddress: Address = {
  name: "Derek Tan",
  line1: "180 Sansome Street",
  city: "San Francisco",
  postcode: "94104",
};

const addressFieldIds: Record<keyof Address, string> = {
  name: "shipping-name",
  line1: "shipping-line",
  city: "shipping-city",
  postcode: "shipping-postcode",
};

function AddressRow({
  initialAddress,
  flashing,
  onSave,
  open,
  onToggle,
}: {
  initialAddress: Address | null;
  flashing: boolean;
  onSave: (address: Address) => { ok: boolean; message: string };
  open: boolean;
  onToggle: () => void;
}) {
  const [form, setForm] = useState<Address>(initialAddress ?? blankAddress);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function update(key: keyof Address, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    if (error) setError("");
  }

  /**
   * Space in an EMPTY field fills the whole address. Typing four fields into a
   * narrow panel is the slowest part of a demo. Guarded on the field being
   * empty so a space between words still types normally.
   */
  function autofill(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key !== " " || event.currentTarget.value !== "") return;
    event.preventDefault();
    setForm(sampleAddress);
    setError("");
    setMessage("Sample address filled in. Save it, or edit any field first.");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = onSave(form);
    if (result.ok) {
      setError("");
      setMessage(result.message);
      onToggle();
      return;
    }
    setMessage("");
    setError(result.message);
    const firstEmpty = (Object.keys(form) as Array<keyof Address>).find((key) => !form[key].trim());
    if (firstEmpty) document.getElementById(addressFieldIds[firstEmpty])?.focus();
  }

  return (
    <AuthorityRow
      label="Ships to"
      value={
        initialAddress
          ? `${initialAddress.name} · ${initialAddress.city} ${initialAddress.postcode}`
          : "Not set"
      }
      empty={!initialAddress}
      icon={<LocationIcon />}
      editorId="address-editor"
      editLabel="Edit shipping address"
      open={open}
      onToggle={onToggle}
      onSubmit={submit}
      flashing={flashing}
    >
      <div>
        <strong className="authority-label">Shipping address</strong>
        <span>{initialAddress ? "Saved" : "Not set"}</span>
      </div>
      <div className="authority-fields">
        <div className="panel-field full-field">
          <label htmlFor="shipping-name">Name</label>
          <input
            id="shipping-name"
            type="text"
            autoComplete="name"
            spellCheck={false}
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            onKeyDown={autofill}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? "address-error" : undefined}
          />
        </div>
        <div className="panel-field full-field">
          <label htmlFor="shipping-line">Street address</label>
          <input
            id="shipping-line"
            type="text"
            autoComplete="street-address"
            spellCheck={false}
            value={form.line1}
            onChange={(event) => update("line1", event.target.value)}
            onKeyDown={autofill}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? "address-error" : undefined}
          />
        </div>
        <div className="panel-field">
          <label htmlFor="shipping-city">City</label>
          <input
            id="shipping-city"
            type="text"
            autoComplete="address-level2"
            spellCheck={false}
            value={form.city}
            onChange={(event) => update("city", event.target.value)}
            onKeyDown={autofill}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? "address-error" : undefined}
          />
        </div>
        <div className="panel-field">
          <label htmlFor="shipping-postcode">ZIP code</label>
          <input
            id="shipping-postcode"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            spellCheck={false}
            value={form.postcode}
            onChange={(event) => update("postcode", event.target.value)}
            onKeyDown={autofill}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? "address-error" : undefined}
          />
        </div>
      </div>
      <p className="authority-note">Press space in an empty field to fill a sample address.</p>
      <button type="submit" className="panel-button panel-button--compact panel-button--wide">
        Save address
      </button>
      {error ? (
        <p id="address-error" className="policy-message is-error" role="alert">
          {error}
        </p>
      ) : message ? (
        <p className="policy-message" aria-live="polite">
          {message}
        </p>
      ) : null}
    </AuthorityRow>
  );
}

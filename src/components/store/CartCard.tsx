"use client";

import { useEffect, useState } from "react";

import { formatUSD } from "@/lib/catalog";
import { refreshQuote } from "@/lib/payments-client";
import { flashed, useStore } from "@/lib/store";

export function CartCard() {
  const { state, api } = useStore();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const total = state.items.reduce(
    (sum, item) => sum + item.product.price * item.qty,
    0,
  );
  const isFlashed =
    flashed(state.lastFlash, "cart") ||
    flashed(state.lastFlash, "checkout") ||
    Boolean(state.lastFlash?.startsWith("product:"));

  // Keep a server-priced quote standing by. The guard reads it synchronously
  // when it needs the cost of a checkout, so it has to already be here.
  const lineKey = state.items
    .map((item) => `${item.product.id}:${item.qty}`)
    .sort()
    .join("|");

  useEffect(() => {
    const lines = lineKey
      ? lineKey.split("|").map((part) => {
          const [id, qty] = part.split(":");
          return { id, qty: Number(qty) };
        })
      : [];
    void refreshQuote(lines);
  }, [lineKey]);

  async function checkout() {
    const guard = window.PageControl;
    if (!guard) {
      setError("PageControl is not ready yet.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      // Routed through the guard rather than calling the store directly, so a
      // human checkout is subject to the same approval, budget, and journal
      // as an agent one.
      const raw = await guard.invoke("checkout", {});
      let parsed: { ok?: boolean; message?: string } | null = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
      if (parsed?.ok) setMessage(parsed.message ?? "Order confirmed.");
      else setError(parsed?.message ?? raw);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Checkout failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`store-card cart-card${isFlashed ? " is-flashing" : ""}`} aria-labelledby="cart-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Your basket</p>
          <h2 id="cart-title">Cart</h2>
        </div>
        <span className="count-badge">{state.items.reduce((sum, item) => sum + item.qty, 0)}</span>
      </div>

      {state.items.length ? (
        <ul className="cart-list">
          {state.items.map((item) => (
            <li key={item.product.id}>
              <div>
                <strong>{item.product.name}</strong>
                <span>
                  {item.qty} × {formatUSD(item.product.price)}
                </span>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label={`Remove ${item.product.name}`}
                onClick={() => setMessage(api.removeFromCart(item.product.id).message)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="compact-empty">
          <strong>Your cart is ready</strong>
          <span>Add an item yourself, or ask an agent to help.</span>
        </div>
      )}

      <div className="cart-total">
        <span>Total</span>
        <strong className="price">{formatUSD(total)}</strong>
      </div>
      <button
        type="button"
        className="button button-primary full-width"
        onClick={checkout}
        disabled={!state.items.length || busy}
      >
        {busy ? "Waiting for approval…" : "Checkout"}
      </button>
      {error ? (
        <p className="inline-message is-error" role="alert">
          {error}
        </p>
      ) : (
        <p className="inline-message" aria-live="polite">
          {message}
        </p>
      )}
    </section>
  );
}

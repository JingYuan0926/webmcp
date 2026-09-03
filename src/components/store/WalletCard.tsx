"use client";

import { useCallback, useEffect, useState } from "react";

import { rememberCard, savedCard, subscribe, type SavedCard } from "@/lib/payments-client";

type Status = "loading" | "idle" | "redirecting" | "returning";

/**
 * The payment panel. Adding a card hands the shopper to Stripe's own hosted
 * setup page, so card details never reach this origin at all — not the DOM,
 * not this bundle, and therefore not any WebMCP tool.
 */
export function WalletCard() {
  const [card, setCard] = useState<SavedCard | null>(() => savedCard());
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Finish a setup the shopper started on Stripe, then tidy the URL so a
  // reload does not replay it.
  const completeReturn = useCallback(async (checkoutSessionId: string) => {
    setStatus("returning");
    try {
      const response = await fetch("/api/payments/method", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ checkoutSessionId }),
      });
      const payload = await response.json();
      if (payload?.ok && payload.card) {
        rememberCard(payload.card as SavedCard);
        setNotice("Card saved. The agent can now check out without ever seeing it.");
      } else {
        setError(payload?.message ?? "The card could not be saved.");
      }
    } catch {
      setError("Could not reach the payment service.");
    } finally {
      setStatus("idle");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe(() => setCard(savedCard()));

    const params = new URLSearchParams(window.location.search);
    const outcome = params.get("card_setup");
    const sessionId = params.get("session_id");

    if (outcome) {
      params.delete("card_setup");
      params.delete("session_id");
      const query = params.toString();
      window.history.replaceState(
        null,
        "",
        window.location.pathname + (query ? `?${query}` : "") + window.location.hash,
      );
    }

    void (async () => {
      try {
        const response = await fetch("/api/payments/method", { credentials: "same-origin" });
        const payload = await response.json();
        setConfigured(Boolean(payload?.configured));
        rememberCard(payload?.card ?? null);
      } catch {
        setConfigured(false);
        rememberCard(null);
      }

      if (outcome === "success" && sessionId) {
        await completeReturn(sessionId);
      } else {
        if (outcome === "cancelled") setNotice("Card setup was cancelled.");
        setStatus("idle");
      }
    })();

    return unsubscribe;
  }, [completeReturn]);

  async function startSetup() {
    setError("");
    setNotice("");
    setStatus("redirecting");
    try {
      const response = await fetch("/api/payments/checkout-session", {
        method: "POST",
        credentials: "same-origin",
      });
      const payload = await response.json();
      if (!payload?.ok || !payload.url) {
        setError(payload?.message ?? "Could not open Stripe card setup.");
        setStatus("idle");
        return;
      }
      window.location.href = payload.url;
    } catch {
      setError("Could not reach the payment service.");
      setStatus("idle");
    }
  }

  async function removeCard() {
    setError("");
    setNotice("");
    try {
      await fetch("/api/payments/method", { method: "DELETE", credentials: "same-origin" });
      rememberCard(null);
      setNotice("Card removed.");
    } catch {
      setError("Could not remove the card.");
    }
  }

  return (
    <section id="wallet" className="store-card wallet-card" aria-labelledby="wallet-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Payment</p>
          <h2 id="wallet-title">Payment card</h2>
        </div>
        {card ? <span className="saved-badge">Saved</span> : null}
      </div>

      {status === "loading" || status === "returning" ? (
        <div className="compact-empty">
          <strong>{status === "returning" ? "Saving your card…" : "Checking…"}</strong>
          <span>One moment.</span>
        </div>
      ) : configured === false ? (
        <div className="compact-empty">
          <strong>Stripe is not configured</strong>
          <span>
            Copy <code>.env.example</code> to <code>.env.local</code> and add your Stripe test keys,
            then restart the dev server.
          </span>
        </div>
      ) : card ? (
        <>
          <div className="wallet-summary">
            <span className="wallet-brand">{card.brand}</span>
            <strong className="wallet-digits">···· ···· ···· {card.last4}</strong>
            <span className="wallet-expiry">
              {String(card.expMonth).padStart(2, "0")}/{String(card.expYear).slice(-2)}
            </span>
          </div>
          <p className="wallet-note">
            Held by Stripe. This page never sees the number, so no agent tool can read it.
          </p>
          <button type="button" className="button button-secondary full-width" onClick={removeCard}>
            Remove card
          </button>
        </>
      ) : (
        <>
          <div className="compact-empty">
            <strong>No card saved</strong>
            <span>Add one so an agent can check out for you. Test card: 4242 4242 4242 4242.</span>
          </div>
          <button
            type="button"
            className="button button-primary full-width"
            onClick={startSetup}
            disabled={status === "redirecting"}
          >
            {status === "redirecting" ? "Opening Stripe…" : "Add a card with Stripe ↗"}
          </button>
          <p className="wallet-note wallet-note--after">
            Opens Stripe&rsquo;s hosted page. Your card details never reach this site.
          </p>
        </>
      )}

      {error ? (
        <p className="inline-message is-error" role="alert">
          {error}
        </p>
      ) : (
        <p className="inline-message" aria-live="polite">
          {notice}
        </p>
      )}
    </section>
  );
}

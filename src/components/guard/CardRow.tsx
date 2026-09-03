"use client";

import { useCallback, useEffect, useState } from "react";

import { rememberCard, savedCard, subscribe, type SavedCard } from "@/lib/payments-client";

import { AuthorityRow } from "@/components/guard/AuthorityRow";
import { CardBrandIcon, CardIcon } from "@/components/guard/AuthorityIcons";

type Status = "loading" | "idle" | "redirecting" | "returning";

/**
 * The saved payment card, as one row of the agent authority group.
 *
 * The mount effect is deliberately not gated on `open` or on panel visibility:
 * it is the only thing that resolves the card state (which the checkout tool's
 * pre-approval guard reads) and the only handler for the return trip from
 * Stripe's hosted setup page.
 */
export function CardRow({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const [card, setCard] = useState<SavedCard | null>(() => savedCard());
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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
        setNotice("Card saved. The agent can check out without ever seeing it.");
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

  const value =
    status === "loading"
      ? "Checking…"
      : status === "returning"
        ? "Saving your card…"
        : card
          ? `···· ${card.last4}`
          : "Not set";

  return (
    <AuthorityRow
      label="Charges to"
      value={value}
      icon={<CardIcon />}
      badge={card ? <CardBrandIcon brand={card.brand} /> : null}
      empty={!card && status !== "loading" && status !== "returning"}
      editorId="card-editor"
      editLabel="Edit payment card"
      open={open}
      onToggle={onToggle}
    >
      <div>
        <strong className="authority-label">Payment card</strong>
        <span>
          {card
            ? `${card.brand} ····${card.last4} · exp ${String(card.expMonth).padStart(2, "0")}/${String(card.expYear).slice(-2)}`
            : "None saved"}
        </span>
      </div>

      {configured === false ? (
        <p className="authority-note">
          Stripe is not configured. Copy <code>.env.example</code> to <code>.env.local</code>, add
          your Stripe test key, and restart the dev server.
        </p>
      ) : card ? (
        <>
          <p className="authority-note">
            Held by Stripe. This page never sees the number, so no agent tool can read it.
          </p>
          <button
            type="button"
            className="panel-button panel-button--ghost panel-button--wide"
            onClick={removeCard}
          >
            Remove card
          </button>
        </>
      ) : (
        <>
          <p className="authority-note">
            Opens Stripe&rsquo;s hosted page. Your card details never reach this site. Test card
            4242 4242 4242 4242.
          </p>
          <button
            type="button"
            className="panel-button panel-button--allow panel-button--wide"
            onClick={startSetup}
            disabled={status === "redirecting" || status === "loading"}
          >
            {status === "redirecting" ? "Opening Stripe…" : "Add a card with Stripe ↗"}
          </button>
        </>
      )}

      {error ? (
        <p className="policy-message is-error" role="alert">
          {error}
        </p>
      ) : notice ? (
        <p className="policy-message" aria-live="polite">
          {notice}
        </p>
      ) : null}
    </AuthorityRow>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

import { loadCard, rememberCard, savedCard, subscribe, type SavedCard } from "@/lib/payments-client";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

let stripePromise: Promise<Stripe | null> | null = null;
function getStripe(): Promise<Stripe | null> {
  if (!publishableKey) return Promise.resolve(null);
  if (!stripePromise) stripePromise = loadStripe(publishableKey);
  return stripePromise;
}

/**
 * The card panel. Card details are typed into an iframe served by Stripe, so
 * they are never readable by this application's JavaScript — and therefore
 * never reachable through a WebMCP tool.
 */
export function WalletCard() {
  const [card, setCard] = useState<SavedCard | null>(() => savedCard());
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "starting" | "collecting">("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void loadCard();
    return subscribe(() => setCard(savedCard()));
  }, []);

  const startSetup = useCallback(async () => {
    setError("");
    setNotice("");
    setStatus("starting");
    try {
      const response = await fetch("/api/payments/setup-intent", {
        method: "POST",
        credentials: "same-origin",
      });
      const payload = await response.json();
      if (!payload?.ok || !payload.clientSecret) {
        setError(payload?.message ?? "Could not start card setup.");
        setStatus("idle");
        return;
      }
      setClientSecret(payload.clientSecret);
      setStatus("collecting");
    } catch {
      setError("Could not reach the payment service.");
      setStatus("idle");
    }
  }, []);

  const cancelSetup = useCallback(() => {
    setClientSecret(null);
    setStatus("idle");
    setError("");
  }, []);

  const onSaved = useCallback((next: SavedCard) => {
    rememberCard(next);
    setCard(next);
    setClientSecret(null);
    setStatus("idle");
    setNotice("Card saved. The agent can now check out without ever seeing it.");
  }, []);

  async function removeCard() {
    setError("");
    setNotice("");
    try {
      await fetch("/api/payments/method", { method: "DELETE", credentials: "same-origin" });
      rememberCard(null);
      setCard(null);
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

      {!publishableKey ? (
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
      ) : status === "collecting" && clientSecret ? (
        <Elements
          stripe={getStripe()}
          options={{ clientSecret, appearance: { theme: "flat", variables: { borderRadius: "8px" } } }}
        >
          <SaveCardForm onSaved={onSaved} onCancel={cancelSetup} onError={setError} />
        </Elements>
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
            disabled={status === "starting"}
          >
            {status === "starting" ? "Opening…" : "Add a card"}
          </button>
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

function SaveCardForm({
  onSaved,
  onCancel,
  onError,
}: {
  onSaved: (card: SavedCard) => void;
  onCancel: () => void;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setSaving(true);
    onError("");

    // Card details go from the iframe straight to Stripe. Only the resulting
    // SetupIntent id comes back into this page.
    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
    });

    if (error) {
      onError(error.message ?? "The card could not be saved.");
      setSaving(false);
      return;
    }
    if (setupIntent?.status !== "succeeded") {
      onError("Card setup did not complete.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/payments/method", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ setupIntentId: setupIntent.id }),
      });
      const payload = await response.json();
      if (!payload?.ok || !payload.card) {
        onError(payload?.message ?? "The card could not be saved.");
        setSaving(false);
        return;
      }
      onSaved(payload.card as SavedCard);
    } catch {
      onError("Could not reach the payment service.");
      setSaving(false);
    }
  }

  return (
    <form className="wallet-form" onSubmit={submit}>
      <PaymentElement options={{ layout: "tabs" }} />
      <div className="wallet-actions">
        <button type="button" className="button button-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="button button-primary" disabled={!stripe || saving}>
          {saving ? "Saving…" : "Save card"}
        </button>
      </div>
    </form>
  );
}

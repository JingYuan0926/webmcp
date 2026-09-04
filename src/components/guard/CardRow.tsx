"use client";

import { useCallback, useEffect, useState } from "react";

import { rememberCard, savedCard, subscribe, type SavedCard } from "@/lib/payments-client";

import { AuthorityRow } from "@/components/guard/AuthorityRow";
import { CardBrandIcon, CardIcon } from "@/components/guard/AuthorityIcons";

type Status = "loading" | "idle" | "redirecting" | "returning" | "awaiting";

/**
 * Marks that card setup runs in a tab this page opened. The returning tab reads
 * it to decide whether closing itself is safe. Both tabs share this origin, but
 * only the returning one carries `card_setup` in its URL.
 */
const SETUP_TAB_FLAG = "pagectrl:card-setup-tab";

function setSetupTabFlag(): void {
  try {
    window.localStorage.setItem(SETUP_TAB_FLAG, "1");
  } catch {
    // Storage is unavailable; the tab simply stays open.
  }
}

function clearSetupTabFlag(): void {
  try {
    window.localStorage.removeItem(SETUP_TAB_FLAG);
  } catch {
    // Nothing to clear.
  }
}

function readSetupTabFlag(): boolean {
  try {
    return window.localStorage.getItem(SETUP_TAB_FLAG) === "1";
  } catch {
    return false;
  }
}

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
        // Stripe returns to a second copy of the shop with an empty basket,
        // which reads as a lost cart. Close that tab so the browser goes back
        // to the original one, where the cart and the journey are intact.
        // The flag is only set when a separate tab was actually opened, so the
        // popup-blocked path never closes the shopper's only tab.
        if (readSetupTabFlag()) {
          clearSetupTabFlag();
          window.close();
          // A browser that refuses to close the tab leaves this standing.
          setNotice("Card saved. You can close this tab and return to the shop.");
        }
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
      // Opened in a new tab rather than navigating this one. A full-page
      // redirect to Stripe tears down the page mid-session, and the agent's
      // cart and journey are the things a demo is actually showing.
      // No "noopener" in the feature string: with it, window.open always
      // returns null, so the popup-blocked fallback below fired every time and
      // navigated this tab as well. The opener is severed afterwards instead.
      setSetupTabFlag();
      const opened = window.open(payload.url, "_blank");
      if (!opened) {
        // Genuinely blocked. A redirect beats a dead button. This tab is the
        // one going to Stripe, so it must not close itself on the way back.
        clearSetupTabFlag();
        window.location.href = payload.url;
        return;
      }
      try {
        opened.opener = null;
      } catch {
        // Cross-origin already; nothing to sever.
      }
      setStatus("awaiting");
      setNotice("Finish in the Stripe tab, then come back here.");
    } catch {
      setError("Could not reach the payment service.");
      setStatus("idle");
    }
  }

  /** Picks up a card saved in the other tab when this one is looked at again. */
  const refreshCard = useCallback(async () => {
    try {
      const response = await fetch("/api/payments/method", { credentials: "same-origin" });
      const payload = await response.json();
      rememberCard(payload?.card ?? null);
      if (payload?.card) {
        setStatus("idle");
        setNotice("Card saved. The agent can check out without ever seeing it.");
      }
    } catch {
      // Leave the current state alone; the next focus will try again.
    }
  }, []);

  useEffect(() => {
    function onFocus() {
      if (document.visibilityState === "visible") void refreshCard();
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refreshCard]);

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
            disabled={status === "redirecting" || status === "loading" || status === "awaiting"}
          >
            {status === "redirecting"
              ? "Opening Stripe…"
              : status === "awaiting"
                ? "Waiting for the Stripe tab…"
                : "Add a card with Stripe ↗"}
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

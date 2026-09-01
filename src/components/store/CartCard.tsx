"use client";

import { useState } from "react";

import { formatRM } from "@/lib/catalog";
import { flashed, useStore } from "@/lib/store";

export function CartCard() {
  const { state, api } = useStore();
  const [message, setMessage] = useState("");
  const total = state.items.reduce(
    (sum, item) => sum + item.product.price * item.qty,
    0,
  );
  const isFlashed =
    flashed(state.lastFlash, "cart") ||
    flashed(state.lastFlash, "checkout") ||
    Boolean(state.lastFlash?.startsWith("product:"));

  function checkout() {
    const result = api.checkout();
    setMessage(result.message);
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
                  {item.qty} × {formatRM(item.product.price)}
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
        <strong className="price">{formatRM(total)}</strong>
      </div>
      <button
        type="button"
        className="button button-primary full-width"
        onClick={checkout}
        disabled={!state.items.length}
      >
        Checkout
      </button>
      <p className={`inline-message${message && !message.includes("confirmed") ? " is-error" : ""}`} aria-live="polite">
        {message}
      </p>
    </section>
  );
}

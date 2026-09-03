"use client";

import { formatUSD } from "@/lib/catalog";
import { flashed, useStore } from "@/lib/store";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** Live keys are refused, so a charge is always a test-mode one. */
function stripeUrl(paymentIntentId: string): string {
  return `https://dashboard.stripe.com/test/payments/${paymentIntentId}`;
}

export function OrdersCard() {
  const { state } = useStore();
  if (!state.orders.length) return null;

  return (
    <section
      id="orders"
      className={`store-card orders-card${flashed(state.lastFlash, "checkout") ? " is-flashing" : ""}`}
      aria-labelledby="orders-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">Confirmed</p>
          <h2 id="orders-title">Orders</h2>
        </div>
        <span className="count-badge">{state.orders.length}</span>
      </div>

      <ul className="order-list">
        {state.orders.map((order) => (
          <li key={order.id} className="order-row">
            <div className="order-topline">
              <strong>{order.id}</strong>
              <span className="price">{formatUSD(order.total)}</span>
            </div>
            <p className="order-meta">
              {dateFormatter.format(new Date(order.createdAt))}
              {order.paidWith ? ` · ${order.paidWith}` : null}
            </p>
            {order.items.length ? (
              <p className="order-lines">
                {order.items.map((item) => `${item.qty} × ${item.product.name}`).join(", ")}
              </p>
            ) : null}
            {order.paymentIntentId ? (
              <a
                className="order-link"
                href={stripeUrl(order.paymentIntentId)}
                target="_blank"
                rel="noreferrer noopener"
              >
                View the charge in Stripe ↗
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

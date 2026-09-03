"use client";

import { CardBrandIcon, ExternalLinkIcon } from "@/components/guard/AuthorityIcons";
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

/** Brand and last four, split out of the "visa ····4242" summary string. */
function splitCard(paidWith: string | undefined): { brand: string; last4: string } | null {
  if (!paidWith) return null;
  const match = /^(\S+)\s+·*\s*·{0,4}(\d{4})$/.exec(paidWith.replace(/····/g, "···· "));
  if (match) return { brand: match[1], last4: match[2] };
  const digits = /(\d{4})\s*$/.exec(paidWith);
  const brand = paidWith.split(/\s+/)[0];
  return digits ? { brand, last4: digits[1] } : null;
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
        {state.orders.map((order) => {
          const card = splitCard(order.paidWith);
          return (
            <li key={order.id} className="order-row">
              <div className="order-line">
                <strong className="order-id">{order.id}</strong>
                <span className="order-total price">{formatUSD(order.total)}</span>
                {order.paymentIntentId ? (
                  <a
                    className="order-link"
                    href={stripeUrl(order.paymentIntentId)}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`View the charge for ${order.id} in Stripe`}
                    title="View the charge in Stripe"
                  >
                    <ExternalLinkIcon />
                  </a>
                ) : null}
              </div>
              {order.items.length ? (
                <p className="order-items">
                  {order.items.map((item) => `${item.qty} × ${item.product.name}`).join(", ")}
                </p>
              ) : null}
              <div className="order-line order-line--meta">
                <span>{dateFormatter.format(new Date(order.createdAt))}</span>
                {card ? (
                  <span className="order-card">
                    <CardBrandIcon brand={card.brand} height={13} />
                    <span>···· {card.last4}</span>
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

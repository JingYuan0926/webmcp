"use client";

import { formatRM } from "@/lib/catalog";
import { flashed, useStore } from "@/lib/store";

export function OrdersCard() {
  const { state } = useStore();
  return (
    <section className={`store-card${flashed(state.lastFlash, "checkout") ? " is-flashing" : ""}`} aria-labelledby="orders-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Receipts</p>
          <h2 id="orders-title">Orders</h2>
        </div>
        <span className="count-badge">{state.orders.length}</span>
      </div>
      {state.orders.length ? (
        <ul className="order-list">
          {state.orders.map((order) => (
            <li key={order.id}>
              <div>
                <strong>{order.id}</strong>
                <span>{order.items.length} product lines</span>
              </div>
              <strong className="price">{formatRM(order.total)}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <div className="compact-empty">
          <strong>No orders yet</strong>
          <span>Completed checkouts appear here.</span>
        </div>
      )}
    </section>
  );
}


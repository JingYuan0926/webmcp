"use client";

import { useStore } from "@/lib/store";

export function TopBar() {
  const { state } = useStore();
  const itemCount = state.items.reduce((total, item) => total + item.qty, 0);

  return (
    <header className="topbar">
      <a className="brand-lockup" href="#catalog" aria-label="Northline Tech home">
        <div>
          <strong>Northline Tech</strong>
          <span>Everyday technology, thoughtfully selected.</span>
        </div>
      </a>

      <nav className="store-nav" aria-label="Store navigation">
        <a href="#catalog">Shop</a>
        <a href="#delivery">Delivery</a>
        <a href="/docs">SDK Docs</a>
      </nav>

      <div className="store-utilities">
        <span className="shipping-note">Free shipping over $50</span>
        <a className="cart-link" href="#cart-title">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M3.5 5h2l1.5 9h10.5l2-6.5H6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9" cy="18.5" r="1.25" fill="currentColor" />
            <circle cx="17" cy="18.5" r="1.25" fill="currentColor" />
          </svg>
          Cart
          <span aria-label={`${itemCount} items`}>{itemCount}</span>
        </a>
      </div>
    </header>
  );
}

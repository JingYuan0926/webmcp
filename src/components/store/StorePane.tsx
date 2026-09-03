"use client";

import { useMemo, useState } from "react";

import { CartCard } from "@/components/store/CartCard";
import { ProductGrid } from "@/components/store/ProductGrid";
import { OrdersCard } from "@/components/store/OrdersCard";
import { SearchBar } from "@/components/store/SearchBar";
import { catalog } from "@/lib/catalog";

export function StorePane() {
  const [query, setQuery] = useState("");
  const products = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return catalog;
    return catalog.filter((product) =>
      [product.name, product.tag, product.blurb, product.id]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [query]);

  return (
    <main className="store-pane">
      <section className="store-intro" aria-labelledby="catalog-title">
        <div>
          <p className="store-brand">Northline Tech</p>
          <h1 id="catalog-title">Better tech for everyday work.</h1>
          <p>Reliable desk gear, useful upgrades, and straightforward support—all selected to make your setup work better.</p>
        </div>
        <SearchBar value={query} onChange={setQuery} resultCount={products.length} />
      </section>
      <section className="store-benefits" aria-label="Shopping benefits">
        <div>
          <span aria-hidden="true">✓</span>
          <p><strong>Free shipping</strong><small>On orders over $50</small></p>
        </div>
        <div>
          <span aria-hidden="true">↺</span>
          <p><strong>30-day returns</strong><small>Simple, no-stress returns</small></p>
        </div>
        <div>
          <span aria-hidden="true">◇</span>
          <p><strong>Helpful support</strong><small>Real answers when you need them</small></p>
        </div>
      </section>
      <div className="store-content">
        <section id="catalog" aria-label="Product catalog">
          <ProductGrid products={products} />
        </section>
        <aside className="store-sidebar" aria-label="Cart and account details">
          <div id="partner-slot" aria-live="polite" />
          <CartCard />
          <OrdersCard />
        </aside>
      </div>
      <footer className="store-footer">
        <p>
          <strong>Northline Tech</strong>
          <span>Everyday technology, thoughtfully selected. Free shipping over $50.</span>
        </p>
        <nav aria-label="Store pages">
          <a href="/docs">SDK Docs</a>
          <a href="/dashboard">Dashboard</a>
        </nav>
      </footer>
    </main>
  );
}

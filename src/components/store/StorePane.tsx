"use client";

import { useMemo, useState } from "react";

import { AddressCard } from "@/components/store/AddressCard";
import { CartCard } from "@/components/store/CartCard";
import { OrdersCard } from "@/components/store/OrdersCard";
import { ProductGrid } from "@/components/store/ProductGrid";
import { SearchBar } from "@/components/store/SearchBar";
import { catalog } from "@/lib/catalog";
import { useAgentGuard } from "@/lib/use-agentguard";

export function StorePane() {
  const [query, setQuery] = useState("");
  const { tools, budget, available } = useAgentGuard();
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
          <p className="eyebrow">Kuala Lumpur · ready to ship</p>
          <h1 id="catalog-title">Let your agent shop. Keep the final say.</h1>
          <p>Share the cart, not control. AgentGuard checks every WebMCP call inside the page.</p>
        </div>
        <SearchBar value={query} onChange={setQuery} resultCount={products.length} />
      </section>
      <section className="trust-path" aria-label="AgentGuard protection path">
        <div>
          <span className="trust-step">01</span>
          <p><strong>{available ? tools.length : "—"} tools</strong><span>registered in-page</span></p>
        </div>
        <span className="trust-arrow" aria-hidden="true">→</span>
        <div>
          <span className="trust-step">02</span>
          <p><strong>{available ? `RM ${budget.limit.toFixed(0)}` : "Loading"}</strong><span>session policy floor</span></p>
        </div>
        <span className="trust-arrow" aria-hidden="true">→</span>
        <div>
          <span className="trust-step">03</span>
          <p><strong>Human approval</strong><span>before address or checkout</span></p>
        </div>
      </section>
      <div className="store-content">
        <section aria-label="Product catalog">
          <ProductGrid products={products} />
        </section>
        <aside className="store-sidebar" aria-label="Cart and account details">
          <CartCard />
          <AddressCard />
          <OrdersCard />
        </aside>
      </div>
    </main>
  );
}

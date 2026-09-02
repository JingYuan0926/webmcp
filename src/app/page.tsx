"use client";

import { useEffect, useState } from "react";

import { GuardPanel } from "@/components/guard/GuardPanel";
import { StorePane } from "@/components/store/StorePane";
import { TopBar } from "@/components/store/TopBar";
import { StoreProvider } from "@/lib/store";
import { registerStoreTools } from "@/lib/tools";

function PageControlDemo() {
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    registerStoreTools().catch(() => {
      // The store remains fully usable when the SDK or WebMCP host is unavailable.
    });
  }, []);

  return (
    <div className={`app-shell${panelOpen ? "" : " app-shell--panel-hidden"}`}>
      <section className="store-column" aria-label="Northline Tech store">
        <TopBar />
        <StorePane />
      </section>
      {panelOpen ? (
        <GuardPanel onHide={() => setPanelOpen(false)} />
      ) : (
        <button
          type="button"
          className="show-guard-button"
          onClick={() => setPanelOpen(true)}
          aria-label="Show PageControl panel"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="m9 12 2 2 4-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Show PageControl
        </button>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <StoreProvider>
      <PageControlDemo />
    </StoreProvider>
  );
}

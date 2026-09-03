"use client";

import { useEffect, useRef, useState } from "react";

import { GuardPanel } from "@/components/guard/GuardPanel";
import { StorePane } from "@/components/store/StorePane";
import { TopBar } from "@/components/store/TopBar";
import { StoreProvider } from "@/lib/store";
import { registerStoreTools } from "@/lib/tools";

function PageControlDemo() {
  const [panelOpen, setPanelOpen] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    registerStoreTools().catch(() => {
      // The store remains fully usable when the SDK or WebMCP host is unavailable.
    });
  }, []);

  useEffect(() => {
    if (!panelOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPanelOpen(false);
        triggerRef.current?.focus();
      }
    }

    function closeOnOutsideClick(event: PointerEvent) {
      if (!widgetRef.current?.contains(event.target as Node)) setPanelOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, [panelOpen]);

  return (
    <div className="app-shell">
      <section className="store-column" aria-label="Northline Tech store">
        <TopBar />
        <StorePane />
      </section>
      <div className="pagecontrol-widget" ref={widgetRef}>
        {/* Always mounted, only hidden. The panel owns shipping inputs that a
            third-party widget scrapes, Stripe's return flow, and checkout card
            state — unmounting it would silently disable all three. */}
        <GuardPanel onHide={() => setPanelOpen(false)} hidden={!panelOpen} />
        <button
          ref={triggerRef}
          type="button"
          className={`show-guard-button${panelOpen ? " is-open" : ""}`}
          onClick={() => setPanelOpen((open) => !open)}
          aria-label={panelOpen ? "Close PageControl settings" : "Open PageControl settings"}
          aria-expanded={panelOpen}
          aria-controls="pagecontrol-panel"
          data-label={panelOpen ? "Close PageControl" : "PageControl"}
        >
          <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true">
            <path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="m9 12 2 2 4-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
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

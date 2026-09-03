"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { GuardPanel } from "@/components/guard/GuardPanel";
import { StorePane } from "@/components/store/StorePane";
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
          aria-label={panelOpen ? "Close PageCtrl settings" : "Open PageCtrl settings"}
          aria-expanded={panelOpen}
          aria-controls="pagecontrol-panel"
        >
          <Image src="/logo.png" alt="" width={78} height={78} priority />
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

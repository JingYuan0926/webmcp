"use client";

import { useEffect } from "react";

import { GuardPanel } from "@/components/guard/GuardPanel";
import { StorePane } from "@/components/store/StorePane";
import { TopBar } from "@/components/store/TopBar";
import { StoreProvider } from "@/lib/store";
import { registerStoreTools } from "@/lib/tools";

function AgentGuardDemo() {
  useEffect(() => {
    registerStoreTools().catch(() => {
      // The store remains fully usable when the SDK or WebMCP host is unavailable.
    });
  }, []);

  return (
    <div className="app-shell">
      <section className="store-column" aria-label="Kedai Tech store">
        <TopBar />
        <StorePane />
      </section>
      <GuardPanel />
    </div>
  );
}

export default function Home() {
  return (
    <StoreProvider>
      <AgentGuardDemo />
    </StoreProvider>
  );
}

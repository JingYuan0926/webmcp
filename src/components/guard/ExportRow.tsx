"use client";

import { useState } from "react";

export function ExportRow() {
  const [message, setMessage] = useState("");

  function exportJourney() {
    if (!window.AgentGuard) {
      setMessage("AgentGuard is not available.");
      return;
    }
    window.AgentGuard.exportJourney();
    setMessage("Journey exported.");
  }

  return (
    <footer className="export-row">
      <button type="button" className="export-button" onClick={exportJourney}>
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
          <path d="M10 3v9m0 0 3-3m-3 3L7 9M4 14v3h12v-3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Export journey (JSON)
      </button>
      <span>hash-chained · tamper-evident</span>
      <p className="sr-only" aria-live="polite">{message}</p>
    </footer>
  );
}


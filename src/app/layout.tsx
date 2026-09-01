import type { Metadata } from "next";
import Script from "next/script";

import "./globals.css";

export const metadata: Metadata = {
  title: "AgentGuard · Kedai Tech",
  description:
    "The in-page trust layer for WebMCP: policies, approvals, and a hash-chained flight recorder.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script src="/agentguard.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}

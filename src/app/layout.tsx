import type { Metadata } from "next";
import Script from "next/script";

import "./globals.css";

export const metadata: Metadata = {
  title: "Northline Tech | Everyday technology",
  description:
    "Thoughtfully selected technology for work, home, and everything between.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script src="/pagecontrol.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}

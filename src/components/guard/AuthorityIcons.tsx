"use client";

import Image from "next/image";
import { useState } from "react";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function WalletIcon() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H14a1.5 1.5 0 0 1 1.5 1.5v1" {...stroke} />
      <rect x="3" y="6.5" width="14" height="9" rx="1.8" {...stroke} />
      <circle cx="13.4" cy="11" r="1.05" {...stroke} />
    </svg>
  );
}

export function CardIcon() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.8" {...stroke} />
      <path d="M2.5 8.5h15" {...stroke} />
      <path d="M5.5 12.5h3" {...stroke} />
    </svg>
  );
}

/** Parcel — a cart line. */
export function BoxIcon() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
      <path d="M2.5 6.2 10 3l7.5 3.2v7.6L10 17l-7.5-3.2Z" {...stroke} />
      <path d="M2.5 6.2 10 9.5l7.5-3.3M10 9.5V17" {...stroke} />
    </svg>
  );
}

/** Map pin — shipping destination. */
export function LocationIcon() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
      <path d="M10 17.5s5.5-4.6 5.5-9a5.5 5.5 0 0 0-11 0c0 4.4 5.5 9 5.5 9Z" {...stroke} />
      <circle cx="10" cy="8.4" r="2.1" {...stroke} />
    </svg>
  );
}

/** Opens in a new tab. */
export function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
      <path d="M11 4h5v5" {...stroke} />
      <path d="M16 4l-6.5 6.5" {...stroke} />
      <path d="M15 12.5V15a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 15V6.5A1.5 1.5 0 0 1 5 5h2.5" {...stroke} />
    </svg>
  );
}

const KNOWN = new Set(["visa", "mastercard", "amex"]);

function assetFor(brand: string): string {
  const key = brand.trim().toLowerCase().replace(/\s|_/g, "");
  const normalised = key === "americanexpress" ? "amex" : key;
  return KNOWN.has(normalised) ? normalised : "card";
}

/**
 * The card network's mark, loaded from /brands. Those files are placeholders —
 * dropping the licensed artwork in at the same path and viewBox replaces them
 * everywhere without a code change. See public/brands/README.md.
 */
export function CardBrandIcon({ brand, height = 16 }: { brand: string; height?: number }) {
  const [failed, setFailed] = useState(false);
  const label = brand.charAt(0).toUpperCase() + brand.slice(1);
  const src = `/brands/${failed ? "card" : assetFor(brand)}.svg`;

  return (
    <span className="card-brand" title={label}>
      <Image
        src={src}
        alt={label}
        width={Math.round(height * 3)}
        height={height}
        unoptimized
        onError={() => setFailed(true)}
      />
    </span>
  );
}

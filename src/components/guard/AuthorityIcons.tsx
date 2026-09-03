"use client";

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

export function ShipIcon() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
      <path d="M2.5 6.2 10 3l7.5 3.2v7.6L10 17l-7.5-3.2Z" {...stroke} />
      <path d="M2.5 6.2 10 9.5l7.5-3.3M10 9.5V17" {...stroke} />
    </svg>
  );
}

/**
 * A compact brand mark for a saved card. These are simplified marks drawn from
 * each network's basic geometry, not the licensed logos — enough to recognise
 * the card at a glance beside its last four digits.
 */
export function CardBrandIcon({ brand }: { brand: string }) {
  const key = brand.trim().toLowerCase();
  const label = brand.charAt(0).toUpperCase() + brand.slice(1);

  if (key === "mastercard") {
    return (
      <span className="card-brand" role="img" aria-label={label}>
        <svg viewBox="0 0 28 18" width="26" height="17" aria-hidden="true">
          <rect width="28" height="18" rx="3" fill="#f4f5f7" />
          <circle cx="11.4" cy="9" r="5" fill="#eb001b" />
          <circle cx="16.6" cy="9" r="5" fill="#f79e1b" opacity="0.9" />
        </svg>
      </span>
    );
  }

  if (key === "amex" || key === "american_express") {
    return (
      <span className="card-brand" role="img" aria-label={label}>
        <svg viewBox="0 0 28 18" width="26" height="17" aria-hidden="true">
          <rect width="28" height="18" rx="3" fill="#1f72cd" />
          <text x="14" y="12.2" textAnchor="middle" fontSize="6.6" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">
            AMEX
          </text>
        </svg>
      </span>
    );
  }

  if (key === "visa") {
    return (
      <span className="card-brand" role="img" aria-label={label}>
        <svg viewBox="0 0 28 18" width="26" height="17" aria-hidden="true">
          <rect width="28" height="18" rx="3" fill="#f4f5f7" />
          <text
            x="14"
            y="12.4"
            textAnchor="middle"
            fontSize="7.4"
            fontWeight="700"
            fontStyle="italic"
            fill="#1a1f71"
            fontFamily="system-ui, sans-serif"
          >
            VISA
          </text>
        </svg>
      </span>
    );
  }

  return (
    <span className="card-brand" role="img" aria-label={label}>
      <svg viewBox="0 0 28 18" width="26" height="17" aria-hidden="true">
        <rect x="0.5" y="0.5" width="27" height="17" rx="2.5" fill="#f4f5f7" stroke="#d7dbe0" />
        <path d="M0.5 6h27" stroke="#d7dbe0" strokeWidth="1" />
      </svg>
    </span>
  );
}

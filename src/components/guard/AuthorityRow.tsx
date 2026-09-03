"use client";

import type { FormEvent, ReactNode } from "react";

/**
 * One line of the agent authority group: a label, its current value, and a
 * pencil that reveals an editor.
 *
 * The editor is hidden with the `hidden` attribute rather than unmounted. A
 * third-party widget in this demo reads the shipping inputs straight out of the
 * document, and PageControl's own checkout guard depends on state these editors
 * own — removing them from the DOM would silently change both.
 */
export function AuthorityRow({
  label,
  value,
  empty = false,
  tone,
  editorId,
  editLabel,
  open,
  onToggle,
  flashing = false,
  meter,
  icon,
  badge,
  full = false,
  onSubmit,
  trustedBudgetControl = false,
  children,
}: {
  label: string;
  value: string;
  empty?: boolean;
  tone?: "ok" | "warn" | "danger";
  editorId: string;
  editLabel: string;
  open: boolean;
  onToggle: () => void;
  flashing?: boolean;
  meter?: ReactNode;
  /** Small glyph beside the label. */
  icon?: ReactNode;
  /** Rendered before the value, e.g. a card brand mark. */
  badge?: ReactNode;
  /** Spans both columns even when collapsed. */
  full?: boolean;
  /** When given, the editor is a form and this handles its submit. */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  /** Lets the sealed SDK accept only a browser-trusted budget form submission. */
  trustedBudgetControl?: boolean;
  children: ReactNode;
}) {
  const valueClass = [
    "authority-value",
    empty ? "authority-value--empty" : "",
    tone ? `authority-value--${tone}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li
      className={[
        "authority-row",
        full ? "authority-row--full" : "",
        open ? "is-open" : "",
        flashing ? "is-flashing" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="authority-row-head">
        {icon ? (
          <span className="authority-icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className="authority-label">{label}</span>
        <button
          type="button"
          className="budget-edit-button"
          aria-label={editLabel}
          aria-expanded={open}
          aria-controls={editorId}
          title={editLabel}
          onClick={onToggle}
        >
          <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
            <path
              d="m4 13.5-.7 3.2 3.2-.7L15.8 6.7a1.6 1.6 0 0 0 0-2.3l-.2-.2a1.6 1.6 0 0 0-2.3 0L4 13.5Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="m12 5.5 2.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="authority-value-line">
        {badge}
        <span className={valueClass}>{value}</span>
      </div>
      {meter}
      {onSubmit ? (
        <form
          id={editorId}
          className="budget-policy authority-editor"
          hidden={!open}
          onSubmit={onSubmit}
          data-pagecontrol-budget-form={trustedBudgetControl ? "" : undefined}
          noValidate
        >
          {children}
        </form>
      ) : (
        <div id={editorId} className="budget-policy authority-editor" hidden={!open}>
          {children}
        </div>
      )}
    </li>
  );
}

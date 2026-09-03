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
    <li className={`authority-row${flashing ? " is-flashing" : ""}`}>
      <div className="authority-row-head">
        <span className="authority-label">{label}</span>
        <span className={valueClass}>{value}</span>
        <button
          type="button"
          className="budget-edit-button"
          aria-label={editLabel}
          aria-expanded={open}
          aria-controls={editorId}
          title={editLabel}
          onClick={onToggle}
        >
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
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

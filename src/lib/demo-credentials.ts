/**
 * Sign-in details for the merchant console.
 *
 * These are public on purpose. The console shows preview keys that are minted
 * per session and grant nothing, so anyone evaluating this project can open it
 * without being handed a secret. A real deployment overrides both values with
 * PAGECONTROL_DASHBOARD_USERNAME and PAGECONTROL_DASHBOARD_PASSWORD.
 *
 * This module holds no server code, so the sign-in form and the server check
 * can share one source and never drift apart.
 */
export const DEMO_DASHBOARD_USERNAME = "demoaccount@gmail.com";
export const DEMO_DASHBOARD_PASSWORD = "PageCTRL#Demo2026!";

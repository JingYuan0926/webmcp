"use client";

import {
  cardIsLoaded,
  chargeQuote,
  hasCard,
  pinQuote,
  savedCard,
  takePinnedQuote,
  type CartLine,
} from "@/lib/payments-client";
import { storeApi, type Address } from "@/lib/store";

let registrationPromise: Promise<boolean> | null = null;

/**
 * Every message a failed checkout can show the agent. They are fixed strings:
 * PageControl passes a thrown error straight into model context, so nothing
 * from Stripe or the network is ever allowed to reach this path.
 */
const CHECKOUT_ERRORS: Record<string, string> = {
  no_quote:
    "No priced quote was pinned for this cart. Reload the cart and try checkout again.",
  expired: "The approved price expired before the charge ran. Start checkout again.",
  cart_changed:
    "The cart changed after the price was approved. Nothing was charged. Start checkout again.",
  amount_changed:
    "The approved amount no longer matches this checkout. Nothing was charged. Start checkout again.",
};

function cartLines(): CartLine[] {
  return storeApi.cart().items.map((item) => ({ id: item.product.id, qty: item.qty }));
}

const objectSchema = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: "object",
  properties,
  required,
});

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number {
  return typeof value === "number" ? value : Number.NaN;
}

export function registerStoreTools(): Promise<boolean> {
  if (registrationPromise) return registrationPromise;
  if (typeof window === "undefined") return Promise.resolve(false);

  // The beforeInteractive bootstrap publishes the read-only catalog tools
  // before React starts. Their handlers wait for this bridge if an agent calls
  // during hydration, so the first request still enters PageCTRL.
  window.NorthlineToolBridge = {
    searchProducts: (query) => JSON.stringify(storeApi.search(query)),
    listProducts: () => JSON.stringify(storeApi.list()),
  };

  registrationPromise = (async () => {
    if (window.NorthlineWebMCPReady) await window.NorthlineWebMCPReady;
    const deadline = Date.now() + 5_000;
    while (!window.PageControl && Date.now() < deadline) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 50));
    }
    const guard = window.PageControl;
    if (!guard) {
      registrationPromise = null;
      return false;
    }

    await guard.init({
      appName: "Northline Tech",
      budget: { limit: 300, currency: "USD" },
      defaultMode: "allow",
      defaultMaxPerMinute: 30,
      tools: {
        add_to_cart: { mode: "allow", maxAmount: 200, maxQty: 5, maxPerMinute: 20 },
        checkout: { mode: "approve", chargesBudget: true },
        set_shipping_address: { mode: "approve" },
        delete_account: {
          mode: "deny",
          denyMessage: "Account deletion requires the account owner, in person.",
        },
        search_products: { maxPerMinute: 60 },
        list_products: { maxPerMinute: 60 },
        payment_method_status: { mode: "allow", maxPerMinute: 20 },
      },
    });
    // There is deliberately no tool for adding, changing, or reading a payment
    // card. The card is saved by a human through a Stripe iframe and lives on
    // the server behind an httpOnly cookie, so it is outside the agent's reach
    // by construction rather than by policy.

    if (!document.modelContext) {
      throw new Error("PageCTRL could not initialize the WebMCP tool registry.");
    }

    const searchProductsSchema = {
      type: "object",
      properties: {
        query: { type: "string", minLength: 1 },
      },
      required: ["query"],
    };
    const executeSearchProducts = async (input: Record<string, unknown>) =>
      JSON.stringify(storeApi.search(asString(input.query)));

    if (guard.canInterceptNativeRegistration()) {
      // This direct literal call proves PageControl wraps the native WebMCP
      // API when the browser allows the method to be patched.
      await document.modelContext.registerTool({
        name: "search_products",
        label: "Search products",
        description: "Search the product catalog",
        inputSchema: searchProductsSchema,
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: executeSearchProducts,
      });
    } else {
      // Some hosts expose a read-only native method. Use the explicit bridge
      // there so the tool cannot silently bypass PageControl.
      await guard.registerTool({
        name: "search_products",
        label: "Search products",
        description: "Search the product catalog",
        inputSchema: searchProductsSchema,
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: executeSearchProducts,
      });
    }

    const tools: WebMCPToolDefinition[] = [
      {
        name: "list_products",
        label: "Browse the catalog",
        description: "List every product sold by Northline Tech.",
        inputSchema: objectSchema({}),
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: async () => JSON.stringify(storeApi.list()),
      },
      {
        name: "get_product",
        label: "View a product",
        description: "Get one product by its stable catalog id.",
        inputSchema: objectSchema({ id: { type: "string", minLength: 1 } }, ["id"]),
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: async (inputs) => JSON.stringify(storeApi.get(asString(inputs.id))),
      },
      {
        name: "add_to_cart",
        label: "Add to cart",
        description: "Add a positive integer quantity of one product to the cart.",
        inputSchema: objectSchema(
          {
            id: { type: "string", minLength: 1 },
            qty: { type: "integer", minimum: 1 },
          },
          ["id", "qty"],
        ),
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        guard: {
          getCost: (inputs) => {
            const product = storeApi.get(asString(inputs.id));
            return product ? product.price * asNumber(inputs.qty) : Number.NaN;
          },
          getQty: (inputs) => asNumber(inputs.qty),
        },
        execute: async (inputs) =>
          JSON.stringify(storeApi.addToCart(asString(inputs.id), asNumber(inputs.qty))),
      },
      {
        name: "remove_from_cart",
        label: "Remove from cart",
        description: "Remove one product line from the cart.",
        inputSchema: objectSchema({ id: { type: "string", minLength: 1 } }, ["id"]),
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: async (inputs) => JSON.stringify(storeApi.removeFromCart(asString(inputs.id))),
      },
      {
        name: "view_cart",
        label: "View the cart",
        description: "Read the current cart and total in US dollars.",
        inputSchema: objectSchema({}),
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: async () => JSON.stringify(storeApi.cart()),
      },
      {
        name: "set_shipping_address",
        label: "Change the delivery address",
        description: "Set the recipient name and shipping address.",
        inputSchema: objectSchema(
          {
            name: { type: "string", minLength: 1 },
            line1: { type: "string", minLength: 1 },
            city: { type: "string", minLength: 1 },
            postcode: { type: "string", minLength: 1 },
          },
          ["name", "line1", "city", "postcode"],
        ),
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: async (inputs) =>
          JSON.stringify(
            storeApi.setAddress({
              name: asString(inputs.name),
              line1: asString(inputs.line1),
              city: asString(inputs.city),
              postcode: asString(inputs.postcode),
            } satisfies Address),
          ),
      },
      {
        name: "payment_method_status",
        label: "Check the payment method",
        description:
          "Report whether the account holder has a card saved for checkout. Returns no card details.",
        inputSchema: objectSchema({}),
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: async () =>
          JSON.stringify({
            ready: hasCard(),
            message: hasCard()
              ? "A card is saved. Checkout can proceed."
              : "No card is saved. The account holder must add one in the Payment card panel.",
          }),
      },
      {
        name: "checkout",
        label: "Place the order",
        description:
          "Place an order for the current cart at the saved address, charged to the card the " +
          "account holder saved earlier. Takes no arguments and accepts no payment details.",
        inputSchema: objectSchema({}),
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        guard: {
          // Runs synchronously inside the guard. Returns the amount the human
          // sees on the approval card and pins the exact server quote behind
          // it, so the charge cannot be for a different cart than the one
          // approved.
          getCost: (_inputs, context) => {
            const ready = storeApi.canCheckout();
            // Throwing here blocks the call before it reaches a human, so an
            // agent that forgot a prerequisite is told immediately rather than
            // after someone approves a doomed checkout.
            if (!ready.ok) throw new Error(ready.message);
            // Only assert this once the card state is known — an unresolved
            // lookup must not read as "no card".
            if (cardIsLoaded() && !hasCard()) {
              throw new Error(
                "No card is saved. The account holder must add one in the Payment card panel.",
              );
            }
            return pinQuote(cartLines(), context.callId);
          },
          // checkout takes no arguments by design, so "{}" is all a human
          // would otherwise see. Describe the actual order instead.
          getSummary: () => {
            const { items } = storeApi.cart();
            const address = storeApi.getAddress();
            const card = savedCard();

            // At most six rows: the guard caps a summary at eight, and ship-to
            // and pay-with take the last two.
            const shown = items.slice(0, 5);
            const rows: PageControlSummaryRow[] = shown.map((item) => ({
              icon: "item",
              text: `${item.qty} × ${item.product.name}`,
            }));
            const hidden = items.length - shown.length;
            if (hidden > 0) {
              rows.push({ icon: "item", text: `and ${hidden} more line${hidden === 1 ? "" : "s"}` });
            }

            rows.push({
              icon: "ship",
              text: address
                ? `${address.name}, ${address.line1}, ${address.city} ${address.postcode}`
                : "No shipping address",
            });
            rows.push(
              card
                ? { icon: "card", brand: card.brand, text: `···· ${card.last4}` }
                : { icon: "card", text: "No card saved" },
            );
            return rows;
          },
        },
        execute: async (_inputs, context) => {
          const ready = storeApi.canCheckout();
          // Throwing rather than returning: the guard refunds the budget
          // reservation on the error path, so a failed order never consumes
          // the session budget.
          if (!ready.ok) throw new Error(ready.message);

          const callId = context.pageControl?.callId;
          const approvedCost = context.pageControl?.approvedCost ?? null;
          if (!callId) throw new Error(CHECKOUT_ERRORS.no_quote);
          const pin = takePinnedQuote(cartLines(), callId, approvedCost);
          if (!pin.ok) throw new Error(CHECKOUT_ERRORS[pin.code]);

          let charge;
          try {
            charge = await chargeQuote(pin.quoteId);
          } catch {
            throw new Error("The payment service is unreachable. Nothing was charged.");
          }
          if (!charge.ok) throw new Error(charge.message);

          return JSON.stringify(
            storeApi.checkout({
              orderId: charge.orderId,
              total: charge.total,
              currency: charge.currency,
              card: charge.card,
              // Kept for the on-page receipt. storeApi.checkout does not return
              // it, so it never reaches the agent.
              paymentIntentId: charge.paymentIntentId,
            }),
          );
        },
      },
      {
        name: "contact_seller",
        label: "Message the seller",
        description: "Send a product question to the Northline Tech seller.",
        inputSchema: objectSchema({ message: { type: "string", minLength: 1 } }, ["message"]),
        annotations: { readOnlyHint: false, untrustedContentHint: true },
        execute: async (inputs) => storeApi.contactSeller(asString(inputs.message)),
      },
      {
        name: "delete_account",
        label: "Delete the account",
        description: "Request permanent deletion of the current customer account.",
        inputSchema: objectSchema({}),
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: async () => JSON.stringify(storeApi.deleteAccount()),
      },
    ];

    for (const tool of tools) await guard.registerTool(tool);
    guard.seal();
    return true;
  })().catch((error) => {
    registrationPromise = null;
    throw error;
  });

  return registrationPromise;
}

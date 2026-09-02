"use client";

import { storeApi, type Address } from "@/lib/store";

let registrationPromise: Promise<boolean> | null = null;

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

  registrationPromise = (async () => {
    const deadline = Date.now() + 5_000;
    while (!window.AgentGuard && Date.now() < deadline) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 50));
    }
    const guard = window.AgentGuard;
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
      },
    });

    const tools: WebMCPToolDefinition[] = [
      {
        name: "search_products",
        description: "Search the Northline Tech catalog by name, tag, or product detail.",
        inputSchema: objectSchema({ query: { type: "string", minLength: 1 } }, ["query"]),
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: async (inputs) => JSON.stringify(storeApi.search(asString(inputs.query))),
      },
      {
        name: "list_products",
        description: "List every product sold by Northline Tech.",
        inputSchema: objectSchema({}),
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: async () => JSON.stringify(storeApi.list()),
      },
      {
        name: "get_product",
        description: "Get one product by its stable catalog id.",
        inputSchema: objectSchema({ id: { type: "string", minLength: 1 } }, ["id"]),
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: async (inputs) => JSON.stringify(storeApi.get(asString(inputs.id))),
      },
      {
        name: "add_to_cart",
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
        description: "Remove one product line from the cart.",
        inputSchema: objectSchema({ id: { type: "string", minLength: 1 } }, ["id"]),
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: async (inputs) => JSON.stringify(storeApi.removeFromCart(asString(inputs.id))),
      },
      {
        name: "view_cart",
        description: "Read the current cart and total in US dollars.",
        inputSchema: objectSchema({}),
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: async () => JSON.stringify(storeApi.cart()),
      },
      {
        name: "set_shipping_address",
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
        name: "checkout",
        description: "Place an order for the current cart at the saved address.",
        inputSchema: objectSchema({}),
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        guard: { getCost: () => storeApi.cart().total },
        execute: async () => JSON.stringify(storeApi.checkout()),
      },
      {
        name: "contact_seller",
        description: "Send a product question to the Northline Tech seller.",
        inputSchema: objectSchema({ message: { type: "string", minLength: 1 } }, ["message"]),
        annotations: { readOnlyHint: false, untrustedContentHint: true },
        execute: async (inputs) => storeApi.contactSeller(asString(inputs.message)),
      },
      {
        name: "delete_account",
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

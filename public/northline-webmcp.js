(function () {
  "use strict";

  if (window.NorthlineWebMCPReady) return;
  if (window.location.pathname !== "/") {
    window.NorthlineWebMCPReady = Promise.resolve(false);
    return;
  }

  var guard = window.PageControl;
  if (!guard) {
    window.NorthlineWebMCPReady = Promise.resolve(false);
    return;
  }

  function callBridge(method, inputs) {
    var deadline = Date.now() + 5000;
    return new Promise(function (resolve, reject) {
      function attempt() {
        var bridge = window.NorthlineToolBridge;
        if (bridge && typeof bridge[method] === "function") {
          resolve(bridge[method](inputs));
          return;
        }
        if (Date.now() >= deadline) {
          reject(new Error("The Northline Tech storefront is still loading. Try this tool again."));
          return;
        }
        window.setTimeout(attempt, 25);
      }
      attempt();
    });
  }

  var config = {
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
  };

  window.NorthlineWebMCPReady = guard
    .init(config)
    .then(function () {
      return guard.registerTool({
        name: "search_products",
        label: "Search products",
        description: "Search the Northline Tech product catalog.",
        inputSchema: {
          type: "object",
          properties: { query: { type: "string", minLength: 1 } },
          required: ["query"],
        },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: function (inputs) {
          return callBridge("searchProducts", String(inputs.query || ""));
        },
      });
    })
    .then(function () {
      return guard.registerTool({
        name: "list_products",
        label: "Browse the catalog",
        description: "List every product sold by Northline Tech.",
        inputSchema: { type: "object", properties: {}, required: [] },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: function () {
          return callBridge("listProducts");
        },
      });
    })
    .then(function () {
      return true;
    })
    .catch(function () {
      return false;
    });
})();

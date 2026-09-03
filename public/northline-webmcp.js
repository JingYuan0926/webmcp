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

  function waitForCompleteToolSurface() {
    var deadline = Date.now() + 5000;
    return new Promise(function (resolve, reject) {
      function attempt() {
        var ready = window.NorthlineStoreToolsReady;
        if (!ready) {
          if (Date.now() >= deadline) {
            reject(new Error("The complete storefront tool list is still loading. Try again."));
            return;
          }
          window.setTimeout(attempt, 25);
          return;
        }

        Promise.resolve(ready).then(function (registered) {
          if (!registered) {
            reject(new Error("The storefront tools could not be registered."));
            return;
          }
          var context = document.modelContext;
          var tools = context && typeof context.getTools === "function" ? context.getTools() : [];
          Promise.resolve(tools).then(function (definitions) {
            var names = Array.isArray(definitions)
              ? definitions.map(function (definition) { return definition.name; }).filter(Boolean)
              : [];
            resolve(JSON.stringify({ ready: true, count: names.length, tools: names }));
          }, reject);
        }, reject);
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
        name: "pagecontrol_ready",
        label: "Connect PageCTRL",
        description:
          "Call this first after opening the site. Wait for the complete WebMCP tool surface and return every available tool name.",
        inputSchema: { type: "object", properties: {}, required: [] },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: function () {
          return waitForCompleteToolSurface();
        },
      });
    })
    .then(function () {
      return guard.registerTool({
        name: "search_products",
        label: "Search products",
        description:
          "Search the Northline Tech product catalog. After navigation, call pagecontrol_ready first to confirm the complete tool surface.",
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

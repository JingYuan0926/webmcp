# AgentGuard

The trust layer for the agent-native web. One script. Policies, approvals, and a flight recorder for every WebMCP tool call.

## Why AgentGuard exists

AI agents can act inside a web page through WebMCP. A page registers JavaScript tools, and an agent can search, edit, buy, or delete through those tools.

These calls run inside the page. They do not cross the network, so a firewall, API gateway, payment rail, or browser extension cannot reliably inspect them.

The page is the only control point that sees the tool definition, arguments, result, and user state together. AgentGuard puts the policy layer there.

## The demo

The app is one shared workspace. Kedai Tech, a Malaysian electronics store, sits on the left. The AgentGuard control panel sits on the right. A human and an agent change the same cart and address.

Select **Run test agent** to start a deterministic nine-step run. The agent lists products, adds a safe quantity, hits quantity and amount caps, receives an instruction-like seller reply, asks why a call was blocked, and reaches two human approval gates. It then reads its own journey record.

The control panel updates as the run moves. It shows spend, pending approvals, verdicts, alerts, policy floors, stricter user rules, and hash links. Select **Pause agent** at any time to activate the kill switch.

## Guardrails

| Guardrail | Protects the user | Protects the merchant |
| --- | --- | --- |
| Budget | Stops total agent spend at a clear session limit. | Limits payment exposure before checkout runs. |
| Amount cap | Blocks one action that costs too much. | Keeps high-value products out of unattended flows. |
| Quantity cap | Stops accidental or malicious bulk orders. | Reduces inventory abuse and obvious automation errors. |
| Rate limit | Slows repeated calls from a looping agent. | Protects page state and merchant workflows from floods. |
| Approval gates | Lets a human inspect sensitive arguments and cost. | Creates a clear decision point before side effects. |
| Hard deny | Keeps forbidden actions unavailable to agents. | Enforces non-negotiable operating rules. |
| Argument validation | Rejects missing, wrong-type, fractional, and invalid values. | Prevents malformed inputs from reaching merchant code. |
| Injection detection | Warns the agent when tool output looks like instructions. | Finds hostile content returned through merchant data. |
| Tamper guard | Shows when a sealed tool changes after review. | Stops silent replacement of trusted tool definitions. |
| Hash-chained journey | Gives the user a tamper-evident action record. | Produces an auditable sequence for support and review. |
| Kill switch | Blocks every agent call immediately. | Contains a bad run without disabling the storefront. |
| Agent analytics | Explains what the agent tried and why it failed. | Reveals tool demand, friction, and policy pressure. |

## Two-tier policy

Merchant rules are the floor. They stay locked after setup. Users can deny more actions, require more approvals, and lower caps or budgets. Users cannot loosen a merchant rule.

## How this uses WebMCP

AgentGuard patches `document.modelContext.registerTool` before application code runs and mirrors the same context on `navigator.modelContext` for older clients. Every registered `execute()` function is replaced with a guarded pipeline for validation, policy resolution, rate limits, caps, budgets, approvals, execution timeouts, redaction, output scanning, and journey hashing. AgentGuard also registers `guard_get_journey`, `guard_explain_block`, and `guard_set_budget` as WebMCP tools through that same pipeline. An approval gate leaves `execute()` pending until a human selects Allow or Deny; that in-page human checkpoint is not possible in classic server-side MCP.

When the browser does not provide WebMCP, the SDK installs a compatible in-page shim. The demo therefore runs in a normal browser while using the same guarded path as a native client.

## Native WebMCP

AgentGuard binds directly to `document.modelContext` when the browser provides it and mirrors that context on `navigator.modelContext` for older clients. Registration options, annotations, and execution cancellation signals pass through to the native API. If WebMCP appears shortly after page load, AgentGuard adopts it once and migrates every already-guarded tool without dropping the sealed policy state.

The shim is only a demo fallback. The interface always shows the active mode:

- Open the deployed URL in ChatGPT's in-app browser. The badge must read **WebMCP: Native**. Ask the agent to add a wireless mouse and check out.
- In Chrome, enable `chrome://flags/#enable-webmcp-testing`, reload the page, and confirm the badge reads **Native**.
- Use the open-source [Model Context Tool Inspector](https://github.com/beaufortfrancois/model-context-tool-inspector) to list and execute the page tools manually.

## Merchant quick start

```html
<script src="/agentguard.js"></script>
<script>
  await AgentGuard.init({
    appName: "My Store",
    budget: { limit: 300, currency: "RM" },
    defaultMode: "allow",
    defaultMaxPerMinute: 30,
    tools: {
      add_to_cart: { maxAmount: 200, maxQty: 5 },
      checkout: { mode: "approve", chargesBudget: true },
      delete_account: { mode: "deny" },
    },
  });
  await document.modelContext.registerTool(myTool);
  AgentGuard.seal();
</script>
```

A tool can add `guard: { getCost(inputs), getQty(inputs) }`. AgentGuard removes this extension before native registration and uses it to enforce amount, quantity, and budget rules.

## Run locally

```bash
npm install && npm run dev
```

Open `http://localhost:3000`. Test native WebMCP in ChatGPT's in-app browser or in Chrome with `chrome://flags/#enable-webmcp-testing` enabled.

## Project structure

- `public/agentguard.js` — dependency-free SDK, WebMCP patch, guard pipeline, shim, approval modal, and public API.
- `src/app/layout.tsx` — metadata, fonts, global styles, and early SDK loading.
- `src/app/page.tsx` — split-screen application and one-time tool registration.
- `src/app/globals.css` — product tokens, responsive layout, interaction states, and reduced-motion rules.
- `src/lib/catalog.ts` — typed Kedai Tech product catalog.
- `src/lib/store.tsx` — React store, reducer, persistence, and imperative tool facade.
- `src/lib/tools.ts` — merchant policy and ten WebMCP store tools.
- `src/lib/use-agentguard.ts` — React bridge for SDK events.
- `src/lib/demo-agent.ts` — deterministic nine-step test agent.
- `src/components/store/` — storefront, cart, address, and orders interface.
- `src/components/guard/` — spend, approvals, timeline, alerts, policies, and export interface.

## Built with

This project is an entry for the OpenAI WebMCP Challenge. OpenAI Codex helped build the implementation from a detailed product and security specification. The code then passed adversarial security review and carries regression tests for every confirmed finding. The demo targets ChatGPT's in-app browser, which supports WebMCP natively.

## Roadmap

- Multi-model evaluation runs.
- Anomaly detection on journeys.
- Hosted policy dashboard.

## License

MIT. See [LICENSE](LICENSE).

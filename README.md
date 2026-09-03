# PageControl

The trust layer for the agent-native web. One script. Policies, approvals, and a flight recorder for every WebMCP tool call.

## Why PageControl exists

AI agents can act inside a web page through WebMCP. A page registers JavaScript tools, and an agent can search, edit, buy, or delete through those tools.

These calls run inside the page. They do not cross the network, so a firewall, API gateway, payment rail, or browser extension cannot reliably inspect them.

The page is the only control point that sees the tool definition, arguments, result, and user state together. PageControl puts the policy layer there.

## The design problem

Blocking an agent is easy. Blocking it without making it useless is the hard part.

A guard that only says no turns the agent into a dead end. PageControl answers every blocked call with a plain sentence: which rule stopped it, and what the limit is. The agent reads that, adapts, and retries inside the rule. Refused fifty cables, it asks for five.

The guard also registers its own WebMCP tools. The agent can ask why it was blocked, read its own record, and request a budget change that a human must approve. The result is a boundary the agent can work inside, not a wall it keeps hitting.

## The demo

The app is one shared workspace. Northline Tech, a US technology store, sits on the left. The PageControl panel sits on the right. A human and an agent change the same cart and address.

The included test harness covers a deterministic ten-step run. The agent lists products, adds a safe quantity, hits quantity and amount caps, receives an instruction-like seller reply, asks why a call was blocked, and reaches two human approval gates. It then reads its own journey record before a third-party widget attempts to replace checkout and add an unreviewed tool.

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

PageControl patches `document.modelContext.registerTool` before application code runs and mirrors the same context on `navigator.modelContext` for older clients. Every registered `execute()` function is replaced with a guarded pipeline for validation, policy resolution, rate limits, caps, budgets, approvals, execution timeouts, redaction, output scanning, and journey hashing. PageControl also registers `pagecontrol_get_journey`, `pagecontrol_explain_block`, and `pagecontrol_set_budget` as WebMCP tools through that same pipeline. An approval gate leaves `execute()` pending until a human selects Allow or Deny; that in-page human checkpoint is not possible in classic server-side MCP.

The SDK also audits the browser's native tool list through `document.modelContext.getTools()` and the `toolchange` event. The panel compares that list with PageControl's own registry and warns when a tool exists that PageControl did not wrap, including a tool registered before the SDK loaded.

When the browser does not provide WebMCP, the SDK installs a compatible in-page shim. The demo therefore runs in a normal browser while using the same guarded path as a native client.

## Native WebMCP

PageControl binds directly to `document.modelContext` when the browser provides it and mirrors that context on `navigator.modelContext` for older clients. Registration options, annotations, and execution cancellation signals pass through to the native API. If WebMCP appears shortly after page load, PageControl adopts it once and migrates every already-guarded tool without dropping the sealed policy state.

The shim is only a demo fallback. The interface always shows the active mode:

- Open the deployed URL in ChatGPT's in-app browser. The badge must read **WebMCP: Native**. Ask the agent to add a wireless mouse and check out.
- In Chrome, enable `chrome://flags/#enable-webmcp-testing`, reload the page, and confirm the badge reads **Native**.
- Use the open-source [Model Context Tool Inspector](https://github.com/beaufortfrancois/model-context-tool-inspector) to list and execute the page tools manually.

## How we attacked it

A guard that nobody attacked is a guess. Two adversarial review rounds tried to break PageControl and confirmed sixteen defects. All are fixed. Every security defect carries a regression test in `scripts/pagecontrol-smoke.mjs`.

These four attacks worked, and matter most:

**1. The budget race.** Two `checkout` calls fired together both passed one remaining budget. The check read the spent total before the awaited execution added to it. Two calls of $200 each cleared a $300 limit. Fix: the cost is now reserved synchronously at check time, then refunded on deny, pause, timeout, or error.

**2. The kill switch gap.** `pause()` set the paused flag but never settled approvals already waiting for a human. Granting one of those approvals still ran the tool, with the kill switch on. Fix: `pause()` denies every pending approval, and the pipeline re-checks the flag after an approval resolves.

**3. The guard that failed open.** Any script could define `document.modelContext = {}` before the SDK loaded. The wrapper threw, `window.PageControl` never existed, and the page ran with no guard at all — silently. This is the worst failure mode for a security product. Fix: load-time wrapping falls back to the shim, so the guard always comes up.

**4. The split tool surface.** If one tool failed while migrating to a late-arriving native WebMCP, half the tools moved and half stayed. The two globals then pointed at different contexts, permanently, with no retry. Fix: migration tolerates per-tool failures, keeps both globals identical, and retries after a total failure.

The remaining twelve were smaller: a tool that stayed callable after `unregisterTool`, policy fields that were accepted without validation, a leaked interval, alert rows keyed by array index, and a badge that claimed a mode before the SDK had connected.

## What happens when things fail

Failure behavior is a security decision. A guard that fails quietly is worse than no guard, because it creates false confidence. PageControl never fails open.

| Situation | Behavior |
| --- | --- |
| The browser has no WebMCP | The SDK installs its own shim and still guards every call. The badge reads Shim. |
| A page defines a broken or hostile `modelContext` | The SDK falls back to the shim and comes up guarded. It never leaves the page unprotected. |
| Native WebMCP arrives after page load | The SDK adopts it, migrates every guarded tool, and keeps the sealed policy state. |
| A migration fails part way | Both globals stay on one context, an alert fires, and the SDK retries. |
| A tool throws or times out | The call is recorded as an error and any budget reservation is refunded. |
| An agent cancels a call | The pending approval settles, the budget is refunded, and the record shows the abort. |
| A human ignores an approval | It denies itself after 60 seconds. Silence is never consent. |
| A call is blocked | The agent receives a plain sentence explaining why, so it can correct itself and retry. |

## Payments

Checkout charges a real Stripe card in test mode. The agent triggers the charge and never sees the card.

The three things a shopper delegates — how much the agent may spend, which card it charges, and where the order ships — sit together under **Agent authority** in the PageControl panel. Budget is authority, and so are the other two.

The shopper saves a card on Stripe's own hosted setup page. Card details never reach this origin at all, so the browser never loads Stripe.js and no publishable key is needed. Stripe returns a `pm_...` handle that stays on the server behind an httpOnly cookie. There is deliberately no tool for adding, reading, or changing a card.

The `checkout` tool still takes zero arguments. What it does now:

1. The cart is priced **on the server**, from the server's own catalog. Client-supplied prices are ignored. The result is a single-use quote that expires in five minutes.
2. The guard's `getCost` hook pins that quote and returns its total. That total is the number on the approval card.
3. A human approves.
4. `execute()` re-checks the live cart against the pinned quote. If anything moved during the approval window, the charge is refused and nothing is billed. Otherwise the server charges the quote's own amount off-session.

Step 4 is the point. Cost is derived at check time but execution happens later, so without that binding a cart mutated inside the approval window charges an amount nobody approved — a $29.99 approval settling a $4,009.99 cart, with the journey recording `approved`. `scripts/pagecontrol-smoke.mjs` covers both the refusal and the matching-amount case.

Failure messages the agent can see are a fixed set of strings. Stripe's own error text is logged server-side and never returned, because PageControl passes a tool's error straight into model context.

### Setup

```bash
cp .env.example .env.local     # add your Stripe test keys
npm run dev
```

Keys come from the [Stripe test dashboard](https://dashboard.stripe.com/test/apikeys). Test card `4242 4242 4242 4242`, any future expiry, any CVC. Use `4000 0000 0000 0341` for a decline and `4000 0025 0000 3155` for a card that demands authentication. Without keys the storefront still runs and the payment panel says so.

The session store is in-memory, so saved cards reset when the dev server restarts.

## Merchant quick start

```html
<script src="/pagecontrol.js"></script>
<script>
  await PageControl.init({
    appName: "My Store",
    budget: { limit: 300, currency: "USD" },
    defaultMode: "allow",
    defaultMaxPerMinute: 30,
    tools: {
      add_to_cart: { maxAmount: 200, maxQty: 5 },
      checkout: { mode: "approve", chargesBudget: true },
      delete_account: { mode: "deny" },
    },
  });
  await document.modelContext.registerTool(myTool);
  PageControl.seal();
</script>
```

A tool can add `guard: { getCost(inputs), getQty(inputs) }`. PageControl removes this extension before native registration and uses it to enforce amount, quantity, and budget rules.

## Merchant dashboard preview

Open `/dashboard` to see the merchant integration flow. The preview includes a demo sign-in, publishable and secret keys, reveal and two-step rotation controls, and a copyable installation snippet. Preview keys are encrypted into an httpOnly session cookie, reset when the merchant signs out, and do not authorize production traffic.

Set `PAGECONTROL_DASHBOARD_USERNAME`, `PAGECONTROL_DASHBOARD_PASSWORD`, and `PAGECONTROL_DASHBOARD_SESSION_SECRET` for a stable deployed preview. Local development defaults to `merchant` / `pagecontrol-demo`.

## Optional signing service

The SDK itself remains dependency-free and makes no PageControl network requests. The separate [`service/`](service/) package is an optional server-to-server trust layer: it keeps an Ed25519 private key away from the merchant page, publishes the public verification key, and issues short-lived signed grants. See [`service/README.md`](service/README.md) for its routes, environment variables, and Railway deployment steps.

The service is not yet connected to the demo checkout path. Its presence does not make an in-page prompt unforgeable; that still requires a browser-owned or cross-origin approval surface.

## Run locally

```bash
npm install && npm run dev
```

Open `http://localhost:3000`. Test native WebMCP in ChatGPT's in-app browser or in Chrome with `chrome://flags/#enable-webmcp-testing` enabled.

## Project structure

- `public/pagecontrol.js` — dependency-free SDK, WebMCP patch, guard pipeline, shim, approval modal, and public API.
- `src/app/layout.tsx` — metadata, fonts, global styles, and early SDK loading.
- `src/app/page.tsx` — split-screen application and one-time tool registration.
- `src/app/globals.css` — product tokens, responsive layout, interaction states, and reduced-motion rules.
- `src/lib/catalog.ts` — typed Northline Tech product catalog.
- `src/lib/store.tsx` — React store, reducer, persistence, and imperative tool facade.
- `src/lib/tools.ts` — merchant policy and eleven WebMCP store tools.
- `src/lib/payments-client.ts` — quote cache, the synchronous pin the guard reads, and the charge call.
- `src/lib/server/` — Stripe client, cookie session holding the card handle, and server-side quote pricing.
- `src/app/api/` — payment routes plus the authenticated dashboard preview API.
- `src/app/dashboard/` — merchant sign-in and session-scoped API key preview.
- `service/` — standalone Ed25519 signing service for Railway or another Node host.
- `src/lib/use-pagecontrol.ts` — React bridge for SDK events.
- `src/lib/demo-agent.ts` — deterministic ten-step security demo.
- `src/components/store/` — storefront, cart, and orders interface.
- `src/components/guard/` — agent authority (budget, card, address), approvals, alerts, timeline, policies, and export interface.

## Built with

This project is an entry for the OpenAI WebMCP Challenge. OpenAI Codex helped build the implementation from a detailed product and security specification. The code then passed adversarial security review and carries regression tests for every confirmed finding. The demo targets ChatGPT's in-app browser, which supports WebMCP natively.

## Roadmap

- Multi-model evaluation runs.
- Anomaly detection on journeys.
- Persistent organizations, production API keys, and a hosted policy dashboard.

## License

MIT. See [LICENSE](LICENSE).

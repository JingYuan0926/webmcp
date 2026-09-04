# PageCTRL

Control what agents do next. The in-page trust and security layer for WebMCP, protecting both merchants and users.

## Why PageCTRL exists

AI agents can act inside a web page through WebMCP. A page registers JavaScript tools, and an agent can search, edit, buy, or delete through those tools.

These calls run inside the page. They do not cross the network, so a firewall, API gateway, payment rail, or browser extension cannot reliably inspect them.

The page is the only control point that sees the tool definition, arguments, result, and user state together. PageCTRL puts the policy layer there.

## Why this matters

> **[77% of people shop with AI](https://explodingtopics.com/blog/ai-commerce-survey), while [75% are uneasy letting an agent pay on its own](https://chainstoreage.com/survey-majority-consumers-dont-trust-ai-make-purchases-them).** Agents browse, then trust breaks at the last step. PageCTRL closes that gap.

The demand is moving quickly. Adobe reported **[1,324% growth in AI-referred traffic to US retail sites since October 2024](https://www.digitalcommerce360.com/2026/06/17/adobe-ai-referred-traffic-to-retail-sites-doubles-in-a-year/)**, while Visa reported a **[4,700% surge in AI-driven US retail traffic](https://investor.visa.com/news/news-details/2025/Visa-Introduces-Trusted-Agent-Protocol-An-Ecosystem-Led-Framework-for-AI-Commerce/default.aspx)**. Adobe also found that AI-referred visitors **[converted 42% better after converting 38% worse one year earlier](https://business.adobe.com/blog/ai-traffic-surge-retail-sites-not-machine-readable)**.

The requested safeguards map directly to PageCTRL. **[73.9% expect a strong safeguard on every agent transaction](https://www.barchart.com/story/news/1534384/riskified-study-finds-consumers-arent-ready-to-hand-over-control-as-ai-transforms-shopping-with-over-half-afraid-of-online-fraud)**. **[Six in ten would cap agent spending at $50 or less, and 31% would allow no autonomous spending](https://product.ai/research/trust-in-ai-commerce-report/)**. That is an approval gate, a session budget, and per-action caps—not a guess about what users want.

The risk exists at the tool layer. One study found **[43% of tested MCP servers open to command injection](https://equixly.com/blog/2025/03/29/mcp-server-new-security-nightmare/)**. The adjacent market has already produced a **[$634.5 million acquisition of Protect AI](https://www.sec.gov/Archives/edgar/data/1327567/000132756725000027/panw-20250731.htm)**, and Gartner forecasts **[$4.8 billion in spending on securing AI in 2027](https://www.gartner.com/en/newsroom/press-releases/2026-08-26-gartner-forecasts-the-market-for-securing-ai-will-reach-almost-5-billion-in-2027)**. PageCTRL applies that security pattern to the in-page WebMCP layer external gateways cannot reliably observe.

<details>
<summary>More sourced market signals</summary>

| Signal | What it shows |
| --- | --- |
| **[393% year-over-year growth](https://www.retailgentic.com/p/breakingadobe-releases-q1-ai-traffic)** | AI retail traffic growth in Q1 2026. |
| **[57.5% of HTML requests](https://www.tomshardware.com/tech-industry/artificial-intelligence/bots-have-now-passed-human-traffic-online-cloudflare-boss-laments-says-agentic-traffic-wasnt-expected-to-eclipse-real-people-until-next-year)** | Bot traffic measured across Cloudflare's network in June 2026. |
| **[85% reported a better shopping experience](https://investor.visa.com/news/news-details/2025/Visa-Introduces-Trusted-Agent-Protocol-An-Ecosystem-Led-Framework-for-AI-Commerce/default.aspx)** | Experience reported by people who used AI shopping. |
| **[About 50% remain cautious](https://www.bain.com/about/media-center/press-releases/20252/agentic-ai-poised-to-disrupt-retail-even-with-50-of-consumers-cautious-of-fully-autonomous-purchasesbain--company/)** | Caution toward fully autonomous purchasing. |
| **[30–82% of public MCP servers had exploitable flaws; only 8.5% used OAuth](https://www.practical-devsecops.com/mcp-security-statistics-2026-report/)** | The range reported across MCP security scans. |
| **[Snyk acquired Invariant Labs less than 12 months after its founding](https://siliconangle.com/2025/06/24/snyk-acquires-invariant-labs-expand-ai-agent-security-capabilities/)** | Speed of consolidation in agent security. |
| **[Obot AI raised a $35 million seed](https://www.prnewswire.com/news-releases/obot-ai-secures-35m-seed-to-build-enterprise-mcp-gateway-302563687.html)** | Funding for an MCP gateway. |
| **[Runlayer launched with $11 million and signed eight unicorns in four months](https://techcrunch.com/2025/11/17/mcp-ai-agent-security-startup-runlayer-launches-with-8-unicorns-11m-from-khoslas-keith-rabois-and-felicis)** | Early enterprise demand for MCP security. |
| **[Zenity raised $125 million](https://www.securityweek.com/zenity-raises-125-million-in-series-c-funding/)** | Continued agent-security funding in August 2026. |
| **[Securing AI reaches $7.7 billion by 2028](https://www.gartner.com/en/newsroom/press-releases/2026-08-26-gartner-forecasts-the-market-for-securing-ai-will-reach-almost-5-billion-in-2027)** | Gartner's longer-term market forecast. |
| **[25% of enterprise breaches traced to AI-agent abuse by 2028](https://www.globalsecuritymag.com/gartner-by-2028-a-quarter-of-enterprise-breaches-will-be-traced-back-to-ai-hgs.html)** | Gartner's forecast of agent-related exposure. |
| **[Visa launched with 12 partners](https://investor.visa.com/news/news-details/2025/Visa-Introduces-Trusted-Agent-Protocol-An-Ecosystem-Led-Framework-for-AI-Commerce/default.aspx)** | Payment networks are adding agent controls. |
| **[Mastercard launched with more than 30 partners](https://investor.mastercard.com/investor-news/investor-news-details/2026/Mastercard-Launches-Agent-Pay-for-Machines-to-Unlock-Super-Fast-Always-On-Payments/default.aspx)** | Breadth of the Agent Pay launch. |
| **[Stripe announced Instant Checkout for more than one million Shopify merchants](https://stripe.com/newsroom/news/stripe-openai-instant-checkout)** | Distribution scale for agent payments. |
| **[Coinbase x402 passed 100 million agent transactions on Base](https://www.chainalysis.com/blog/x402-agentic-payments-adoption/)** | Agent-payment activity reported by Q1 2026. |
| **[Twilio acquired Segment for $3.2 billion](https://www.twilio.com/en-us/press/releases/twilio-completes-acquisition-segment-market-leading-customer-data-platform)** | The infrastructure precedent for one embedded script. |

</details>

## The design problem

Blocking an agent is easy. Blocking it without making it useless is the hard part.

A guard that only says no turns the agent into a dead end. PageCTRL answers every blocked call with a plain sentence: which rule stopped it, and what the limit is. The agent reads that, adapts, and retries inside the rule. Refused fifty cables, it asks for five.

The guard also registers its own WebMCP tools. The agent can ask why it was blocked, read its own record, and request a budget change that a human must approve. The result is a boundary the agent can work inside, not a wall it keeps hitting.

## The demo

The app is one shared workspace. Northline Tech, a US technology store, sits on the left. The PageCTRL panel sits on the right. A human and an agent change the same cart and address.

The included test harness covers a deterministic ten-step run. The agent lists products, adds a safe quantity, hits quantity and amount caps, receives an instruction-like seller reply, asks why a call was blocked, and reaches two human approval gates. It then reads its own journey record before a third-party widget attempts to replace checkout and add an unreviewed tool.

The control panel updates as the run moves. It shows spend, pending approvals, verdicts, alerts, policy floors, stricter user rules, and hash links. Select **Pause agent** at any time to activate the kill switch.

## The three pages

| Page | Who it is for | What it answers |
| --- | --- | --- |
| `/` — storefront | A shopper and their agent | What is my agent doing, and do I approve? |
| `/docs` — SDK reference | A developer evaluating PageCTRL | How do I install this, and what does it protect? |
| `/dashboard` — merchant console | A merchant running a shop | Where do the keys go, and how does signing connect? |

**The storefront** is Northline Tech, a working shop with Stripe test-mode payments. The store and PageCTRL panel share one page, cart, address, and checkout. The panel shows agent authority, pending approvals, the live journey, tool coverage, and two-tier policies.

**The docs page** covers installation, the guarded execution model, client API, events, credentials, and the protection boundary. PageCTRL is an SDK, not only a storefront demo.

**The dashboard** is the merchant setup preview. It shows which credential belongs in which service, links to the signing API and public verification key, and demonstrates the planned key-rotation flow. It deliberately does not edit policy.

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

## What each side gets

### For the person

| Capability | Benefit |
| --- | --- |
| Spending boundary | The agent cannot pass the session budget or a per-action cap. |
| Decision point | Checkout and address changes stop and wait for a human click. |
| Save a card once | The agent can shop and pay inside limits without receiving card details. |
| Kill switch | One control stops every new call and settles pending approvals. |
| Evidence | A redacted, hash-chained record shows what the agent did. |
| Protection from tricks | Instruction-like tool output is flagged instead of silently trusted. |

### For the merchant

| Capability | Benefit |
| --- | --- |
| Operational limits | Rate, quantity, amount, and budget rules contain runaway agents. |
| Sealed tool surface | A third-party script cannot silently replace a reviewed tool. |
| Validated inputs | Malformed arguments stop before merchant code runs. |
| Dispute evidence | A tamper-evident journey replaces unsupported claims about what an agent did. |
| Agent analytics | Tool demand, failure points, and policy pressure become visible. |
| Guarded checkout | A signed grant binds approval to the exact origin, session, quote, and amount. |

### Why policy lives in code

A spending cap that can be switched off casually from a web login is not much of a cap. Merchant policy stays in source, so changing the floor requires a reviewable commit. The dashboard manages integration and keys—the same separation Stripe uses. Dashboard-managed policy with a signed audit trail remains a roadmap item.

## How this uses WebMCP

PageCTRL patches `document.modelContext.registerTool` before application code runs and mirrors the same context on `navigator.modelContext` for older clients. Every registered `execute()` function is replaced with a guarded pipeline for validation, policy resolution, rate limits, caps, budgets, approvals, execution timeouts, redaction, output scanning, and journey hashing. PageCTRL also registers `pagecontrol_get_journey`, `pagecontrol_explain_block`, and `pagecontrol_set_budget` as WebMCP tools through that same pipeline. An approval gate leaves `execute()` pending until a human selects Allow or Deny; that in-page human checkpoint is not possible in classic server-side MCP.

The SDK also audits the browser's native tool list through `document.modelContext.getTools()` and the `toolchange` event. The panel compares that list with PageCTRL's own registry and warns when a tool exists that PageCTRL did not wrap, including a tool registered before the SDK loaded.

After `seal()`, the public `approve`, `deny`, and `setBudget` methods refuse—even if a script cached them earlier. Approval events expose only opaque display handles. The built-in dialog and panel settle requests through browser-trusted user actions, so a page script cannot approve its own call with a synthetic click.

When the browser does not provide WebMCP, the SDK installs a compatible in-page shim. The demo therefore runs in a normal browser while using the same guarded path as a native client.

## Native WebMCP

PageCTRL binds directly to `document.modelContext` when the browser provides it and mirrors that context on `navigator.modelContext` for older clients. Registration options, annotations, and execution cancellation signals pass through to the native API. If WebMCP appears shortly after page load, PageCTRL adopts it once and migrates every already-guarded tool without dropping the sealed policy state.

The shim is only a demo fallback. The interface always shows the active mode:

- Open the deployed URL in ChatGPT's in-app browser. The badge must read **WebMCP: Native**. Ask the agent to add a wireless mouse and check out.
- In Chrome, enable `chrome://flags/#enable-webmcp-testing`, reload the page, and confirm the badge reads **Native**.
- Use the open-source [Model Context Tool Inspector](https://github.com/beaufortfrancois/model-context-tool-inspector) to list and execute the page tools manually.

## What happens when things fail

Failure behavior is a security decision. A guard that fails quietly is worse than no guard, because it creates false confidence. PageCTRL never fails open.

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

## Honest limits

- **WebMCP adoption is early.** The [July 2026 State of WebMCP survey](https://www.spronta.com/blog/state-of-webmcp-july-2026/) found almost no production deployment. PageCTRL is a bet on where the browser platform is going.
- **PageCTRL does not stop scraping, crawling, or DDoS.** Those are network-layer problems. Edge protection and PageCTRL stack together; they do not replace one another.
- **PageCTRL cannot protect a user from a malicious merchant.** The merchant owns its Stripe account and backend and can charge outside PageCTRL. Nothing running inside the merchant's page can remove that authority.
- **An in-page prompt can be imitated.** Independent proof that the genuine guard is present requires a browser-owned surface or companion extension.

## Payments

Checkout charges a real Stripe card in test mode. The agent triggers the charge and never sees the card.

The three things a shopper delegates — how much the agent may spend, which card it charges, and where the order ships — sit together under **Agent authority** in the PageCTRL panel. Budget is authority, and so are the other two.

The shopper saves a card on Stripe's own hosted setup page. Card details never reach this origin at all, so the browser never loads Stripe.js and no publishable key is needed. Stripe returns a `pm_...` handle that stays on the server behind an httpOnly cookie. There is deliberately no tool for adding, reading, or changing a card.

The `checkout` tool still takes zero arguments. What it does now:

1. The cart is priced **on the server**, from the server's own catalog. Client-supplied prices are ignored. The result is a single-use quote that expires in five minutes.
2. The guard's `getCost` hook pins that quote to one PageCTRL call and returns its total. That total is the number on the approval card.
3. A human approves.
4. `execute()` re-checks the live cart and displayed amount against that call's pinned quote.
5. The shop server asks `https://api.pagecontrol.app` for a 60-second Ed25519 grant. The browser never receives the service credential.
6. The charge route verifies the signature, origin, session, quote, exact minor-unit amount, expiry, and one-time nonce. It also reserves the amount against an independent server-side $300 session budget before Stripe runs.

The call binding is the point. Cost is derived at check time but execution happens later, so without that binding a second checkout can overwrite the first quote while its approval remains open. `scripts/pagecontrol-smoke.mjs` covers cart mutation, matching amounts, and two overlapping approvals with different totals.

Failure messages the agent can see are a fixed set of strings. Stripe's own error text is logged server-side and never returned, because PageCTRL passes a tool's error straight into model context.

### Setup

```bash
cp .env.example .env.local     # add your Stripe test keys
npm run dev
```

Keys come from the [Stripe test dashboard](https://dashboard.stripe.com/test/apikeys). Test card `4242 4242 4242 4242`, any future expiry, any CVC. Use `4000 0000 0000 0341` for a decline and `4000 0025 0000 3155` for a card that demands authentication. Without keys the storefront still runs and the payment panel says so.

The shopping session is carried in a signed, seven-day HTTP-only cookie. It survives serverless instance changes without exposing the Stripe payment-method handle to JavaScript.

## Merchant quick start

Load PageCTRL before application code registers a tool:

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
</script>
```

Registering through the browser's native API is still guarded because PageCTRL patches `registerTool` before application code runs:

```js
await document.modelContext.registerTool({
  name: "search_products",
  description: "Search the product catalog",
  inputSchema: {
    type: "object",
    properties: { query: { type: "string", minLength: 1 } },
    required: ["query"],
  },
  execute: async (input) => JSON.stringify(storeApi.search(input.query)),
});
```

A tool registered through PageCTRL can add guard metadata. The quantity hook returns the cart's resulting quantity, so repeated small calls cannot walk past the cap:

```js
await PageControl.registerTool({
  name: "add_to_cart",
  label: "Add to cart",
  description: "Add a positive integer quantity of one product to the cart.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", minLength: 1 },
      qty: { type: "integer", minimum: 1 },
    },
    required: ["id", "qty"],
  },
  guard: {
    getCost: (input) => {
      const product = storeApi.get(input.id);
      return product ? product.price * input.qty : Number.NaN;
    },
    getQty: (input) => {
      const product = storeApi.get(input.id);
      if (!product) return Number.NaN;
      const current = storeApi.cart().items
        .find((line) => line.product.id === product.id)?.qty ?? 0;
      return current + input.qty;
    },
  },
  execute: async (input) =>
    JSON.stringify(storeApi.addToCart(input.id, input.qty)),
});

PageControl.seal();
```

PageCTRL removes the `guard` extension before native registration and uses it for amount, quantity, and budget enforcement. It also registers three meta-tools through the same pipeline:

| Tool | What the agent uses it for |
| --- | --- |
| `pagecontrol_explain_block` | Ask why the last call was refused. |
| `pagecontrol_get_journey` | Read its own record of what it did. |
| `pagecontrol_set_budget` | Lower the budget, or request human approval to raise it. |

## Merchant dashboard preview

Open `/dashboard` to see the merchant integration flow. The preview includes a demo sign-in, publishable and secret keys, reveal and two-step rotation controls, a copyable installation snippet, and a production setup map showing which variables belong in Vercel and Render. Preview keys are encrypted into an httpOnly session cookie, reset when the merchant signs out, and do not authorize production traffic.

Set `PAGECONTROL_DASHBOARD_USERNAME`, `PAGECONTROL_DASHBOARD_PASSWORD`, and `PAGECONTROL_DASHBOARD_SESSION_SECRET` for a stable deployed preview. The demo defaults to `q` / `q`.

For signed checkout, put `PAGECONTROL_API_URL` and `PAGECONTROL_SERVICE_TOKEN` in the merchant app. Put the same service-token value with `PAGECONTROL_PRIVATE_KEY` and `PAGECONTROL_ALLOWED_ORIGINS` in the separate Render signing service. See the [live SDK credential guide](https://webmcp-nine.vercel.app/docs#credentials), [Vercel environment guide](https://vercel.com/docs/environment-variables/managing-environment-variables), and [Render environment guide](https://render.com/docs/configure-environment-variables).

No public-key environment variable is required. Render derives the Ed25519 public key from its private key and publishes the [PageCTRL public JWK](https://api.pagecontrol.app/.well-known/pagecontrol-key.json); the merchant server downloads it automatically when verifying a grant. The dashboard's `pk_demo_…` value is only a preview of future site-key management and is not this verification key.

## Signing service

The SDK itself remains dependency-free and sends no telemetry. The separate [`service/`](service/) package is the server-to-server trust layer for checkout: it keeps an Ed25519 private key away from the merchant page, publishes the public verification key, and issues short-lived signed grants. See [`service/README.md`](service/README.md) for its routes and deployment configuration.

The signing key runs on a separate origin the merchant deployment does not control. Putting that private key inside the merchant's own deployment would defeat the purpose of the separate trust boundary.

Production service tokens can be scoped to exact merchant origins with `PAGECONTROL_ALLOWED_ORIGINS`, so a leaked token cannot issue grants outside its configured origin allowlist.

This prevents a page script from calling the charge route with only a quote id. It does not stop a malicious merchant: the merchant owns its Stripe account and backend and could charge outside PageCTRL entirely. An in-page prompt also remains visually forgeable until a browser-owned or cross-origin approval surface exists.

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
- `src/lib/store.tsx` — React store, session-only cart, receipt persistence, and imperative tool facade.
- `public/northline-webmcp.js` — pre-hydration catalog-tool bootstrap for the first agent request.
- `src/lib/tools.ts` — merchant policy and eleven WebMCP store tools.
- `src/lib/payments-client.ts` — quote cache, the synchronous pin the guard reads, and the charge call.
- `src/lib/server/` — Stripe client, signed-grant verification, server spend ledger, cookie session, and quote pricing.
- `src/app/api/` — payment routes plus the authenticated dashboard preview API.
- `src/app/dashboard/` — merchant sign-in and session-scoped API key preview.
- `service/` — standalone Ed25519 signing service deployed on Render.
- `src/lib/use-pagecontrol.ts` — React bridge for SDK events.
- `src/lib/demo-agent.ts` — deterministic ten-step security demo.
- `src/components/store/` — storefront, cart, and orders interface.
- `src/components/guard/` — agent authority (budget, card, address), approvals, alerts, timeline, policies, and export interface.

## Devpost description

### Why this use case is a strong fit for WebMCP

WebMCP tools execute as JavaScript inside the page. Registration and dispatch can happen without crossing a network boundary, so an API gateway, payment rail, or edge firewall cannot reliably see the definition, arguments, and result. A policy layer for those calls belongs where they execute.

PageCTRL also uses WebMCP as its own interface, not only as its target. It patches `document.modelContext.registerTool`, audits the browser's real tool list through `getTools()` and the `toolchange` event, and registers three tools of its own. The agent can ask why it was blocked, read its own record, and request a budget change that a human must approve.

WebMCP makes the shared human checkpoint possible. The approval gate leaves the agent's `execute()` pending while the person reviews the action on the same page. The agent does not lose its task, and the person does not have to move to a separate administrative system.

### How it creates a better user experience

Agents are useful for browsing, but people hesitate exactly where delegation becomes valuable: payment and other consequential actions.

PageCTRL closes that gap. The shopper saves a card through Stripe's hosted page. The agent can then shop inside a session budget, per-action amount cap, and per-product quantity cap. It stops for approval only on actions that matter, such as checkout or changing the delivery address. Card details are never exposed as a tool argument or result.

Blocked calls are not dead ends. The agent receives a plain sentence naming the rule and limit, so it can adapt and retry. If fifty items are refused, it can ask for five. It can also call the guard's own explanation tool, and the answer appears in the shared journey.

Merchant rules form the locked floor. A user may make them stricter but cannot weaken them. One layer therefore protects both sides without giving either side a hidden bypass.

### What people and agents can do together that was difficult before

A person and an agent share one live page—the same cart, delivery address, and checkout—while a policy engine watches and records every WebMCP action.

The approval gate suspends a tool call mid-flight until the person decides. That creates direct supervision inside the task instead of asking the person to trust an autonomous run after the fact.

The demo includes a third-party widget that tries to replace the checkout tool and add an unreviewed tool. PageCTRL refuses the replacement and raises an alert. A layer outside the page would not reliably observe a tool-definition change that never crossed its boundary.

The agent can read its own flight record and reason about its limits. The guard participates in the workflow instead of acting as a silent wall.

### How we implemented WebMCP

`public/pagecontrol.js` is a dependency-free browser script loaded before application tool registration. It patches `document.modelContext.registerTool` and mirrors the active context on `navigator.modelContext`. Every registered `execute()` is replaced by a guarded pipeline: schema validation, two-tier policy resolution, rate limits, cumulative quantity and amount caps, an atomically reserved session budget, human approval, execution timeout, PII redaction, injection scanning, and a SHA-256 hash-chained journey entry. If native WebMCP appears after load, the SDK adopts it and migrates the guarded surface without losing sealed state.

The SDK audits the browser's own tool list through `getTools()` and `toolchange`, then reports any definition it did not wrap. A guard that quietly misses a tool creates false confidence, so coverage is visible in the panel.

Checkout approval is enforced server-side. After a human approves, the merchant server requests a short-lived Ed25519 grant from `api.pagecontrol.app`. The charge route verifies that the grant matches the exact origin, session, quote, amount, expiry, and single-use nonce. The signing key stays in a separate service, and Stripe card details remain on Stripe's hosted page.

## Built with

This project is an entry for the OpenAI WebMCP Challenge. OpenAI Codex helped build the implementation from a detailed product and security specification. The demo targets ChatGPT's in-app browser, which supports WebMCP natively.

## Roadmap

- Multi-model evaluation runs.
- Anomaly detection on journeys.
- Persistent organizations, production API keys, and a hosted policy dashboard.

## License

MIT. See [LICENSE](LICENSE).

import type { Metadata } from "next";
import Link from "next/link";
import { ConsoleHeader } from "@/components/console/ConsoleHeader";
import { DocsSidebar } from "./DocsSidebar";

export const metadata: Metadata = {
  title: "PageControl SDK documentation",
  description: "Install and configure the in-page trust layer for WebMCP tools.",
};

const quickStart = `<script src="/pagecontrol.js"></script>
<script type="module">
  const guard = window.PageControl;

  await guard.init({
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

  // Register tools through PageControl, then lock the reviewed surface.
  await guard.registerTool(myTool);
  guard.seal();
</script>`;

const toolExample = `await PageControl.registerTool({
  name: "add_to_cart",
  label: "Add to cart",
  description: "Add one catalog item to the cart.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", minLength: 1 },
      qty: { type: "integer", minimum: 1 },
    },
    required: ["id", "qty"],
  },
  annotations: { readOnlyHint: false },
  guard: {
    getQty: ({ qty }) => qty,
    getCost: ({ id, qty }) => catalog[id].price * qty,
  },
  execute: async ({ id, qty }, { signal }) => {
    return JSON.stringify(await cart.add(id, qty, { signal }));
  },
});`;

const approvalExample = `const stop = PageControl.on("approval", ({ pending }) => {
  // Handles are display-only. They cannot settle an approval.
  renderPendingApprovals(pending);
});

// Unsubscribe when your UI unmounts.
stop();`;

const policyExample = `// Tightening a rule applies immediately.
PageControl.setUserPolicy("checkout", { mode: "deny" });

// Reducing a user-added restriction requires an explicit human confirmation.
PageControl.setUserPolicy(
  "checkout",
  { mode: "approve" },
  { humanConfirmed: true },
);`;

const sriExample = `<script
  src="https://your-cdn.example/pagecontrol/v1.0.0/pagecontrol.js"
  integrity="sha384-YOUR_RELEASE_HASH"
  crossorigin="anonymous">
</script>`;

const componentRoadmapExample = `<!-- Roadmap sketch — not available in v1.0.0. -->
<script
  src="https://your-cdn.example/pagecontrol/v1.0.0/pagecontrol.js"
  data-budget="300"
  data-currency="USD">
</script>

<page-control-panel></page-control-panel>`;

const apiRows = [
  ["init(config)", "Set the merchant policy, session budget, default mode, and rate limit."],
  ["registerTool(tool, options?)", "Register a WebMCP tool through the guarded execution pipeline."],
  ["seal()", "Lock the reviewed tool surface and flag later replacements or additions."],
  ["on(event, callback)", "Subscribe to entries, tools, budget, approvals, alerts, state, or environment."],
  ["approve(id) / deny(id)", "Setup-only helpers. Both refuse after the reviewed surface is sealed."],
  ["pause() / resume()", "Stop every agent call immediately, then restore guarded execution."],
  ["setUserPolicy(name, rule, options?)", "Change a user rule without going below the merchant policy."],
  ["setBudget(limit, options?)", "Setup-only helper. The trusted panel owns budget changes after seal."],
  ["getPolicies()", "Read merchant, user, and effective policy maps."],
  ["getJourney() / exportJourney()", "Read or download the redacted, hash-chained flight record."],
  ["getEnvironment()", "Return native WebMCP or shim mode and the active API surface."],
  ["canInterceptNativeRegistration()", "Check whether direct modelContext.registerTool calls enter PageControl on this host."],
  ["getSurface()", "Compare browser-reported WebMCP tools with the tools PageControl wrapped."],
  ["explainLast()", "Return the plain-language reason for the most recent blocked call."],
] as const;

const eventRows = [
  ["entry", "A new guarded call or system event was added to the journey."],
  ["approval", "The pending human-approval list changed."],
  ["alert", "Tampering, late registration, migration trouble, or suspicious output was detected."],
  ["tools", "The registered tool surface or a tool's tamper status changed."],
  ["budget", "Reserved or spent session budget changed."],
  ["state", "The kill switch paused or resumed execution."],
  ["environment", "PageControl entered native WebMCP or fallback shim mode."],
  ["surface", "The guarded and unguarded browser-reported tool lists changed."],
] as const;

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49v-1.9c-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.66.35-1.12.64-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.4 9.4 0 0 1 12 6.97a9.4 9.4 0 0 1 2.5.35c1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.06.36.32.68.95.68 1.91v2.74c0 .27.18.59.69.49A10.24 10.24 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z"
      />
    </svg>
  );
}

function CodeBlock({ title, children }: { title: string; children: string }) {
  return (
    <figure className="sdk-code-block">
      <figcaption>{title}</figcaption>
      <pre tabIndex={0}><code>{children}</code></pre>
    </figure>
  );
}

export default function DocsPage() {
  return (
    <div className="sdk-docs-page">
      <ConsoleHeader subtitle="SDK docs · v1.0.0">
        <Link href="/">Live demo</Link>
        <Link href="/dashboard">Dashboard</Link>
        <a href="https://github.com/JingYuan0926/webmcp" target="_blank" rel="noreferrer">
          <GitHubMark />
          <span>GitHub</span>
        </a>
      </ConsoleHeader>

      <main>
        <section className="sdk-docs-hero" aria-labelledby="sdk-docs-title">
          <div>
            <p className="sdk-docs-eyebrow">WebMCP runtime guard</p>
            <h1 id="sdk-docs-title">Put a human-controlled boundary around in-page agent tools.</h1>
            <p>
              PageControl wraps WebMCP tool execution with validation, policies, budgets, approvals,
              tamper detection, and a redacted flight recorder. It runs entirely inside the page.
            </p>
          </div>
          <aside aria-label="Integration summary">
            <span>Current package</span>
            <strong>public/pagecontrol.js</strong>
            <p>Load it before application tools register. Then initialize, register, and seal.</p>
            <a href="#quick-start">Start integrating <span aria-hidden="true">↓</span></a>
          </aside>
        </section>

        <div className="sdk-docs-layout">
          <DocsSidebar />

          <article className="sdk-docs-content">
            <section id="quick-start" className="sdk-docs-section">
              <p className="sdk-docs-kicker">01 · Install</p>
              <h2>Quick start</h2>
              <p>
                Today, PageControl ships as one dependency-free browser file. Self-host that reviewed
                file and load it before any script that registers WebMCP tools.
              </p>
              <CodeBlock title="HTML">{quickStart}</CodeBlock>
              <div className="sdk-docs-callout">
                <strong>Load order matters.</strong>
                <p>The SDK must see tool registration to wrap it. In Next.js, load the script with <code>beforeInteractive</code>.</p>
              </div>
            </section>

            <section id="execution" className="sdk-docs-section">
              <p className="sdk-docs-kicker">02 · Understand</p>
              <h2>One guarded execution path</h2>
              <p>
                When native WebMCP exists, PageControl registers wrapped tools with
                <code> document.modelContext</code>. It mirrors the active context to
                <code> navigator.modelContext</code> for older clients.
              </p>
              <ol className="sdk-step-list">
                <li><span>1</span><div><strong>Validate</strong><p>Reject malformed inputs before merchant code runs.</p></div></li>
                <li><span>2</span><div><strong>Enforce</strong><p>Resolve modes, rate limits, quantities, amounts, and reserved budget.</p></div></li>
                <li><span>3</span><div><strong>Ask</strong><p>Keep sensitive calls pending until a person allows or blocks them.</p></div></li>
                <li><span>4</span><div><strong>Record</strong><p>Redact sensitive strings and append a hash-linked journey entry.</p></div></li>
              </ol>
              <p className="sdk-docs-note">
                If native WebMCP arrives after page load, PageControl watches for 10 seconds and migrates already-guarded tools. Without native support, the same pipeline remains available through its demo shim.
              </p>
            </section>

            <section id="value" className="sdk-docs-section">
              <p className="sdk-docs-kicker">03 · Align</p>
              <h2>One guard, two beneficiaries</h2>
              <p>
                PageControl faces both directions. It gives people the confidence to delegate a task,
                while giving merchants a controlled WebMCP surface instead of unrestricted automation.
              </p>
              <div className="sdk-audience-grid">
                <article className="sdk-audience-card">
                  <span>For the person</span>
                  <h3>Keep the final say</h3>
                  <ul className="sdk-benefit-list">
                    <li><strong>Spending boundary</strong><p>The agent cannot exceed the session budget or per-action caps.</p></li>
                    <li><strong>Approval before impact</strong><p>Address changes and checkout can stop for a real decision.</p></li>
                    <li><strong>Immediate pause</strong><p>The kill switch stops new calls and denies pending approvals.</p></li>
                    <li><strong>Readable evidence</strong><p>A redacted journey shows what ran, what was blocked, and why.</p></li>
                  </ul>
                </article>
                <article className="sdk-audience-card">
                  <span>For the merchant</span>
                  <h3>Open the store without opening chaos</h3>
                  <ul className="sdk-benefit-list">
                    <li><strong>Validated inputs</strong><p>Malformed arguments stop before merchant code executes.</p></li>
                    <li><strong>Operational limits</strong><p>Rate, quantity, amount, and budget rules contain runaway agents.</p></li>
                    <li><strong>Sealed tool surface</strong><p>A third-party script cannot silently replace a reviewed tool.</p></li>
                    <li><strong>Shared accountability</strong><p>The flight recorder gives both sides the same call history.</p></li>
                  </ul>
                </article>
              </div>
              <div className="sdk-docs-callout">
                <strong>Two tiers prevent a policy tug-of-war.</strong>
                <p>The merchant sets the minimum protection. The person may make it stricter, but cannot weaken that baseline.</p>
              </div>
            </section>

            <section id="tools" className="sdk-docs-section">
              <p className="sdk-docs-kicker">04 · Register</p>
              <h2>Register a guarded tool</h2>
              <p>
                A tool uses the normal WebMCP definition. The optional <code>label</code> and
                <code> guard</code> fields stay inside PageControl and are removed before native registration.
              </p>
              <CodeBlock title="JavaScript">{toolExample}</CodeBlock>
              <div className="sdk-docs-grid">
                <div><strong>getQty(inputs)</strong><p>Returns the quantity checked against <code>maxQty</code>.</p></div>
                <div><strong>getCost(inputs)</strong><p>Returns the amount checked against caps and session budget.</p></div>
                <div><strong>annotations</strong><p>Pass through to native WebMCP unchanged.</p></div>
                <div><strong>signal</strong><p>Registration and execution cancellation propagate safely.</p></div>
              </div>
              <div className="sdk-docs-callout">
                <strong>PageControl audits the browser&apos;s real tool surface.</strong>
                <p>It calls <code>document.modelContext.getTools()</code> after setup and whenever the native <code>toolchange</code> event fires. A browser-reported tool that PageControl did not wrap is shown as unguarded.</p>
              </div>
            </section>

            <section id="policies" className="sdk-docs-section">
              <p className="sdk-docs-kicker">05 · Control</p>
              <h2>Layer merchant and user policy</h2>
              <p>
                The merchant sets the minimum protection. A user can make it stricter immediately.
                Moving back toward the merchant setting requires explicit confirmation.
              </p>
              <div className="sdk-policy-table" role="table" aria-label="Policy modes">
                <div role="row"><strong role="columnheader">Mode</strong><strong role="columnheader">Behavior</strong></div>
                <div role="row"><code role="cell">allow</code><span role="cell">Run after validation and limits pass.</span></div>
                <div role="row"><code role="cell">approve</code><span role="cell">Wait for a human decision.</span></div>
                <div role="row"><code role="cell">deny</code><span role="cell">Return a plain-language refusal.</span></div>
              </div>
              <CodeBlock title="User policy">{policyExample}</CodeBlock>
            </section>

            <section id="approvals" className="sdk-docs-section">
              <p className="sdk-docs-kicker">06 · Decide</p>
              <h2>Use the built-in human approval UI</h2>
              <p>
                PageControl renders its own keyboard-accessible approval dialog with Run once and Block
                actions. Unanswered requests deny themselves after 60 seconds. Pausing the guard denies
                every pending request.
              </p>
              <p className="sdk-docs-note">
                The dialog needs no merchant UI code. Public events contain an opaque display handle, never the internal approval id. After <code>seal()</code>, only a browser-trusted click in PageControl&apos;s controls can resolve the request.
              </p>
              <CodeBlock title="JavaScript">{approvalExample}</CodeBlock>
            </section>

            <section id="api" className="sdk-docs-section">
              <p className="sdk-docs-kicker">07 · Reference</p>
              <h2>Client API</h2>
              <div className="sdk-api-table">
                {apiRows.map(([method, description]) => (
                  <div key={method}><code>{method}</code><p>{description}</p></div>
                ))}
              </div>
            </section>

            <section id="events" className="sdk-docs-section">
              <p className="sdk-docs-kicker">08 · Observe</p>
              <h2>Events</h2>
              <p><code>PageControl.on(event, callback)</code> returns an unsubscribe function.</p>
              <div className="sdk-api-table sdk-api-table--events">
                {eventRows.map(([event, description]) => (
                  <div key={event}><code>{event}</code><p>{description}</p></div>
                ))}
              </div>
            </section>

            <section id="scope" className="sdk-docs-section">
              <p className="sdk-docs-kicker">09 · Scope</p>
              <h2>Protect the action layer, not the whole internet</h2>
              <p>
                PageControl sees structured WebMCP calls inside the page. It does not sit on the network
                path, so it cannot see ordinary crawlers, DDoS traffic, or direct server attacks.
              </p>
              <div className="sdk-boundary-table" role="table" aria-label="PageControl protection boundary">
                <div role="row"><strong role="columnheader">Risk</strong><strong role="columnheader">PageControl</strong><strong role="columnheader">Right layer</strong></div>
                <div role="row"><span role="cell">Malformed WebMCP inputs</span><b role="cell" data-state="yes">Protects</b><span role="cell">PageControl validation</span></div>
                <div role="row"><span role="cell">Runaway calls or oversized orders</span><b role="cell" data-state="yes">Protects</b><span role="cell">PageControl policies</span></div>
                <div role="row"><span role="cell">A script replacing a sealed tool</span><b role="cell" data-state="yes">Protects</b><span role="cell">PageControl tamper guard</span></div>
                <div role="row"><span role="cell">Scraping and crawling</span><b role="cell" data-state="no">Outside scope</b><span role="cell">Edge and bot controls</span></div>
                <div role="row"><span role="cell">DDoS or server exploitation</span><b role="cell" data-state="no">Outside scope</b><span role="cell">Network and application security</span></div>
                <div role="row"><span role="cell">A malicious page owner</span><b role="cell" data-state="no">Outside scope</b><span role="cell">Browser or extension verification</span></div>
              </div>
              <div className="sdk-docs-callout">
                <strong>The layers complement each other.</strong>
                <p>Edge security decides which automated traffic reaches a site. PageControl decides what an admitted agent may do through WebMCP.</p>
              </div>
            </section>

            <section id="trust" className="sdk-docs-section">
              <p className="sdk-docs-kicker">10 · Verify</p>
              <h2>Trust and privacy boundary</h2>
              <div className="sdk-docs-grid">
                <div><strong>Zero SDK network calls</strong><p>The browser SDK calls no PageControl backend and sends no telemetry.</p></div>
                <div><strong>Memory-only journey</strong><p>The record disappears with the tab unless the user exports it.</p></div>
                <div><strong>Redacted before logging</strong><p>Email addresses and long card-number-like strings are masked first.</p></div>
                <div><strong>Honest boundary</strong><p>An in-page guard cannot protect a user from the page owner itself.</p></div>
              </div>
              <h3>Production distribution</h3>
              <p>
                This repository does not claim a live PageControl CDN. For production distribution,
                publish an immutable versioned asset and provide its real Subresource Integrity hash.
                The browser then rejects any changed file, including one served by a compromised CDN.
              </p>
              <CodeBlock title="Pattern — replace every placeholder">{sriExample}</CodeBlock>
              <p className="sdk-docs-note">
                HTTPS authenticates the named origin. <a href="https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity" target="_blank" rel="noreferrer">Subresource Integrity</a> verifies the exact release bytes. Neither stops a malicious merchant from omitting the SDK or drawing a lookalike interface.
              </p>
              <h3>The approval component today</h3>
              <p>
                The SDK creates the approval dialog, styles it, traps keyboard focus, runs the countdown,
                and wires the decision. The merchant writes no approval component. Today that dialog still
                lives in the merchant page, so same-page scripts can inspect or imitate it.
              </p>
              <div className="sdk-docs-callout sdk-docs-callout--boundary">
                <strong>The remaining limit</strong>
                <p>A malicious site can omit the SDK or imitate its interface. Independent verification requires the browser or a companion extension.</p>
              </div>
            </section>

            <section id="roadmap" className="sdk-docs-section">
              <p className="sdk-docs-kicker">11 · Extend</p>
              <h2>Roadmap: move trust outside the host page</h2>
              <p>
                These are deliberate next layers, not claims about the current release. Each one reduces
                merchant integration work or moves a trust decision into a stronger browser boundary.
              </p>
              <ol className="sdk-roadmap-list">
                <li><span>1</span><div><strong>Versioned distribution</strong><p>Publish immutable releases from a PageControl origin with a real SRI hash and CORS headers.</p></div></li>
                <li><span>2</span><div><strong>Placement Web Component</strong><p>Add an <code>&lt;page-control-panel&gt;</code> custom element for layout only. The boot script must still load first so no tool registration escapes the guard.</p></div></li>
                <li><span>3</span><div><strong>Cross-origin approval frame</strong><p>Serve the sensitive decision UI from a PageControl origin. The browser same-origin policy then prevents the host page from reading its internal DOM.</p></div></li>
                <li><span>4</span><div><strong>Independent verification</strong><p>A companion extension can warn when a site claims protection without loading the genuine release.</p></div></li>
                <li><span>5</span><div><strong>Browser-owned prompt</strong><p>Long term, the browser should own the unforgeable approval surface while PageControl supplies policy decisions.</p></div></li>
              </ol>
              <CodeBlock title="Roadmap sketch — not implemented">{componentRoadmapExample}</CodeBlock>
              <h3>Architecture references</h3>
              <ul className="sdk-source-list">
                <li><a href="https://docs.stripe.com/payments/elements" target="_blank" rel="noreferrer">Stripe Web Elements</a><span>Sensitive fields are tokenized inside hosted Elements instead of touching the merchant server.</span></li>
                <li><a href="https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy" target="_blank" rel="noreferrer">MDN: Same-origin policy</a><span>Explains the browser boundary that restricts cross-origin frame access.</span></li>
                <li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements" target="_blank" rel="noreferrer">MDN: Custom elements</a><span>Defines the standards-based path to an <code>&lt;page-control-panel&gt;</code> placement API.</span></li>
                <li><a href="https://developers.cloudflare.com/bots/" target="_blank" rel="noreferrer">Cloudflare bot solutions</a><span>Shows why scraping and request-level bot control belong at the edge, outside PageControl.</span></li>
              </ul>
            </section>
          </article>
        </div>
      </main>

      <footer className="sdk-docs-footer">
        <p>PageControl · Open-source WebMCP runtime guard</p>
        <Link href="/">Open the live demo</Link>
      </footer>
    </div>
  );
}

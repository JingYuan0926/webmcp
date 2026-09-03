"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

type MerchantKeys = {
  publishable: string;
  secret: string;
  publishableRotatedAt: string;
  secretRotatedAt: string;
};

type ViewState = "loading" | "signed-out" | "ready" | "error";
type KeyKind = "publishable" | "secret";

const VERCEL_ENVIRONMENT_GUIDE =
  "https://vercel.com/docs/environment-variables/managing-environment-variables";
const RENDER_ENVIRONMENT_GUIDE =
  "https://render.com/docs/configure-environment-variables";

function ShieldMark() {
  return (
    <span className="dashboard-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="m9 12 2 2 4-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function KeyCard({
  kind,
  value,
  rotatedAt,
  revealed,
  busy,
  confirming,
  onReveal,
  onCopy,
  onRotate,
}: {
  kind: KeyKind;
  value: string;
  rotatedAt: string;
  revealed: boolean;
  busy: boolean;
  confirming: boolean;
  onReveal: () => void;
  onCopy: () => void;
  onRotate: () => void;
}) {
  const isSecret = kind === "secret";
  const label = isSecret ? "Secret key" : "Publishable key";
  const shown = isSecret && !revealed ? `sk_demo_${"•".repeat(22)}${value.slice(-4)}` : value;

  return (
    <article className="dashboard-key-card">
      <div className="dashboard-key-heading">
        <div>
          <span>{label}</span>
          <p>
            {isSecret
              ? "Preview only. This is not the signing service token."
              : "Preview only. The v1 browser SDK needs no key."}
          </p>
        </div>
        <span className={`dashboard-key-scope${isSecret ? " is-secret" : ""}`}>
          {isSecret ? "Server" : "Browser"}
        </span>
      </div>
      <code className="dashboard-key-value">{shown}</code>
      <p className="dashboard-key-date">
        Rotated {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(rotatedAt))}
      </p>
      <div className="dashboard-key-actions">
        {isSecret ? (
          <button type="button" className="dashboard-button dashboard-button--secondary" onClick={onReveal}>
            {revealed ? "Hide" : "Reveal"}
          </button>
        ) : null}
        <button type="button" className="dashboard-button dashboard-button--secondary" onClick={onCopy}>
          Copy
        </button>
        <button
          type="button"
          className={`dashboard-button${confirming ? " dashboard-button--danger" : " dashboard-button--secondary"}`}
          onClick={onRotate}
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? "Rotating…" : confirming ? "Confirm rotate" : "Rotate"}
        </button>
      </div>
    </article>
  );
}

export function DashboardClient({ signingApiUrl, allowedOrigin }: { signingApiUrl: string; allowedOrigin: string }) {
  const [view, setView] = useState<ViewState>("loading");
  const [keys, setKeys] = useState<MerchantKeys | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [secretVisible, setSecretVisible] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [rotating, setRotating] = useState<KeyKind | null>(null);
  const [confirming, setConfirming] = useState<KeyKind | null>(null);

  const loadKeys = useCallback(async () => {
    setView("loading");
    setError("");
    try {
      const response = await fetch("/api/dashboard/keys", { cache: "no-store" });
      if (response.status === 401) {
        setView("signed-out");
        return;
      }
      const payload = await response.json();
      if (!response.ok || !payload?.keys) throw new Error(payload?.message || "The key preview could not load.");
      setKeys(payload.keys);
      setView("ready");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "The key preview could not load.");
      setView("error");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/keys", { cache: "no-store" })
      .then(async (response) => ({ response, payload: await response.json() }))
      .then(({ response, payload }) => {
        if (cancelled) return;
        if (response.status === 401) {
          setView("signed-out");
          return;
        }
        if (!response.ok || !payload?.keys) throw new Error(payload?.message || "The key preview could not load.");
        setKeys(payload.keys);
        setView("ready");
      })
      .catch((loadError) => {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "The key preview could not load.");
        setView("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const snippet = `<script src="/pagecontrol.js"></script>`;

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoginBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/dashboard/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || "Sign-in failed. Try again.");
      await loadKeys();
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Sign-in failed. Try again.");
    } finally {
      setLoginBusy(false);
    }
  }

  async function rotate(kind: KeyKind) {
    if (confirming !== kind) {
      setConfirming(kind);
      setNotice(`Press Confirm rotate to replace the ${kind} key.`);
      return;
    }
    setRotating(kind);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/dashboard/keys", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const payload = await response.json();
      if (response.status === 401) {
        setView("signed-out");
        setKeys(null);
        return;
      }
      if (!response.ok || !payload?.keys) throw new Error(payload?.message || "The key could not be rotated.");
      setKeys(payload.keys);
      setSecretVisible(false);
      setNotice(`${kind === "secret" ? "Secret" : "Publishable"} key rotated.`);
    } catch (rotateError) {
      setError(rotateError instanceof Error ? rotateError.message : "The key could not be rotated.");
    } finally {
      setRotating(null);
      setConfirming(null);
    }
  }

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label} copied.`);
      setError("");
    } catch {
      setError("Copy was blocked by the browser. Select the value and copy it manually.");
    }
  }

  async function signOut() {
    await fetch("/api/dashboard/logout", { method: "POST" });
    setKeys(null);
    setView("signed-out");
    setNotice("");
    setError("");
  }

  return (
    <main className="merchant-dashboard">
      <header className="dashboard-header">
        <Link className="dashboard-brand" href="/">
          <ShieldMark />
          <span><strong>PageCTRL</strong><small>Merchant console</small></span>
        </Link>
        <nav aria-label="Dashboard navigation">
          <Link href="/">Live demo</Link>
          <Link href="/docs">SDK docs</Link>
          {view === "ready" ? <button type="button" onClick={signOut}>Sign out</button> : null}
        </nav>
      </header>

      {view === "loading" ? (
        <section className="dashboard-loading" aria-label="Loading merchant dashboard" aria-busy="true">
          <span /><span /><span />
        </section>
      ) : null}

      {view === "signed-out" ? (
        <section className="dashboard-login-shell">
          <div className="dashboard-login-copy">
            <p className="dashboard-eyebrow">Merchant access</p>
            <h1>Connect your site to PageCTRL.</h1>
            <p>Sign in to preview API keys, the install tag, and the separate signing service.</p>
            <ul>
              <li>Detect the complete WebMCP tool surface.</li>
              <li>Keep signing secrets off the storefront.</li>
              <li>Rotate credentials without editing the SDK.</li>
            </ul>
          </div>
          <form className="dashboard-login-card" onSubmit={signIn}>
            <div>
              <p className="dashboard-eyebrow">Demo account</p>
              <h2>Sign in</h2>
              <p>Use <strong>q</strong> for both fields.</p>
            </div>
            <label htmlFor="dashboard-username">Email or username</label>
            <input id="dashboard-username" name="username" type="text" autoComplete="username" spellCheck={false} defaultValue="q" required />
            <label htmlFor="dashboard-password">Password</label>
            <input id="dashboard-password" name="password" type="password" autoComplete="current-password" spellCheck={false} defaultValue="q" required aria-describedby={error ? "dashboard-login-error" : undefined} aria-invalid={error ? "true" : undefined} />
            {error ? <p id="dashboard-login-error" className="dashboard-error" role="alert">{error}</p> : null}
            <button type="submit" className="dashboard-button dashboard-button--primary" disabled={loginBusy} aria-busy={loginBusy}>
              {loginBusy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </section>
      ) : null}

      {view === "error" ? (
        <section className="dashboard-state-card" role="alert">
          <p className="dashboard-eyebrow">Could not load</p>
          <h1>The merchant console is unavailable.</h1>
          <p>{error}</p>
          <button type="button" className="dashboard-button dashboard-button--primary" onClick={() => void loadKeys()}>Try again</button>
        </section>
      ) : null}

      {view === "ready" && keys ? (
        <>
          <section className="dashboard-hero">
            <div>
              <p className="dashboard-eyebrow">Merchant integration</p>
              <h1>Keys, coverage, and signing in one place.</h1>
              <p>Connect PageCTRL without placing a signing secret in the merchant page.</p>
            </div>
            <span className="dashboard-preview-badge">Preview environment</span>
          </section>

          <section className="dashboard-summary" aria-label="Integration status">
            <div><span>SDK</span><strong>v1.0.0</strong><small>Current release</small></div>
            <div><span>Signing API</span><strong>{signingApiUrl}</strong><small>Separate trust boundary</small></div>
            <div><span>Key storage</span><strong>HTTP-only</strong><small>Encrypted session cookie</small></div>
          </section>

          <section className="dashboard-section" aria-labelledby="dashboard-keys-title">
            <div className="dashboard-section-heading">
              <div><p className="dashboard-eyebrow">Developer settings</p><h2 id="dashboard-keys-title">API keys</h2></div>
              <div className="dashboard-origin-binding">
                <span>Token is bound to</span>
                <strong>{allowedOrigin}</strong>
              </div>
            </div>
            <p className="dashboard-key-intro">Rotating a key replaces it immediately in this preview session.</p>
            <div className="dashboard-key-grid">
              <KeyCard kind="publishable" value={keys.publishable} rotatedAt={keys.publishableRotatedAt} revealed busy={rotating === "publishable"} confirming={confirming === "publishable"} onReveal={() => {}} onCopy={() => void copy(keys.publishable, "Publishable key")} onRotate={() => void rotate("publishable")} />
              <KeyCard kind="secret" value={keys.secret} rotatedAt={keys.secretRotatedAt} revealed={secretVisible} busy={rotating === "secret"} confirming={confirming === "secret"} onReveal={() => setSecretVisible((visible) => !visible)} onCopy={() => void copy(keys.secret, "Secret key")} onRotate={() => void rotate("secret")} />
            </div>
          </section>

          <section className="dashboard-section" aria-labelledby="dashboard-config-title">
            <div className="dashboard-section-heading">
              <div>
                <p className="dashboard-eyebrow">Production setup</p>
                <h2 id="dashboard-config-title">Put each secret in the right service</h2>
              </div>
              <Link className="dashboard-resource-link" href="/docs#credentials">
                Read the SDK setup <span aria-hidden="true">→</span>
              </Link>
            </div>
            <p className="dashboard-config-intro">
              Generate two different random secrets. Keep both server-side and never add
              <code> NEXT_PUBLIC_</code> to either name.
            </p>
            <div className="dashboard-config-grid">
              <article className="dashboard-config-card">
                <div>
                  <span className="dashboard-config-step">1</span>
                  <div>
                    <p className="dashboard-eyebrow">Merchant app · Vercel</p>
                    <h3>Storefront environment</h3>
                  </div>
                </div>
                <dl className="dashboard-env-list">
                  <div>
                    <dt><code>PAGECONTROL_SERVICE_TOKEN</code></dt>
                    <dd>Use the same random value in Vercel and Render.</dd>
                  </div>
                  <div>
                    <dt><code>PAGECONTROL_DASHBOARD_SESSION_SECRET</code></dt>
                    <dd>Use a second random value. This belongs only to the merchant app.</dd>
                  </div>
                  <div>
                    <dt><code>PAGECONTROL_API_URL</code></dt>
                    <dd>Set this to <code>{signingApiUrl}</code>.</dd>
                  </div>
                </dl>
                <a
                  className="dashboard-resource-link"
                  href={VERCEL_ENVIRONMENT_GUIDE}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Vercel environment guide <span aria-hidden="true">↗</span>
                </a>
              </article>

              <article className="dashboard-config-card">
                <div>
                  <span className="dashboard-config-step">2</span>
                  <div>
                    <p className="dashboard-eyebrow">Signing service · Render</p>
                    <h3>Signing environment</h3>
                  </div>
                </div>
                <dl className="dashboard-env-list">
                  <div>
                    <dt><code>PAGECONTROL_SERVICE_TOKEN</code></dt>
                    <dd>Paste the exact same value used by the merchant app.</dd>
                  </div>
                  <div>
                    <dt><code>PAGECONTROL_PRIVATE_KEY</code></dt>
                    <dd>Keep the Ed25519 signing key here, outside the storefront.</dd>
                  </div>
                  <div>
                    <dt><code>PAGECONTROL_ALLOWED_ORIGINS</code></dt>
                    <dd>Allow only the exact merchant origins that may request grants.</dd>
                  </div>
                </dl>
                <a
                  className="dashboard-resource-link"
                  href={RENDER_ENVIRONMENT_GUIDE}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Render environment guide <span aria-hidden="true">↗</span>
                </a>
              </article>
            </div>
            <p className="dashboard-security-note">
              The browser dashboard never displays production secrets. The keys above are a safe,
              session-only preview of the future key-management flow.
            </p>
          </section>

          <section className="dashboard-section dashboard-install" aria-labelledby="dashboard-install-title">
            <div className="dashboard-section-heading">
              <div><p className="dashboard-eyebrow">Quick start</p><h2 id="dashboard-install-title">Install PageCTRL</h2></div>
              <button type="button" className="dashboard-button dashboard-button--secondary" onClick={() => void copy(snippet, "Install snippet")}>Copy snippet</button>
            </div>
            <pre><code>{snippet}</code></pre>
            <ol>
              <li><span>1</span><p>Load PageCTRL before any tool registration.</p></li>
              <li><span>2</span><p>Register tools through <code>document.modelContext.registerTool()</code>.</p></li>
              <li><span>3</span><p>Watch the panel confirm every browser-reported tool is guarded.</p></li>
            </ol>
          </section>

          <p className="dashboard-preview-note">Preview — keys are session-scoped, reset when you sign out, and do not authorize production traffic.</p>
          <div className="dashboard-feedback" aria-live="polite">
            {notice ? <p>{notice}</p> : null}
            {error ? <p className="dashboard-error" role="alert">{error}</p> : null}
          </div>
        </>
      ) : null}
    </main>
  );
}

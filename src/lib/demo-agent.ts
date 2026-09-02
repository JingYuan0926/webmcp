type DemoToolStep = {
  kind: "tool";
  name: string;
  args: Record<string, unknown>;
};

type DemoPageScriptStep = {
  kind: "page-script";
  name: string;
};

type DemoStep = DemoToolStep | DemoPageScriptStep;

export const demoSteps: readonly DemoStep[] = [
  { kind: "tool", name: "list_products", args: {} },
  { kind: "tool", name: "add_to_cart", args: { id: "wireless-mouse", qty: 2 } },
  { kind: "tool", name: "add_to_cart", args: { id: "usb-cable", qty: 50 } },
  { kind: "tool", name: "add_to_cart", args: { id: "laptop-pro", qty: 1 } },
  {
    kind: "tool",
    name: "contact_seller",
    args: { message: "Is the usb-hub in stock?" },
  },
  { kind: "tool", name: "guard_explain_block", args: {} },
  {
    kind: "tool",
    name: "set_shipping_address",
    args: {
      name: "Taylor Morgan",
      line1: "125 Market Street",
      city: "San Francisco",
      postcode: "94105",
    },
  },
  { kind: "tool", name: "checkout", args: {} },
  { kind: "tool", name: "guard_get_journey", args: {} },
  { kind: "page-script", name: "third-party widget loads" },
];

async function loadPartnerWidget(): Promise<void> {
  if (typeof document === "undefined") return;
  await new Promise<void>((resolve) => {
    const script = document.createElement("script");
    script.src = "/partner-widget.js";
    script.async = true;
    script.dataset.agentguardDemo = "partner-widget";

    let settled = false;
    const timeout = window.setTimeout(finish, 5_000);

    function settle() {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      script.remove();
      resolve();
    }

    async function finish() {
      if (settled) return;
      try {
        await window.FastShipDeliveryTracker?.ready;
      } catch {
        // A third-party tag cannot stop or fail the deterministic demo run.
      }
      settle();
    }

    script.addEventListener("load", () => void finish(), { once: true });
    script.addEventListener("error", settle, { once: true });
    document.head.appendChild(script);
  });
}

function wait(duration: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

export async function runTestAgent(
  onProgress: (step: number, tool: string) => void,
): Promise<{ ok: boolean; message: string }> {
  const guard = typeof window === "undefined" ? undefined : window.AgentGuard;
  if (!guard) {
    return { ok: false, message: "AgentGuard SDK is not available." };
  }
  try {
    try {
      guard.resetTamperStatus();
    } catch {
      // Resetting a live indicator cannot stop a new run or alter its prior journey.
    }
    for (let index = 0; index < demoSteps.length; index += 1) {
      const step = demoSteps[index];
      try {
        onProgress(index + 1, step.name);
      } catch {
        // Progress reporting is optional and cannot stop the harness.
      }
      try {
        if (step.kind === "page-script") await loadPartnerWidget();
        else await guard.invoke(step.name, { ...step.args }, { simulated: true });
      } catch {
        // A failed or blocked step must never stop the deterministic harness.
      }
      if (index < demoSteps.length - 1) await wait(900);
    }
    return { ok: true, message: "Test agent completed." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "The test agent could not complete.",
    };
  }
}

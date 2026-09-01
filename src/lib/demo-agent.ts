export const demoSteps = [
  { name: "list_products", args: {} },
  { name: "add_to_cart", args: { id: "wireless-mouse", qty: 2 } },
  { name: "add_to_cart", args: { id: "usb-cable", qty: 50 } },
  { name: "add_to_cart", args: { id: "laptop-pro", qty: 1 } },
  { name: "contact_seller", args: { message: "Is the usb-hub in stock?" } },
  { name: "guard_explain_block", args: {} },
  {
    name: "set_shipping_address",
    args: {
      name: "Aiman",
      line1: "12 Jalan Merdeka",
      city: "Kuala Lumpur",
      postcode: "50000",
    },
  },
  { name: "checkout", args: {} },
  { name: "guard_get_journey", args: {} },
] as const;

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
    for (let index = 0; index < demoSteps.length; index += 1) {
      const step = demoSteps[index];
      try {
        onProgress(index + 1, step.name);
      } catch {
        // Progress reporting is optional and cannot stop the harness.
      }
      try {
        await guard.invoke(step.name, { ...step.args }, { simulated: true });
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

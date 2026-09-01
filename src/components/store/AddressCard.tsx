"use client";

import { useState, type FormEvent } from "react";

import { flashed, useStore, type Address } from "@/lib/store";

const blankAddress: Address = { name: "", line1: "", city: "", postcode: "" };

export function AddressCard() {
  const { state, api } = useStore();
  return (
    <AddressForm
      key={JSON.stringify(state.address)}
      initialAddress={state.address}
      lastFlash={state.lastFlash}
      onSave={(address) => api.setAddress(address)}
    />
  );
}

function AddressForm({
  initialAddress,
  lastFlash,
  onSave,
}: {
  initialAddress: Address | null;
  lastFlash: string | null;
  onSave: (address: Address) => { ok: boolean; message: string };
}) {
  const [form, setForm] = useState<Address>(initialAddress ?? blankAddress);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function update(key: keyof Address, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = onSave(form);
    if (result.ok) {
      setError("");
      setMessage(result.message);
    } else {
      setMessage("");
      setError(result.message);
      const firstEmpty = (Object.keys(form) as Array<keyof Address>).find(
        (key) => !form[key].trim(),
      );
      const ids: Record<keyof Address, string> = {
        name: "shipping-name",
        line1: "shipping-line",
        city: "shipping-city",
        postcode: "shipping-postcode",
      };
      if (firstEmpty) document.getElementById(ids[firstEmpty])?.focus();
    }
  }

  return (
    <section className={`store-card${flashed(lastFlash, "address") ? " is-flashing" : ""}`} aria-labelledby="address-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Delivery</p>
          <h2 id="address-title">Shipping address</h2>
        </div>
        {initialAddress ? <span className="saved-badge">Saved</span> : null}
      </div>
      <form className="address-form" onSubmit={submit} noValidate>
        <div className="field full-field">
          <label htmlFor="shipping-name">Name</label>
          <input
            id="shipping-name"
            type="text"
            autoComplete="name"
            spellCheck={false}
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="Aiman Rahman"
            required
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? "address-error" : undefined}
          />
        </div>
        <div className="field full-field">
          <label htmlFor="shipping-line">Street address</label>
          <input
            id="shipping-line"
            type="text"
            autoComplete="street-address"
            spellCheck={false}
            value={form.line1}
            onChange={(event) => update("line1", event.target.value)}
            placeholder="12 Jalan Merdeka"
            required
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? "address-error" : undefined}
          />
        </div>
        <div className="field">
          <label htmlFor="shipping-city">City</label>
          <input
            id="shipping-city"
            type="text"
            autoComplete="address-level2"
            spellCheck={false}
            value={form.city}
            onChange={(event) => update("city", event.target.value)}
            placeholder="Kuala Lumpur"
            required
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? "address-error" : undefined}
          />
        </div>
        <div className="field">
          <label htmlFor="shipping-postcode">Postcode</label>
          <input
            id="shipping-postcode"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="postal-code"
            spellCheck={false}
            value={form.postcode}
            onChange={(event) => update("postcode", event.target.value)}
            placeholder="50000"
            required
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? "address-error" : undefined}
          />
        </div>
        <button type="submit" className="button button-secondary full-field">
          Save address
        </button>
      </form>
      {error ? (
        <p id="address-error" className="inline-message is-error" role="alert">
          {error}
        </p>
      ) : (
        <p className="inline-message" aria-live="polite">
          {message}
        </p>
      )}
    </section>
  );
}

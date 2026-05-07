"use client";

import { useState } from "react";

export default function ShippingAccordion() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="font-[family-name:var(--font-dm-mono)] text-xs text-text-primary uppercase tracking-[0.2em]">
          Versand &amp; Rückgabe
        </span>
        <span className={`text-text-muted transition-transform ${open ? "rotate-45" : ""}`}>
          +
        </span>
      </button>
      {open && (
        <div className="pb-5 space-y-3 font-[family-name:var(--font-dm-mono)] text-[12px] text-text-primary leading-relaxed">
          <p>Versand innerhalb 3–5 Werktagen nach Drop-Ende.</p>
          <p>Versandkosten werden im Checkout berechnet.</p>
          <p>14 Tage Rückgaberecht ab Erhalt der Ware. Artikel müssen ungetragen und unbeschädigt sein.</p>
        </div>
      )}
    </div>
  );
}

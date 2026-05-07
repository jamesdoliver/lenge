"use client";

import { useState } from "react";
import { MATERIAL } from "@/lib/shop/stanley-stella";

export default function MaterialsAccordion() {
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
          Material &amp; Pflege
        </span>
        <span className={`text-text-muted transition-transform ${open ? "rotate-45" : ""}`}>
          +
        </span>
      </button>
      {open && (
        <dl className="pb-5 space-y-2">
          <Row label="Passform" value={MATERIAL.fit} />
          <Row label="Gewicht" value={`${MATERIAL.weightGsm} g/m²`} />
          <Row label="Material" value={MATERIAL.composition} />
          <Row label="Pflege" value={MATERIAL.care} />
          <Row label="Herkunft" value={MATERIAL.origin} />
          <div className="flex flex-wrap gap-2 pt-3">
            {MATERIAL.certs.map((cert) => (
              <span
                key={cert}
                className="font-[family-name:var(--font-dm-mono)] text-[10px] text-text-muted uppercase tracking-[0.2em] border border-border/40 px-2 py-1"
              >
                {cert}
              </span>
            ))}
          </div>
        </dl>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2">
      <dt className="font-[family-name:var(--font-dm-mono)] text-[11px] text-text-muted uppercase tracking-[0.2em]">
        {label}
      </dt>
      <dd className="font-[family-name:var(--font-dm-mono)] text-[12px] text-text-primary">
        {value}
      </dd>
    </div>
  );
}

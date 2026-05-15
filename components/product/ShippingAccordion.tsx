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
          <p>
            Herzlichen Glückwunsch — mit dem Erwerb dieses T-Shirts bist du Teil des
            ersten offiziellen Lenge-Merch Drops JEMALS!
          </p>
          <p>
            Da dies ein exklusiver Vorverkauf ist, müssen wir dich bis zum Erhalt
            deiner Bestellung um etwas Geduld bitten. (Man könnte sagen, es wird
            sich in die Lenge ziehen.) Die T-Shirts werden voraussichtlich im Juli
            bei euch eintreffen. Danke für deinen Support &lt;3
          </p>
          <p>Versand innerhalb der EU.</p>
          <p>
            For shipping outside of the EU: Our distribution currently focuses on
            EU countries. If you&rsquo;re based elsewhere, feel free to reach out
            to{" "}
            <a
              href="mailto:shopify@guesstimate.de"
              className="text-accent hover:underline"
            >
              shopify@guesstimate.de
            </a>{" "}
            and we&rsquo;ll gladly look into a solution with you.
          </p>
        </div>
      )}
    </div>
  );
}

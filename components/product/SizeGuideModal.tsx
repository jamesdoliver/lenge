"use client";

import { useEffect, useState } from "react";
import { filterSizeGuide } from "@/lib/shop/stanley-stella";
import SizeGuideDiagram from "./SizeGuideDiagram";

const numberFormat = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });

export default function SizeGuideModal({ availableSizes }: { availableSizes: string[] }) {
  const [open, setOpen] = useState(false);
  const rows = filterSizeGuide(availableSizes);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-[family-name:var(--font-dm-mono)] text-[11px] text-accent hover:underline uppercase tracking-[0.2em]"
      >
        Größentabelle anzeigen
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Schließen"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[55] bg-black/70"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="size-guide-title"
            className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[60] bg-bg border-border/60 md:border md:max-w-xl md:w-full md:max-h-[85vh] flex flex-col overflow-y-auto"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/30 sticky top-0 bg-bg">
              <div>
                <h2
                  id="size-guide-title"
                  className="font-[family-name:var(--font-bebas)] text-text-primary uppercase tracking-[0.2em] text-xl"
                >
                  Größentabelle
                </h2>
                <p className="font-[family-name:var(--font-dm-mono)] text-[10px] text-text-muted uppercase tracking-[0.2em] mt-1">
                  Maße in Zentimetern
                </p>
              </div>
              <button
                type="button"
                aria-label="Schließen"
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-accent text-xl"
              >
                ×
              </button>
            </div>

            <div className="px-5 py-6 space-y-6">
              <SizeGuideDiagram />

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="font-[family-name:var(--font-bebas)] text-text-muted text-xs uppercase tracking-[0.15em] py-2 pr-3">Größe</th>
                      <th className="font-[family-name:var(--font-bebas)] text-text-muted text-xs uppercase tracking-[0.15em] py-2 pr-3">A · Brust</th>
                      <th className="font-[family-name:var(--font-bebas)] text-text-muted text-xs uppercase tracking-[0.15em] py-2 pr-3">B · Länge</th>
                      <th className="font-[family-name:var(--font-bebas)] text-text-muted text-xs uppercase tracking-[0.15em] py-2">C · Ärmel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.size} className="border-b border-border/15">
                        <td className="font-[family-name:var(--font-bebas)] text-text-primary py-2 pr-3 uppercase tracking-[0.15em]">{row.size}</td>
                        <td className="font-[family-name:var(--font-dm-mono)] text-sm tabular-nums py-2 pr-3">{numberFormat.format(row.halfChest)}</td>
                        <td className="font-[family-name:var(--font-dm-mono)] text-sm tabular-nums py-2 pr-3">{numberFormat.format(row.bodyLength)}</td>
                        <td className="font-[family-name:var(--font-dm-mono)] text-sm tabular-nums py-2">{numberFormat.format(row.sleeveLength)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="font-[family-name:var(--font-dm-mono)] text-[10px] text-text-muted uppercase tracking-[0.2em]">
                * Maße können +/- 1 cm variieren
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}

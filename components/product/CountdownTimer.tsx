"use client";

import { useEffect, useState } from "react";
import { DROP_END_MS, splitCountdown } from "@/lib/shop/drop";

const labelClass =
  "font-[family-name:var(--font-dm-mono)] text-[10px] text-text-muted uppercase tracking-[0.2em]";
const digitClass =
  "font-[family-name:var(--font-bebas)] text-border text-3xl lg:text-4xl tabular-nums leading-none";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export default function CountdownTimer() {
  const [parts, setParts] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const tick = () => {
      const ms = Math.max(0, DROP_END_MS - Date.now());
      setParts(splitCountdown(ms));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="border-y border-border/40 py-4 my-4">
      <p className="text-center font-[family-name:var(--font-dm-mono)] text-[11px] text-text-muted uppercase tracking-[0.2em] mb-3">
        Drop endet in
      </p>
      <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
        <CountdownCell value={parts?.days ?? 0} label="Tage" />
        <CountdownCell value={parts?.hours ?? 0} label="Std" />
        <CountdownCell value={parts?.minutes ?? 0} label="Min" />
        <CountdownCell value={parts?.seconds ?? 0} label="Sek" />
      </div>
    </div>
  );
}

function CountdownCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <span className={digitClass}>{pad(value)}</span>
      <p className={`${labelClass} mt-1`}>{label}</p>
    </div>
  );
}

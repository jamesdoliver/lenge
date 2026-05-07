"use client";

export default function QuantitySelector({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  max: number;
}) {
  const clamp = (n: number) => Math.max(1, Math.min(max, n));

  return (
    <div>
      <p className="font-[family-name:var(--font-dm-mono)] text-[11px] text-text-muted uppercase tracking-[0.2em] mb-2">
        Anzahl
      </p>
      <div className="inline-flex items-center border-2 border-border/40">
        <button
          type="button"
          aria-label="Menge verringern"
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= 1}
          className="w-11 h-11 flex items-center justify-center text-text-primary hover:text-accent disabled:opacity-30"
        >
          −
        </button>
        <span className="w-11 text-center font-[family-name:var(--font-dm-mono)] text-sm tabular-nums">
          {value}
        </span>
        <button
          type="button"
          aria-label="Menge erhöhen"
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= max}
          className="w-11 h-11 flex items-center justify-center text-text-primary hover:text-accent disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}

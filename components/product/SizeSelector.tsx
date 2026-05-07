"use client";

import type { ProductVariant } from "@/lib/shopify/types";

export default function SizeSelector({
  variants,
  selectedVariantId,
  onSelect,
}: {
  variants: ProductVariant[];
  selectedVariantId: string | null;
  onSelect: (variantId: string) => void;
}) {
  return (
    <div>
      <p className="font-[family-name:var(--font-dm-mono)] text-[11px] text-text-muted uppercase tracking-[0.2em] mb-2">
        Größe
      </p>
      <div className="grid grid-cols-4 gap-2">
        {variants.map((variant) => {
          const sizeOption = variant.selectedOptions.find(
            (o) => o.name.toLowerCase().includes("größe") || o.name.toLowerCase() === "size"
          );
          const label = sizeOption?.value ?? variant.title;
          const isSelected = selectedVariantId === variant.id;
          const disabled = !variant.availableForSale;

          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => !disabled && onSelect(variant.id)}
              disabled={disabled}
              className={`min-h-[44px] border-2 font-[family-name:var(--font-bebas)] text-sm uppercase tracking-[0.15em] transition-all ${
                isSelected
                  ? "border-border bg-[rgba(138,92,246,0.10)] text-accent"
                  : "border-border/40 text-text-primary hover:border-border"
              } ${disabled ? "line-through opacity-40 cursor-not-allowed" : ""}`}
              aria-pressed={isSelected}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

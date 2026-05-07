"use client";

import Image from "next/image";
import type { CartLine } from "@/lib/shopify/types";
import { useCart } from "./CartProvider";

const formatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export default function CartLineItem({ line }: { line: CartLine }) {
  const { updateLine, removeLine, isPending } = useCart();
  const image = line.merchandise.product.featuredImage;
  const sizeOption = line.merchandise.selectedOptions.find((o) => o.name.toLowerCase().includes("größe") || o.name.toLowerCase() === "size");

  return (
    <div className="flex gap-4 py-4 border-b border-border/30">
      <div className="relative w-20 h-20 flex-shrink-0 bg-surface border border-border/40">
        {image && (
          <Image
            src={image.url}
            alt={image.altText ?? line.merchandise.product.title}
            fill
            className="object-contain"
            sizes="80px"
          />
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <p className="font-[family-name:var(--font-bebas)] text-text-primary uppercase tracking-[0.15em] text-base truncate">
            {line.merchandise.product.title}
          </p>
          {sizeOption && (
            <p className="font-[family-name:var(--font-dm-mono)] text-[10px] text-text-muted uppercase tracking-[0.15em] mt-1">
              GRÖSSE {sizeOption.value}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border border-border/40">
            <button
              type="button"
              aria-label="Menge verringern"
              onClick={() => updateLine(line.id, line.quantity - 1)}
              disabled={isPending}
              className="w-8 h-8 flex items-center justify-center text-text-primary hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed"
            >
              −
            </button>
            <span className="w-8 text-center font-[family-name:var(--font-dm-mono)] text-sm tabular-nums">
              {line.quantity}
            </span>
            <button
              type="button"
              aria-label="Menge erhöhen"
              onClick={() => updateLine(line.id, line.quantity + 1)}
              disabled={isPending}
              className="w-8 h-8 flex items-center justify-center text-text-primary hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>

          <p className="font-[family-name:var(--font-dm-mono)] text-sm text-border tabular-nums">
            {formatter.format(parseFloat(line.cost.totalAmount.amount))}
          </p>
        </div>
      </div>

      <button
        type="button"
        aria-label="Artikel entfernen"
        onClick={() => removeLine(line.id)}
        disabled={isPending}
        className="self-start w-8 h-8 flex items-center justify-center text-text-muted hover:text-accent text-lg disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ×
      </button>
    </div>
  );
}

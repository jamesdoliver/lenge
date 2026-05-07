"use client";

import { useState } from "react";
import type { Product, ProductVariant } from "@/lib/shopify/types";
import { useCart } from "@/components/cart/CartProvider";
import SizeSelector from "./SizeSelector";
import QuantitySelector from "./QuantitySelector";

function pickInitialVariant(variants: ProductVariant[]): ProductVariant | null {
  return variants.find((v) => v.availableForSale) ?? variants[0] ?? null;
}

export default function AddToCartForm({ product }: { product: Product }) {
  const initial = pickInitialVariant(product.variants);
  const [variantId, setVariantId] = useState<string | null>(initial?.id ?? null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const { add, isPending } = useCart();

  const variant =
    product.variants.find((v) => v.id === variantId) ?? initial;
  const max = variant?.quantityAvailable ?? 10;
  const soldOut = !product.availableForSale;

  const handleSubmit = async () => {
    setError(null);
    if (!variant) {
      setError("WÄHLE EINE GRÖSSE");
      return;
    }
    if (!variant.availableForSale) {
      setError("AUSVERKAUFT");
      return;
    }
    const result = await add(variant.id, quantity);
    if (!result.ok) {
      setError(result.error);
    }
  };

  if (soldOut) {
    return (
      <button
        type="button"
        disabled
        className="w-full mt-6 border-2 border-border/40 bg-transparent text-text-muted font-[family-name:var(--font-bebas)] text-lg uppercase tracking-[0.2em] py-4 min-h-[44px] cursor-not-allowed"
      >
        Ausverkauft
      </button>
    );
  }

  return (
    <div className="space-y-5">
      <SizeSelector
        variants={product.variants}
        selectedVariantId={variant?.id ?? null}
        onSelect={(id) => {
          setVariantId(id);
          setError(null);
          setQuantity(1);
        }}
      />

      <QuantitySelector value={quantity} onChange={setQuantity} max={Math.min(10, max)} />

      {error && (
        <p className="font-[family-name:var(--font-dm-mono)] text-xs text-[#ef4444] uppercase tracking-[0.2em]">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full border-2 border-border bg-transparent text-accent font-[family-name:var(--font-bebas)] text-lg uppercase tracking-[0.2em] py-4 min-h-[44px] hover:bg-[rgba(138,92,246,0.08)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "..." : "In den Warenkorb"}
      </button>
    </div>
  );
}

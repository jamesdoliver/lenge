"use client";

import { useCart } from "./CartProvider";

export default function CartPill() {
  const { cart, isOpen, open } = useCart();
  const count = cart?.totalQuantity ?? 0;

  if (count === 0 || isOpen) return null;

  return (
    <button
      type="button"
      onClick={open}
      aria-label={`Warenkorb öffnen, ${count} Artikel`}
      className="fixed z-30 bottom-4 right-4 border-2 border-border bg-bg/90 backdrop-blur-sm text-accent font-[family-name:var(--font-bebas)] text-base uppercase tracking-[0.2em] px-5 py-3 min-h-[44px] hover:bg-[rgba(138,92,246,0.1)] hover:scale-[1.02] transition-all"
    >
      Warenkorb · {count}
    </button>
  );
}

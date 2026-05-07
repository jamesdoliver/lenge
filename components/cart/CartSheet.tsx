"use client";

import { useEffect } from "react";
import { useCart } from "./CartProvider";
import CartLineItem from "./CartLineItem";

const formatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export default function CartSheet() {
  const { cart, isOpen, close } = useCart();

  // Lock body scroll while open + ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  const lines = cart?.lines ?? [];
  const subtotal = cart ? formatter.format(parseFloat(cart.cost.subtotalAmount.amount)) : null;
  const isEmpty = !cart || cart.totalQuantity === 0;

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Warenkorb schließen"
        onClick={close}
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Sheet — bottom-up on mobile, right-in on desktop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className={`fixed z-50 bg-bg border-border/60 transition-transform duration-300 ease-out
          inset-x-0 bottom-0 max-h-[85vh] border-t
          md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[420px] md:border-l md:border-t-0
          ${
            isOpen
              ? "translate-y-0 md:translate-x-0"
              : "translate-y-full md:translate-y-0 md:translate-x-full"
          }
          flex flex-col`}
      >
        {/* Drag handle (mobile only) */}
        <div className="md:hidden pt-2 pb-1 flex justify-center">
          <span className="block w-10 h-1 bg-border/40 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-border/30">
          <h2
            id="cart-title"
            className="font-[family-name:var(--font-bebas)] text-text-primary uppercase tracking-[0.2em] text-xl"
          >
            Warenkorb
          </h2>
          <button
            type="button"
            aria-label="Schließen"
            onClick={close}
            className="text-text-muted hover:text-accent text-xl w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Lines or empty state */}
        <div className="flex-1 overflow-y-auto px-5">
          {isEmpty ? (
            <div className="py-12 text-center">
              <p className="font-[family-name:var(--font-bebas)] text-text-primary uppercase tracking-[0.2em] text-lg">
                Dein Warenkorb ist leer
              </p>
              <button
                type="button"
                onClick={close}
                className="mt-4 font-[family-name:var(--font-dm-mono)] text-xs text-accent hover:underline uppercase tracking-[0.2em]"
              >
                Weiter stöbern
              </button>
            </div>
          ) : (
            lines.map((line) => <CartLineItem key={line.id} line={line} />)
          )}
        </div>

        {/* Footer */}
        {!isEmpty && cart && (
          <div className="border-t border-border/30 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-[family-name:var(--font-dm-mono)] text-xs text-text-muted uppercase tracking-[0.2em]">
                Zwischensumme
              </span>
              <span className="font-[family-name:var(--font-dm-mono)] text-sm text-border tabular-nums">
                {subtotal}
              </span>
            </div>
            <a
              href={cart.checkoutUrl}
              className="block w-full text-center border-2 border-border bg-transparent text-accent font-[family-name:var(--font-bebas)] text-lg uppercase tracking-[0.2em] py-4 min-h-[44px] hover:bg-[rgba(138,92,246,0.08)] hover:scale-[1.02] transition-all"
            >
              Zur Kasse
            </a>
            <p className="font-[family-name:var(--font-dm-mono)] text-[10px] text-text-muted uppercase tracking-[0.15em] text-center">
              Versand & Steuern werden im Checkout berechnet
            </p>
          </div>
        )}
      </div>
    </>
  );
}

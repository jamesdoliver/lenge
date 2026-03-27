"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

export default function NewsletterModal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, close]);

  const handleTakeMeThere = () => {
    close();
    document.getElementById("vote")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          onClick={close}
        >
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.80)]" />
          <div
            className="relative border-2 border-border bg-surface px-6 py-10 max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-[family-name:var(--font-bebas)] text-2xl text-border uppercase tracking-[0.2em] leading-snug">
              JOIN THE LENGE NEWSLETTER BY VOTING FOR MERCH
            </p>
            <button
              type="button"
              onClick={handleTakeMeThere}
              className="mt-6 w-full border-2 border-border bg-transparent text-accent font-[family-name:var(--font-bebas)] text-lg uppercase tracking-[0.2em] py-4 min-h-[44px] hover:bg-[rgba(138,92,246,0.08)] hover:scale-[1.02] transition-all"
            >
              TAKE ME THERE
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

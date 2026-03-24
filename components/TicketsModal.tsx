"use client";

import { useState, useEffect, useCallback } from "react";

export default function TicketsModal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    setError("");
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, close]);

  const handleSubmit = async () => {
    setError("");

    if (!suggestion.trim()) {
      setError("ENTER A SUGGESTION");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/suggest-venue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestion: suggestion.trim() }),
      });

      if (res.ok) {
        setSubmitted(true);
        return;
      }

      setError("SOMETHING WENT WRONG. TRY AGAIN.");
    } catch {
      setError("SOMETHING WENT WRONG. TRY AGAIN.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          onClick={close}
        >
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.80)]" />
          <div
            className="relative border-2 border-border bg-surface px-6 py-10 max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {submitted ? (
              <>
                <p className="font-[family-name:var(--font-bebas)] text-3xl text-text-primary uppercase tracking-[0.2em]">
                  NOTED.
                </p>
                <p className="font-[family-name:var(--font-dm-mono)] text-sm text-text-muted mt-2 uppercase">
                  WE&apos;LL SEE WHAT WE CAN DO.
                </p>
              </>
            ) : (
              <>
                <p className="font-[family-name:var(--font-bebas)] text-2xl text-border uppercase tracking-[0.2em] leading-snug">
                  TELL US WHERE LENGE SHOULD PLAY NEXT?
                </p>
                <input
                  type="text"
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  placeholder="CITY, VENUE, OR FESTIVAL"
                  className="w-full mt-6 bg-transparent border-b border-border text-text-primary font-[family-name:var(--font-dm-mono)] text-sm uppercase tracking-[0.2em] py-3 px-0 outline-none placeholder:text-text-muted"
                />
                {error && (
                  <p className="font-[family-name:var(--font-dm-mono)] text-xs text-[#ef4444] mt-2 uppercase">
                    {error}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full mt-4 border-2 border-border bg-transparent text-accent font-[family-name:var(--font-bebas)] text-lg uppercase tracking-[0.2em] py-4 min-h-[44px] hover:bg-[rgba(138,92,246,0.08)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "..." : "SUBMIT"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

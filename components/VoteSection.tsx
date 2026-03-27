"use client";

import Image from "next/image";
import { useState } from "react";

type Design = "A" | "B";

export default function VoteSection() {
  const [selected, setSelected] = useState<Design | null>(null);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setError("");

    if (!selected) {
      setError("WÄHLE EIN DESIGN");
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("GÜLTIGE E-MAIL EINGEBEN");
      return;
    }

    if (!consent) {
      setError("BITTE ZUSTIMMUNG ERTEILEN");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, design: selected, marketing_consent: consent }),
      });

      if (res.ok) {
        setSubmitted(true);
        return;
      }

      if (res.status === 409) {
        setError("DIESE E-MAIL HAT BEREITS ABGESTIMMT.");
        return;
      }

      setError("ETWAS IST SCHIEFGELAUFEN. VERSUCH ES NOCHMAL.");
    } catch {
      setError("ETWAS IST SCHIEFGELAUFEN. VERSUCH ES NOCHMAL.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <section id="vote" className="px-4 py-12 text-center">
        <h2 className="font-[family-name:var(--font-bebas)] text-4xl text-text-primary uppercase tracking-[0.2em]">
          VOTE ERHALTEN.
        </h2>
        <p className="font-[family-name:var(--font-dm-mono)] text-sm text-text-muted mt-2 uppercase">
          DU ERF&Auml;HRST ZUERST VOM DROP 😔🙏🏻
        </p>
      </section>
    );
  }

  return (
    <section id="vote" className="px-4 py-12">
      {/* Heading */}
      <h2 className="font-[family-name:var(--font-bebas)] text-[28px] text-border text-center uppercase tracking-[0.2em]">
        VOTE FÜR DAS DESIGN
      </h2>

      {/* Subheadings */}
      <div className="mt-3 text-center font-[family-name:var(--font-dm-mono)] text-xs text-text-muted uppercase leading-relaxed">
        <p>WÄHLE DEINEN MERCH</p>
        <p>E-MAIL EINGEBEN</p>
        <p>DROP NICHT VERPASSEN</p>
      </div>

      {/* Design Cards */}
      <div className="grid grid-cols-2 gap-3 mt-8">
        {(["A", "B"] as const).map((design) => (
          <button
            key={design}
            type="button"
            onClick={() => setSelected(design)}
            className={`relative border-2 transition-all ${
              selected === design
                ? "border-border"
                : "border-transparent"
            }`}
          >
            {selected === design && (
              <div className="absolute inset-0 bg-[rgba(138,92,246,0.10)] z-10 pointer-events-none" />
            )}
            <Image
              src={`/images/tshirt-${design.toLowerCase()}.png`}
              alt={`T-shirt design ${design}`}
              width={800}
              height={500}
              className="w-full h-auto"
              unoptimized
            />
            <p className="font-[family-name:var(--font-bebas)] text-text-primary text-center text-base uppercase tracking-[0.2em] py-2">
              DESIGN {design}
            </p>
          </button>
        ))}
      </div>

      <p className="mt-3 text-center font-[family-name:var(--font-dm-mono)] text-xs text-text-muted uppercase">
        Designed &amp; illustrated by Dieu My Maria Luu (<a href="https://www.instagram.com/customsbymy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">@customsbymy</a>)
      </p>

      {/* Email + Submit */}
      <div className="mt-6">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-MAIL"
          className="w-full bg-transparent border-b border-border text-text-primary font-[family-name:var(--font-dm-mono)] text-sm uppercase tracking-[0.2em] py-3 px-0 outline-none placeholder:text-text-muted"
        />

        <label className="flex items-start gap-3 mt-4 cursor-pointer min-h-[44px]">
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-5 h-5 border-2 border-border peer-checked:bg-accent peer-checked:border-accent transition-all flex items-center justify-center">
              {consent && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-white">
                  <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
                </svg>
              )}
            </div>
          </div>
          <span className="font-[family-name:var(--font-dm-mono)] text-[11px] text-text-muted uppercase leading-relaxed">
            Ich stimme zu, Marketinginformationen von Lenge und kooperierenden Partnerunternehmen zu erhalten
          </span>
        </label>

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
          {loading ? "..." : "VOTE ABGEBEN"}
        </button>
      </div>
    </section>
  );
}

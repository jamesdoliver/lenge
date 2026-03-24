"use client";

import Image from "next/image";
import { useState } from "react";

type Design = "A" | "B";

export default function VoteSection() {
  const [selected, setSelected] = useState<Design | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setError("");

    if (!selected) {
      setError("SELECT A DESIGN");
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("ENTER A VALID EMAIL");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, design: selected }),
      });

      if (res.ok) {
        setSubmitted(true);
        return;
      }

      if (res.status === 409) {
        setError("THIS EMAIL HAS ALREADY VOTED.");
        return;
      }

      setError("SOMETHING WENT WRONG. TRY AGAIN.");
    } catch {
      setError("SOMETHING WENT WRONG. TRY AGAIN.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <section className="px-4 py-12 text-center">
        <h2 className="font-[family-name:var(--font-bebas)] text-4xl text-text-primary uppercase tracking-[0.2em]">
          VOTE RECEIVED.
        </h2>
        <p className="font-[family-name:var(--font-dm-mono)] text-sm text-text-muted mt-2 uppercase">
          WE&apos;LL HIT YOU WHEN IT DROPS.
        </p>
      </section>
    );
  }

  return (
    <section className="px-4 py-12">
      {/* Heading */}
      <h2 className="font-[family-name:var(--font-bebas)] text-[28px] text-border text-center uppercase tracking-[0.2em]">
        VOTE FOR THE DESIGN
      </h2>

      {/* Subheadings */}
      <div className="mt-3 text-center font-[family-name:var(--font-dm-mono)] text-xs text-text-muted uppercase leading-relaxed">
        <p>CHOOSE YOUR MERCH</p>
        <p>ENTER YOUR EMAIL</p>
        <p>KNOW WHEN IT DROPS</p>
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
              src={`/images/tshirt-${design.toLowerCase()}.jpg`}
              alt={`T-shirt design ${design}`}
              width={400}
              height={250}
              className="w-full h-auto"
            />
            <p className="font-[family-name:var(--font-bebas)] text-text-primary text-center text-base uppercase tracking-[0.2em] py-2">
              DESIGN {design}
            </p>
          </button>
        ))}
      </div>

      {/* Email + Submit */}
      <div className="mt-6">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="YOUR EMAIL"
          className="w-full bg-transparent border-b border-border text-text-primary font-[family-name:var(--font-dm-mono)] text-sm uppercase tracking-[0.2em] py-3 px-0 outline-none placeholder:text-text-muted"
        />

        {error && (
          <p className="font-[family-name:var(--font-dm-mono)] text-xs text-red-500 mt-2 uppercase">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-4 border-2 border-border bg-transparent text-accent font-[family-name:var(--font-bebas)] text-lg uppercase tracking-[0.2em] py-4 min-h-[44px] hover:bg-[rgba(138,92,246,0.08)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "..." : "CAST VOTE"}
        </button>
      </div>
    </section>
  );
}

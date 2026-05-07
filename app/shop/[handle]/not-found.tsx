import Link from "next/link";

export default function NotFound() {
  return (
    <main className="px-4 py-24 text-center">
      <h1 className="font-[family-name:var(--font-bebas)] text-3xl text-border uppercase tracking-[0.2em]">
        Produkt nicht gefunden
      </h1>
      <p className="mt-3 font-[family-name:var(--font-dm-mono)] text-xs text-text-muted uppercase tracking-[0.2em]">
        Dieses Produkt gibt es nicht oder wurde entfernt.
      </p>
      <Link
        href="/#shop"
        className="inline-block mt-8 border-2 border-border text-accent font-[family-name:var(--font-bebas)] text-base uppercase tracking-[0.2em] px-8 py-3 hover:bg-[rgba(138,92,246,0.08)] transition-all"
      >
        Zurück zum Shop
      </Link>
    </main>
  );
}

import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative w-full">
      <Image
        src="/images/hero.jpg"
        alt="LENGE live"
        width={1600}
        height={900}
        className="w-full max-h-[85vh] object-cover object-top"
        priority
        unoptimized
      />
      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, #0d0b0e 100%)",
        }}
      />
    </section>
  );
}

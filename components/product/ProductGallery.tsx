"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/lib/shopify/types";

export default function ProductGallery({
  images,
  productTitle,
}: {
  images: ProductImage[];
  productTitle: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  if (!active) {
    return (
      <div className="aspect-[8/5] bg-surface border border-border/40" />
    );
  }

  return (
    <div className="space-y-4">
      {/* Framed main image */}
      <div className="bg-surface border border-border/40 p-3 md:p-5">
        <div className="relative w-full aspect-[8/5]">
          <Image
            src={active.url}
            alt={active.altText ?? productTitle}
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 60vw"
            priority
          />
        </div>
      </div>

      {/* Thumbnail strip — only when 2+ images */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative w-16 h-16 flex-shrink-0 border bg-surface ${
                i === activeIndex ? "border-border" : "border-border/30"
              }`}
              aria-label={`Bild ${i + 1} von ${images.length}`}
            >
              <Image
                src={image.url}
                alt=""
                fill
                className="object-contain"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Artist credit */}
      <p className="font-[family-name:var(--font-dm-mono)] text-[11px] text-text-muted uppercase tracking-[0.2em] text-center">
        Designed &amp; illustrated by Dieu My Maria Luu (
        <a
          href="https://www.instagram.com/customsbymy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          @customsbymy
        </a>
        )
      </p>
    </div>
  );
}

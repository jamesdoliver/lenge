import Image from "next/image";
import Link from "next/link";
import { getShopProducts } from "@/lib/shopify/products";

const formatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const TAGLINES: Record<string, string> = {
  "lenge-design-a": "wie eine Audiodatei, nur aus Baumwolle",
  "lenge-design-b": "beschützende Aura inklusive",
};

export default async function ShopSection() {
  const products = await getShopProducts();

  return (
    <section id="shop" className="px-4 py-12">
      <h2 className="font-[family-name:var(--font-bebas)] text-[28px] text-border text-center uppercase tracking-[0.2em]">
        Shop
      </h2>
      <p className="mt-3 text-center font-[family-name:var(--font-dm-mono)] text-xs text-text-muted uppercase leading-relaxed tracking-[0.2em]">
        Limitierter Drop · 14 Tage
      </p>

      <div className="grid grid-cols-2 gap-3 mt-8 max-w-3xl mx-auto">
        {products.map((product) => {
          const image = product.images[0];
          return (
            <Link
              key={product.id}
              href={`/shop/${product.handle}`}
              className="group block bg-surface border border-border/40 hover:border-border transition-colors"
            >
              <div className="relative w-full aspect-[8/5]">
                {image && (
                  <Image
                    src={image.url}
                    alt={image.altText ?? product.title}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 50vw, 384px"
                  />
                )}
              </div>
              <div className="px-3 py-3 border-t border-border/20">
                <p className="font-[family-name:var(--font-bebas)] text-text-primary uppercase tracking-[0.2em] text-base">
                  {product.title}
                </p>
                <p className="font-[family-name:var(--font-dm-mono)] text-[11px] text-text-primary leading-snug mt-1 min-h-[1.25rem]">
                  {TAGLINES[product.handle] ?? ""}
                </p>
                <p className="font-[family-name:var(--font-dm-mono)] text-xs text-border tabular-nums mt-1">
                  {formatter.format(parseFloat(product.priceRange.minVariantPrice.amount))}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="mt-6 text-center font-[family-name:var(--font-dm-mono)] text-xs text-text-muted uppercase tracking-[0.2em]">
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
    </section>
  );
}

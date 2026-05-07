import type { Product } from "@/lib/shopify/types";

export default function ProductDetails({ product }: { product: Product }) {
  return (
    <section className="px-4 py-8">
      <h1 className="font-[family-name:var(--font-bebas)] text-text-primary uppercase tracking-[0.2em] text-3xl">
        {product.title}
      </h1>
      <p className="font-[family-name:var(--font-dm-mono)] text-xs text-text-muted mt-2 uppercase">
        TODO — fill in
      </p>
    </section>
  );
}

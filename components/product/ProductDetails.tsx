import type { Product } from "@/lib/shopify/types";
import { isDropActive } from "@/lib/shop/drop";
import ProductGallery from "./ProductGallery";
import CountdownTimer from "./CountdownTimer";
import DropEnded from "./DropEnded";
import AddToCartForm from "./AddToCartForm";
import SizeGuideModal from "./SizeGuideModal";
import MaterialsAccordion from "./MaterialsAccordion";
import ShippingAccordion from "./ShippingAccordion";

const formatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export default function ProductDetails({ product }: { product: Product }) {
  const dropActive = isDropActive();
  const sizeOption = product.options.find(
    (o) => o.name.toLowerCase().includes("größe") || o.name.toLowerCase() === "size"
  );
  const availableSizes = sizeOption?.values ?? [];

  return (
    <section className="px-4 py-8 lg:px-8 lg:py-12 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-16">
        {/* LEFT — gallery */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery images={product.images} productTitle={product.title} />
        </div>

        {/* RIGHT — details */}
        <div className="space-y-5 lg:pt-6">
          {dropActive ? <CountdownTimer /> : <DropEnded />}

          <h1 className="font-[family-name:var(--font-bebas)] text-text-primary uppercase tracking-[0.2em] text-3xl lg:text-4xl">
            {product.title}
          </h1>

          <p className="font-[family-name:var(--font-dm-mono)] text-xl text-border tabular-nums">
            {formatter.format(parseFloat(product.priceRange.minVariantPrice.amount))}
          </p>

          <div
            className="font-[family-name:var(--font-dm-mono)] text-[13px] text-text-primary/85 leading-relaxed [&>p]:mb-3 [&>p:last-child]:mb-0"
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />

          <div className="border-t border-border/30 pt-5 space-y-5">
            {dropActive ? (
              <AddToCartForm product={product} />
            ) : (
              <p className="font-[family-name:var(--font-dm-mono)] text-xs text-text-muted uppercase tracking-[0.2em]">
                Dieses Produkt ist nicht mehr verfügbar.
              </p>
            )}

            <div>
              <SizeGuideModal availableSizes={availableSizes} />
            </div>
          </div>

          <div className="pt-2">
            <MaterialsAccordion />
            <ShippingAccordion />
          </div>
        </div>
      </div>
    </section>
  );
}

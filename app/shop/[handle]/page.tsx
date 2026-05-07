import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductDetails from "@/components/product/ProductDetails";
import { getProductByHandle } from "@/lib/shopify/products";

export const revalidate = 60;

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();

  return (
    <>
      <Navbar />
      <main className="pt-[52px] md:pt-0">
        <ProductDetails product={product} />
      </main>
      <Footer />
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  try {
    const product = await getProductByHandle(handle);
    if (!product) return { title: "Produkt nicht gefunden" };
    return {
      title: `${product.title} · LENGE`,
      description: product.descriptionHtml.replace(/<[^>]+>/g, "").slice(0, 160),
    };
  } catch (err) {
    console.error("generateMetadata for product page failed", err);
    return { title: "LENGE" };
  }
}

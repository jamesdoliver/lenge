import "server-only";
import { cache } from "react";
import { shopifyFetch } from "./client";
import { PRODUCT_BY_HANDLE_QUERY, PRODUCTS_BY_HANDLES_QUERY } from "./queries";
import type { Product } from "./types";

type ProductByHandleData = { product: ProductRaw | null };
type ProductsListData = { products: { nodes: ProductRaw[] } };

type ProductRaw = Omit<Product, "images" | "variants"> & {
  images: { nodes: Product["images"] };
  variants: { nodes: Product["variants"] };
};

function flattenProduct(raw: ProductRaw): Product {
  return {
    ...raw,
    images: raw.images.nodes,
    variants: raw.variants.nodes,
  };
}

export const getProductByHandle = cache(async (handle: string): Promise<Product | null> => {
  const data = await shopifyFetch<ProductByHandleData>(
    PRODUCT_BY_HANDLE_QUERY,
    { handle },
    { revalidate: 60 }
  );
  return data.product ? flattenProduct(data.product) : null;
});

export const getShopProducts = cache(async (): Promise<Product[]> => {
  const data = await shopifyFetch<ProductsListData>(
    PRODUCTS_BY_HANDLES_QUERY,
    {},
    { revalidate: 60 }
  );
  return data.products.nodes
    .map(flattenProduct)
    .sort((a, b) => a.handle.localeCompare(b.handle));
});

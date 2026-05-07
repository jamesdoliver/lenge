import "server-only";

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_API_VERSION ?? "2025-10";

if (!domain || !token) {
  // Allow build to succeed; fail loudly at runtime
}

const endpoint = `https://${domain}/api/${apiVersion}/graphql.json`;

export type ShopifyResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

export async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
  options: { revalidate?: number; cache?: RequestCache } = {}
): Promise<T> {
  if (!domain || !token) {
    throw new Error("Shopify env vars are not configured");
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    next: options.revalidate !== undefined ? { revalidate: options.revalidate } : undefined,
    cache: options.cache,
  });

  if (!res.ok) {
    throw new Error(`Shopify HTTP ${res.status}`);
  }

  const json = (await res.json()) as ShopifyResponse<T>;
  if (json.errors?.length) {
    throw new Error(`Shopify GraphQL: ${json.errors.map((e) => e.message).join("; ")}`);
  }
  if (!json.data) {
    throw new Error("Shopify response missing data");
  }
  return json.data;
}

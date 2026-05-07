# Lenge Shop Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the homepage vote section with two product pages backed by a Shopify Headless Storefront API + bottom-sheet cart drawer that hands off to Shopify-hosted checkout. Add a 14-day drop countdown that ends midnight Berlin May 22 → 23, after which products become non-buyable.

**Architecture:** Server Components fetch product data from Shopify Storefront API (with 60s revalidate). Cart mutations go through Server Actions; cart ID lives in an httpOnly cookie. A React Context with `useOptimistic` gives the cart UI instant feedback. Drop end is enforced server-side at render time and re-checked on every Server Action call.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript · Tailwind v4 · `@shopify/storefront-api-client` · Vercel.

**Companion design doc:** `docs/plans/2026-05-07-shopify-shop-design.md`. Read it first.

**Next.js 16 references** (read before each task as relevant):
- Server Actions: `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`
- Fetching + caching: `node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md`
- Revalidating: `node_modules/next/dist/docs/01-app/01-getting-started/09-revalidating.md`
- Images: `node_modules/next/dist/docs/01-app/01-getting-started/12-images.md`

**Verification approach:** No unit-test framework is set up in this project, and we're not adding one — visual / behavioral verification happens through `npm run lint`, `tsc --noEmit`, `npm run build`, and `npm run dev` browser checks. Each task ends with a concrete verification step + a commit.

**CLAUDE.md reminder:** "This is NOT the Next.js you know — read `node_modules/next/dist/docs/` before writing code." Heed it.

---

## Task 1: Foundation — install deps, configure images, document env

**Files:**
- Modify: `package.json` (add dep), then `package-lock.json` regenerates
- Modify: `next.config.ts`
- Create: `.env.example`

**Step 1: Install Shopify client**

```bash
npm install @shopify/storefront-api-client
```

Expected: package added to `dependencies`, lockfile updated, no errors.

**Step 2: Allow Shopify CDN images**

Replace `next.config.ts` with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
  },
};

export default nextConfig;
```

**Step 3: Create `.env.example`**

```
# Supabase (legacy — being removed; do not add to new envs)
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=

# Shopify Storefront API (required for the shop)
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=public_storefront_token_from_headless_channel
SHOPIFY_API_VERSION=2025-10

# Shopify Admin API (optional — for one-off admin scripts)
# SHOPIFY_CLIENT_ID=
# SHOPIFY_CLIENT_SECRET=
# SHOPIFY_APP_TOKEN=
```

**Step 4: Verify `.env.local` has the Storefront vars**

Run: `grep -c '^SHOPIFY_STORE_DOMAIN\|^SHOPIFY_STOREFRONT_ACCESS_TOKEN' .env.local`
Expected: `2`

**Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

**Step 6: Commit**

```bash
git add package.json package-lock.json next.config.ts .env.example
git commit -m "chore: add Shopify Storefront client + image domain + .env.example"
```

---

## Task 2: Shopify GraphQL client + types

**Files:**
- Create: `lib/shopify/client.ts`
- Create: `lib/shopify/types.ts`

**Step 1: Create the client**

`lib/shopify/client.ts`:

```ts
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
```

**Step 2: Create the types**

`lib/shopify/types.ts`:

```ts
export type Money = { amount: string; currencyCode: string };

export type ProductImage = {
  id: string;
  url: string;
  altText: string | null;
  width: number;
  height: number;
};

export type ProductOption = { name: string; values: string[] };

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
  price: Money;
  selectedOptions: { name: string; value: string }[];
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  descriptionHtml: string;
  availableForSale: boolean;
  options: ProductOption[];
  priceRange: { minVariantPrice: Money; maxVariantPrice: Money };
  images: ProductImage[];
  variants: ProductVariant[];
};

export type CartLine = {
  id: string;
  quantity: number;
  cost: { totalAmount: Money };
  merchandise: {
    id: string;
    title: string;
    selectedOptions: { name: string; value: string }[];
    product: {
      handle: string;
      title: string;
      featuredImage: { url: string; altText: string | null } | null;
    };
  };
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: Money; totalAmount: Money };
  lines: CartLine[];
};
```

**Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

**Step 4: Commit**

```bash
git add lib/shopify/client.ts lib/shopify/types.ts
git commit -m "feat(shopify): add Storefront API client and types"
```

---

## Task 3: Shopify queries + mutations + product helpers

**Files:**
- Create: `lib/shopify/queries.ts`
- Create: `lib/shopify/mutations.ts`
- Create: `lib/shopify/products.ts`
- Create: `lib/shopify/cart.ts`

**Step 1: Create queries.ts**

`lib/shopify/queries.ts`:

```ts
const PRODUCT_FRAGMENT = `#graphql
  fragment ProductFields on Product {
    id
    handle
    title
    descriptionHtml
    availableForSale
    options { name values }
    priceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    images(first: 10) {
      nodes { id url altText width height }
    }
    variants(first: 50) {
      nodes {
        id
        title
        availableForSale
        quantityAvailable
        price { amount currencyCode }
        selectedOptions { name value }
      }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = `#graphql
  ${PRODUCT_FRAGMENT}
  query ProductByHandle($handle: String!) {
    product(handle: $handle) { ...ProductFields }
  }
`;

export const PRODUCTS_BY_HANDLES_QUERY = `#graphql
  ${PRODUCT_FRAGMENT}
  query ProductsByHandles($handles: [String!]!) {
    products(first: 50, query: "handle:design-a OR handle:design-b") {
      nodes { ...ProductFields }
    }
  }
`;
```

The second query intentionally hardcodes the two handles in the search filter — keeps the homepage shop section query simple. If a `shop` collection is added later, swap to `collection(handle:"shop") { products { nodes { ...ProductFields } } }`.

**Step 2: Create mutations.ts**

`lib/shopify/mutations.ts`:

```ts
const CART_FRAGMENT = `#graphql
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount { amount currencyCode }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost { totalAmount { amount currencyCode } }
        merchandise {
          ... on ProductVariant {
            id
            title
            selectedOptions { name value }
            product {
              handle
              title
              featuredImage { url altText }
            }
          }
        }
      }
    }
  }
`;

export const CART_QUERY = `#graphql
  ${CART_FRAGMENT}
  query Cart($id: ID!) { cart(id: $id) { ...CartFields } }
`;

export const CART_CREATE_MUTATION = `#graphql
  ${CART_FRAGMENT}
  mutation CartCreate($input: CartInput) {
    cartCreate(input: $input) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

export const CART_LINES_ADD_MUTATION = `#graphql
  ${CART_FRAGMENT}
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

export const CART_LINES_UPDATE_MUTATION = `#graphql
  ${CART_FRAGMENT}
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

export const CART_LINES_REMOVE_MUTATION = `#graphql
  ${CART_FRAGMENT}
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;
```

**Step 3: Create products.ts (helper functions)**

`lib/shopify/products.ts`:

```ts
import "server-only";
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

export async function getProductByHandle(handle: string): Promise<Product | null> {
  const data = await shopifyFetch<ProductByHandleData>(
    PRODUCT_BY_HANDLE_QUERY,
    { handle },
    { revalidate: 60 }
  );
  return data.product ? flattenProduct(data.product) : null;
}

export async function getShopProducts(): Promise<Product[]> {
  const data = await shopifyFetch<ProductsListData>(
    PRODUCTS_BY_HANDLES_QUERY,
    {},
    { revalidate: 60 }
  );
  return data.products.nodes.map(flattenProduct);
}
```

**Step 4: Create cart.ts (helper functions)**

`lib/shopify/cart.ts`:

```ts
import "server-only";
import { shopifyFetch } from "./client";
import {
  CART_QUERY,
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_LINES_REMOVE_MUTATION,
} from "./mutations";
import type { Cart } from "./types";

type CartRaw = Omit<Cart, "lines"> & { lines: { nodes: Cart["lines"] } };
type CartPayload = { cart: CartRaw | null; userErrors: { field: string[] | null; message: string }[] };

function flattenCart(raw: CartRaw): Cart {
  return { ...raw, lines: raw.lines.nodes };
}

export async function getCart(id: string): Promise<Cart | null> {
  const data = await shopifyFetch<{ cart: CartRaw | null }>(
    CART_QUERY,
    { id },
    { cache: "no-store" }
  );
  return data.cart ? flattenCart(data.cart) : null;
}

export async function createCart(): Promise<Cart> {
  const data = await shopifyFetch<{ cartCreate: CartPayload }>(
    CART_CREATE_MUTATION,
    { input: {} },
    { cache: "no-store" }
  );
  if (!data.cartCreate.cart) {
    throw new Error(data.cartCreate.userErrors[0]?.message ?? "Cart creation failed");
  }
  return flattenCart(data.cartCreate.cart);
}

export async function addCartLines(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const data = await shopifyFetch<{ cartLinesAdd: CartPayload }>(
    CART_LINES_ADD_MUTATION,
    { cartId, lines },
    { cache: "no-store" }
  );
  if (!data.cartLinesAdd.cart) {
    throw new Error(data.cartLinesAdd.userErrors[0]?.message ?? "Add to cart failed");
  }
  return flattenCart(data.cartLinesAdd.cart);
}

export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<Cart> {
  const data = await shopifyFetch<{ cartLinesUpdate: CartPayload }>(
    CART_LINES_UPDATE_MUTATION,
    { cartId, lines: [{ id: lineId, quantity }] },
    { cache: "no-store" }
  );
  if (!data.cartLinesUpdate.cart) {
    throw new Error(data.cartLinesUpdate.userErrors[0]?.message ?? "Update line failed");
  }
  return flattenCart(data.cartLinesUpdate.cart);
}

export async function removeCartLines(cartId: string, lineIds: string[]): Promise<Cart> {
  const data = await shopifyFetch<{ cartLinesRemove: CartPayload }>(
    CART_LINES_REMOVE_MUTATION,
    { cartId, lineIds },
    { cache: "no-store" }
  );
  if (!data.cartLinesRemove.cart) {
    throw new Error(data.cartLinesRemove.userErrors[0]?.message ?? "Remove line failed");
  }
  return flattenCart(data.cartLinesRemove.cart);
}
```

**Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

**Step 6: Smoke-test the queries by running an inline script**

```bash
node --input-type=module -e "
import('./lib/shopify/products.js').catch(()=>{});
" 2>&1 || true
```

(Skip this if Node can't load the TS file; we'll smoke-test in browser after the product page exists.)

**Step 7: Commit**

```bash
git add lib/shopify/queries.ts lib/shopify/mutations.ts lib/shopify/products.ts lib/shopify/cart.ts
git commit -m "feat(shopify): add product + cart helpers"
```

---

## Task 4: Drop date logic + Stanley/Stella reference data

**Files:**
- Create: `lib/shop/drop.ts`
- Create: `lib/shop/stanley-stella.ts`

**Step 1: Create drop.ts**

`lib/shop/drop.ts`:

```ts
// Midnight at end of May 22 Berlin (CEST = UTC+2 in May).
// Means: drop is live up to and including all of May 22; ends at 00:00 May 23.
export const DROP_END_MS = Date.parse("2026-05-23T00:00:00+02:00");

export function isDropActive(now: number = Date.now()): boolean {
  return now < DROP_END_MS;
}

export function msUntilDropEnd(now: number = Date.now()): number {
  return Math.max(0, DROP_END_MS - now);
}

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function splitCountdown(ms: number): CountdownParts {
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}
```

**Step 2: Create stanley-stella.ts**

`lib/shop/stanley-stella.ts`:

```ts
export const SIZES_OFFERED = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;
export type Size = (typeof SIZES_OFFERED)[number];

export type SizeRow = {
  size: Size;
  halfChest: number;   // cm — measurement A
  bodyLength: number;  // cm — measurement B
  sleeveLength: number; // cm — measurement C
};

// Stanley/Stella Creator 2.0 STTU169
export const SIZE_GUIDE_CM: SizeRow[] = [
  { size: "XXS", halfChest: 45.5, bodyLength: 62, sleeveLength: 20 },
  { size: "XS",  halfChest: 47.5, bodyLength: 65, sleeveLength: 21 },
  { size: "S",   halfChest: 49.5, bodyLength: 69, sleeveLength: 22.5 },
  { size: "M",   halfChest: 53.5, bodyLength: 73, sleeveLength: 24 },
  { size: "L",   halfChest: 56.5, bodyLength: 75, sleeveLength: 24.5 },
  { size: "XL",  halfChest: 59.5, bodyLength: 77, sleeveLength: 25 },
  { size: "XXL", halfChest: 63.5, bodyLength: 79, sleeveLength: 25.5 },
  { size: "3XL", halfChest: 67.5, bodyLength: 81, sleeveLength: 26 },
];

export const MATERIAL = {
  fit: "Medium Fit · Unisex",
  weightGsm: 180,
  composition: "100% Bio-Baumwolle (kammgarn, ringgesponnen)",
  care: "30°C waschen · Druck nicht bügeln · auf links waschen",
  origin: "Bangladesh",
  certs: ["GOTS", "OEKO-TEX", "VEGAN", "FAIR WEAR"] as const,
};

export function filterSizeGuide(availableSizes: string[]): SizeRow[] {
  if (availableSizes.length === 0) return SIZE_GUIDE_CM;
  const upper = availableSizes.map((s) => s.toUpperCase());
  return SIZE_GUIDE_CM.filter((row) => upper.includes(row.size));
}
```

**Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

**Step 4: Commit**

```bash
git add lib/shop/drop.ts lib/shop/stanley-stella.ts
git commit -m "feat(shop): add drop countdown logic + Stanley/Stella reference data"
```

---

## Task 5: Cart cookie helpers + Server Actions

**Files:**
- Create: `lib/cart/cookie.ts`
- Create: `lib/cart/actions.ts`

**Step 1: Create cookie helpers**

`lib/cart/cookie.ts`:

```ts
import "server-only";
import { cookies } from "next/headers";

const CART_COOKIE_NAME = "lenge_cart_id";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

export async function readCartId(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE_NAME)?.value ?? null;
}

export async function writeCartId(cartId: string): Promise<void> {
  const store = await cookies();
  store.set(CART_COOKIE_NAME, cartId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
}

export async function clearCartId(): Promise<void> {
  const store = await cookies();
  store.delete(CART_COOKIE_NAME);
}
```

Note: `cookies()` is async in Next.js 16. Verify this against `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`.

**Step 2: Create Server Actions**

`lib/cart/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import {
  addCartLines,
  createCart,
  getCart as fetchCart,
  removeCartLines,
  updateCartLine,
} from "@/lib/shopify/cart";
import type { Cart } from "@/lib/shopify/types";
import { isDropActive } from "@/lib/shop/drop";
import { clearCartId, readCartId, writeCartId } from "./cookie";

export type ActionResult =
  | { ok: true; cart: Cart }
  | { ok: false; error: string };

async function ensureCart(): Promise<Cart> {
  const id = await readCartId();
  if (id) {
    const cart = await fetchCart(id);
    if (cart) return cart;
    await clearCartId();
  }
  const fresh = await createCart();
  await writeCartId(fresh.id);
  return fresh;
}

export async function getCartAction(): Promise<Cart | null> {
  const id = await readCartId();
  if (!id) return null;
  const cart = await fetchCart(id);
  if (!cart) {
    await clearCartId();
    return null;
  }
  return cart;
}

export async function addToCartAction(
  variantId: string,
  quantity: number
): Promise<ActionResult> {
  if (!isDropActive()) {
    return { ok: false, error: "DROP BEENDET" };
  }
  if (!variantId || quantity < 1) {
    return { ok: false, error: "UNGÜLTIGE EINGABE" };
  }
  try {
    const cart = await ensureCart();
    const updated = await addCartLines(cart.id, [{ merchandiseId: variantId, quantity }]);
    revalidatePath("/", "layout");
    return { ok: true, cart: updated };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "FEHLER" };
  }
}

export async function updateLineAction(
  lineId: string,
  quantity: number
): Promise<ActionResult> {
  const id = await readCartId();
  if (!id) return { ok: false, error: "KEIN WARENKORB" };
  try {
    const updated =
      quantity <= 0
        ? await removeCartLines(id, [lineId])
        : await updateCartLine(id, lineId, quantity);
    revalidatePath("/", "layout");
    return { ok: true, cart: updated };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "FEHLER" };
  }
}

export async function removeLineAction(lineId: string): Promise<ActionResult> {
  const id = await readCartId();
  if (!id) return { ok: false, error: "KEIN WARENKORB" };
  try {
    const updated = await removeCartLines(id, [lineId]);
    revalidatePath("/", "layout");
    return { ok: true, cart: updated };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "FEHLER" };
  }
}
```

**Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

**Step 4: Commit**

```bash
git add lib/cart/cookie.ts lib/cart/actions.ts
git commit -m "feat(cart): add cookie helpers and Server Actions"
```

---

## Task 6: Cart provider + line item

**Files:**
- Create: `components/cart/CartProvider.tsx`
- Create: `components/cart/CartLineItem.tsx`

**Step 1: Create CartProvider**

`components/cart/CartProvider.tsx`:

```tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useOptimistic,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import type { Cart } from "@/lib/shopify/types";
import {
  addToCartAction,
  removeLineAction,
  updateLineAction,
} from "@/lib/cart/actions";

type CartContextValue = {
  cart: Cart | null;
  isOpen: boolean;
  isPending: boolean;
  open: () => void;
  close: () => void;
  add: (variantId: string, quantity: number) => Promise<void>;
  updateLine: (lineId: string, quantity: number) => Promise<void>;
  removeLine: (lineId: string) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  initialCart,
  children,
}: {
  initialCart: Cart | null;
  children: ReactNode;
}) {
  const [cart, setCart] = useState<Cart | null>(initialCart);
  const [optimisticCart, setOptimisticCart] = useOptimistic(cart);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const add = useCallback(
    (variantId: string, quantity: number) =>
      new Promise<void>((resolve) => {
        startTransition(async () => {
          // Open the sheet immediately for responsiveness
          setIsOpen(true);
          const result = await addToCartAction(variantId, quantity);
          if (result.ok) setCart(result.cart);
          resolve();
        });
      }),
    []
  );

  const updateLine = useCallback(
    (lineId: string, quantity: number) =>
      new Promise<void>((resolve) => {
        startTransition(async () => {
          const result = await updateLineAction(lineId, quantity);
          if (result.ok) setCart(result.cart);
          resolve();
        });
      }),
    []
  );

  const removeLine = useCallback(
    (lineId: string) =>
      new Promise<void>((resolve) => {
        startTransition(async () => {
          const result = await removeLineAction(lineId);
          if (result.ok) setCart(result.cart);
          resolve();
        });
      }),
    []
  );

  return (
    <CartContext.Provider
      value={{
        cart: optimisticCart,
        isOpen,
        isPending,
        open,
        close,
        add,
        updateLine,
        removeLine,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
```

**Step 2: Create CartLineItem**

`components/cart/CartLineItem.tsx`:

```tsx
"use client";

import Image from "next/image";
import type { CartLine } from "@/lib/shopify/types";
import { useCart } from "./CartProvider";

const formatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export default function CartLineItem({ line }: { line: CartLine }) {
  const { updateLine, removeLine } = useCart();
  const image = line.merchandise.product.featuredImage;
  const sizeOption = line.merchandise.selectedOptions.find((o) => o.name.toLowerCase().includes("größe") || o.name.toLowerCase() === "size");

  return (
    <div className="flex gap-4 py-4 border-b border-border/30">
      <div className="relative w-20 h-20 flex-shrink-0 bg-surface border border-border/40">
        {image && (
          <Image
            src={image.url}
            alt={image.altText ?? line.merchandise.product.title}
            fill
            className="object-contain"
            sizes="80px"
          />
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <p className="font-[family-name:var(--font-bebas)] text-text-primary uppercase tracking-[0.15em] text-base truncate">
            {line.merchandise.product.title}
          </p>
          {sizeOption && (
            <p className="font-[family-name:var(--font-dm-mono)] text-[10px] text-text-muted uppercase tracking-[0.15em] mt-1">
              GRÖSSE {sizeOption.value}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border border-border/40">
            <button
              type="button"
              aria-label="Menge verringern"
              onClick={() => updateLine(line.id, line.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center text-text-primary hover:text-accent"
            >
              −
            </button>
            <span className="w-8 text-center font-[family-name:var(--font-dm-mono)] text-sm tabular-nums">
              {line.quantity}
            </span>
            <button
              type="button"
              aria-label="Menge erhöhen"
              onClick={() => updateLine(line.id, line.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center text-text-primary hover:text-accent"
            >
              +
            </button>
          </div>

          <p className="font-[family-name:var(--font-dm-mono)] text-sm text-border tabular-nums">
            {formatter.format(parseFloat(line.cost.totalAmount.amount))}
          </p>
        </div>
      </div>

      <button
        type="button"
        aria-label="Artikel entfernen"
        onClick={() => removeLine(line.id)}
        className="self-start w-8 h-8 flex items-center justify-center text-text-muted hover:text-accent text-lg"
      >
        ×
      </button>
    </div>
  );
}
```

**Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

**Step 4: Commit**

```bash
git add components/cart/CartProvider.tsx components/cart/CartLineItem.tsx
git commit -m "feat(cart): add cart provider with optimistic state and line item"
```

---

## Task 7: Cart sheet (bottom drawer)

**Files:**
- Create: `components/cart/CartSheet.tsx`

**Step 1: Create the sheet**

`components/cart/CartSheet.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { useCart } from "./CartProvider";
import CartLineItem from "./CartLineItem";

const formatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export default function CartSheet() {
  const { cart, isOpen, close } = useCart();

  // Lock body scroll while open + ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  const lines = cart?.lines ?? [];
  const subtotal = cart ? formatter.format(parseFloat(cart.cost.subtotalAmount.amount)) : null;
  const isEmpty = !cart || cart.totalQuantity === 0;

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Warenkorb schließen"
        onClick={close}
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Sheet — bottom-up on mobile, right-in on desktop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className={`fixed z-50 bg-bg border-border/60 transition-transform duration-300 ease-out
          inset-x-0 bottom-0 max-h-[85vh] border-t
          md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[420px] md:border-l md:border-t-0
          ${
            isOpen
              ? "translate-y-0 md:translate-x-0"
              : "translate-y-full md:translate-y-0 md:translate-x-full"
          }
          flex flex-col`}
      >
        {/* Drag handle (mobile only) */}
        <div className="md:hidden pt-2 pb-1 flex justify-center">
          <span className="block w-10 h-1 bg-border/40 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-border/30">
          <h2
            id="cart-title"
            className="font-[family-name:var(--font-bebas)] text-text-primary uppercase tracking-[0.2em] text-xl"
          >
            Warenkorb
          </h2>
          <button
            type="button"
            aria-label="Schließen"
            onClick={close}
            className="text-text-muted hover:text-accent text-xl w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Lines or empty state */}
        <div className="flex-1 overflow-y-auto px-5">
          {isEmpty ? (
            <div className="py-12 text-center">
              <p className="font-[family-name:var(--font-bebas)] text-text-primary uppercase tracking-[0.2em] text-lg">
                Dein Warenkorb ist leer
              </p>
              <button
                type="button"
                onClick={close}
                className="mt-4 font-[family-name:var(--font-dm-mono)] text-xs text-accent hover:underline uppercase tracking-[0.2em]"
              >
                Weiter stöbern
              </button>
            </div>
          ) : (
            lines.map((line) => <CartLineItem key={line.id} line={line} />)
          )}
        </div>

        {/* Footer */}
        {!isEmpty && cart && (
          <div className="border-t border-border/30 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-[family-name:var(--font-dm-mono)] text-xs text-text-muted uppercase tracking-[0.2em]">
                Zwischensumme
              </span>
              <span className="font-[family-name:var(--font-dm-mono)] text-sm text-border tabular-nums">
                {subtotal}
              </span>
            </div>
            <a
              href={cart.checkoutUrl}
              className="block w-full text-center border-2 border-border bg-transparent text-accent font-[family-name:var(--font-bebas)] text-lg uppercase tracking-[0.2em] py-4 min-h-[44px] hover:bg-[rgba(138,92,246,0.08)] hover:scale-[1.02] transition-all"
            >
              Zur Kasse
            </a>
            <p className="font-[family-name:var(--font-dm-mono)] text-[10px] text-text-muted uppercase tracking-[0.15em] text-center">
              Versand & Steuern werden im Checkout berechnet
            </p>
          </div>
        )}
      </div>
    </>
  );
}
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

**Step 3: Commit**

```bash
git add components/cart/CartSheet.tsx
git commit -m "feat(cart): add bottom-sheet drawer (mobile) / right drawer (desktop)"
```

---

## Task 8: Cart pill + wire into root layout

**Files:**
- Create: `components/cart/CartPill.tsx`
- Modify: `app/layout.tsx`

**Step 1: Create CartPill**

`components/cart/CartPill.tsx`:

```tsx
"use client";

import { useCart } from "./CartProvider";

export default function CartPill() {
  const { cart, isOpen, open } = useCart();
  const count = cart?.totalQuantity ?? 0;

  if (count === 0 || isOpen) return null;

  return (
    <button
      type="button"
      onClick={open}
      aria-label={`Warenkorb öffnen, ${count} Artikel`}
      className="fixed z-30 bottom-4 right-4 border-2 border-border bg-bg/90 backdrop-blur-sm text-accent font-[family-name:var(--font-bebas)] text-base uppercase tracking-[0.2em] px-5 py-3 min-h-[44px] hover:bg-[rgba(138,92,246,0.1)] hover:scale-[1.02] transition-all"
    >
      Warenkorb · {count}
    </button>
  );
}
```

**Step 2: Wire into layout**

Replace `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Bebas_Neue, DM_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart/CartProvider";
import CartSheet from "@/components/cart/CartSheet";
import CartPill from "@/components/cart/CartPill";
import { getCartAction } from "@/lib/cart/actions";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
  display: "swap",
});

const dmMono = DM_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LENGE",
  description: "Deutschland bekanntester underground hip house rapper",
  metadataBase: new URL("https://lenge.app"),
  openGraph: {
    title: "LENGE",
    description: "Deutschland bekanntester underground hip house rapper",
    images: [{ url: "/images/hero.jpg", width: 4500, height: 2508 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LENGE",
    description: "Deutschland bekanntester underground hip house rapper",
    images: ["/images/hero.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialCart = await getCartAction();

  return (
    <html lang="de">
      <body
        className={`${bebasNeue.variable} ${dmMono.variable} bg-bg text-text-primary antialiased`}
      >
        <CartProvider initialCart={initialCart}>
          {children}
          <CartSheet />
          <CartPill />
        </CartProvider>
      </body>
    </html>
  );
}
```

**Step 3: Type-check + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

**Step 4: Smoke test**

Run: `npm run dev`
- Visit http://localhost:3000 — homepage renders
- Open dev tools network tab — confirm a Storefront API call to `cart` did NOT happen on first load (no cart cookie yet)
- Confirm no JS errors in browser console

**Step 5: Commit**

```bash
git add components/cart/CartPill.tsx app/layout.tsx
git commit -m "feat(cart): mount cart provider, sheet, and pill in root layout"
```

---

## Task 9: Product page route + 404

**Files:**
- Create: `app/shop/[handle]/page.tsx`
- Create: `app/shop/[handle]/not-found.tsx`

**Step 1: Create not-found page**

`app/shop/[handle]/not-found.tsx`:

```tsx
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
```

**Step 2: Create the product page (skeleton — will be filled in next tasks)**

`app/shop/[handle]/page.tsx`:

```tsx
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
  const product = await getProductByHandle(handle);
  if (!product) return { title: "Produkt nicht gefunden" };
  return {
    title: `${product.title} · LENGE`,
    description: product.descriptionHtml.replace(/<[^>]+>/g, "").slice(0, 160),
  };
}
```

**Step 3: Stub `ProductDetails` so the build doesn't break**

Create `components/product/ProductDetails.tsx`:

```tsx
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
```

We'll flesh this out in Task 14.

**Step 4: Type-check and verify the route renders**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run dev`
- Visit http://localhost:3000/shop/design-a — if products exist in Shopify, you see the title; otherwise 404
- Visit http://localhost:3000/shop/does-not-exist — 404 page renders

If the product doesn't exist in Shopify yet, the not-found page is the expected outcome.

**Step 5: Commit**

```bash
git add app/shop/[handle]/page.tsx app/shop/[handle]/not-found.tsx components/product/ProductDetails.tsx
git commit -m "feat(shop): add product page route + 404 fallback"
```

---

## Task 10: Product gallery (framed wide image)

**Files:**
- Create: `components/product/ProductGallery.tsx`

**Step 1: Implement the gallery**

`components/product/ProductGallery.tsx`:

```tsx
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
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

**Step 3: Commit**

```bash
git add components/product/ProductGallery.tsx
git commit -m "feat(product): add framed image gallery with thumbnails and credit"
```

---

## Task 11: Countdown timer + drop-ended placard

**Files:**
- Create: `components/product/CountdownTimer.tsx`
- Create: `components/product/DropEnded.tsx`

**Step 1: Create CountdownTimer**

`components/product/CountdownTimer.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { DROP_END_MS, splitCountdown } from "@/lib/shop/drop";

const labelClass =
  "font-[family-name:var(--font-dm-mono)] text-[10px] text-text-muted uppercase tracking-[0.2em]";
const digitClass =
  "font-[family-name:var(--font-bebas)] text-border text-3xl lg:text-4xl tabular-nums leading-none";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export default function CountdownTimer() {
  const [parts, setParts] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const tick = () => {
      const ms = Math.max(0, DROP_END_MS - Date.now());
      setParts(splitCountdown(ms));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="border-y border-border/40 py-4 my-4">
      <p className="text-center font-[family-name:var(--font-dm-mono)] text-[11px] text-text-muted uppercase tracking-[0.2em] mb-3">
        Drop endet in
      </p>
      <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
        <CountdownCell value={parts?.days ?? 0} label="Tage" />
        <CountdownCell value={parts?.hours ?? 0} label="Std" />
        <CountdownCell value={parts?.minutes ?? 0} label="Min" />
        <CountdownCell value={parts?.seconds ?? 0} label="Sek" />
      </div>
    </div>
  );
}

function CountdownCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <span className={digitClass}>{pad(value)}</span>
      <p className={`${labelClass} mt-1`}>{label}</p>
    </div>
  );
}
```

**Step 2: Create DropEnded**

`components/product/DropEnded.tsx`:

```tsx
export default function DropEnded() {
  return (
    <div className="border-y border-border/40 py-6 my-4 text-center">
      <p className="font-[family-name:var(--font-bebas)] text-border uppercase tracking-[0.2em] text-2xl">
        Drop beendet
      </p>
      <p className="font-[family-name:var(--font-dm-mono)] text-[11px] text-text-muted uppercase tracking-[0.2em] mt-2">
        Vielen Dank für die Unterstützung
      </p>
    </div>
  );
}
```

**Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

**Step 4: Commit**

```bash
git add components/product/CountdownTimer.tsx components/product/DropEnded.tsx
git commit -m "feat(product): add drop countdown and ended-state placard"
```

---

## Task 12: Size + quantity selectors + add-to-cart form

**Files:**
- Create: `components/product/SizeSelector.tsx`
- Create: `components/product/QuantitySelector.tsx`
- Create: `components/product/AddToCartForm.tsx`

**Step 1: Create SizeSelector**

`components/product/SizeSelector.tsx`:

```tsx
"use client";

import type { ProductVariant } from "@/lib/shopify/types";

export default function SizeSelector({
  variants,
  selectedVariantId,
  onSelect,
}: {
  variants: ProductVariant[];
  selectedVariantId: string | null;
  onSelect: (variantId: string) => void;
}) {
  return (
    <div>
      <p className="font-[family-name:var(--font-dm-mono)] text-[11px] text-text-muted uppercase tracking-[0.2em] mb-2">
        Größe
      </p>
      <div className="grid grid-cols-4 gap-2">
        {variants.map((variant) => {
          const sizeOption = variant.selectedOptions.find(
            (o) => o.name.toLowerCase().includes("größe") || o.name.toLowerCase() === "size"
          );
          const label = sizeOption?.value ?? variant.title;
          const isSelected = selectedVariantId === variant.id;
          const disabled = !variant.availableForSale;

          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => !disabled && onSelect(variant.id)}
              disabled={disabled}
              className={`min-h-[44px] border-2 font-[family-name:var(--font-bebas)] text-sm uppercase tracking-[0.15em] transition-all ${
                isSelected
                  ? "border-border bg-[rgba(138,92,246,0.10)] text-accent"
                  : "border-border/40 text-text-primary hover:border-border"
              } ${disabled ? "line-through opacity-40 cursor-not-allowed" : ""}`}
              aria-pressed={isSelected}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Create QuantitySelector**

`components/product/QuantitySelector.tsx`:

```tsx
"use client";

export default function QuantitySelector({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  max: number;
}) {
  const clamp = (n: number) => Math.max(1, Math.min(max, n));

  return (
    <div>
      <p className="font-[family-name:var(--font-dm-mono)] text-[11px] text-text-muted uppercase tracking-[0.2em] mb-2">
        Anzahl
      </p>
      <div className="inline-flex items-center border-2 border-border/40">
        <button
          type="button"
          aria-label="Menge verringern"
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= 1}
          className="w-11 h-11 flex items-center justify-center text-text-primary hover:text-accent disabled:opacity-30"
        >
          −
        </button>
        <span className="w-11 text-center font-[family-name:var(--font-dm-mono)] text-sm tabular-nums">
          {value}
        </span>
        <button
          type="button"
          aria-label="Menge erhöhen"
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= max}
          className="w-11 h-11 flex items-center justify-center text-text-primary hover:text-accent disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}
```

**Step 3: Create AddToCartForm**

`components/product/AddToCartForm.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { Product, ProductVariant } from "@/lib/shopify/types";
import { useCart } from "@/components/cart/CartProvider";
import SizeSelector from "./SizeSelector";
import QuantitySelector from "./QuantitySelector";

function pickInitialVariant(variants: ProductVariant[]): ProductVariant | null {
  return variants.find((v) => v.availableForSale) ?? variants[0] ?? null;
}

export default function AddToCartForm({ product }: { product: Product }) {
  const initial = pickInitialVariant(product.variants);
  const [variantId, setVariantId] = useState<string | null>(initial?.id ?? null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const { add, isPending } = useCart();

  const variant =
    product.variants.find((v) => v.id === variantId) ?? initial;
  const max = variant?.quantityAvailable ?? 10;
  const soldOut = !product.availableForSale;

  const handleSubmit = async () => {
    setError(null);
    if (!variant) {
      setError("WÄHLE EINE GRÖSSE");
      return;
    }
    if (!variant.availableForSale) {
      setError("AUSVERKAUFT");
      return;
    }
    await add(variant.id, quantity);
  };

  if (soldOut) {
    return (
      <button
        type="button"
        disabled
        className="w-full mt-6 border-2 border-border/40 bg-transparent text-text-muted font-[family-name:var(--font-bebas)] text-lg uppercase tracking-[0.2em] py-4 min-h-[44px] cursor-not-allowed"
      >
        Ausverkauft
      </button>
    );
  }

  return (
    <div className="space-y-5">
      <SizeSelector
        variants={product.variants}
        selectedVariantId={variant?.id ?? null}
        onSelect={(id) => {
          setVariantId(id);
          setError(null);
          setQuantity(1);
        }}
      />

      <QuantitySelector value={quantity} onChange={setQuantity} max={Math.min(10, max)} />

      {error && (
        <p className="font-[family-name:var(--font-dm-mono)] text-xs text-[#ef4444] uppercase tracking-[0.2em]">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full border-2 border-border bg-transparent text-accent font-[family-name:var(--font-bebas)] text-lg uppercase tracking-[0.2em] py-4 min-h-[44px] hover:bg-[rgba(138,92,246,0.08)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "..." : "In den Warenkorb"}
      </button>
    </div>
  );
}
```

**Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

**Step 5: Commit**

```bash
git add components/product/SizeSelector.tsx components/product/QuantitySelector.tsx components/product/AddToCartForm.tsx
git commit -m "feat(product): add size + quantity selectors and add-to-cart form"
```

---

## Task 13: Size guide modal + diagram + materials & shipping accordions

**Files:**
- Create: `components/product/SizeGuideModal.tsx`
- Create: `components/product/SizeGuideDiagram.tsx`
- Create: `components/product/MaterialsAccordion.tsx`
- Create: `components/product/ShippingAccordion.tsx`

**Step 1: Create SizeGuideDiagram (inline SVG flat tee)**

`components/product/SizeGuideDiagram.tsx`:

```tsx
export default function SizeGuideDiagram() {
  return (
    <svg
      viewBox="0 0 360 180"
      role="img"
      aria-label="T-Shirt Maße: A Brustbreite, B Länge, C Ärmellänge"
      className="w-full max-w-md mx-auto text-border"
    >
      {/* FRONT */}
      <g transform="translate(20 20)" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M40 10 L60 0 L100 0 L120 10 L155 25 L150 55 L130 50 L130 130 L30 130 L30 50 L10 55 L5 25 Z" />
        {/* A — half chest line */}
        <line x1="30" y1="50" x2="130" y2="50" stroke="currentColor" strokeDasharray="3 3" />
        <text x="80" y="44" textAnchor="middle" fontSize="10" fill="currentColor">A</text>
        {/* B — body length */}
        <line x1="20" y1="0" x2="20" y2="130" stroke="currentColor" strokeDasharray="3 3" />
        <text x="14" y="68" textAnchor="middle" fontSize="10" fill="currentColor">B</text>
        {/* C — sleeve length */}
        <line x1="120" y1="10" x2="155" y2="25" stroke="currentColor" strokeDasharray="3 3" />
        <text x="146" y="14" textAnchor="middle" fontSize="10" fill="currentColor">C</text>
      </g>
      <text x="100" y="170" textAnchor="middle" fontSize="11" fill="currentColor" fontFamily="var(--font-dm-mono)" letterSpacing="2">FRONT</text>

      {/* BACK */}
      <g transform="translate(200 20)" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M40 10 L60 0 L100 0 L120 10 L155 25 L150 55 L130 50 L130 130 L30 130 L30 50 L10 55 L5 25 Z" />
      </g>
      <text x="280" y="170" textAnchor="middle" fontSize="11" fill="currentColor" fontFamily="var(--font-dm-mono)" letterSpacing="2">BACK</text>
    </svg>
  );
}
```

**Step 2: Create SizeGuideModal**

`components/product/SizeGuideModal.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { filterSizeGuide } from "@/lib/shop/stanley-stella";
import SizeGuideDiagram from "./SizeGuideDiagram";

const numberFormat = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });

export default function SizeGuideModal({ availableSizes }: { availableSizes: string[] }) {
  const [open, setOpen] = useState(false);
  const rows = filterSizeGuide(availableSizes);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-[family-name:var(--font-dm-mono)] text-[11px] text-accent hover:underline uppercase tracking-[0.2em]"
      >
        Größentabelle anzeigen
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Schließen"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/70"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="size-guide-title"
            className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 bg-bg border-border/60 md:border md:max-w-xl md:w-full md:max-h-[85vh] flex flex-col overflow-y-auto"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/30 sticky top-0 bg-bg">
              <div>
                <h2
                  id="size-guide-title"
                  className="font-[family-name:var(--font-bebas)] text-text-primary uppercase tracking-[0.2em] text-xl"
                >
                  Größentabelle
                </h2>
                <p className="font-[family-name:var(--font-dm-mono)] text-[10px] text-text-muted uppercase tracking-[0.2em] mt-1">
                  Maße in Zentimetern
                </p>
              </div>
              <button
                type="button"
                aria-label="Schließen"
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-accent text-xl"
              >
                ×
              </button>
            </div>

            <div className="px-5 py-6 space-y-6">
              <SizeGuideDiagram />

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="font-[family-name:var(--font-bebas)] text-text-muted text-xs uppercase tracking-[0.15em] py-2 pr-3">Größe</th>
                      <th className="font-[family-name:var(--font-bebas)] text-text-muted text-xs uppercase tracking-[0.15em] py-2 pr-3">A · Brust</th>
                      <th className="font-[family-name:var(--font-bebas)] text-text-muted text-xs uppercase tracking-[0.15em] py-2 pr-3">B · Länge</th>
                      <th className="font-[family-name:var(--font-bebas)] text-text-muted text-xs uppercase tracking-[0.15em] py-2">C · Ärmel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.size} className="border-b border-border/15">
                        <td className="font-[family-name:var(--font-bebas)] text-text-primary py-2 pr-3 uppercase tracking-[0.15em]">{row.size}</td>
                        <td className="font-[family-name:var(--font-dm-mono)] text-sm tabular-nums py-2 pr-3">{numberFormat.format(row.halfChest)}</td>
                        <td className="font-[family-name:var(--font-dm-mono)] text-sm tabular-nums py-2 pr-3">{numberFormat.format(row.bodyLength)}</td>
                        <td className="font-[family-name:var(--font-dm-mono)] text-sm tabular-nums py-2">{numberFormat.format(row.sleeveLength)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="font-[family-name:var(--font-dm-mono)] text-[10px] text-text-muted uppercase tracking-[0.2em]">
                * Maße können +/- 1 cm variieren
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
```

**Step 3: Create MaterialsAccordion**

`components/product/MaterialsAccordion.tsx`:

```tsx
"use client";

import { useState } from "react";
import { MATERIAL } from "@/lib/shop/stanley-stella";

export default function MaterialsAccordion() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="font-[family-name:var(--font-dm-mono)] text-xs text-text-primary uppercase tracking-[0.2em]">
          Material &amp; Pflege
        </span>
        <span className={`text-text-muted transition-transform ${open ? "rotate-45" : ""}`}>
          +
        </span>
      </button>
      {open && (
        <dl className="pb-5 space-y-2">
          <Row label="Passform" value={MATERIAL.fit} />
          <Row label="Gewicht" value={`${MATERIAL.weightGsm} g/m²`} />
          <Row label="Material" value={MATERIAL.composition} />
          <Row label="Pflege" value={MATERIAL.care} />
          <Row label="Herkunft" value={MATERIAL.origin} />
          <div className="flex flex-wrap gap-2 pt-3">
            {MATERIAL.certs.map((cert) => (
              <span
                key={cert}
                className="font-[family-name:var(--font-dm-mono)] text-[10px] text-text-muted uppercase tracking-[0.2em] border border-border/40 px-2 py-1"
              >
                {cert}
              </span>
            ))}
          </div>
        </dl>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2">
      <dt className="font-[family-name:var(--font-dm-mono)] text-[11px] text-text-muted uppercase tracking-[0.2em]">
        {label}
      </dt>
      <dd className="font-[family-name:var(--font-dm-mono)] text-[12px] text-text-primary">
        {value}
      </dd>
    </div>
  );
}
```

**Step 4: Create ShippingAccordion**

`components/product/ShippingAccordion.tsx`:

```tsx
"use client";

import { useState } from "react";

export default function ShippingAccordion() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="font-[family-name:var(--font-dm-mono)] text-xs text-text-primary uppercase tracking-[0.2em]">
          Versand &amp; Rückgabe
        </span>
        <span className={`text-text-muted transition-transform ${open ? "rotate-45" : ""}`}>
          +
        </span>
      </button>
      {open && (
        <div className="pb-5 space-y-3 font-[family-name:var(--font-dm-mono)] text-[12px] text-text-primary leading-relaxed">
          <p>Versand innerhalb 3–5 Werktagen nach Drop-Ende.</p>
          <p>Versandkosten werden im Checkout berechnet.</p>
          <p>14 Tage Rückgaberecht ab Erhalt der Ware. Artikel müssen ungetragen und unbeschädigt sein.</p>
        </div>
      )}
    </div>
  );
}
```

**Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

**Step 6: Commit**

```bash
git add components/product/SizeGuideModal.tsx components/product/SizeGuideDiagram.tsx components/product/MaterialsAccordion.tsx components/product/ShippingAccordion.tsx
git commit -m "feat(product): add size guide modal, materials accordion, shipping accordion"
```

---

## Task 14: Compose ProductDetails (the right column)

**Files:**
- Modify: `components/product/ProductDetails.tsx`

**Step 1: Replace the stub**

`components/product/ProductDetails.tsx`:

```tsx
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
        <div>
          <ProductGallery images={product.images} productTitle={product.title} />
        </div>

        {/* RIGHT — details */}
        <div className="lg:sticky lg:top-8 lg:self-start space-y-5">
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
```

**Step 2: Type-check + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

**Step 3: Smoke-test in browser**

Run: `npm run dev`

This requires that Shopify products with handles `design-a` and `design-b` exist and are published to the Headless sales channel. If they don't yet, create at least one stub product before continuing — even a draft with a single variant and a placeholder image is fine for verification.

- Visit http://localhost:3000/shop/design-a
- Verify: gallery renders, countdown ticks, size + qty work, "IN DEN WARENKORB" opens the cart sheet, sheet shows the line, "ZUR KASSE" link points at `hottogo.shop/cart/c/...`
- Resize to mobile: layout stacks correctly, sheet slides from bottom
- Open size guide modal: SVG renders, table shows only available sizes, ESC + backdrop close

**Step 4: Commit**

```bash
git add components/product/ProductDetails.tsx
git commit -m "feat(product): compose product details with countdown, cart, size guide, accordions"
```

---

## Task 15: Homepage shop section + CTARow update

**Files:**
- Create: `components/ShopSection.tsx`
- Modify: `app/page.tsx`
- Modify: `components/CTARow.tsx`

**Step 1: Create ShopSection**

`components/ShopSection.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import { getShopProducts } from "@/lib/shopify/products";

const formatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

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
```

**Step 2: Update homepage**

Replace `app/page.tsx`:

```tsx
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CTARow from "@/components/CTARow";
import ShopSection from "@/components/ShopSection";
import Footer from "@/components/Footer";

export const revalidate = 60;

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="pt-[52px] md:pt-0">
        <Hero />
        <CTARow />
        <ShopSection />
      </main>
      <Footer />
    </>
  );
}
```

**Step 3: Update CTARow**

Edit `components/CTARow.tsx`: change `href="#vote"` to `href="#shop"`.

```tsx
<a href="#shop" className={ctaClass}>
  MERCH
</a>
```

**Step 4: Type-check + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

**Step 5: Smoke test**

Run: `npm run dev`
- Visit http://localhost:3000 — the shop section renders two product cards (assuming both products exist in Shopify); clicking each card navigates to the right product page
- The MERCH button in the CTA row scrolls to the shop section
- Verify on mobile and desktop

**Step 6: Commit**

```bash
git add components/ShopSection.tsx app/page.tsx components/CTARow.tsx
git commit -m "feat(homepage): replace vote section with Shopify-backed shop section"
```

---

## Task 16: Cleanup — delete vote artifacts + uninstall Supabase

**Files to delete:**
- `components/VoteSection.tsx`
- `app/api/vote/route.ts`
- `app/api/vote/` (the empty directory after deleting route.ts)
- `lib/supabase.ts`

**Step 1: Verify nothing imports the removed files**

```bash
grep -rn "VoteSection\|api/vote\|lib/supabase" --include="*.ts" --include="*.tsx" /Users/jamesoliver/WebstormProjects/lenge/app /Users/jamesoliver/WebstormProjects/lenge/components /Users/jamesoliver/WebstormProjects/lenge/lib
```

Expected: no matches (or only matches inside the files themselves, which are about to be deleted).

If anything else imports them, fix the import before continuing.

**Step 2: Delete the files**

```bash
rm /Users/jamesoliver/WebstormProjects/lenge/components/VoteSection.tsx
rm /Users/jamesoliver/WebstormProjects/lenge/app/api/vote/route.ts
rmdir /Users/jamesoliver/WebstormProjects/lenge/app/api/vote
rm /Users/jamesoliver/WebstormProjects/lenge/lib/supabase.ts
```

If `app/api/` is now empty, leave it — `app/api/suggest-venue/route.ts` still exists.

**Step 3: Uninstall Supabase**

```bash
npm uninstall @supabase/supabase-js
```

**Step 4: Type-check + lint + build**

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Expected: all pass. Build will exercise the static pages and most server-only code paths.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove vote pipeline and Supabase dependency"
```

---

## Task 17: Document Shopify product setup + final verification

**Files:**
- Create: `content/shopify-product-setup.md`

**Step 1: Write the setup guide**

`content/shopify-product-setup.md`:

````markdown
# Shopify Product Setup — Lenge Drop

Follow these steps in Shopify admin to create the two products the site expects.

## Pre-requisites

- ✅ Headless sales channel app installed
- ✅ Storefront API access token in `.env.local` (and Vercel project envs) as `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
- ✅ Store currency set to EUR

## Per-product checklist

For each design (`design-a` and `design-b`):

| Field | Value |
|---|---|
| Title | `Lenge Design A T-Shirt` (or similar; drives the H1) |
| Handle | **must be `design-a` or `design-b`** (set under "Search engine listing → Edit") |
| Status | Active |
| Sales channels | ✓ Online Store, ✓ **Headless** (required) |
| Vendor | `Lenge` |
| Type | `T-Shirt` |
| Tags | `drop-may-2026` |
| Description | Short HTML — use the rich text editor; up to ~3 short paragraphs |
| Pricing | EUR per variant |
| Inventory | Track quantity per variant; uncheck "Continue selling when out of stock" |
| Variants | Option name `Größe`; values: `XXS`, `XS`, `S`, `M`, `L`, `XL`, `XXL`, `3XL` |
| Images | The wide combined front+back PNG (same as the homepage). 2–4 images max. ≥1200px on the long edge. |

## Optional — `shop` collection

Create a manual collection with handle `shop` containing both products. The code currently filters products by hardcoded handles, but if you change to the collection-based query later, this collection is what it will read.

## Verification

After publishing both products:

1. Run the local dev server: `npm run dev`
2. Visit http://localhost:3000 — both products appear on the homepage shop section
3. Click each card — product page renders with correct title, price, sizes, image
4. Add a variant to cart — sheet slides up; subtotal correct; "ZUR KASSE" redirects to a real Shopify checkout URL
5. Resize the window — mobile and desktop layouts both look right
````

**Step 2: Final end-to-end verification**

Run: `npm run dev`

Manual test pass:
- [ ] http://localhost:3000 — homepage loads, shop section shows both products
- [ ] Click MERCH button in CTARow — scrolls to shop section
- [ ] Click product card — product page loads
- [ ] Countdown ticks down (digits decrement every second)
- [ ] Select size → quantity → IN DEN WARENKORB
- [ ] Cart sheet slides up (mobile) or in (desktop)
- [ ] Cart pill appears in bottom-right
- [ ] Update qty in cart → totals update
- [ ] Remove line → empty state shows when last item removed
- [ ] ZUR KASSE button opens `hottogo.shop/cart/c/...` checkout (don't complete in production)
- [ ] Size guide modal: opens, SVG renders, table shows only your offered sizes, ESC closes
- [ ] Material & Pflege accordion: expands; cert pills render
- [ ] Shipping accordion: expands
- [ ] Refresh — cart persists (cookie-driven)
- [ ] http://localhost:3000/shop/does-not-exist — 404 page
- [ ] Type-check + lint + build all pass: `npx tsc --noEmit && npm run lint && npm run build`

**Step 3: Commit**

```bash
git add content/shopify-product-setup.md
git commit -m "docs: add Shopify product setup guide"
```

**Step 4 (optional): Push to a preview branch and verify on Vercel**

```bash
git push -u origin <feature-branch>
```

In Vercel project settings → Environment Variables, add:
- `SHOPIFY_STORE_DOMAIN`
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
- (optional) `SHOPIFY_API_VERSION`

Wait for the preview deployment, repeat the manual test pass.

---

## Done

After Task 17, the implementation is complete. The user should:
1. Export historical Supabase votes from the Supabase admin (CSV) if they want them as a marketing list — the table is still there but unused
2. Drop the Supabase project entirely once they've exported what they need
3. Configure Vercel env vars for production
4. Promote to production when products are live

## Out of scope (future iterations)

- Admin script using `SHOPIFY_CLIENT_ID/SECRET/APP_TOKEN` to programmatically create products
- Cleanup of the mislabeled `SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN` env var (Admin token, not a Storefront private token)
- Discount codes, customer accounts, wishlist, restock notifications
- A11y audit beyond the basics (ESC, focus trap, keyboard nav, alt text)
- Analytics integration beyond what Shopify checkout provides

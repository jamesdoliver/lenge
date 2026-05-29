# Shopify Product Setup — Lenge Drop

The site is wired to a Shopify Headless storefront. This guide documents the live state and what needs to change in Shopify admin if you want to adjust products, prices, or inventory.

## Pre-flight

The following are already in place:

- ✅ Shopify Headless sales channel installed (store: `j8qssm-uf.myshopify.com`, customer-facing checkout at `hottogo.shop`)
- ✅ Storefront API access token in `.env.local` as `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
- ✅ Currency: EUR
- ✅ Two products created with handles `lenge-design-a` and `lenge-design-b`
- ✅ 8 size variants per product: `XXS, XS, S, M, L, XL, 2XL, 3XL`
- ✅ Pricing: €35,00 per variant
- ✅ One image per product (wide composite front+back)

The customer flow is: homepage `#shop` section → click card → `/shop/<handle>` product page → add to cart → bottom-sheet drawer → "Zur Kasse" link → Shopify-hosted checkout.

## How handles map to URLs

The site filters on hardcoded handles in `lib/shopify/queries.ts`:

```graphql
products(first: 50, query: "handle:lenge-design-a OR handle:lenge-design-b")
```

Routes:
- `/shop/lenge-design-a` → Design A product page
- `/shop/lenge-design-b` → Design B product page

If you create a third design, add a new clause to the `query:` filter (or switch to a `shop` collection — see "Adding a third product" below).

## Per-product field reference

| Field | Where edited | Notes |
|---|---|---|
| Title | Shopify admin → Products | Drives the H1 on the product page and the card label on the homepage. |
| Handle | Search engine listing → Edit | **Must remain** `lenge-design-a` / `lenge-design-b`, or you must update the GraphQL filter. |
| Status | Active | Required for visibility. |
| Sales channels | ✓ Online Store, ✓ Headless | **Headless** is required — Storefront API can't see products without it. |
| Description (Body) | Rich text editor | Renders verbatim on the product page (HTML, including `<p>`, `<br>`). |
| Pricing | EUR per variant | Currently €35,00. |
| Inventory | Tracked per variant | See "Inventory tracking + scopes" below. |
| Variants — option | `Size` | Code accepts both `Size` and `Größe` (case-insensitive). |
| Variants — values | `XXS, XS, S, M, L, XL, 2XL, 3XL` | If you change these, also update `SIZES_OFFERED` and `SIZE_GUIDE_CM` in `lib/shop/stanley-stella.ts`. |
| Images | 1+ per product | First image becomes the homepage card thumbnail and product page hero. PNG ≥1200px on the long edge recommended. The site frames the image as wide artwork (`aspect-[8/5]`) so a wide composite works well. |

## Inventory tracking + scopes

The Storefront API access token currently does NOT have the `unauthenticated_read_product_inventory` scope. As a result:

- The site does NOT cap quantity at variant inventory level. The `+` button steps to a fixed maximum of 10.
- If a customer adds an item that's actually out of stock, the rejection happens at Shopify checkout (not at the product page).
- The size button still grays out a variant when `availableForSale` is false (Shopify reports this without the inventory scope), so fully sold-out sizes ARE hidden from selection.

**To enable accurate inventory caps:** Shopify admin → Headless app → Storefront API access scopes → enable `unauthenticated_read_product_inventory` → save. Then update the `PRODUCT_FRAGMENT` in `lib/shopify/queries.ts` to re-add `quantityAvailable` to the `variants(first: 50)` selection.

## Adding a third product

Two options:

**Option A — Quick: extend the hardcoded handle list.**
In `lib/shopify/queries.ts` change the `query:` string:

```graphql
products(first: 50, query: "handle:lenge-design-a OR handle:lenge-design-b OR handle:lenge-design-c")
```

**Option B — Cleaner: switch to a Shopify collection.**
1. In Shopify admin, create a manual collection with handle `shop` and add both products.
2. Replace the query in `lib/shopify/queries.ts`:
   ```graphql
   query ProductsByCollection {
     collection(handle: "shop") {
       products(first: 50) { nodes { ...ProductFields } }
     }
   }
   ```
3. Update `getShopProducts()` in `lib/shopify/products.ts` to read `data.collection?.products.nodes ?? []`.

Adding a third product card on the homepage will likely require relaxing the 2-column grid (`grid-cols-2 md:grid-cols-3`) in `components/ShopSection.tsx`.

## Drop dates

The drop end is hardcoded in `lib/shop/drop.ts`:

```ts
export const DROP_END_MS = Date.parse("2026-05-30T23:59:59+02:00");
```

= end of day May 30 Berlin time (the window was extended one evening from the
original May 29 17:00 close to give post-payday shoppers an extra day). Past this moment:
- Server-side: cart form is replaced with a "DROP BEENDET" placard and "Dieses Produkt ist nicht mehr verfügbar." message.
- The `addToCartAction` Server Action additionally refuses any post-drop add (defense-in-depth in case of cached pages).

To change the drop end, edit that constant and redeploy.

## Stanley/Stella reference data

The product blank is **Stanley/Stella Creator 2.0 STTU169** (180 GSM, 100% organic combed ring-spun cotton, GOTS / OEKO-TEX / Vegan / Fair Wear certified, made in Bangladesh). Specs and the size-measurement table are encoded in `lib/shop/stanley-stella.ts` — change them there if the blank ever changes. The size-guide modal automatically filters its rows to only the sizes you offer in Shopify variants.

## Verification

After any product/inventory change in Shopify admin, you can sanity-check the site:

1. `npm run dev` (or visit production)
2. Homepage `/` — both cards render with current title and price within ~60 seconds (revalidate window)
3. Product page `/shop/lenge-design-a` — title, price, size buttons, countdown all reflect Shopify state
4. Add a variant, hit "ZUR KASSE" — should redirect to a `hottogo.shop/cart/c/...` URL with the right line and price

Or run the Playwright suite:

```bash
npm run dev   # in one terminal
BASE_URL=http://localhost:3001 npx playwright test
```

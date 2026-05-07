# Lenge Shop — Design Document

**Date:** 2026-05-07
**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Shopify Storefront API · Vercel

---

## Overview

Replace the homepage `VoteSection` (email-capture for an upcoming t-shirt drop) with a working merch shop that links to product detail pages and routes customers to a Shopify-hosted headless checkout.

Two products: **Design A** and **Design B** t-shirts (Stanley/Stella Creator 2.0 STTU169 blank). Sold via the Shopify Headless sales channel. Customer journey: homepage → product page (image, price, size, quantity, add to cart) → bottom-sheet cart drawer → Shopify checkout (`hottogo.shop/cart/c/...`).

A 14-day "drop ending" countdown runs from now until midnight Berlin time on May 22 → 23. After the drop ends, products become non-buyable and a "DROP BEENDET" placard replaces the cart form.

The existing Supabase vote pipeline is removed. The vote table itself is left untouched in Supabase admin so historical email/preference data can be exported manually if needed.

---

## Decisions (with rationale)

| # | Decision | Rationale |
|---|---|---|
| 1 | Shopify Storefront API (GraphQL) for products + cart | Customer-facing surface. Public token works for product reads + cart writes. Admin API can't do customer carts. |
| 2 | Server Actions for all cart mutations | Keeps Storefront calls server-side, type-safe, plays with `useOptimistic` and `revalidatePath`. Avoids a `/api/cart/*` REST layer. |
| 3 | Cart ID stored in httpOnly cookie | Survives navigations + tab restores. SameSite=lax. 14-day expiry (Shopify cart TTL is 10 days idle). |
| 4 | Bottom-sheet cart drawer (mobile) / right slide-in (desktop) | All traffic is from Instagram → mobile. Bottom sheets feel native; side drawers clip on small screens. Allows multi-item baskets. |
| 5 | Floating cart pill | Single source of truth for "view cart" without crowding the logo-only navbar. Hidden when cart empty. |
| 6 | One image per product (combined front+back) | Matches the existing homepage assets. Gallery code is forward-compatible for 1+ images if more shots are uploaded later. |
| 7 | "Image-left, text-right" desktop layout, framed image card | Per the brief. Wide image card with thin gold border + dark surface fill makes the deliberately wide aspect read as "framed artwork." |
| 8 | Drop countdown enforced server-side | Server decides live vs ended state at render time. Server Action also re-checks on submit. CDN cache lag (≤60s) cannot punch through. |
| 9 | Size guide as modal (Stanley/Stella Creator 2.0 data, hardcoded) | Same blank for both products → single source of truth in code. Modal opens from a small link below the cart button. |
| 10 | Material & Pflege accordion sibling to Versand & Rückgabe | Keeps Stanley/Stella spec data discoverable but not noisy. Cert badges as text pills (no logos — avoids legal/usage hassle). |
| 11 | Removed: Supabase code + dependency | Vote pipeline is no longer used; nothing else depends on Supabase. Table preserved for one-time data export by user. |

---

## Project Structure (after changes)

```
lenge/
├── app/
│   ├── layout.tsx                       # MODIFIED — wraps body in <CartProvider>, renders <CartSheet> + <CartPill>
│   ├── page.tsx                         # MODIFIED — <VoteSection /> → <ShopSection />
│   ├── shop/
│   │   └── [handle]/
│   │       ├── page.tsx                 # NEW — RSC, fetches product by handle
│   │       └── not-found.tsx            # NEW — 404 fallback
│   └── api/                             # /api/vote DELETED
├── components/
│   ├── Navbar.tsx                       # unchanged
│   ├── Hero.tsx                         # unchanged
│   ├── CTARow.tsx                       # MODIFIED — MERCH href #vote → #shop
│   ├── ShopSection.tsx                  # NEW — replaces VoteSection
│   ├── Footer.tsx                       # unchanged
│   ├── product/
│   │   ├── ProductGallery.tsx           # NEW — framed image card, supports 1+ images
│   │   ├── ProductDetails.tsx           # NEW — title + price + description container
│   │   ├── SizeSelector.tsx             # NEW
│   │   ├── QuantitySelector.tsx         # NEW
│   │   ├── AddToCartForm.tsx            # NEW — <form action={addToCart}>
│   │   ├── CountdownTimer.tsx           # NEW — drop countdown (client component)
│   │   ├── DropEnded.tsx                # NEW — placard shown post-drop
│   │   ├── SizeGuideModal.tsx           # NEW
│   │   ├── SizeGuideTable.tsx           # NEW — measurement table, filtered by Shopify variants
│   │   ├── SizeGuideDiagram.tsx         # NEW — inline SVG flat tee with A/B/C labels
│   │   ├── MaterialsAccordion.tsx       # NEW — Stanley/Stella spec + cert pills
│   │   └── ShippingAccordion.tsx        # NEW
│   └── cart/
│       ├── CartProvider.tsx             # NEW — context + useOptimistic
│       ├── CartSheet.tsx                # NEW — bottom-sheet/drawer
│       ├── CartLineItem.tsx             # NEW
│       └── CartPill.tsx                 # NEW
├── lib/
│   ├── shopify/
│   │   ├── client.ts                    # NEW — server-only GraphQL fetcher
│   │   ├── queries.ts                   # NEW — product reads
│   │   ├── mutations.ts                 # NEW — cart mutations
│   │   └── types.ts                     # NEW
│   ├── cart/
│   │   ├── actions.ts                   # NEW — Server Actions
│   │   └── cookie.ts                    # NEW — cart-id cookie helpers
│   └── shop/
│       ├── drop.ts                      # NEW — DROP_END constant + helpers
│       └── stanley-stella.ts            # NEW — size guide table, fit/material/care/origin/certs
├── content/
│   └── shopify-product-setup.md         # NEW — admin checklist for creating products
├── public/                              # unchanged (existing tshirt-a/b PNGs stay)
├── docs/plans/
│   └── 2026-05-07-shopify-shop-design.md  # this doc
├── next.config.ts                       # MODIFIED — cdn.shopify.com in remotePatterns
├── package.json                         # MODIFIED — remove @supabase/supabase-js, add @shopify/storefront-api-client
└── .env.local                           # adds SHOPIFY_STORE_DOMAIN, SHOPIFY_STOREFRONT_ACCESS_TOKEN
```

**Deletions:** `components/VoteSection.tsx`, `app/api/vote/route.ts`, `lib/supabase.ts`.

---

## Data Flow

**Reads (products):** Server Components fetch directly from `https://{store}.myshopify.com/api/2025-10/graphql.json` with `X-Shopify-Storefront-Access-Token` header. Wrapped in `fetch` with `next: { revalidate: 60 }` so price/inventory updates propagate within ~1 minute without redeploys.

**Writes (cart):** Server Actions in `lib/cart/actions.ts`:
- `addToCart(variantId, quantity)`
- `updateLineQuantity(lineId, quantity)`
- `removeLine(lineId)`
- `getCart()` — read-only, uses cart-id cookie

Each mutation reads/writes the cart-id cookie, calls the corresponding Storefront mutation, and returns the canonical cart payload.

**Client state:** `<CartProvider>` wraps `<body>`. Hydrates from a server-rendered cart snapshot. All actions go through `useOptimistic` for instant UI feedback; rolls back on error.

**Checkout:** Every cart payload includes `cart.checkoutUrl`. The "ZUR KASSE" button is a plain `<a href={checkoutUrl}>`. We never see card data — Shopify hosts the checkout at `hottogo.shop/cart/c/...`.

---

## Routing

| Route | Purpose |
|---|---|
| `/` | Homepage — Hero, CTARow, **ShopSection**, Footer |
| `/shop/design-a` | Product page for Design A |
| `/shop/design-b` | Product page for Design B |
| `/shop/[anything-else]` | 404 (`not-found.tsx`) |

No `/shop` index, no `/cart` page. Cart is the drawer.

CTARow's MERCH button scrolls to `#shop` (the homepage shop section anchor).

---

## Cart UX

**State model:**
```ts
{ cart: ShopifyCart | null, isOpen: boolean, isPending: boolean }
```

**Add-to-cart flow:**
1. User submits `<form action={addToCart}>` with `{variantId, quantity}`
2. Optimistic line item appears, sheet slides up
3. Server Action calls `cartLinesAdd`, returns canonical cart
4. Context replaces optimistic state
5. On error: rollback + inline message inside sheet

**The sheet:**
- Mobile (<768px): slides up from bottom, max-height 85vh, drag-handle, body scroll locked
- Desktop (≥768px): slides in from right, width 420px, full height
- Backdrop click + ESC dismiss
- Empty state: "DEIN WARENKORB IST LEER"
- Footer: subtotal + fat full-width "ZUR KASSE" button

**The pill:**
- Hidden when `totalQuantity === 0`
- Otherwise: fixed bottom-right, gold border + purple text, "WARENKORB · {n}"
- Tap → opens sheet
- Hidden while sheet is open

**Edge cases:**
- Out-of-stock: surface Shopify `userErrors[].message`, don't open sheet
- Expired cart cookie: silent `cartCreate` retry once
- Deleted variants: server fetcher filters out stale lines

---

## Product Page Layout

**Mobile (<1024px):** stacked — gallery, then countdown, then details, then cart, then accordions, with a sticky bottom purchase bar that appears once the user scrolls past the inline CTA.

**Desktop (≥1024px):** `grid-cols-[1.4fr_1fr] gap-16`.
- **Left:** framed gallery card (`bg-surface`, thin gold border) with the wide combined image inside. Below: "Designed & illustrated by Dieu My Maria Luu" caption.
- **Right (`lg:sticky lg:top-24`):** countdown band → title → price → description → divider → size selector → quantity → add-to-cart → size guide link → MATERIAL & PFLEGE accordion → VERSAND & RÜCKGABE accordion.

**Drop ended:** countdown band shows "DROP BEENDET". Cart form is replaced with `<DropEndedNotice />`.

**Sold out variant:** size button strikethrough + reduced opacity, not selectable. Fully sold out: cart button shows `AUSVERKAUFT`, disabled.

---

## Drop Countdown

```ts
// lib/shop/drop.ts
export const DROP_END = new Date('2026-05-23T00:00:00+02:00').getTime();
// = midnight at end of May 22 Berlin (CEST = UTC+2)

export function isDropActive(now = Date.now()) { return now < DROP_END; }
```

**Component states:**
- `isDropActive()` true → ticker (TAGE / STD / MIN / SEK), gold digits, DM Mono labels, hairline gold rules top + bottom
- `isDropActive()` false → "DROP BEENDET" placard, same frame

**Implementation:**
- `'use client'` component, single `setInterval(1000)`
- Initial render: fixed-height skeleton to prevent layout shift + hydration mismatch
- `tabular-nums` so digit widths don't jump
- Server Action `addToCart` re-checks `isDropActive()` and refuses with a user-facing error if past

Page revalidate is 60s so the post-drop server-rendered state propagates within ~1 min of midnight even with cached responses.

---

## Shopify Product Setup Spec

For each product (instructions captured in full at `content/shopify-product-setup.md`):

| Field | Design A | Design B |
|---|---|---|
| Title | `Lenge Design A T-Shirt` | `Lenge Design B T-Shirt` |
| Handle | `design-a` | `design-b` |
| Status | Active | Active |
| Sales channels | ✓ Online Store, ✓ Headless | same |
| Vendor | `Lenge` | same |
| Type | `T-Shirt` | same |
| Tags | `drop-may-2026` | same |
| Pricing | EUR | same |
| Inventory | Tracked, no oversell | same |
| Variants | `Größe`: XXS, XS, S, M, L, XL, XXL, 3XL | same |
| Images | Wide combined front+back PNG | own equivalent |
| Description | Short HTML body | own copy |

Optional: collection `shop` (handle `shop`) containing both products. Lets the homepage fetch via `collection(handle: "shop")` instead of two product handles.

---

## Stanley/Stella Reference Data (Creator 2.0 STTU169)

Encoded in `lib/shop/stanley-stella.ts`:

```ts
export const SIZE_GUIDE_CM = [
  { size: 'XXS', halfChest: 45.5, bodyLength: 62, sleeveLength: 20 },
  { size: 'XS',  halfChest: 47.5, bodyLength: 65, sleeveLength: 21 },
  { size: 'S',   halfChest: 49.5, bodyLength: 69, sleeveLength: 22.5 },
  { size: 'M',   halfChest: 53.5, bodyLength: 73, sleeveLength: 24 },
  { size: 'L',   halfChest: 56.5, bodyLength: 75, sleeveLength: 24.5 },
  { size: 'XL',  halfChest: 59.5, bodyLength: 77, sleeveLength: 25 },
  { size: 'XXL', halfChest: 63.5, bodyLength: 79, sleeveLength: 25.5 },
  { size: '3XL', halfChest: 67.5, bodyLength: 81, sleeveLength: 26 },
];

export const MATERIAL = {
  fit:        'Medium Fit · Unisex',
  weightGsm:  180,
  composition:'100% Bio-Baumwolle (kammgarn, ringgesponnen)',
  care:       '30°C waschen · Druck nicht bügeln · auf links waschen',
  origin:     'Bangladesh',
  certs:      ['GOTS', 'OEKO-TEX', 'VEGAN', 'FAIR WEAR'],
};
```

Size guide modal renders only the rows whose `size` matches a variant on the current product.

---

## Migration & Rollout

**Pre-flight (user):**
- ✓ Storefront access token in `.env.local`
- Create products in Shopify with handles `design-a`, `design-b`, sizes XXS–3XL, EUR pricing, both sales channels enabled
- Optional: create `shop` collection

**Code rollout (single branch):**
1. Shopify client + queries + mutations + types
2. Cart Server Actions + cookie helpers
3. `next.config.ts` allowlist for `cdn.shopify.com`
4. Product page (`/shop/[handle]`) + gallery, details, countdown, modals, accordions
5. Cart provider + sheet + pill in root layout
6. New `<ShopSection />` on homepage; CTARow MERCH anchor swap
7. Delete vote artifacts + Supabase dependency
8. `.env.example` documenting required vars

**Deploy:**
- Push preview branch, end-to-end test against production Shopify
- Mirror env vars in Vercel project settings (Production + Preview)
- Promote when products are published

**Post-deploy (24h):**
- Vercel logs for `/shop/*` errors
- Shopify admin → Orders to confirm flow
- Verify countdown across the May 8 → May 9 boundary (or fast-forward locally)

---

## Out of Scope (this iteration)

- Multi-product cart variants beyond two designs
- Discount codes (Shopify checkout still supports them on the hosted page)
- Customer accounts / login (no Customer Account API integration)
- Wishlist / favorites
- Inventory webhooks / real-time stock updates (60s revalidate is sufficient)
- Email notifications for low/restock (Shopify handles via its own emails)
- Analytics integration beyond what Shopify checkout already includes
- Internationalisation (single-locale German site)
- Accessibility audit beyond keyboard/ESC modal trap, focus rings, alt text

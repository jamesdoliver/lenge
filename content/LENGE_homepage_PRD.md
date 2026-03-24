# PRD: LENGE Artist Homepage
**Version:** 1.0  
**Deployment:** Vercel  
**Stack:** Next.js (App Router) · Tailwind CSS · Supabase · TypeScript

---

## 1. Project Overview

A single-page artist homepage for **LENGE** — an underground electronic / club music act. The page is a mobile-first landing hub linking fans to tickets, merch, and newsletter sign-up, and hosts an interactive **t-shirt design vote** where fans submit their email alongside their preference.

### Goals
- Faithfully replicate the dark, gothic club aesthetic shown in the reference design
- Drive ticket, merch, and newsletter conversions
- Capture fan emails + vote data for the t-shirt launch campaign
- Load fast and look flawless on mobile (primary traffic source: Instagram / social links)

---

## 2. Design System

### 2.1 Colour Palette

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#0d0b0e` | Page background |
| `--surface` | `#161318` | Card / overlay surfaces |
| `--border` | `#c9a227` | CTA button borders, decorative rules (gold) |
| `--accent` | `#8a5cf6` | CTA button text, logo colour (purple) |
| `--text-primary` | `#f0ecf5` | Body / nav text |
| `--text-muted` | `#6b6472` | Footer / small print |

### 2.2 Typography

- **Display / Wordmark:** `UnifrakturMaguntia` (Google Fonts) — used for the LENGE logo only. If unavailable, fallback to `MedievalSharp` or similar gothic blackletter.
- **Navigation & CTAs:** `Bebas Neue` (Google Fonts) — all caps, wide letter-spacing (`tracking-[0.2em]`)
- **Body / Labels:** `DM Mono` (Google Fonts) — uppercase, small size for footer and form labels
- **Font sizes:** scale mobile-first; nav ~14px, CTA buttons ~18px, headings as needed

### 2.3 Component Styles

**CTA Button:**
```
border: 2px solid var(--border)  [gold]
color: var(--accent)              [purple]
background: transparent
padding: 16px 32px
font: Bebas Neue, tracking-widest
text-transform: uppercase
hover: background rgba(138,92,246,0.08), slight scale(1.02) transition
```

**Input Field (vote form):**
```
background: transparent
border-bottom: 1px solid var(--border)
color: var(--text-primary)
No rounded corners — sharp, minimal
```

---

## 3. Page Architecture

Single scrollable page. No routing required beyond `/`. All sections stack vertically on mobile.

```
┌─────────────────────────┐
│  NAV (fixed, top)       │
├─────────────────────────┤
│  HERO (artist photo)    │
├─────────────────────────┤
│  CTA ROW (3 buttons)    │
├─────────────────────────┤
│  T-SHIRT VOTE SECTION   │
├─────────────────────────┤
│  FOOTER (social icons)  │
└─────────────────────────┘
```

---

## 4. Section Specs

### 4.1 Navigation Bar

- **Fixed** to top, `z-50`, full width
- Background: `rgba(13,11,14,0.85)` with `backdrop-blur-sm`
- Left: `TICKETS` text link → `#TICKETS_URL` *(placeholder)*
- Centre: **LENGE gothic wordmark** — rendered as the logo image (`/public/logo.png`) *(placeholder — see Assets section)*
- Right: `NEWSLETTER` text link → `#NEWSLETTER_URL` *(placeholder)*
- Mobile: same layout, reduce padding. Logo scales down to ~120px wide.
- No hamburger menu. Nav items stay visible on all breakpoints.

### 4.2 Hero Section

- Full-width artist photograph, no border radius
- Image fills width, natural aspect ratio preserved (do not crop on mobile — show the full image)
- Subtle dark vignette overlay on edges via CSS gradient
- Asset: `/public/hero.jpg` *(placeholder)*
- No text overlay on the photo

### 4.3 CTA Row

Three equal-width buttons side by side on desktop/tablet. On mobile: **stack vertically**, full width, with `8px` gap between.

| Button | Label | Link |
|---|---|---|
| 1 | TICKETS | `#TICKETS_URL` *(placeholder)* |
| 2 | MERCH | `#MERCH_URL` *(placeholder)* |
| 3 | NEWSLETTER | `#NEWSLETTER_URL` *(placeholder)* |

Padding above/below the row: `40px` vertical.

### 4.4 T-Shirt Vote Section

This replaces the crowd photo from the reference. This is the most interactive section of the page.

#### Layout
- Section heading: `"VOTE FOR THE DROP"` — Bebas Neue, ~28px, gold (`--border`), centered, uppercase
- Subheading: `"CHOOSE YOUR DESIGN · ENTER YOUR EMAIL · WE'LL NOTIFY YOU WHEN IT DROPS"` — DM Mono, small, muted, centered
- Two t-shirt design cards displayed **side by side** on mobile (equal columns, `gap-3`)
- Each card:
  - Image of the t-shirt design (full width of column)
  - Label below: `"DESIGN A"` / `"DESIGN B"` — Bebas Neue
  - Tapping/clicking a card selects it — highlight with gold border + subtle purple overlay
  - Only one card can be selected at a time
- Below the cards: email input field + submit button
  - Placeholder text: `"YOUR EMAIL"`
  - Submit button label: `"CAST VOTE"`
  - Submit button: full-width, gold border, purple text (same CTA style)
- On successful submission: **replace the entire vote form with a thank-you message**:
  - `"VOTE RECEIVED."` — Bebas Neue large
  - `"WE'LL HIT YOU WHEN IT DROPS."` — DM Mono small, muted

#### Validation
- Email must be a valid format before submission
- A design must be selected before submission
- If either is missing: show inline error in muted red — `"SELECT A DESIGN"` / `"ENTER A VALID EMAIL"`
- Disable submit button while request is in flight; show a minimal loading state (e.g. `"..."` or spinner)

#### Assets
- Design A image: `/public/tshirt-a.jpg` *(placeholder)*
- Design B image: `/public/tshirt-b.jpg` *(placeholder)*

### 4.5 Footer

- Centred layout
- Three social icon links (SVG icons, ~24px):
  - Instagram → `#INSTAGRAM_URL` *(placeholder)*
  - Twitter/X → `#TWITTER_URL` *(placeholder)*
  - YouTube → `#YOUTUBE_URL` *(placeholder)*
- Icons: white/muted, hover → `--accent` purple, `transition-colors`
- Use `lucide-react` icons or inline SVGs — do **not** use Font Awesome
- Below icons: `© 2024 LENGE. ALLE RECHTE VORBEHALTEN.` — DM Mono, 11px, `--text-muted`
- `80px` padding top/bottom

---

## 5. Supabase Schema

Create a **new** Supabase project. The following table is required.

### Table: `votes`

```sql
create table votes (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  design text not null check (design in ('A', 'B')),
  created_at timestamptz default now(),
  unique(email)  -- one vote per email address
);
```

> The `unique(email)` constraint prevents duplicate votes. Handle the resulting 409/23505 error on the client with the message: `"THIS EMAIL HAS ALREADY VOTED."` shown inline.

### Row-Level Security

Enable RLS on the `votes` table. Create one policy:

```sql
-- Allow inserts from anonymous (public) users only — no reads
create policy "Allow public inserts"
on votes for insert
to anon
with check (true);
```

No read access for anon users — vote tallies are not public-facing in this version.

---

## 6. API Route

Create a Next.js API route at `app/api/vote/route.ts`:

- **Method:** `POST`
- **Body:** `{ email: string, design: 'A' | 'B' }`
- **Logic:**
  1. Validate email format and design value server-side
  2. Insert into Supabase `votes` table using the service role key (never expose to client)
  3. On unique constraint violation → return `409` with `{ error: 'ALREADY_VOTED' }`
  4. On success → return `200` with `{ success: true }`
- Use `@supabase/supabase-js` with the **service role key** (stored in env var, never in client bundle)

---

## 7. Environment Variables

Create a `.env.local` file (add to `.gitignore`). Set the same vars in Vercel project settings.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> Only the service role key is truly secret. The anon key and URL are safe to expose but should still be managed via env vars for flexibility.

---

## 8. Tech Stack & Dependencies

```json
{
  "framework": "Next.js 14+ (App Router)",
  "language": "TypeScript",
  "styling": "Tailwind CSS",
  "database": "Supabase (PostgreSQL)",
  "icons": "lucide-react",
  "fonts": "next/font/google — UnifrakturMaguntia, Bebas Neue, DM Mono",
  "deployment": "Vercel"
}
```

Install:
```bash
npx create-next-app@latest lenge --typescript --tailwind --app
npm install @supabase/supabase-js lucide-react
```

---

## 9. Mobile-First Implementation Notes

- **Base styles target mobile** (375px+). Desktop overrides use `md:` and `lg:` prefixes only.
- Hero image: use `next/image` with `width={800} height={900} className="w-full"` — prioritise loading (`priority` prop)
- CTA buttons: `w-full` on mobile, `flex-1` within a `flex-row` on `md:`
- T-shirt cards: always side by side (`grid grid-cols-2`) — do not stack them even on small screens. Keep images square or portrait.
- Tap targets: minimum `44px` height for all interactive elements
- No hover-only states without a fallback active/focus style for touch
- Test at 375px, 390px (iPhone 14), 430px (iPhone 15 Pro Max)
- Font loading: use `display: swap` to prevent invisible text flash

---

## 10. Assets

All image assets are pre-supplied and must be sourced from the `/content/images/` directory. Do not use placeholder images — inspect the directory and map files to the roles below using best judgement on filenames.

| Role | Source path | Usage |
|---|---|---|
| Logo / wordmark | `/content/images/` | Gothic LENGE wordmark, nav centre |
| Artist hero photo | `/content/images/` | Full-width hero section |
| T-shirt Design A | `/content/images/` | Vote card left |
| T-shirt Design B | `/content/images/` | Vote card right |

Copy all required files into `/public/images/` as part of project setup. Reference them via `next/image` using the copied paths.

If any expected asset cannot be confidently identified in the directory, leave a `// TODO: confirm asset filename` comment at the relevant usage site rather than guessing.

---

## 11. Layout Reference

The canonical visual reference for the page layout is located at:

```
/content/layout/
```

Claude Code **must open and inspect the image(s) in this directory before writing any component**. Every layout decision — section order, spacing, nav structure, button arrangement, photo proportions, footer — should be validated against this reference. If any spec in this PRD conflicts with what is visible in the layout image, **the layout image takes precedence**.

Key layout observations from the reference image:
- Fixed top nav: left CTA link · centred wordmark · right CTA link
- Full-bleed hero photo below nav, no padding, no border radius
- Three equal CTA buttons in a horizontal row (TICKETS · MERCH · NEWSLETTER), with visible rectangular gold borders and purple text
- Vote section (replacing the lower crowd photo in the reference) — same full-bleed width as the hero
- Footer: social icons centred, copyright line beneath
- No sidebars, no columns, no decorative framing — everything is edge-to-edge or centred

---

## 12. Placeholder Links

Replace all instances of these strings before going live:

| Placeholder | Replace with |
|---|---|
| `#TICKETS_URL` | Ticketing platform link |
| `#MERCH_URL` | Merch store link |
| `#NEWSLETTER_URL` | Newsletter sign-up link |
| `#INSTAGRAM_URL` | Instagram profile URL |
| `#TWITTER_URL` | Twitter/X profile URL |
| `#YOUTUBE_URL` | YouTube channel URL |

---

## 13. Vercel Deployment

1. Push repo to GitHub
2. Import project in Vercel dashboard
3. Set all environment variables from section 7
4. Deploy — no custom build command needed (Next.js default)
5. Set custom domain if required

---

## 14. Out of Scope (v1)

- Multi-page routing
- Vote results / admin dashboard
- Confirmation emails to voters
- Auth / user accounts
- Analytics integration
- Merch store build

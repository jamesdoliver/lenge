# LENGE Homepage — Design Document

**Date:** 2026-03-24
**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Supabase · Vercel

---

## Overview

Single-page artist homepage for LENGE. Mobile-first landing hub linking fans to tickets, merch, and newsletter, with an interactive t-shirt design vote that captures emails. The vote section replaces the crowd photo shown in the layout reference image.

---

## Project Structure

```
lenge/
├── app/
│   ├── layout.tsx            # Root layout — fonts, bg color, metadata
│   ├── page.tsx              # Single page — composes all sections
│   ├── api/vote/
│   │   └── route.ts          # POST handler — validates + inserts to Supabase
│   └── globals.css           # Tailwind directives + CSS custom properties
├── components/
│   ├── Navbar.tsx            # Fixed nav — TICKETS / logo / NEWSLETTER
│   ├── Hero.tsx              # Full-bleed artist photo + vignette overlay
│   ├── CTARow.tsx            # Three action buttons
│   ├── VoteSection.tsx       # Client component — cards, form, states
│   └── Footer.tsx            # Social icons + copyright
├── lib/
│   └── supabase.ts           # Server-side Supabase client (service role key)
├── public/images/            # All assets copied from /content/
├── .env.local                # Blank Supabase keys
└── tailwind.config.ts        # Custom colors
```

Only `VoteSection.tsx` is a client component (`"use client"`). Everything else is a server component — no JS shipped for nav, hero, CTAs, or footer.

Font loading happens once in `layout.tsx` via `next/font/google`, exported as CSS variable classes on `<body>`.

---

## Design System

### Colors

| Token            | Value       | Usage                              |
|------------------|-------------|-------------------------------------|
| `--bg`           | `#0d0b0e`   | Page background                    |
| `--surface`      | `#161318`   | Card / overlay surfaces            |
| `--border`       | `#c9a227`   | CTA borders, decorative rules (gold)|
| `--accent`       | `#8a5cf6`   | CTA text, interactive (purple)     |
| `--text-primary` | `#f0ecf5`   | Body / nav text                    |
| `--text-muted`   | `#6b6472`   | Footer / small print               |

### Typography

- **UnifrakturMaguntia** — logo image only (not rendered as text)
- **Bebas Neue** — nav links, CTA buttons, headings. All caps, `tracking-[0.2em]`
- **DM Mono** — body, labels, footer. Uppercase where specified

### Component Styles

- **CTA Button:** transparent bg, `2px solid #c9a227`, `#8a5cf6` text, Bebas Neue, uppercase, `tracking-[0.2em]`, `py-4`. Hover: `rgba(138,92,246,0.08)` bg + `scale(1.02)` transition
- **Input field:** transparent bg, `border-b 1px solid #c9a227`, no other borders, sharp corners, DM Mono
- **Zero rounded corners anywhere**

---

## Section Specs

### 1. Navbar (Fixed)

- `z-50`, full-width, `rgba(13,11,14,0.85)` bg + `backdrop-blur-sm`
- Three-column flex: TICKETS (left) · logo image (center, ~120px mobile / ~160px desktop) · NEWSLETTER (right)
- Text links: Bebas Neue, uppercase, `tracking-[0.2em]`, `--text-primary`
- No hamburger menu — all items always visible

### 2. Hero

- Full-bleed `hero banner.jpg`, edge-to-edge, no padding, no border-radius
- `next/image` with `priority`, natural aspect ratio preserved
- CSS pseudo-element or overlay div for subtle radial vignette (dark edges)
- Top padding to account for fixed navbar height

### 3. CTA Row

- `flex flex-col gap-2` on mobile (stacked, full-width), `md:flex-row md:gap-4` on desktop
- Three buttons: TICKETS · MERCH · NEWSLETTER
- CTA button style (gold border, purple text)
- Min height 44px for tap targets
- `py-10 px-4` section padding

### 4. Vote Section

- Full-width, `px-4 py-12`, same bg as page (no wrapping card)
- **Heading:** `"VOTE FOR THE DESIGN"` — Bebas Neue, ~28px, gold (`#c9a227`), centered
- **Subheadings:** Three stacked lines, DM Mono, small (~12px), muted, centered:
  - `CHOOSE YOUR MERCH`
  - `ENTER YOUR EMAIL`
  - `KNOW WHEN IT DROPS`
- **Design cards:** `grid grid-cols-2 gap-3`. Each card is a button (keyboard accessible). Unselected: faint/transparent border. Selected: `2px solid #c9a227` + `rgba(138,92,246,0.10)` overlay. Label below: `"DESIGN A"` / `"DESIGN B"` in Bebas Neue, centered
- **Form:** `mt-6`. Full-width email input (gold bottom border, placeholder `"YOUR EMAIL"`). Full-width submit button (`"CAST VOTE"`, CTA style)
- **States:**
  - Validation errors: inline text, muted red (`#ef4444`), DM Mono small
  - Loading: button text → `"..."`, disabled
  - Success (200): entire form replaced → `"VOTE RECEIVED."` (Bebas Neue, large) + `"WE'LL HIT YOU WHEN IT DROPS."` (DM Mono, small, muted)
  - Duplicate (409): `"THIS EMAIL HAS ALREADY VOTED."` inline, form stays
  - Other error: `"SOMETHING WENT WRONG. TRY AGAIN."` inline

### 5. Footer

- Centered column, `py-20`
- Three `lucide-react` icons (Instagram, Twitter, Youtube), 24px, `#6b6472` default, hover → `#8a5cf6`
- Copyright: `© 2024 LENGE. ALLE RECHTE VORBEHALTEN.` — DM Mono, 11px, muted

---

## API Route — `app/api/vote/route.ts`

**Method:** POST
**Body:** `{ email: string, design: "A" | "B" }`

**Flow:**
1. Validate email (present + basic regex) and design (exactly `"A"` or `"B"`)
2. If invalid → `400 { error: "INVALID_INPUT" }`
3. Insert into Supabase `votes` table via service role client
4. On success → `200 { success: true }`
5. On unique violation (Postgres 23505) → `409 { error: "ALREADY_VOTED" }`
6. On other error → `500 { error: "SERVER_ERROR" }`

**Supabase client** (`lib/supabase.ts`): created with `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. Only imported server-side.

No client-side Supabase SDK — the form uses `fetch("/api/vote")`.

---

## Asset Mapping

| Role             | Source                              | Destination              |
|------------------|-------------------------------------|--------------------------|
| Logo / wordmark  | `content/images/Lenge Logo.png`     | `public/images/logo.png` |
| Hero photo       | `content/images/hero banner.jpg`    | `public/images/hero.jpg` |
| T-shirt Design A | `content/merch-vote/Merch1.jpeg`    | `public/images/tshirt-a.jpg` |
| T-shirt Design B | `content/merch-vote/Merch2.jpeg`    | `public/images/tshirt-b.jpg` |

`Lenge Vertical.jpg` is not used — the vote section replaces its position.

---

## Placeholder Links

| Placeholder       | Usage          |
|-------------------|----------------|
| `#TICKETS_URL`    | Nav + CTA      |
| `#MERCH_URL`      | CTA            |
| `#NEWSLETTER_URL` | Nav + CTA      |
| `#INSTAGRAM_URL`  | Footer icon    |
| `#TWITTER_URL`    | Footer icon    |
| `#YOUTUBE_URL`    | Footer icon    |

---

## Environment Variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Changes from PRD

- Vote section heading: `"VOTE FOR THE DESIGN"` (was `"VOTE FOR THE DROP"`)
- Vote section subheadings: three stacked lines — `CHOOSE YOUR MERCH` / `ENTER YOUR EMAIL` / `KNOW WHEN IT DROPS` (was a single dot-separated line)
- `Lenge Vertical.jpg` not used — vote section takes its position per PRD section 4.4

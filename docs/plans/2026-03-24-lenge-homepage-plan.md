# LENGE Homepage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a single-page Next.js artist homepage for LENGE with a t-shirt design vote backed by Supabase.

**Architecture:** Next.js App Router with 5 server components (Navbar, Hero, CTARow, Footer, page) and 1 client component (VoteSection). A single API route handles vote submissions via Supabase service role key. Mobile-first Tailwind styling with custom color tokens.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Supabase (PostgreSQL), lucide-react, Vercel deployment

**Reference files:**
- Design doc: `docs/plans/2026-03-24-lenge-homepage-design.md`
- PRD: `content/LENGE_homepage_PRD.md`
- Layout reference: `content/layout/homepage layout.png`

---

### Task 1: Scaffold Next.js Project & Copy Assets

**Step 1: Create the Next.js app in a temp directory and move files into repo root**

Run:
```bash
cd /Users/jamesoliver/WebstormProjects/lenge
npx create-next-app@latest nextapp --typescript --tailwind --app --src-dir=false --import-alias="@/*" --eslint --no-turbopack
```

Accept defaults. Then move the scaffolded files into the repo root:
```bash
# Move all files from nextapp/ into repo root (overwriting index.js, package.json)
cp -r nextapp/* nextapp/.* . 2>/dev/null || true
rm -rf nextapp
rm -f index.js
```

**Step 2: Install dependencies**

Run:
```bash
npm install @supabase/supabase-js lucide-react
```

**Step 3: Copy assets into public/images/**

Run:
```bash
mkdir -p public/images
cp "content/images/Lenge Logo.png" public/images/logo.png
cp "content/images/hero banner.jpg" public/images/hero.jpg
cp content/merch-vote/Merch1.jpeg public/images/tshirt-a.jpg
cp content/merch-vote/Merch2.jpeg public/images/tshirt-b.jpg
```

**Step 4: Create `.env.local` with blank keys**

Create: `.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Verify `.env.local` is in `.gitignore` (create-next-app includes it by default).

**Step 5: Verify setup**

Run:
```bash
npm run dev &
sleep 3
curl -s http://localhost:3000 | head -20
kill %1
```
Expected: HTML output from default Next.js page.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project and copy assets"
```

---

### Task 2: Tailwind Config & Global Styles

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

**Step 1: Update Tailwind config with custom colors**

Replace the contents of `tailwind.config.ts` with:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0d0b0e",
        surface: "#161318",
        border: "#c9a227",
        accent: "#8a5cf6",
        "text-primary": "#f0ecf5",
        "text-muted": "#6b6472",
      },
    },
  },
  plugins: [],
};
export default config;
```

**Step 2: Replace globals.css**

Replace the contents of `app/globals.css` with:

```css
@import "tailwindcss";

@theme {
  --color-bg: #0d0b0e;
  --color-surface: #161318;
  --color-border: #c9a227;
  --color-accent: #8a5cf6;
  --color-text-primary: #f0ecf5;
  --color-text-muted: #6b6472;
}
```

> Note: Next.js 15 with Tailwind v4 uses `@import "tailwindcss"` and `@theme` blocks instead of the old `@tailwind` directives and `tailwind.config.ts`. Check which version was scaffolded. If the generated `globals.css` uses `@tailwind base; @tailwind components; @tailwind utilities;`, keep that pattern and use the `tailwind.config.ts` colors instead. If it uses `@import "tailwindcss"`, use the `@theme` block and the `tailwind.config.ts` may not be needed.

**Step 3: Verify build still works**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add tailwind.config.ts app/globals.css
git commit -m "feat: configure Tailwind with LENGE color palette"
```

---

### Task 3: Root Layout — Fonts & Metadata

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Replace layout.tsx with font loading and metadata**

```tsx
import type { Metadata } from "next";
import { Bebas_Neue, DM_Mono } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
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
  description: "LENGE — underground electronic music",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bebasNeue.variable} ${dmMono.variable} bg-bg text-text-primary antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

> Note: `UnifrakturMaguntia` is not loaded as a font — the logo is rendered as an image (`public/images/logo.png`), not text.

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: configure root layout with Bebas Neue and DM Mono fonts"
```

---

### Task 4: Navbar Component

**Files:**
- Create: `components/Navbar.tsx`

**Step 1: Create the Navbar**

```tsx
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[rgba(13,11,14,0.85)] backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3 md:px-8">
        {/* TODO: replace with live URL */}
        <a
          href="#TICKETS_URL"
          className="font-[family-name:var(--font-bebas)] text-sm uppercase tracking-[0.2em] text-text-primary hover:text-accent transition-colors min-h-[44px] flex items-center"
        >
          TICKETS
        </a>

        <Image
          src="/images/logo.png"
          alt="LENGE"
          width={160}
          height={60}
          className="w-[120px] md:w-[160px] h-auto"
          priority
        />

        {/* TODO: replace with live URL */}
        <a
          href="#NEWSLETTER_URL"
          className="font-[family-name:var(--font-bebas)] text-sm uppercase tracking-[0.2em] text-text-primary hover:text-accent transition-colors min-h-[44px] flex items-center"
        >
          NEWSLETTER
        </a>
      </div>
    </nav>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds (component not yet used in page, but should compile).

**Step 3: Commit**

```bash
git add components/Navbar.tsx
git commit -m "feat: add fixed Navbar component with logo and nav links"
```

---

### Task 5: Hero Component

**Files:**
- Create: `components/Hero.tsx`

**Step 1: Create the Hero**

```tsx
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative w-full">
      <Image
        src="/images/hero.jpg"
        alt="LENGE live"
        width={1600}
        height={900}
        className="w-full h-auto"
        priority
      />
      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, #0d0b0e 100%)",
        }}
      />
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add components/Hero.tsx
git commit -m "feat: add Hero component with vignette overlay"
```

---

### Task 6: CTARow Component

**Files:**
- Create: `components/CTARow.tsx`

**Step 1: Create the CTA row**

```tsx
const links = [
  { label: "TICKETS", href: "#TICKETS_URL" }, // TODO: replace with live URL
  { label: "MERCH", href: "#MERCH_URL" }, // TODO: replace with live URL
  { label: "NEWSLETTER", href: "#NEWSLETTER_URL" }, // TODO: replace with live URL
];

export default function CTARow() {
  return (
    <section className="px-4 py-10 md:px-8">
      <div className="flex flex-col gap-2 md:flex-row md:gap-4">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="flex-1 border-2 border-border bg-transparent text-accent text-center font-[family-name:var(--font-bebas)] text-lg uppercase tracking-[0.2em] py-4 px-8 min-h-[44px] flex items-center justify-center hover:bg-[rgba(138,92,246,0.08)] hover:scale-[1.02] transition-all"
          >
            {link.label}
          </a>
        ))}
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add components/CTARow.tsx
git commit -m "feat: add CTARow component with three action buttons"
```

---

### Task 7: Footer Component

**Files:**
- Create: `components/Footer.tsx`

**Step 1: Create the Footer**

```tsx
import { Instagram, Twitter, Youtube } from "lucide-react";

const socials = [
  { icon: Instagram, href: "#INSTAGRAM_URL", label: "Instagram" }, // TODO: replace with live URL
  { icon: Twitter, href: "#TWITTER_URL", label: "Twitter" }, // TODO: replace with live URL
  { icon: Youtube, href: "#YOUTUBE_URL", label: "YouTube" }, // TODO: replace with live URL
];

export default function Footer() {
  return (
    <footer className="py-20 flex flex-col items-center gap-4">
      <div className="flex gap-6">
        {socials.map(({ icon: Icon, href, label }) => (
          <a
            key={label}
            href={href}
            aria-label={label}
            className="text-text-muted hover:text-accent transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Icon size={24} />
          </a>
        ))}
      </div>
      <p className="font-[family-name:var(--font-dm-mono)] text-[11px] text-text-muted uppercase">
        &copy; 2024 LENGE. ALLE RECHTE VORBEHALTEN.
      </p>
    </footer>
  );
}
```

**Step 2: Commit**

```bash
git add components/Footer.tsx
git commit -m "feat: add Footer component with social icons and copyright"
```

---

### Task 8: Supabase Client & API Route

**Files:**
- Create: `lib/supabase.ts`
- Create: `app/api/vote/route.ts`

**Step 1: Create the server-side Supabase client**

```typescript
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

**Step 2: Create the API route**

```typescript
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  let body: { email?: string; design?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const { email, design } = body;

  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !design ||
    (design !== "A" && design !== "B")
  ) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const { error } = await supabase
    .from("votes")
    .insert({ email, design });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "ALREADY_VOTED" }, { status: 409 });
    }
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add lib/supabase.ts app/api/vote/route.ts
git commit -m "feat: add Supabase client and /api/vote POST route"
```

---

### Task 9: VoteSection Client Component

**Files:**
- Create: `components/VoteSection.tsx`

This is the only `"use client"` component. It manages card selection, email input, form submission, and all error/success states.

**Step 1: Create VoteSection**

```tsx
"use client";

import Image from "next/image";
import { useState } from "react";

type Design = "A" | "B";

export default function VoteSection() {
  const [selected, setSelected] = useState<Design | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setError("");

    if (!selected) {
      setError("SELECT A DESIGN");
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("ENTER A VALID EMAIL");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, design: selected }),
      });

      if (res.ok) {
        setSubmitted(true);
        return;
      }

      if (res.status === 409) {
        setError("THIS EMAIL HAS ALREADY VOTED.");
        return;
      }

      setError("SOMETHING WENT WRONG. TRY AGAIN.");
    } catch {
      setError("SOMETHING WENT WRONG. TRY AGAIN.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <section className="px-4 py-12 text-center">
        <h2 className="font-[family-name:var(--font-bebas)] text-4xl text-text-primary uppercase tracking-[0.2em]">
          VOTE RECEIVED.
        </h2>
        <p className="font-[family-name:var(--font-dm-mono)] text-sm text-text-muted mt-2 uppercase">
          WE&apos;LL HIT YOU WHEN IT DROPS.
        </p>
      </section>
    );
  }

  return (
    <section className="px-4 py-12">
      {/* Heading */}
      <h2 className="font-[family-name:var(--font-bebas)] text-[28px] text-border text-center uppercase tracking-[0.2em]">
        VOTE FOR THE DESIGN
      </h2>

      {/* Subheadings */}
      <div className="mt-3 text-center font-[family-name:var(--font-dm-mono)] text-xs text-text-muted uppercase leading-relaxed">
        <p>CHOOSE YOUR MERCH</p>
        <p>ENTER YOUR EMAIL</p>
        <p>KNOW WHEN IT DROPS</p>
      </div>

      {/* Design Cards */}
      <div className="grid grid-cols-2 gap-3 mt-8">
        {(["A", "B"] as const).map((design) => (
          <button
            key={design}
            type="button"
            onClick={() => setSelected(design)}
            className={`relative border-2 transition-all ${
              selected === design
                ? "border-border"
                : "border-transparent"
            }`}
          >
            {selected === design && (
              <div className="absolute inset-0 bg-[rgba(138,92,246,0.10)] z-10 pointer-events-none" />
            )}
            <Image
              src={`/images/tshirt-${design.toLowerCase()}.jpg`}
              alt={`T-shirt design ${design}`}
              width={400}
              height={250}
              className="w-full h-auto"
            />
            <p className="font-[family-name:var(--font-bebas)] text-text-primary text-center text-base uppercase tracking-[0.2em] py-2">
              DESIGN {design}
            </p>
          </button>
        ))}
      </div>

      {/* Email + Submit */}
      <div className="mt-6">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="YOUR EMAIL"
          className="w-full bg-transparent border-b border-border text-text-primary font-[family-name:var(--font-dm-mono)] text-sm uppercase tracking-[0.2em] py-3 px-0 outline-none placeholder:text-text-muted"
        />

        {error && (
          <p className="font-[family-name:var(--font-dm-mono)] text-xs text-red-500 mt-2 uppercase">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-4 border-2 border-border bg-transparent text-accent font-[family-name:var(--font-bebas)] text-lg uppercase tracking-[0.2em] py-4 min-h-[44px] hover:bg-[rgba(138,92,246,0.08)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "..." : "CAST VOTE"}
        </button>
      </div>
    </section>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add components/VoteSection.tsx
git commit -m "feat: add VoteSection client component with vote form and state management"
```

---

### Task 10: Compose Page & Verify

**Files:**
- Modify: `app/page.tsx`

**Step 1: Replace page.tsx to compose all sections**

```tsx
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CTARow from "@/components/CTARow";
import VoteSection from "@/components/VoteSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="pt-[72px]">
        <Hero />
        <CTARow />
        <VoteSection />
      </main>
      <Footer />
    </>
  );
}
```

> The `pt-[72px]` accounts for the fixed navbar height. Adjust if needed after visual check.

**Step 2: Run full build verification**

Run:
```bash
npx tsc --noEmit
npm run build
```

Expected: Both pass with zero errors.

**Step 3: Visual check**

Run: `npm run dev`

Open `http://localhost:3000` and verify:
- Nav is fixed at top with TICKETS / logo / NEWSLETTER
- Hero image is full-bleed below nav
- Three CTA buttons are stacked on mobile, row on desktop
- Vote section shows heading, subheadings, two design cards side-by-side, email input, CAST VOTE button
- Footer has three social icons and copyright text
- All text uses correct fonts (Bebas Neue for headings/CTAs, DM Mono for body)
- Colors match: dark bg, gold borders, purple text on buttons
- Zero rounded corners anywhere

Compare against `content/layout/homepage layout.png`.

**Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: compose homepage with all sections"
```

---

### Task 11: Final Cleanup & Build Verification

**Step 1: Remove unused default files**

Delete any remaining scaffolded default content that isn't used (e.g., default SVGs in `public/`, unused CSS). Keep `favicon.ico`.

**Step 2: Verify `.env.local` is gitignored**

Run:
```bash
grep -q ".env.local" .gitignore && echo "OK" || echo "MISSING"
```

Expected: `OK`

**Step 3: Final build**

Run:
```bash
npx tsc --noEmit && npm run build
```

Expected: Clean pass, zero errors, Vercel-ready.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: clean up scaffolding defaults"
```

---

## Definition of Done Checklist

After all tasks, verify each item:

- [ ] All five sections render correctly on mobile (375px)
- [ ] Layout matches `content/layout/homepage layout.png`
- [ ] All assets from `/content/images/` and `/content/merch-vote/` loaded and displaying
- [ ] Vote form submits to `/api/vote`, stores in Supabase, shows thank-you state
- [ ] Duplicate email returns inline error without resetting the form
- [ ] Social icon links present in footer (with placeholder hrefs)
- [ ] `.env.local` created with blank keys and gitignored
- [ ] No TypeScript errors (`tsc --noEmit` passes)
- [ ] `npm run build` completes without errors (Vercel-ready)

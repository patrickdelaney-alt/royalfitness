# Handoff: Royal iOS Signup Flow

> **For a non-coder handing this off to Claude Code.** This document is written in plain English for you (the product owner) with a clearly-marked section at the bottom for Claude Code to read directly.

---

## Part 1 — What this is (read this yourself)

You designed an 8-screen signup flow for Royal. The design lives as an HTML prototype on a canvas (you can click through it, but it's not real code your app can use).

**The job:** take those 8 screens and rebuild them as real screens inside your existing Royal app (the Next.js codebase at `patrickdelaney-alt/royalfitness` that you already ship to iOS via Capacitor).

**You don't write any of this.** You hand this whole folder to Claude Code and say: *"Read `handoff/README.md` and implement the onboarding flow."* Claude Code will open each HTML file, read the designs, and write real TypeScript/React code inside your repo — in the same style as the rest of your app.

---

## Part 2 — How to actually do it (still you, non-coder)

**Step 1 — Download this folder.** There's a download button at the end of the chat.

**Step 2 — Open your Royal repo in Claude Code.**
- Install Claude Code from [claude.com/claude-code](https://claude.com/claude-code) if you haven't.
- In your terminal: `cd` into your `royalfitness` repo folder, then run `claude`.

**Step 3 — Drop the handoff folder into your repo.** Unzip the download, move the folder inside the repo root (alongside `src/`, `package.json`, etc.). Name it `handoff_onboarding/`.

**Step 4 — Ask Claude Code to do it.** Paste this prompt:

> Read `handoff_onboarding/README.md` and then implement the 8-screen onboarding flow it describes inside this Next.js app. Match the existing code patterns (folder layout under `src/app`, Tailwind classes, the token names already in `globals.css`). The HTML files in the handoff folder are design references — recreate them as real React components, don't copy the HTML directly. When you're done, show me how to run the app so I can click through it.

Claude Code will ask clarifying questions as it goes. Answer them in plain English. It will make a pull request or just edit files directly — either way it'll tell you what it did.

**Step 5 — Click through it.** When Claude Code says it's done, open the app locally (it'll tell you how) and tap through the 8 screens. If anything looks wrong, screenshot it and tell Claude Code.

That's the whole workflow.

---

## Part 3 — Everything below is for Claude Code

Stop reading. The rest of this file is the technical spec.

---

# Technical spec (Claude Code: start here)

## Context

You're implementing an 8-screen onboarding flow for Royal — a wellness/fitness app where users log workouts and meals, follow people, and earn royalties by sharing referral links to products from a personal catalog. The codebase is Next.js 15 (App Router), deployed to Vercel, wrapped with Capacitor for iOS. Tokens live in `src/app/globals.css`. Icons are `react-icons/hi2`.

## Fidelity

**High fidelity.** The HTML prototypes in `screens/` are pixel-specific — exact colors, exact type sizes, exact spacing. Match them. Don't re-design. When in doubt about a value, grep `screens/screens-*.jsx` for the token.

## What to build

A linear 8-step onboarding routed as `/onboarding/<step>`. State (current step, form values) persists so a user can refresh or return later. The four educational steps (Follow, First Post, Catalog, Royalties) are **skippable** — the skip link matters, they're teaching moments, not gates.

## Routes

```
src/app/onboarding/
  layout.tsx              ← TopBar (back/dots/skip) + shared container
  welcome/page.tsx        ← step 1
  account/page.tsx        ← step 2
  profile/page.tsx        ← step 3
  follow/page.tsx         ← step 4   (skippable)
  first-post/page.tsx     ← step 5   (skippable)
  catalog/page.tsx        ← step 6   (skippable)
  royalties/page.tsx      ← step 7   (skippable)
  done/page.tsx           ← step 8
```

On mount of `/onboarding/layout.tsx`, check `profile.onboarding_step`; if set and not `done`, redirect to that step. On every "Continue" click, update that field before navigating.

## Design tokens (add to `tailwind.config.ts` if not present)

Source of truth is `../colors_and_type.css` in the project root. Key values you'll need:

| Token         | Hex        | Use                                         |
| ------------- | ---------- | ------------------------------------------- |
| `bg`          | `#EEE8DC`  | page background (every screen)              |
| `surface`     | `#F6F1E4`  | cards, inputs, list rows                    |
| `surface-2`   | `#E3DCCB`  | inactive segmented tab                      |
| `brand`       | `#1F3A10`  | primary button, active dot, step number     |
| `brand-soft`  | `#8FA878`  | filled progress dots, avatar fallback       |
| `mustard`     | `#BBA24C`  | **royalty accent — this color only here**   |
| `coral`       | `#E99B90`  | not used in this flow                       |
| `text`        | `#18190F`  | all primary text                            |
| `muted`       | `#6E6A58`  | secondary text, eyebrow labels              |
| `subtle`      | `#908A74`  | placeholder text                            |
| `border`      | `rgba(36,63,22,0.10)`  | default 1px border             |
| `border-strong` | `rgba(36,63,22,0.18)` | ghost button border            |

Fonts (already in the repo via `next/font`):
- **Plus Jakarta Sans** — everything
- **Cormorant Garamond** — used in only 2 places in this flow: welcome wordmark "Royal" (34px / 400) and done screen "You're in." (44px / 400)

Radii: 12 (small btn/tab), 14 (input/list row), 16 (primary button), 18 (card), 20 (post card), pill (9999).

## Screen-by-screen spec

Each HTML file in `screens/` renders that single screen inside a 390×844 iPhone frame. Strip the frame; copy the screen body into a page component. The JSX files (`screens-a/b/c.jsx`) are the most accurate source — use them.

### 1. Welcome (`welcome/page.tsx`)

- Full `bg` background, 28px horizontal padding, vertical centering.
- **Wordmark:** "Royal" in Cormorant Garamond 34px / 400, `text` color, letter-spacing -0.5px.
- 14px below: tagline "For people who take their health seriously." — Jakarta 15/500, `muted`, max-width 280px.
- 64px below: three `FeatureLine` items, 22px gap between. Each is a 10×10 `brand`-colored dot + title (Jakarta 16/600) + sub (Jakarta 13/400 `muted`, 2px gap):
  - *Log workouts & wellness* / As simple or as detailed as you like.
  - *Follow people you trust* / Real routines, not performance.
  - *Earn royalties* / On the products you already recommend.
- Bottom buttons, 10px gap, 36px bottom padding:
  - Primary "Create account" → `/onboarding/account`
  - Ghost "I already have an account" (44px height, transparent, Jakarta 14/500 `muted`) → sign-in route

### 2. Create account (`account/page.tsx`)

- TopBar: back chevron + 6-dot progress (active: index 0) + no skip.
- 28px top padding after topbar: "Create your account" (Jakarta 26/600, letter-spacing -0.015em) + "One minute, then you're in." 8px below (Jakarta 14/400 `muted`).
- Inputs (see **Input spec** below): Email, Password.
- Fine print below inputs: "By continuing you agree to the Terms and Privacy Policy." — 12px `subtle`, line-height 1.5.
- Primary button "Continue" at bottom → `/onboarding/profile` after supabase signup.

### 3. Profile basics (`profile/page.tsx`)

- TopBar: back + dots (active 1) + no skip.
- Title: "A little about you" / "How you'll show up on Royal."
- **Avatar picker:** centered, 96×96 circle with initials on `brand-soft`. Bottom-right corner: 30×30 `brand` circle with a plus glyph, 3px `bg` border (creates the cutout look). Tap → image picker.
- Inputs: Name, Username, Bio. Check username uniqueness against `profiles.username`.
- Primary "Continue" → `/onboarding/follow`.

### 4. Follow people (`follow/page.tsx`) — **skippable**

- TopBar: back + dots (active 2) + "Skip" (right side, Jakarta 14/500 `muted`, no border).
- Title: "Follow a few people" / "Your feed is what they post — workouts, meals, recovery, things they actually use."
- Scrollable list of suggested profiles (fetch from an RPC like `suggested_follows(limit 5)`). Each row: 44×44 avatar, name (Jakarta 15/600) + bio (Jakarta 13/400 `muted`, truncate), right-side toggle button.
  - **Toggle button:** 34px tall, 17px radius. Inactive: transparent, `border-strong` 1px, "Follow", Jakarta 13/600 `text`. Active: `brand` background, `surface` text, "Following", no border.
- Row container: `surface` bg, 16px radius, 1px `border`, 14px padding, 8px gap between rows.
- Bottom: small caption "Following {n} · you can tap Search anytime to find more" (12px `subtle`, centered, 12px above button) + primary "Continue" → `/onboarding/first-post`.

### 5. Log first session (`first-post/page.tsx`) — **skippable**

- TopBar: back + dots (active 3) + Skip.
- Title: "Log your first session" / "Post a quick note or log every set. Both count."
- **Type picker** — 3-way segmented control: Workout / Wellness / Meal. Each button: `flex: 1`, 40px tall, 12px radius. Active: `brand` bg, `surface` text. Inactive: `surface-2` bg, `text`. Jakarta 13/600. 6px gap.
- **Composer card** (`surface`, 18px radius, 1px `border`, 16px padding): small eyebrow "CAPTION" (11/600 `muted`, 0.16em tracking), then a textarea placeholder rendered as body text (Jakarta 15/400 `text`, line-height 1.5).
- **"Add exercises" toggle card** (14px below composer): same `surface`/18px/border card, between title + subtitle on left and an iOS-style toggle on right. Toggle default ON — that's how users discover the detailed mode.
- **Exercise rows** (visible when toggle ON): `surface` bg, 14px radius, 1px `border`, plus a **3px left border in `brand`** — the post-type accent pattern. Each row: exercise name (Jakarta 14/600) left, detail like "5 × 5 · 185 lb" (Jakarta 12/500 `muted`, tabular-nums) right. 12/14px padding.
- Below rows: dashed "+ Add exercise" button — 44px, `border-strong` dashed, `muted` text.
- Primary "Post session" → `/onboarding/catalog`. Actually create the post in the DB; this is their first real post.

### 6. Catalog (`catalog/page.tsx`) — **skippable**

- TopBar: back + dots (active 4) + Skip.
- Eyebrow **in mustard**: "YOUR CATALOG" (first appearance of mustard in the flow — signals "earning" territory).
- Title: "Add things you actually use" / "Referral links, discount codes, and products. This is what you'll share to earn royalties."
- **Paste-link tile:** `surface` card, 18px radius, 42×42 `brand` tile with "+" glyph on left, then "Paste a link or code" (14/600) + "We'll pull the product details automatically" (12/400 `muted`).
- Section eyebrow: "IN YOUR CATALOG · {count}" (`muted`, not mustard — only the page-level eyebrow is mustard).
- **Catalog item rows:** 44×44 initials tile (`surface-2`, Cormorant 18px `muted` letter) + name + small meta row (kind · mustard code) + **mustard pill** on the right showing percentage/$-off. Pill bg: `rgba(187,162,76,0.15)`, text: `mustard`, 11/700 tabular-nums.
- Primary "Continue" → `/onboarding/royalties`.

### 7. Royalties explainer (`royalties/page.tsx`) — **skippable**

- TopBar: back + dots (active 5) + Skip.
- Eyebrow mustard: "EARN ROYALTIES". Title: "Share a catalog item, get paid" / "Attach a catalog item to any post. When someone uses your link or code, you earn royalties."
- **Live-ish post preview** (`surface`, 20px radius, 1px `border`, overflow-hidden):
  - Header: 36px avatar + username (13/600) + "Just now · Morning run" (11/400 `muted`).
  - Caption block: 14/400 `text`, line-height 1.55.
  - **Faux photo block:** 180px tall, `linear-gradient(135deg, brand-soft 0%, brand-light 100%)` — this is one of the two documented gradient exceptions. Contains a 📍 location pill bottom-left. *(The 📍 is the one emoji allowed in this flow — location marker in user content, not system copy.)*
  - **Royalty chip** (12px margin inside the card): `rgba(187,162,76,0.10)` bg, `rgba(187,162,76,0.35)` border, 14px radius. Contains: initials tile, eyebrow "EARNING ROYALTIES" in mustard (10/700, 0.15em tracking), and "LMNT Electrolyte · royal.to/lmnt" (13/600 `text`). Right-side chevron.
- Below preview: 3-step "how it works" numbered list. 22×22 `brand` circle with `surface` number (Jakarta 11/700) + text line (Jakarta 14).
- Primary "I get it" → `/onboarding/done`.

### 8. Done (`done/page.tsx`)

- TopBar: dots only, no back, no skip.
- Vertically centered, 32px horizontal padding:
  - 88×88 `brand` circle with checkmark SVG (38×38, `surface` stroke, strokeWidth 3, rounded linecaps).
  - 32px below: **"You're in."** in Cormorant Garamond 44/400, letter-spacing -0.015em, line-height 1.05.
  - 14px below: "Post what you actually do. Share what you actually use. The rest is details." (15/400 `muted`, max-width 300).
- Primary "Go to feed" → `/feed` + mark `profile.onboarding_step = 'done'`.

## Shared components to build

### `<OnboardingTopBar step={n} total={6} showBack showSkip onBack onSkip />`

- 56px top padding, 20px horizontal.
- **Back chevron:** 36×36 `surface` circle, 1px `border`, chevron SVG.
- **Progress dots:** `total` dots, each 6px tall. Active dot is 22px wide × 6 tall × 3 radius, `brand`. Completed dots are 6×6, `brand-soft`. Future dots are 6×6, `border-strong`. 6px gap. 200ms transition on width/color.
- **Skip:** Jakarta 14/500 `muted`, no border, transparent, right-aligned in 48px cell.

Back/skip cells are 48px wide even when empty — keeps the progress-dots row centered.

### `<RInput label value placeholder />`

- Label: eyebrow style (11/600 `muted`, 0.16em tracking, uppercase), 8px below it the input.
- Input: 52px tall, 14px radius, `surface` bg, 1px `border`, 16px horizontal padding. Text: Jakarta 16/500. Placeholder: `subtle`. 16px margin-bottom.

### `<RPrimaryBtn>` / `<RGhostBtn>`

- Primary: 100% wide, 54px tall, 16px radius, `brand` bg, `surface` text, Jakarta 16/600, `box-shadow: 0 2px 8px rgba(31,58,16,0.18)`. Hover: `brand-mid`. Active: `scale(0.97)`.
- Ghost: same shape, transparent, `text` color, 1px `border-strong`, 16/500.
- Both respect `prefers-reduced-motion` — no scale on active.

### `<RAvatar initials size={44} />`

- `size` × `size` circle, `brand-soft` bg, `surface` text, Jakarta `size × 0.36` / 600, letter-spacing -0.02em. Fallback when no photo.

## Copy — use these strings verbatim

No emoji anywhere in system copy. The only emoji allowed in this flow is the `📍` location marker inside user-authored caption/location chips. Never "affiliate," "commission," "passive income," or "monetize" — always "earn royalties," "referral link."

All strings appear above in the per-screen spec.

## State to persist

```ts
// profiles table additions (if not present)
onboarding_step: 'welcome' | 'account' | 'profile' | 'follow' | 'first-post' | 'catalog' | 'royalties' | 'done'
```

Update on every Continue click before navigation. On layout mount, if step !== 'done' and the user is authed, redirect from `/onboarding/welcome` to their last step.

## Data touches

- **Account step:** Supabase email+password signup → creates `profiles` row.
- **Profile step:** upload avatar to Supabase storage, update `profiles.name/username/bio`. Validate username uniqueness (existing pattern in your `useProfileForm` hook — use it).
- **Follow step:** fetch suggested follows (create a `suggested_follows` RPC or reuse existing search). Toggle writes to `follows` table.
- **First-post step:** create a real post in `posts` (type = workout/wellness/meal, caption, optional `post_exercises` rows).
- **Catalog/Royalties:** read-only demos. Don't require user to add catalog items here — that's its own flow later.

## Files in this handoff

```
handoff_onboarding/
  README.md                     ← this file
  screens/
    screen-1-welcome.html       ← preview (one screen per file, easy to open)
    screen-2-account.html
    screen-3-profile.html
    screen-4-follow.html
    screen-5-first-post.html
    screen-6-catalog.html
    screen-7-royalties.html
    screen-8-done.html
    screens-a.jsx               ← Welcome / Account / Profile source
    screens-b.jsx               ← Follow / First-post source
    screens-c.jsx               ← Catalog / Royalties / Done source
    royal-primitives.jsx        ← RPrimaryBtn / RInput / RTopBar / RAvatar
  colors_and_type.css           ← token source of truth
  full-canvas.html              ← all 8 screens side-by-side on a canvas
```

The `screens-*.jsx` files are the accurate source — pull exact values from there, not from the single-screen HTML previews (which are just nicer viewing).

## Definition of done

1. All 8 routes exist and link correctly (Continue and Back).
2. Skip links on steps 4–7 jump straight to step 8.
3. Progress dots animate (width transition) when the active step changes.
4. Onboarding step is persisted; reload resumes at the correct step.
5. Fresh signup completes the flow and lands on `/feed` with:
   - a `profiles` row populated from step 3,
   - followed users from step 4 (if they followed any),
   - one real post from step 5 (if they didn't skip).
6. Pixel check against `screens/screen-*.html` — every color, type, radius, and spacing matches.
7. `prefers-reduced-motion` respected on all transitions.

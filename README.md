# هو كل يوم أكل (Howa Kol Yom Akl)

An Arabic-first (Egyptian) recipe app for React Native, Android and the web, built with Expo. The goal is a warm, fast, **voice-first** cooking companion — a trusted "relative in the kitchen" that reads recipes out loud in Egyptian colloquial Arabic while your hands are busy.

> **Status: active development.** The app is a working product on a live Supabase backend: 50 recipes, Clerk authentication, server-side Arabic-aware search, persistent favorites, and real narrated MP3s (ElevenLabs / Edge TTS) served from Supabase Storage. See [Project Status](#10-project-status) for what is done and what is still open.

**Quick links:** [Overview](#1-overview) · [Features](#2-features) · [Stack](#3-tech-stack) · [Architecture](#4-architecture) · [Structure](#5-project-structure) · [Setup](#6-setup) · [Backend](#8-backend-supabase) · [Auth](#9-authentication-clerk) · [Narration](#10-narration-pipeline) · [Status](#11-project-status) · [Roadmap](#12-roadmap) · [Conventions](#13-development-conventions)

---

## 1. Overview

هو كل يوم أكل ("Howa Kol Yom Akl") helps Egyptian home cooks find reliable recipes quickly and follow them **without reading** — written recipes are hard to use mid-cooking, and hands covered in flour can't scroll. Every recipe has a dedicated page with ingredients, written steps, tips, and an audio narration button that plays real Egyptian-Arabic voice-over.

Egyptian colloquial Arabic is the product's language throughout: UI copy, recipe content, and narration. Not Modern Standard Arabic.

---

## 2. Features

### Recipes & browsing
- **Home screen** — greeting, a rotating featured hero card (one random recipe per app launch, never the same twice in a row), a search box, a category filter row (real filtering, derived from the live catalog), a list/grid view toggle (persisted), and the recipe feed.
- **Recipe detail** — full-bleed hero, title/description, stats (time, servings, difficulty, rating), tabbed **Ingredients / Steps / Tips** sections, favorite toggle, native share, and a **Listen** button for recipes with real narration.
- **Search** — server-side, bounded, per-column `ILIKE` matching over title, description, and category, plus category chips. Works for colloquial input (`ملوخ` → `ملوخية`, `شاميل` → `بشاميل`). Results are cached per term/category by React Query.
- **Favorites** — persisted to device storage (`AsyncStorage`), so they survive restarts. Hydration-safe: a toggle made before storage loads is never clobbered. Stale ids are pruned against the live catalog.
- **Catalog integrity guard** — a dev-only check logs duplicate or missing recipe ids, since ids are the navigation key everywhere.

### Interface
- **Arabic RTL throughout** — `I18nManager` on native, `dir="rtl"` on the web root, single source of truth in `src/i18n/rtl.ts`.
- **Cairo font**, shipped as real per-weight static files (`fontFamilyFor(weight)`), so no synthesised bold on any platform.
- **Three tabs** (الرئيسية / المفضلة / حسابي) with a custom bottom bar: sliding active pill, icon scale, and `Reduce Motion` support. Search lives on Home, not as its own tab.
- **Design tokens** in `src/theme` (colors, spacing, typography, elevation, shared responsive frame) mirroring `design.md`.
- **Eastern-Arabic numerals** for quantities via `src/i18n/numerals.ts`.

### Audio & voice
- **Real narration playback** — `expo-audio` player behind a `Listen` button, driven by the recipe's `audio_urls` row. Placeholder/`example.com` URLs are detected and the button is hidden instead of offering a dead tap.
- **Voice generation tooling** — `scripts/generate-narration.ts` (ElevenLabs, shared voice/model/format) and `scripts/generate_recipe_audio.py` (Edge TTS `ar-EG-SalmaNeural`, no API key). Both produce one MP3 per recipe id, resumable, dry-run supported.

### Platform
- One codebase for **Android (primary), Web, and iOS**.
- Cloudinary-hosted card images with a smaller-image variant for grid cards.

**Not built yet:** cooking mode / step-by-step full-screen flow, per-step audio, offline mode, tests, linting, CI. See [Roadmap](#12-roadmap).

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 57 · React Native 0.86 · React 19 |
| Language | TypeScript (strict) |
| Navigation | React Navigation v6 — native-stack + bottom-tabs |
| Auth | Clerk (`@clerk/expo`) — email/password + Google SSO, SecureStore token cache |
| Data fetching | TanStack Query v5 (cached: 5 min fresh, 30 min gc, no refetch-on-focus) |
| Client state | Zustand v4 (`favorites`, `viewMode`) persisted via AsyncStorage |
| Backend | Supabase — PostgreSQL + Storage + RLS (`@supabase/supabase-js` v2) |
| Audio | `expo-audio` |
| Media | Cloudinary (recipe images) |
| Web | `react-native-web` 0.21 |
| Fonts / Icons | `expo-font` (Cairo) · `@expo/vector-icons` (Feather) |
| Safe areas | `react-native-safe-area-context` |

---

## 4. Architecture

Three layers, one dependency direction:

```
Screens & Components (UI)
        │  hooks only, never a client
        ▼
Data layer      src/data/queries.ts   (TanStack Query hooks + searchRecipes)
                src/state/*.ts        (Zustand stores)
        │
        ▼
Infrastructure  src/lib/supabase.ts   (the only module holding a Supabase client)
                src/lib/clerkErrors.ts, src/lib/audio.ts, src/lib/images.ts
```

Rules that hold today:

- **Screens never touch Supabase.** All reads go through hooks in `src/data/queries.ts` (`useRecipes`, `useRecipe`, `useRecipeSearch`, `useRecipeCategories`).
- **The catalog is filtered at the source.** The list/detail/category queries use `ingredients!inner` so a recipe with no authored ingredients never appears as an empty detail screen — and reappears automatically once its ingredients land.
- **One mapping function** (`mapRecipe`) serves both list and detail, so a new column is added in one place.
- **Theme, i18n, and RTL are centralised** in `src/theme` and `src/i18n`; screens use tokens, never hard-coded values.
- **Media URLs are validated before rendering** (`hasRealAudio`, `hasRealPhoto`) so placeholder hosts never produce a broken UI.

---

## 5. Project Structure

```
├── app.json                     # Expo config (name, scheme, plugins)
├── index.js                     # Entry: layout direction, then App
├── src/
│   ├── app/App.tsx              # ClerkProvider → QueryClient → SafeArea → Navigation; font + RTL gate
│   ├── navigation/RootNavigator.tsx  # Stack (Welcome, SignIn, SignUp, Tabs, RecipeDetail) + custom tab bar
│   ├── screens/                 # Home, Favorites, Profile, RecipeDetail, Welcome, SignIn, SignUp
│   ├── components/              # AppHeader, RecipeCard(+Grid/List/Media), RecipeMeta, CategoryFilter,
│   │                            #   CategoryChip, ViewToggle, ListenButton, VoiceAssistantCard, auth inputs
│   ├── data/queries.ts          # All Supabase reads + searchRecipes
│   ├── state/                   # favorites.ts · viewMode.ts (Zustand + AsyncStorage)
│   ├── hooks/useAudioPlayer.ts  # expo-audio wrapper
│   ├── lib/                     # supabase · audio · images · imageUrl · heroPick · clerkErrors
│   ├── theme/                   # Design tokens + ResponsiveProvider
│   ├── i18n/                    # strings (Egyptian Arabic) · numerals · rtl
│   ├── types/recipe.ts          # Recipe / RecipeDetail
│   └── db/                      # schema.sql · seed.sql · seed-recipe-md.sql
├── scripts/                     # Narration generation, seeding, migration, UI measurement probes
├── assets/fonts/                # Cairo static weights (+ OFL.txt)
├── public/recipe.md             # Content source of truth (50 recipes)
├── design.md                    # Design system spec
├── plan.md                      # Product plan
├── PROJECT_CONTEXT.md           # Stable facts for agents working in this repo
├── AUTH_AUDIT_REPORT.md         # Auth review
└── audit/                       # audit.md (technical audit) · roadmap.md (execution plan)
```

---

## 6. Setup

### Prerequisites

- **Node.js ≥ 20** and npm.
- **Expo Go** on a device/emulator (Android-first), or an Expo development build. Web needs no extra tooling.
- A **Supabase project** and a **Clerk application** if you want real data and login.

### Install

```bash
npm install
```

### Configure

Copy `.env.example` to `.env` and fill it in:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-publishable-key
ELEVENLABS_API_KEY=          # server-side only, used by narration scripts
```

Only `EXPO_PUBLIC_*` values reach the app bundle — and only the **public** anon/publishable keys belong there. `ELEVENLABS_API_KEY` stays server-side and must never be renamed to `EXPO_PUBLIC_*` or imported into React Native code.

Apply the database schema to your Supabase project (Supabase SQL editor or `supabase db`), then seed it — see [Backend](#8-backend-supabase).

### Run

```bash
npm run start      # Expo dev server (then press a / i / w)
npm run android    # Android (Expo Go / emulator)
npm run web        # Web (react-native-web)
npm run ios        # iOS (Expo Go / simulator)

npm run typecheck  # strict TypeScript check — keep this green
```

> Without valid credentials the app boots but Home/Detail show their error state and Clerk will fail to initialise (with a dev warning pointing at the missing key).

---

## 7. Environment Variables

| Variable | Scope | Purpose |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | client | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | client | Public anon/publishable key — safe **only** because RLS is read-only |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | client | Clerk publishable key (public by design) |
| `ELEVENLABS_API_KEY` | server | Narration generation scripts only |
| `SUPABASE_URL` | server | Used by seed/migration scripts |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Seed/migration scripts (writes) — never in the app |

Notes:

- `.env` and `.work/` are gitignored. **Never commit secrets** — run a secret check before pushing.
- The anon key is public by design and safe only because every table has SELECT-only RLS policies.

---

## 8. Backend (Supabase)

Canonical schema: **`src/db/schema.sql`** — idempotent, the single source of truth.

| Table | Key | Notes |
|---|---|---|
| `recipes` | `text` slug id (`molokhia`, `hawawshi`, `shrimp-scampi`) | title, description, `image_url`, category, minutes, persons, difficulty, rating, `audio_available`, occasion, `category_color`, `sort_order` |
| `ingredients` | uuid, FK `recipe_id` | `text`, `sort_order` |
| `steps` | uuid, FK `recipe_id` | title, body, `image_hint`, `sort_order` |
| `tips` | uuid, FK `recipe_id` | title, body, `sort_order` |
| `audio_urls` | uuid, FK `recipe_id` | one row per recipe (unique index), `url` |

- **Ordering is deterministic** — `sort_order` on recipes and every child table, with stable fallbacks. Never rely on random UUID order.
- **RLS is enabled on all five tables** with `SELECT`-only policies for `anon`. No write policies exist, so writes require the service role.
- **`recipes.id` is TEXT and human-readable** — it is the navigation key across Home, Search, Favorites and Detail, so ids must be stable and unique.
- **Storage:** narration MP3s live in the public `recipe-audio` bucket, one file per recipe, named exactly after the recipe id.
- **Images:** hosted on Cloudinary; card images use a smaller variant.

### Seeding

```bash
# PowerShell
$env:SUPABASE_URL="https://<ref>.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"

node scripts/migrate.js              # apply src/db/seed.sql (canonical, authoritative)
node scripts/seed-from-recipe-md.js  # or: seed the 50 recipes parsed from public/recipe.md
node scripts/seed-from-recipe-md.js --sql > src/db/seed-recipe-md.sql   # emit SQL instead
```

Both scripts refuse to run with the anon key and have no hard-coded fallbacks. Schema DDL is **not** applied by them (PostgREST can't run DDL) — apply `schema.sql` first.

### Content source of truth

`public/recipe.md` is the authored content source (50 recipes). `recipe.md` is never modified by scripts; it is parsed and upserted. The live DB is what the app reads.

---

## 9. Authentication (Clerk)

- `ClerkProvider` wraps the app in `src/app/App.tsx`, always mounted, configured via `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.
- Native tokens are cached in `expo-secure-store` through Clerk's `tokenCache`.
- **Welcome → SignIn / SignUp** (email + password, plus Google SSO) is the stack's initial route; `Tabs` is reached from there.
- Error messages are mapped to friendly Arabic copy in `src/lib/clerkErrors.ts`.
- Clerk owns identity only; recipe data access is anonymous/RLS-read-only and does not depend on the signed-in user.

---

## 10. Narration Pipeline

One MP3 per recipe id, played by the `Listen` button:

1. **Scripts** — narration text lives in `voice-scripts-egyptian-story.md`, keyed by recipe id.
2. **Generate** (pick either engine):
   ```bash
   # ElevenLabs — shared voice/model/format, resumable, throttling-aware
   npm run narration:dry     # validate mappings, no API calls
   npm run narration         # generate missing output/<id>.mp3

   # Edge TTS — free, no API key
   py scripts/generate_recipe_audio.py --limit 3
   ```
3. **Upload** the MP3s to the `recipe-audio` bucket (file name = recipe id).
4. **Register** the URL in `audio_urls` and set `recipes.audio_available = true`.

The app hides the Listen UI unless the URL is a real, non-placeholder `https://` link (`src/lib/audio.ts`).

**Open item:** ~20 recipes still have no narration audio.

---

## 11. Project Status

**Solid today**

- Clean three-layer architecture, strict TypeScript, `npm run typecheck` green.
- Consistent Egyptian-Arabic RTL design system; real per-weight Cairo font.
- 50 recipes live on Supabase with deterministic ordering, `ingredients!inner` integrity filtering, and read-only RLS.
- Working navigation across all screens, on the web and on device; no crash loops.
- Clerk authentication (email/password + Google).
- Server-side Arabic-aware search, real category filtering, persisted favorites, persisted list/grid view.
- Real narration playback wired end to end, plus reproducible generation tooling.

**Open / placeholder**

- 🎙️ **~20 recipes have no narration MP3** yet.
- 🖼️ `shrimp-scampi` has no image.
- 🍳 **Cooking mode is not built** — no step-by-step full-screen flow, no timer, no per-step audio.
- 📴 **No offline mode** — the app needs the network for the catalog.
- 🧪 **No tests, linting, or CI.**
- 🔐 Auth is functional but see `AUTH_AUDIT_REPORT.md` for the outstanding review.

A detailed technical audit lives in `audit/audit.md`.

---

## 12. Roadmap

Execution plan: `audit/roadmap.md`. Phases 0–5 (baseline, backend foundation with RLS + canonical schema, data-path unification, core recipe experience, persisted favorites, search & filtering) are **done**. Remaining:

- **Phase 6 — Voice core:** finish narration coverage for the whole catalog; per-step audio option; hardening the player.
- **Phase 7 — Cooking mode:** full-screen step flow, working timer, narration integration.
- **Phase 8 — UX / accessibility:** Android/Web parity, verified RTL on real devices, touch targets, contrast.
- **Phase 9 — Performance & code quality:** caching, dead-code removal, image tuning.
- **Phase 10 — Testing & release:** lint, tests, CI, store release checklist.

Product direction (`plan.md`): a large Egyptian + Western catalog with **narration on every recipe**, free to use, monetisation deferred.

---

## 13. Development Conventions

- **Layer discipline:** never import the Supabase client into a screen — add a query hook in `src/data/queries.ts`.
- **RTL:** `src/i18n/rtl.ts` is the single source of truth. Author layouts in logical order; don't hard-code left/right.
- **Theme:** visual values come from `src/theme` (mirroring `design.md`). No hard-coded colors or spacing in screens.
- **Fonts:** always `fontFamilyFor(weight)` from `src/theme/typography.ts` — never rely on synthetic bold.
- **Language:** UI copy, content, and narration stay in Egyptian colloquial Arabic.
- **Ids:** recipe ids are navigation keys. Keep them stable, unique, and matching `audio_urls` / storage file names.
- **Verify on a device** (Expo Go) — not only by reading code or checking the web build.
- **Typecheck gate:** `npm run typecheck` must stay green.
- **Before pushing:** secret check (`git diff --cached`); `.env` and `.work/` stay untracked.

**Further reading:** `PROJECT_CONTEXT.md` (stable repo facts), `plan.md` (product), `design.md` (design system), `audit/audit.md` + `audit/roadmap.md` (technical status and plan), `AUTH_AUDIT_REPORT.md` (auth), `public/recipe.md` (content).

---

## License

No license is declared for this project. The bundled **Cairo** font is distributed under the SIL Open Font License — see `assets/fonts/OFL.txt`.

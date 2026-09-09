# هو كل يوم أكل (Howa Kol Yom Akl)

An Arabic-first (Egyptian) recipe app for React Native and the web, built with Expo. The goal is a warm, fast, voice-first cooking companion — a trusted "relative in the kitchen" that reads recipes out loud in Egyptian colloquial Arabic while your hands are busy.

> **Status: early-stage, under active development.** The app is currently a working UI prototype connected to a live Supabase backend. Several flagship features (real AI voice narration, persistent favorites, a functional cooking mode) are planned but **not yet implemented** — see [Current Features](#2-current-features-implemented-today), [Project Status](#11-current-project-status), and [Roadmap](#12-roadmap--upcoming-work).

---

## 1. Overview

هو كل يوم أكل ("Howa Kol Yom Akl") helps Egyptian home cooks find reliable recipes quickly and follow them without reading — addressing the pain point that written recipes are hard to use mid-cooking. Each recipe is meant to have a dedicated page with ingredients, written steps, and an AI-generated voice narration.

The current codebase delivers the visual product shell and core navigation around that idea: a polished Arabic RTL interface (Cairo font, terracotta/cream/olive design system), a Supabase-backed recipe catalog, recipe detail with ingredients/steps/tips, in-memory favorites, and demo audio playback.

---

## 2. Current Features (implemented today)

Everything in this section exists and works in the current codebase.

### Product / UI
- **Arabic RTL interface** with Egyptian colloquial UI copy, right-to-left layout, and Eastern-Arabic numerals for quantities (via a small numerals helper).
- **Cairo font** bundled and loaded through `expo-font` (SIL OFL licensed — see `assets/fonts/OFL.txt`).
- **Four-tab layout** (Home, Search, Favorites, Profile) with a custom floating bottom tab bar and active-tab highlight.
- **Home screen**: greeting, a hero recipe card, a category-chip row (visual only — no filtering yet), and a responsive two-column recipe feed.
- **Recipe detail screen**: hero area, title/description, stats (time, servings, difficulty, rating), and tabbed sections:
  - **Ingredients** — tappable checklist with visual "checked" state.
  - **Steps** — numbered preparation steps.
  - **Tips** — pro-tips ("سر الصنعة").
  - Favorite toggle, native **share**, and a "start cooking" entry point.
- **Search screen**: text search box with clear button and empty-state message — currently filters the bundled placeholder catalog **locally** (not a backend search).
- **Favorites tab**: shows favorited recipes from the in-memory store, with a friendly empty state.
- **Profile screen**: favorite count plus placeholder statistics and settings rows (marked "قريباً" / coming soon).
- **Cooking mode screen** (demo-level): a full-screen step view with next/previous controls, a sample progress bar, and a timer chip — driven by **hard-coded sample steps** and a timer that does **not** actually count down yet.
- **Demo audio playback**: a voice dock on the recipe detail screen that plays/pauses/replays remote **demo MP3 files** (SoundHelix) for recipes flagged as "audio available". This is placeholder audio, **not** real narration.

### Engineering
- **Supabase integration** for the recipe catalog: Home fetches the recipe list and Recipe Detail fetches a single recipe's data (ingredients, steps, tips, audio URL) from Supabase via TanStack Query.
- **In-memory favorites** state managed with Zustand (lost on app restart by design — persistence is planned).
- **Shared design-token system** (`src/theme`) matching `design.md` (colors, spacing, typography, elevation).
- **Shared components**: `AppHeader`, `RecipeCard`, `CategoryChip`.
- **Strict TypeScript**; `npm run typecheck` passes.

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 57 · React Native 0.86 · React 19 |
| Language | TypeScript (strict) |
| Navigation | React Navigation v6 (native-stack + bottom-tabs) |
| Data fetching | TanStack Query v5 |
| State | Zustand v4 |
| Backend | Supabase (PostgreSQL + supabase-js v2) |
| Audio | expo-audio |
| Web | react-native-web 0.21 |
| Fonts / Icons | expo-font (Cairo) · @expo/vector-icons (Feather, MaterialCommunityIcons) |
| Safe areas | react-native-safe-area-context |

---

## 4. Architecture Overview

The codebase follows a clean three-layer dependency direction:

```
Screens & Components (UI)
        │
        ▼
Data layer: src/data/queries.ts (TanStack Query) + src/state/favorites.ts (Zustand)
        │
        ▼
Infrastructure: src/lib/supabase.ts  (Supabase client — the only module that talks to Supabase)
```

Key rules that are currently respected:

- **Screens never touch Supabase directly** — all data access goes through `src/data/queries.ts`.
- **Theme and i18n are centralized** in `src/theme` and `src/i18n`.
- **RTL has a single source of truth** — `src/i18n/rtl.ts` configures `I18nManager` on native and `dir="rtl"` on web.

> ⚠️ **Known data-path split:** Home and Recipe Detail read recipes from **Supabase**, while Search and Favorites currently render the **local placeholder catalog** in `src/data/recipes.ts`. Unifying these data sources is a documented next step (see [Roadmap](#12-roadmap--upcoming-work) and `audit/audit.md`).

---

## 5. Project Structure

```
├── app.json                  # Expo app config (+ Supabase keys read at runtime)
├── index.js                  # Entry point: RTL config + root component registration
├── src/
│   ├── app/App.tsx           # Providers (QueryClient, SafeArea, Navigation) + font gate
│   ├── navigation/           # RootNavigator (tabs + detail + cooking-mode stack)
│   ├── screens/              # Home, Search, Favorites, Profile, RecipeDetail, CookingMode
│   ├── components/           # AppHeader, RecipeCard, CategoryChip
│   ├── data/                 # queries.ts (Supabase + TanStack Query) · recipes.ts (placeholder catalog)
│   ├── state/favorites.ts    # Zustand favorites store (in-memory)
│   ├── hooks/useAudioPlayer.ts  # expo-audio player wrapper
│   ├── lib/supabase.ts       # Supabase client creation
│   ├── theme/                # Design tokens: colors, spacing, typography, elevation
│   ├── i18n/                 # Arabic strings, numeral helpers, RTL configuration
│   ├── types/recipe.ts       # Recipe / RecipeDetail types
│   └── db/                   # SQL schema + seed files (applied manually to Supabase)
├── scripts/                  # Dev / migration helper scripts (Node)
├── assets/fonts/             # Cairo font files
├── audit/                    # audit.md (technical audit) · roadmap.md (execution roadmap)
├── design.md                 # Design system specification
├── plan.md                   # Product plan
└── stitch-screens/           # Static HTML design references (dir="rtl")
```

---

## 6. Setup & Installation

### Prerequisites

- **Node.js ≥ 20** (LTS recommended) and npm.
- For native: the **Expo Go** app on a device/emulator, or an Expo development build. For web, no extra tooling is needed.
- Optional but recommended: your own **Supabase project** to run against real data.

### Install

```bash
npm install
```

### Configure backend credentials

1. Copy/create a `.env` file (it is gitignored) and set your Supabase project values:

   ```bash
   SUPABASE_URL=your-supabase-project-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

2. The mobile app reads the same values from `expo.extra` in `app.json` (`supabaseUrl` / `supabaseAnonKey`) via `expo-constants`. Set them to your own project before running against your backend.

3. (Backend setup) In your Supabase project, apply the SQL schema and seed located in `src/db/` — see [Supabase Integration](#9-supabase-integration-current-backend-state).

---

## 7. Environment Variables

| Variable | Used by | Purpose |
|---|---|---|
| `SUPABASE_URL` | `scripts/migrate.js` (via `.env`) | Supabase project URL for data-migration scripts |
| `SUPABASE_ANON_KEY` | `scripts/migrate.js` (via `.env`) | Supabase **anonymous (publishable)** key for script reads/writes |
| `expo.extra.supabaseUrl` | `src/lib/supabase.ts` (via `app.json`) | Supabase project URL embedded for the app at runtime |
| `expo.extra.supabaseAnonKey` | `src/lib/supabase.ts` (via `app.json`) | Supabase anonymous key used by the app at runtime |

Notes:

- The Supabase **anon key is designed to be public in a client app** — it is only safe when **Row-Level Security (RLS)** protects the underlying tables. RLS policies are planned/being verified; treat any data as readable until that is confirmed.
- **Never commit real credentials.** `.env` is already gitignored. If you publish this repository, replace the Supabase values in `app.json` with your own or remove them.
- The repository does not use `EXPO_PUBLIC_*` variables yet (the app reads from `app.json` `extra`); migrating to `EXPO_PUBLIC_*` is part of the planned backend-hardening work.

---

## 8. Running the Project

```bash
# Start the Expo dev server (then press a / i / w in the terminal)
npm run start

# Or launch a specific target directly
npm run web       # Web (react-native-web) — the most used dev target
npm run android   # Android (Expo Go / emulator)
npm run ios       # iOS (Expo Go / simulator)

# Type-check the whole project (strict TypeScript)
npm run typecheck
```

> If you run **without valid Supabase credentials**, the app still boots: Search and Favorites work from the bundled placeholder catalog, while Home and Recipe Detail surfaces show their error/empty state because they fetch from Supabase.

---

## 9. Supabase Integration (current backend state)

- **Tables** (defined in `src/db/`): `recipes`, `ingredients`, `steps`, `tips`, `audio_urls`.
- **Data flow today**:
  - `useRecipes()` — recipe list for Home (single `select`, all rows, no ordering/limit yet).
  - `useRecipe(id)` — detail data for one recipe (parallel queries for the recipe, ingredients, steps, tips, and audio URL).
- **Seed data**: `src/db/seed.sql` seeds 10 Egyptian/Western dishes with full detail content for okra (بامية); the catalog content is duplicated in the placeholder dataset for offline/demo use.
- **Applying the schema**: SQL in `src/db/` is applied **manually** (Supabase SQL editor / CLI) — the app never applies migrations itself.
- **Row-Level Security**: RLS is **not yet defined** in the checked-in SQL and its status on the live project is unverified. This is a documented, high-priority item in the roadmap (Phase 1) — see `audit/audit.md`.
- **Migration script**: `scripts/migrate.js` upserts seed recipes using the anon key; moving this to a service-role-only path is part of the planned security hardening.

---

## 10. Platform Support

| Platform | Status |
|---|---|
| Web | ✅ Primary development/validation target (react-native-web, RTL by construction) |
| Android | ✅ Toolchain configured (`npm run android`, EAS); partial validation — real-device RTL/audio checks are outstanding |
| iOS | ⚠️ Toolchain configured via Expo; not yet validated in this project |

The app is authored for right-to-left layout first (`I18nManager` on native, `dir="rtl"` wrapper on web) and is intended to run on Android, iOS, and Web from the same codebase.

---

## 11. Current Project Status

This project is **under active development** and is best described as a *visual prototype on a live backend*:

**Solid today:** clean architecture and strict TypeScript, a consistent Arabic design system, working navigation across all screens, Supabase-backed recipe listing/detail, and a stable app shell (no runtime crash loops).

**Missing / placeholder today:**

- 🎙️ **Voice narration is not implemented** — the "voice" experience is demo MP3 audio, and there is no ElevenLabs, text-to-speech, or speech recognition anywhere in the code.
- ❤️ **Favorites are in-memory only** — they do not survive an app restart.
- 🍳 **Cooking mode is a demo** — steps are hard-coded and the timer does not count down.
- 🔎 **Search is local-only** over the placeholder catalog; filter chips are visual.
- 🔐 **Supabase RLS is unverified/undefined**; secrets/config hygiene needs hardening.
- 🧪 **No tests, linting, or CI** yet.

A full, evidence-based technical audit lives in **`audit/audit.md`**.

---

## 12. Roadmap / Upcoming Work

Planned execution phases (detailed in **`audit/roadmap.md`**) — all of the following are **planned, not yet implemented**:

1. **Phase 0 — Baseline & safety**: freeze current state, define the validation checklist.
2. **Phase 1 — Backend foundation**: RLS + read-only policies, one canonical schema, recipe-ID strategy, environment/config hygiene.
3. **Phase 2 — Data architecture unification**: remove the local-vs-Supabase recipe split so Home/Search/Favorites/Detail share one coherent data source.
4. **Phase 3 — Core recipe experience**: ordering, loading/empty/error states, efficient detail queries.
5. **Phase 4 — Favorites & user state**: persistence across restarts, honest counts/stats.
6. **Phase 5 — Search & filtering**: real Supabase search (Arabic-aware) and functional filters.
7. **Phase 6 — Voice / audio core**: real AI voice narration (ElevenLabs) replacing demo audio; remote-generated/local-played architecture; robust player.
8. **Phase 7 — Cooking mode**: real step-by-step flow with working timer and narration integration.
9. **Phase 8 — UX / accessibility / cross-platform hardening**: Android/Web parity, verified RTL on devices, touch targets, contrast.
10. **Phase 9 — Performance & code quality**: cleanup, caching, dead-code removal.
11. **Phase 10 — Testing & release readiness**: lint, tests, CI, release checklist.

Product direction (from `plan.md`): ship a large catalog of Egyptian + Western recipes (target ~50–100) **with voice narration on every recipe from day one**, free to use, with monetization decisions deferred.

---

## 13. Development Notes & Constraints

- **Layering rule:** never call Supabase from screens — add query hooks in `src/data/queries.ts` instead.
- **RTL:** keep `src/i18n/rtl.ts` as the single source of truth for layout direction; author layouts in logical RTL order.
- **Design tokens:** visual values come from `src/theme` (mirroring `design.md`); avoid hard-coded colors/spacing in screens.
- **Content language:** UI copy and (future) narration should stay in Egyptian colloquial Arabic, not Modern Standard Arabic.
- **Typecheck gate:** keep `npm run typecheck` green after every change (strict mode is enabled).
- **Known inconsistency to be aware of:** Search/Favorites use a local placeholder catalog while Home/Detail use Supabase; recipe ids in both places must stay in sync until Phase 2 unifies the data path.
- **Project docs** you may find useful: `plan.md` (product), `design.md` (design system), `audit/audit.md` (technical audit), `audit/roadmap.md` (execution roadmap), and `stitch-screens/` (static design references).

---

## License

No license is currently declared for this project. The bundled **Cairo** font is distributed under the SIL Open Font License (see `assets/fonts/OFL.txt`).

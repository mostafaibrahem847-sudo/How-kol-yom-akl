# Implementation Plan — كيف نكمل من غير ما نقطع الحدود

> Created: Sept 4, 2025  
> Status: Resume from previous agent stop. Foundation already built (design.md, theme, types, data, queries, favorites, supabase, stitch-screen prototypes).  
> Rule: **One phase = one turn / small batch**. Don't try to finish everything at once.

---

## ✅ Phase 0 — Already Done (Don't Repeat)

- [x] `plan.md` read and summarized
- [x] `design.md` created (9 sections, exact hex/dp values)
- [x] `src/theme/colors.ts`, `spacing.ts`, `typography.ts`, `index.ts`
- [x] `src/types/recipe.ts` (Recipe + RecipeDetail)
- [x] `src/data/recipes.ts` (10 recipes + full details for okra)
- [x] `src/data/queries.ts` (useRecipes / useRecipe with TanStack Query)
- [x] `src/i18n/strings.ts` + `numerals.ts`
- [x] `src/lib/supabase.ts`
- [x] `src/state/favorites.ts` (Zustand)
- [x] `app.json` + `package.json` (Expo + RN 0.74 + navigation + supabase + zustand + react-query + expo-av)
- [x] `index.js` points to `./src/app/App`
- [x] `stitch-screens/` HTML prototypes (home, search, favorites, recipe-detail, cooking-mode)

---

## Phase 1 — App Shell + Navigation (Next Immediate)

**Goal:** Make `src/app/App.tsx` render without crashing, with bottom-tabs navigation.

- [ ] Create `src/app/App.tsx` (register navigation + safe-area + theme provider)
- [ ] Create `src/navigation/RootNavigator.tsx` (BottomTabs: Home / Search / Favorites / Profile)
- [ ] Create placeholder screens: `src/screens/HomeScreen.tsx`, `SearchScreen.tsx`, `FavoritesScreen.tsx`, `ProfileScreen.tsx`
- [ ] Wire `useFavorites` into Favorites tab
- [ ] Add `Cairo` font loading via `expo-font` (load in App.tsx)
- [ ] Verify `npm run start` or `tsc --noEmit` passes

**Limit guard:** If this gets long, split into separate turns per screen.

---

## Phase 2 — Home Screen (Recipe Cards + Hero)

**Goal:** Match `stitch-screens/home.html` — greeting, filter chips, hero card, recipe feed.

- [ ] Build `RecipeCard` component using `design.md` specs (4:3 image, 12dp radius, olive/amber tags)
- [ ] Build `CategoryChip` (6dp radius, `#556B2F` / `#D97706` backgrounds)
- [ ] Build hero section with `h1` title + CTA button (`#D35400` primary)
- [ ] Build filter row (horizontal scroll of chips)
- [ ] Use `useRecipes()` to feed cards; show loading spinner (`#D35400` 24dp) + empty state
- [ ] Voice CTA button on hero (play icon in `#D35400`)

---

## Phase 3 — Recipe Detail Screen

**Goal:** Detail view with hero image, ingredients checklist, steps, voice dock.

- [ ] `RecipeDetailScreen.tsx` with `useRecipe(id)`
- [ ] Hero image (full width, 4:3, gradient overlay `rgba(212,167,129,0.15)`)
- [ ] Ingredients checklist (circle checkbox 24dp, filled `#D35400` when checked)
- [ ] Steps list (`h3` 22dp step number, `body-large` 18dp body)
- [ ] Voice player dock (bottom-right, 48dp height, 12dp radius, `#FDFBF7` bg, primary play icon) — use `expo-av`
- [ ] Tips section ("سر الصنعة ✨")
- [ ] Favorite toggle button (`useFavorites`)
- [ ] Share button (primary outline)

---

## Phase 4 — Search + Favorites + Profile

**Goal:** Complete the 4 tabs.

- [ ] Search screen with input (border `#D35400` active), clear icon, voice search chip
- [ ] Favorites screen with empty-state illustration + primary CTA ("اكتشف وصفات")
- [ ] Profile screen (minimal: favorites count, settings placeholder)
- [ ] Navigation between tabs (back arrow left in RTL, mirrored layout)

---

## Phase 5 — Cooking Mode (Hands-Free)

**Goal:** Full-screen step-by-step with large text and voice control.

- [ ] `CookingModeScreen.tsx` (full-screen, `#FDFBF7` bg, `#1A1A1A` text)
- [ ] Large `h3` step title + `body-large` instruction
- [ ] Progress circle (12dp, `#D35400` fill for current step)
- [ ] Voice commands: "الخطوة اللي بعدها", "عيد تاني"
- [ ] Timer chip (2-minute default timer)
- [ ] Exit button (primary outline, 48dp)

---

## Phase 6 — Voice / Audio Pipeline

**Goal:** Actually play audio using `expo-av`, connect to ElevenLabs URLs.

- [x] Add `audioUrl` field from recipe data to `RecipeDetail`
- [x] Create `AudioPlayerHook` using `expo-av` `Audio.Sound` (`src/hooks/useAudioPlayer.ts`)
- [x] Play / Pause / Replay controls matching design.md voice icon rules (`#D35400` resting / cream playing + glow / white paused)
- [x] If no `audioUrl` yet, show placeholder state and prepare for ElevenLabs batch upload
- [ ] Generate or upload voice files for `okra`, `molokhia`, etc. (2-3 days automatic — needs ElevenLabs API key)

---

## Phase 7 — Supabase Integration + Polish

**Goal:** Move from placeholder data to real database + final polish.

- [ ] Create Supabase tables (`recipes`, `ingredients`, `steps`, `audio_urls`)
- [ ] Migrate `recipes.ts` data into Supabase (batch insert)
- [ ] Update `queries.ts` to call Supabase instead of placeholder array
- [ ] Add auth (optional for MVP — can skip if time is tight)
- [ ] Search/filter with Supabase `.ilike()` on Arabic text
- [ ] Polish: touch targets 44dp+, contrast checks, RTL mirroring verified

---

## Phase 8 — Testing / Launch Prep

- [ ] Build APK/IPA via `expo build`
- [ ] Test on device with Arabic locale (RTL, Arabic-Indic numerals, Cairo font)
- [ ] Verify voice playback when hands are dirty (dock accessible)
- [ ] Final `design.md` compliance check (any missing hex/dp values?)

---

## Quick-Reference: What's Already Built (So We Don't Duplicate)

| File | Purpose | Status |
|------|---------|--------|
| `design.md` | Design tokens, hex, dp, button states | ✅ Complete |
| `src/theme/*` | Colors (primary `#D35400`), spacing, typography | ✅ Complete |
| `src/types/recipe.ts` | Types for Recipe / RecipeDetail | ✅ Complete |
| `src/data/recipes.ts` | 10 recipes + okra full details | ✅ Complete |
| `src/data/queries.ts` | TanStack Query hooks | ✅ Complete |
| `src/i18n/strings.ts` | Full Arabic copy (home, search, detail, cooking) | ✅ Complete |
| `src/i18n/numerals.ts` | `toArabicNumerals()` / `toWesternNumerals()` | ✅ Complete |
| `src/lib/supabase.ts` | Client (needs env vars) | ✅ Complete |
| `src/state/favorites.ts` | Zustand favorites store | ✅ Complete |
| `stitch-screens/*.html` | HTML prototypes for all screens | ✅ Reference |

---

## How to Use This File

1. Start with **Phase 1** (App shell). Don't skip.
2. After each phase, check off boxes.
3. If a phase gets too big, split: e.g., Phase 2 = Hero first, RecipeCard second.
4. The previous agent stopped at `src/app/App.tsx` missing — that's exactly Phase 1.
5. Keep `design.md` open when coding any component; every color/spacing/shape must match.

---

## Notes / Blockers

- **Environment:** `SUPABASE_URL` + `SUPABASE_ANON_KEY` needed for Phase 7 (not for Phase 1-6).
- **Fonts:** `Cairo` must be loaded via `expo-font`; if not installed in `node_modules`, load via URL or local asset.
- **Voice:** ElevenLabs API key needed for Phase 6; if not available, build the UI with placeholder URLs first.
- **Limit:** Don't generate voice files or build full DB migration in a single turn. Do UI first, backend second.

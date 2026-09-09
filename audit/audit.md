# Application Audit

**Project:** هو كل يوم أكل (Howa Kol Yom Akl) — Arabic recipe app
**Stack:** Expo SDK 57 · React Native 0.86.3 · React 19.2.3 · react-native-web 0.21.2 · React Navigation v6 · TanStack Query 5 · Zustand 4 · Supabase · expo-audio
**Audit type:** Read-only source audit (no runtime device instrumentation)
**Audited against:** working tree at the time of audit; typecheck (`npm run typecheck`) passes.

Severity scale used throughout: CRITICAL · HIGH · MEDIUM · LOW · INFO.

---

## 1. Executive Summary

The application is a small, cleanly layered Arabic (RTL) recipe app with four tabs (Home, Search, Favorites, Profile), a recipe-detail stack screen, and a cooking-mode screen. The codebase is tidy, TypeScript-strict, and typechecks; the visual system (theme tokens, shared header/cards/tab bar, elevation tokens) is consistent and recently hardened for Android shadows and safe areas.

However, the app is best described as a **visual prototype on a live back-end**: most interactive/product promises (voice assistant, hands-free mode, voice search, cooking timer, filters, favorites filters) are UI-only or missing entirely; Search and Favorites render from a local placeholder dataset while Recipe Detail queries Supabase — a mismatch that can break navigation when the live DB uses UUID ids; favorites live only in memory; RTL is configured but the runtime direction on Android is unverified and may stay LTR; and no tests, lint, or CI exist. The biggest *product* risks are the missing voice/audio pipeline and the local-vs-remote data split; the biggest *release* risks are Supabase RLS posture, credentials duplicated into committed config, and zero automated validation.

---

## 2. Current Architecture

```
index.js                     → configureRtl() + registerRootComponent(App)
src/app/App.tsx              → Providers (QueryClient, SafeArea, Navigation) + web dir="rtl" wrapper + Cairo font gate
src/i18n/rtl.ts              → I18nManager config (RTL=true, swap=false), web document dir="rtl" (single source of truth)
src/navigation/RootNavigator → native-stack [ Tabs, RecipeDetail, CookingMode ]; Tabs = bottom-tabs with CUSTOM floating tab bar
src/screens/                 → HomeScreen, SearchScreen, FavoritesScreen, ProfileScreen (tab scenes)
                              → RecipeDetailScreen, CookingModeScreen (pushed stack screens)
src/components/              → AppHeader, RecipeCard, CategoryChip (shared UI)
src/hooks/useAudioPlayer.ts  → custom expo-audio player wrapper (polling)
src/state/favorites.ts       → Zustand in-memory favorites store
src/data/queries.ts          → react-query hooks: useRecipes (Home), useRecipe (Detail), searchRecipes (UNUSED)
src/data/recipes.ts          → local placeholder dataset (10 recipes + okra detail) used by Search/Favorites
src/lib/supabase.ts          → supabase-js client (URL+anon key from app.json extra)
src/i18n/                    → Arabic strings + Eastern-Arabic numerals helper
src/theme/                   → colors / spacing / typography / elevation tokens
src/types/recipe.ts          → Recipe / RecipeDetail types
src/db/*.sql                 → 3 schema variants + seed (not applied from app; run manually in Supabase)
scripts/                     → dev measurement/migration scripts (Node)
stitch-screens/ design.md    → static HTML design references (dir="rtl") and design spec
```

**Layering:** UI (screens/components) → data (queries/store) → infra (lib/supabase) is clean and dependency direction is correct (screens never touch Supabase directly; all access goes through `data/queries.ts`). Theme and i18n are centralized and imported widely. Reusability is good for shared chrome; weaker for recipe detail data.

**Key architectural finding — two parallel data sources (HIGH):**
- Home → `useRecipes()` reads **Supabase**.
- RecipeDetail → `useRecipe(id)` reads **Supabase**.
- Search & Favorites → `placeholderRecipes` from **`src/data/recipes.ts`** (local) and never call Supabase.
- `getRecipeDetail()` (the local detail provider) and `searchRecipes()` (the Supabase search) are **both dead code** — nothing calls them.

This split means the app only works end-to-end if the live DB was seeded with the exact placeholder TEXT ids (`okra`, `molokhia`, … — `src/db/seed.sql`, `src/db/schema.sql`). If the live DB instead uses the UUID schema (`src/db/supabase-schema.sql` / `supabase-full-setup.sql`), then every tap on a Search/Favorites card navigates to a detail screen that queries a nonexistent UUID-string id, gets an error/empty result, and renders the error state (`src/screens/RecipeDetailScreen.tsx` `if (isError || !recipe)`). The presence of three conflicting schema files (`schema.sql` TEXT ids + `recipes.audio_url`; `supabase-schema.sql`/`supabase-full-setup.sql` UUID ids without `recipes.audio_url`) is itself a maintainability hazard.

---

## 3. Critical Issues

*(Nothing found that would corrupt data or crash at a system level; the closest are two “must verify before release” items below.)*

### 3.1 Supabase Row-Level Security is not defined anywhere (CRITICAL unless verified server-side)
- **Location:** `src/db/*.sql` (all), `src/lib/supabase.ts`, `scripts/migrate.js`.
- **Found:** No `ALTER TABLE … ENABLE ROW LEVEL SECURITY` and no policies exist in any checked-in SQL. The anon key is embedded in the shipped app (`app.json` `extra.supabaseAnonKey`, `src/lib/supabase.ts`) and is used in `scripts/migrate.js` to **upsert** data.
- **Why it matters:** With RLS disabled, the anon (public, extractable) key can read **and write/delete** every table. With RLS enabled and no policy, all queries return nothing and the app’s screens (Home/Detail) would show empty/error states. Either way the current posture is wrong and unverified.
- **Evidence:** `grep -rin "policy\|enable row" src/db` → empty; `scripts/migrate.js` lines: `createClient(URL, ANON_KEY)` then `.from('recipes').upsert(...)`.
- **Recommended fix (not implemented):** Enable RLS for `recipes/ingredients/steps/tips/audio_urls` and add read-only policies for `anon` (and write policies only via a service/edge path if ever needed). Verify with the Supabase project; remove the anon-write migration script or gate it behind the service role.

### 3.2 Voice-assistant product core is not implemented (CRITICAL vs. the stated product, HIGH as code)
- **Location:** `src/hooks/useAudioPlayer.ts`, `src/screens/RecipeDetailScreen.tsx` (`VoicePlayerDock`), `src/screens/CookingModeScreen.tsx`, `src/i18n/strings.ts`, `design.md`.
- **Found:** The design promises a voice assistant (“طنط منى”, hands-free “قولي بالصوت”, voice search, voice chips “التالي”, cooking timer). The implementation only plays remote **demo MP3s** (`https://www.soundhelix.com/...` in `src/data/recipes.ts` and `src/db/seed.sql`). There is **no speech recognition, no text-to-speech, no ElevenLabs or any TTS/AI integration** anywhere in the code (grep for speech/ElevenLabs in `src` → none). Cooking-mode “voice command” chips and the timer are inert UI (`onPress={() => {}}`; timer never counts, label always `(٠٠:٠٢)`).
- **Evidence:** `CookingModeScreen.tsx` timer chip text is static; the second voice chip has an empty handler; `t.cooking` voice/timer strings are unused (grep = 0 usages); `SearchScreen` voice chip has no `onPress`.
- **Recommended fix:** Decide scope: either remove/replace the non-functional voice affordances, or integrate a real audio pipeline (recognition + narration/TTS + real per-step audio) before release. Do not ship dead voice UI.

---

## 4. High Priority Issues

### 4.1 Search/Favorites → RecipeDetail depends on DB ids that may not exist
- **Location:** `src/screens/SearchScreen.tsx`, `src/screens/FavoritesScreen.tsx`, `src/screens/RecipeDetailScreen.tsx`, `src/data/queries.ts` (`useRecipe`), `src/db/*.sql`.
- **Found/why:** Cards in Search/Favorites use local placeholder ids; Detail always queries Supabase `.eq('id', id).single()`. On error/empty it returns `undefined` (no throw), and the screen renders the error branch. Only works when the DB has matching TEXT ids.
- **Evidence:** `useRecipe` does not fall back to `getRecipeDetail(id)` (which exists and is unused); `schema.sql` vs `supabase-schema.sql` disagree on id type and on `recipes.audio_url`.
- **Recommended fix:** Single source of recipe data + id scheme; or make `useRecipe` fall back to the local provider for known placeholder ids; delete the unused schema variants.

### 4.2 RTL runtime state is unverified and can silently stay LTR
- **Location:** `src/i18n/rtl.ts`, `index.js`, `src/app/App.tsx`.
- **Found/why:** Configuration now forces `allowRTL(true)` / `forceRTL(true)` and disables style swapping, with the web root wrapped in `dir="rtl"`. However: (a) earlier real-device runtime logs showed `I18nManager.isRTL=false` on Android; (b) RN Android reads the direction when the native surface is created — the preference change only takes effect on a fresh cold start; (c) the automatic restart that would force that fresh start was removed to stop an infinite reload loop (correct call), so the app can run indefinitely in LTR layout on a device whose surface was created LTR. Whether Android currently renders genuine RTL after a manual cold restart was never confirmed on-device.
- **Evidence:** `rtl.ts` doc comment documents the removed restart logic; the runtime log line `[rtl] … isRTL=… (configured RTL=true)` remains to observe state; RN 0.86 `ReactSurfaceImpl` reads `I18nUtil.isRTL` at surface creation (verified in `node_modules/react-native/.../ReactSurfaceImpl.kt`).
- **Recommended fix:** Verify on a cold-started Android device that `[rtl] … isRTL=true` prints and the UI is RTL. If the host ignores the pref, the direction must be forced at the host/activity level (or accept LTR rendering), not via JS that can never apply.

### 4.3 Credentials/config duplicated into committed files and scripts
- **Location:** `app.json` (`extra.supabaseUrl` / `extra.supabaseAnonKey`), `.env`, `scripts/migrate.js` (hard-coded fallbacks), `src/lib/supabase.ts`.
- **Found/why:** The same Supabase URL + anon key are committed in `app.json` and hard-coded in `scripts/migrate.js`. `.env` uses non-`EXPO_PUBLIC_` names so it is never bundled; `src/lib/supabase.ts` reads `process.env.SUPABASE_URL` which is undefined in RN — it effectively always falls back to the committed `app.json` values.
- **Evidence:** `.env` keys `SUPABASE_URL/SUPABASE_ANON_KEY`; `supabase.ts` `Constants.expoConfig?.extra?.supabaseUrl ?? process.env.SUPABASE_URL ?? ''`.
- **Recommended fix:** Use `EXPO_PUBLIC_*` vars (gitignored) or a secret store; treat committed anon key as public but protect data with RLS (see 3.1); remove hard-coded fallbacks from scripts.

### 4.4 No automated validation: no tests, no lint, no CI
- **Location:** `package.json` scripts (`start/android/ios/web/typecheck` only).
- **Found/why:** Only `typecheck` exists. No unit/component tests, no ESLint, no CI. Combined with the recent RTL/shadow/safe-area churn and runtime-only bugs (infinite reload, RTL mismatch), regressions are easy to ship.
- **Recommended fix:** Add ESLint (`expo lint`), a Jest/React Native Testing Library smoke suite for navigators and shared components, and a CI job running typecheck + tests + web export.

### 4.5 Favorites are in-memory only and several counts/data are placeholders
- **Location:** `src/state/favorites.ts`, `src/screens/FavoritesScreen.tsx`, `src/screens/ProfileScreen.tsx`.
- **Found/why:** Zustand store is never persisted (`hydrate` is never called; no AsyncStorage/MMKV dependency). Favorites are lost on every restart. FavoritesScreen shows `6` in the “الكل” pill when the set is empty (mock count), Profile’s “وصفات بصوت طنط منى” stat reuses the favorites count (wrong semantic), and “أكلات مجربة” is hard-coded `0`.
- **Evidence:** `favorites.ts` (no persistence import); `FavoritesScreen` `{count > 0 ? count : 6}`; `ProfileScreen` stat values.
- **Recommended fix:** Persist favorites locally (AsyncStorage/MMKV + hydration), and derive Profile stats from real data or remove mock values.

---

## 5. Medium Priority Issues

### 5.1 Audio hook: perpetual polling, no error state, no audio-session config
- **Location:** `src/hooks/useAudioPlayer.ts`, `src/screens/RecipeDetailScreen.tsx`.
- **Found/why:** A `setInterval(…, 500)` runs for the lifetime of the player even when paused/idle (battery drain on a mounted dock); if the URL never loads (offline/demo host down) the dock stays in `loading` forever (shows `…`, no error/retry); duration is stored in ms while expo-audio reports seconds, an inconsistency that invites bugs; no `setAudioModeAsync`/audio-focus/ducking config; no handling of interrupted playback.
- **Evidence:** `tick()` + `setInterval` in the third effect; `setDuration(Math.round((player.duration ?? 0) * 1000))`; no `catch` branch that transitions to an error state (empty `catch {}`).
- **Recommended fix:** Use `expo-audio`’s built-in `useAudioPlayer` or add event-driven status updates; surface a load-error state; add an explicit audio-mode policy; guard interval by play state.

### 5.2 Recipe detail fires five network requests and ignores most errors
- **Location:** `src/data/queries.ts` (`useRecipe`).
- **Found/why:** `Promise.all` of recipes + ingredients + steps + tips + audio_urls = 5 round-trips per detail view; only the recipes result is error-checked — ingredient/step/tip/audio errors silently produce empty content, which looks like “recipe has no ingredients”.
- **Evidence:** query body; no error handling for the four non-recipe results.
- **Recommended fix:** Single Supabase query with embedded relations (or fewer requests), check each error, add staleTime so returning to a recipe does not refetch.

### 5.3 Recipe list: no ordering, no pagination, no empty/error states beyond a bare message
- **Location:** `src/data/queries.ts` (`useRecipes`), `src/screens/HomeScreen.tsx`.
- **Found/why:** `select(...)` without `.order()` → the “hero” is whichever row the DB returns first (unstable); no limit/pagination (fine for 10 rows, bad later); when data is `[]` with no error the grid renders empty with no empty state; the error state is a single unlocalized string.
- **Evidence:** query select lacks order/limit; Home renders `feedRecipes.map` with no empty branch.
- **Recommended fix:** Order by `created_at` (or curated flag), add explicit empty and retry states, and consider paging.

### 5.4 Inefficient/unused search path (dead Supabase search + ILIKE that cannot use the indexes)
- **Location:** `src/data/queries.ts` (`searchRecipes`), `src/db/supabase-schema.sql` (GIN `to_tsvector('arabic', …)` indexes), `src/screens/SearchScreen.tsx`.
- **Found/why:** `searchRecipes` (3 parallel ILIKE queries + in-memory dedupe) is never called — Search filters the 10 local placeholders in memory. The GIN full-text indexes defined for Arabic search are therefore unused by any code path. ILIKE `%…%` cannot use those indexes anyway.
- **Evidence:** grep usage of `searchRecipes` = 0; SearchScreen filters `placeholderRecipes`.
- **Recommended fix:** Decide the real search backend; if Supabase, use `to_tsvector`/`websearch_to_tsquery` so the indexes are used, or drop the dead code + indexes.

### 5.5 Mixed safe-area / header strategies across screens
- **Location:** `src/app/App.tsx` (global `SafeAreaView` top/left/right), `src/screens/RecipeDetailScreen.tsx` (`headerBar` `top: Platform.OS === 'ios' ? 50 : 40`), `src/screens/CookingModeScreen.tsx` (nested `SafeAreaProvider` + `SafeAreaView edges={['bottom']}`), tab screens.
- **Found/why:** The app already insets top/left/right once at the root, but RecipeDetail manually positions its floating header with platform constants **relative to a content area that already begins below the top inset** — so the back/share buttons can sit ~inset+40px down (double offset on Android), and Profile (no fixed header, no platform branch) behaves differently from the tab screens. CookingMode nests a second `SafeAreaProvider`. Behavior on web (insets 0) therefore differs from Android by design but not consistently.
- **Evidence:** `headerBar` style; nested provider in `CookingModeScreen`.
- **Recommended fix:** Use one consistent pattern: `useSafeAreaInsets()` offsets relative to the screen root instead of fixed Platform numbers; drop the redundant nested provider.

### 5.6 Voice dock styling duplication & dead elevation token
- **Location:** `src/screens/RecipeDetailScreen.tsx` (`voiceDockPlaying` overrides `elevation`/`shadow*` inline), `src/theme/typography.ts` (`elevation.audioDock`).
- **Found/why:** `elevation.audioDock` is never used; the dock re-declares shadow/elevation locally. Minor duplication of the shadow system.
- **Recommended fix:** Use the theme token (or centralize dock style); delete the unused token if not needed.

---

## 6. Low Priority Issues

### 6.1 Dead exports and dead strings (many)
- **Locations:** `src/data/queries.ts` (`searchRecipes`), `src/data/recipes.ts` (`getRecipeDetail`), `src/i18n/numerals.ts` (`toWesternNumerals`, `minutesLabel`, `minutesLabelWestern`), `src/theme/typography.ts` (`fontFamilyFallback` = "Tajawal", `h1Mobile`, `elevation.audioDock`), `src/theme/colors.ts` (`warning`, `info`(used once?), `black`, `scrim`, `heroOverlayLight`, `cardBg`, `navBg`), `src/theme/index.ts` (`minTouchTarget`, `heightLarge`, `heightHuge`), `src/i18n/strings.ts` (large unused blocks: `home.suggested*`, `home.voiceCta`, `search.voice`, `recipeCard.*` list, `recipeDetail.handsBusy*`, `recipeDetail.micButton`(unused), `cooking` voice/timer keys, `favorites` used partly, `sample.*` entirely unused), `src/types/recipe.ts` `Recipe.imageUrl` (no DB column exists anywhere).
- **Evidence:** grep usage counts = 0 for each listed export (see audit method); `t.sample` never referenced.
- **Recommended fix:** Delete dead code/strings or wire them to features; reconcile `Recipe` type with actual schema (no `image_url` column exists in any SQL file).

### 6.2 Dead props / unused imports / unused styles
- **Location:** `src/components/RecipeCard.tsx` (`onVoicePress` prop is destructured but never used — callers in `HomeScreen` pass `() => console.log('voice', id)` that never fires), `src/screens/SearchScreen.tsx` (imports `FlatList`, unused), `src/screens/FavoritesScreen.tsx` (imports `Dimensions`, unused; style keys `emptyState`, `illustrationText` unused), `src/screens/CookingModeScreen.tsx` (`width` from Dimensions and `RoutePropType` unused).
- **Evidence:** grep within the files; RecipeCard JSX never references `onVoicePress`.
- **Recommended fix:** Remove unused imports/props/styles; re-add a real voice affordance if the audio feature lands.

### 6.3 Debug/inert console calls and non-functional controls
- **Locations:** `AppHeader.tsx` (bell `console.log('notifications')`), `HomeScreen.tsx` (dead `console.log('voice', …)`), `SearchScreen.tsx` voice chip and filter chips (no `onPress`), `HomeScreen` filter chips (no `onPress`), `FavoritesScreen` filter pills (no `onPress`), `CookingModeScreen` “عيدي تاني” chip (`onPress={() => {}}`).
- **Why it matters:** Users can tap controls that do nothing; debug logs ship to console.
- **Recommended fix:** Implement or disable (visually `disabled`/hidden) non-functional controls; remove stray logs or gate behind `__DEV__`.

### 6.4 Styling/typography regressions vs design reference
- **Location:** `src/theme/typography.ts`, `src/screens/FavoritesScreen.tsx` (title uses `headlineMd`), `design.md`.
- **Found:** Token values appear inconsistent after an earlier mass scale-down: `headlineMd` is `fontSize: 12, lineHeight: 34`, `h2` is `17/34`, `h1` is `36/43` but mobile screens use `h1Mobile` (20/38, unused) or `h2`; the Favorites title renders at 12 px. Several tokens are unused so the file carries confusing, divergent values.
- **Evidence:** token definitions vs `FavoritesScreen` `title: { ...typography.headlineMd, ... }`.
- **Recommended fix:** Re-baseline typography tokens against `design.md` and intended screen hierarchy; drop unused tokens.

### 6.5 Grid width math can overflow on very narrow screens
- **Location:** `HomeScreen` (`cardWrapper: '48%'` + `gap: 12`), `SearchScreen`/`FavoritesScreen` grids.
- **Found/why:** `48% × 2 + gap(12)` fits only when the inner width ≥ ~300 px; on small devices (~320 px screens) cards can wrap to one column or overflow.
- **Evidence:** style `width: '48%'` with `gap: spacing.md` and no `maxWidth` accounting.
- **Recommended fix:** Use flex-basis with explicit calc or `flex: 1` pairs, or subtract gap via percentage + margin strategy.

### 6.6 Hard-coded values and magic numbers
- **Locations:** `RecipeDetailScreen` `top: 40/50`, `fab bottom: 100`; `CookingModeScreen` `(٠٠:٠٢)`; `HomeScreen` `paddingBottom: 100`; tab bar `bottom: 2`, `elevation: 16`; `FavoritesScreen` `6` fallback.
- **Why:** Fragile to device/inset changes and inconsistent with the spacing/header token system (`headerHeight`, `bottomNavHeight` exist but screens hard-code 100).
- **Recommended fix:** Route through existing tokens or insets.

### 6.7 Iconography inconsistency
- **Locations:** mixed text glyphs (`←`, `↗`, `↺`, `✓`, emoji 🎙️/⏱/❤️) with `@expo/vector-icons` (Feather/MaterialCommunityIcons).
- **Why:** Renders differently across platforms and can look inconsistent; emoji have no color control.
- **Recommended fix:** Standardize on vector icons for UI chrome (keep emoji only in content strings where intended).

---

## 7. UI / UX Audit

**Consistency:**
- Shared chrome is consistent: one `AppHeader` used by Home/Search/Favorites; one `RecipeCard` used across all grids; one custom floating tab bar; category colors come from a small chip palette. ✅
- Good: empty/loading/error states exist on Home and Detail (ActivityIndicator, message), cards have clear CTA, filter chips styled identically on Home/Search.

**Problems found:**
- Empty states: Home feed with zero rows has no empty message; Search empty relies on literal `ما لاقيناش وصفة بـ "…"` (good) but only when a query is typed; Favorites empty state exists and is nice.
- Filter pills/chips (Home categories, Search filters, Favorites filters) are **visual only** — no filtering, no active-state management (except Favorites static “الكل” highlight). Users tapping them get no feedback change. (MEDIUM)
- Recipe grid card CTA “شوفي الوصفة” and the hero card are the only affordances; recipe cards are not favoritable inline anywhere except Detail (only place to add favorites) — after favoriting from Detail, users must go to Favorites tab to see it.
- Search input has clear (✕) only when text is present — fine. No debounce (not needed for local).
- Favorites “الكل” pill count shows `6` when empty (mock).
- Cooking mode: timer label always `(٠٠:٠٢)`; no countdown; “عيدي تاني” does nothing; “التالي” chip works like next step (duplicate of bottom button).
- Bottom tab order/content is consistent across the four tabs; active pill + label + icon states are consistent.

**Accessibility gaps (MEDIUM):**
- Many icon-only and emoji glyphs lack `accessibilityLabel` (back arrows on RecipeDetail use `<Text>←</Text>` inside a labeled Touchable, share has label; but Cooking nav buttons/exit, voice-dock emoji icons, favorite heart text buttons rely on visible text). Some visible-text labels exist (fine).
- `TouchableOpacity` wraps cards that contain nested `TouchableOpacity` CTA (recipe card) — nested interactive elements can confuse screen readers and double-activate.
- Font sizes: several titles now 12–17 px (see 6.4) — small for the target audience (cooking users, potentially older adults); design.md sets larger title/body targets. Contrast of `neutralLight #777` on cream fails WCAG AA (design.md already flags it) but it is used for captions/secondary text.
- Touch targets: 40 px icon buttons (< 44 recommended by design.md); tab items ~48px tall okay.

---

## 8. RTL & Platform Compatibility

**Current state (post recent fixes):**
- `src/i18n/rtl.ts` is the single source of truth: `allowRTL(true)` + `forceRTL(true)` + `swapLeftAndRightInRTL(false)` on native; `document.documentElement dir="rtl"` and an app wrapper `<View dir="rtl">` on web (`src/app/App.tsx`). No per-screen RTL logic and no `row-reverse` anywhere (verified by grep). ✅
- Shared components are authored in logical RTL order: `AppHeader` (brand/logo start-right, actions end-left), tab bar `TAB_ITEMS` Home-first (renders right in RTL), grids use default RTL wrap. ✅
- Header title/indicator are pinned right with `width:'100%' + textAlign:'right'` (deliberate physical anchor next to the fixed right logo). Bottom-nav shadow uses the overflow-separated shell + `elevation: 16` for Android while Web keeps the same `shadow*` (verified identical box-shadow). Card shadows moved off the `overflow:hidden` surface. ✅

**Outstanding risks:**
1. **Android runtime direction unverified (HIGH).** Configuration is RTL=true but a real cold-start device log is required to confirm `I18nManager.isRTL=true`. Auto-restart was intentionally removed after the infinite-reload bug; therefore a device whose surface was created LTR can remain LTR even though JS config says RTL. Documented in `rtl.ts`.
2. **Physical styles vs. swap:** swap is disabled to mirror react-native-web; this is consistent by design, but absolute-positioned elements that assumed LTR geometry (e.g., audio badge `right: spacing.sm`, detail hero category `right`) now render pinned to the same side on both platforms only because swap is off — verify visually for both RTL correctness and web parity.
3. Web/Android parity items verified only on Web during development (shadows, dir=rtl, order); device verification is outstanding for the four tab screens and stack screens.
4. `RecipeDetailScreen` still uses `Platform.OS` for header offsets (a deliberate native/status-bar offset), which is fine but is the only remaining platform branch in UI code.

---

## 9. Backend & Supabase Audit

- **Client:** `createClient(url, anonKey)` in `src/lib/supabase.ts`. No auth provider is used; the app is anonymous (no login). Any per-user feature (favorites) is local-only.
- **Queries:** 
  - `useRecipes`: single select, no order/limit; returns all rows; errors logged + thrown (react-query retries 3× by default).
  - `useRecipe`: 5 parallel requests; only the recipe request is checked; sub-request errors silently ignored → empty ingredients/steps/tips (MEDIUM).
  - `searchRecipes` (dead): three ILIKE queries; no `.limit()`; dedupes client-side (MEDIUM perf if ever enabled).
- **Schema risk (HIGH):** three diverging schema files (id type TEXT vs UUID; `recipes.audio_url` present in `schema.sql`/`seed.sql` but absent in `supabase-schema.sql`/`supabase-full-setup.sql`); seed uses TEXT ids matching `src/data/recipes.ts`, while the “modern” schema files use UUID. If the live DB doesn’t match what the code expects (the code was recently changed to read the separate `audio_urls` table and to *stop* selecting `recipes.audio_url`), recipe lists/details can break.
- **RLS/security (see 3.1):** no RLS or policies anywhere; anon key is used for upserts in the migration script.
- **Indexes:** GIN tsvector indexes defined but never used by any query; category btree index fine.
- **No offline/caching layer** beyond react-query defaults (no staleTime → refetch on every mount/focus; acceptable in dev, chatty on device).
- **Data validation:** none client-side before display; numeric coercion defaults exist in `mapRecipe` (good defensive defaults).

---

## 10. Audio / Voice Audit

- **Integration:** expo-audio `createAudioPlayer` used by the custom `useAudioPlayerHook` (not the built-in `useAudioPlayer`). Config: `updateInterval: 500` passed correctly per expo-audio API.
- **Lifecycle:** cleanup `player.remove()` on unmount/url change is present. ⚠️ A `remove()` can be invoked twice (two effects reference the same player) — guarded by try/catch, low risk.
- **State:** manual 500 ms polling drives `idle/loading/playing/paused`. Bugs/risks: stuck in `loading` on load failure with no error surfaced (MEDIUM); `duration`/`position` stored in ms though the API reports seconds — internal inconsistency (LOW); polling continues while paused/idle (LOW battery).
- **Playback rules:** dock background/icon colors follow the documented design rules; replay seeks to 0.
- **Platform:** no `setAudioModeAsync` (iOS silent-mode/ducking not configured); no audio interruption handling; no multiple-player coordination (Detail dock + potential Cooking audio could overlap if both mounted).
- **Missing product features (HIGH):** no speech recognition, no TTS/narration synthesis, no ElevenLabs integration anywhere in source; “narrator” is just remote demo MP3s (`SoundHelix-*.mp3`) that are not project-owned and could disappear. CookingMode has no audio at all beyond static chips.

---

## 11. Performance Audit

- **Rendering:** All screens are light; lists are tiny (≤10 recipes). No FlatList in use (Search imports it but uses ScrollView+map) — fine at this scale, but grids will need virtualization if the catalog grows.
- **Re-renders:** `RecipeDetailScreen` re-renders on every 500 ms audio tick (state updates position/duration propagate to the dock subtree) — bounded but unnecessary; memoizing the dock would help. `HomeScreen`/`SearchScreen` grids remount cards on every keystroke filter (Search) — negligible at 10 rows.
- **Startup:** App blocks render until the Cairo font loads (blank screen; no splash-screen hold even though `expo-splash-screen` is a dependency). Config work at startup is trivial. React Query starts fetching Home recipes immediately (single request).
- **Data:** 5 requests for detail, list refetch-on-focus without staleTime; no pagination.
- **Images:** No image pipeline/columns exist; cards show 2-letter placeholder text instead of images. If images are added later, plan for sizing/caching.
- **Audio:** 500 ms polling (see §10).
- **Bundle:** No bundle-size analysis available; dependencies include an unused AI SDK (`@qoder-ai/qoder-agent-sdk`) and several unused Expo packages (see §14). expo-updates was added for the (now removed) restart and may be removable.
- **Android-specific:** Elevation-based shadows are used correctly after the split-shell fix; SafeArea double-inset was removed on tab screens (good).

---

## 12. Security Audit

- **Secrets:** Supabase anon key and project URL are committed in `app.json` and hard-coded in `scripts/migrate.js`; `.env` duplicates them but is gitignored and not actually consumed (non-`EXPO_PUBLIC_`). Anon keys are meant to be public **only if** RLS protects the data. (HIGH, see 3.1)
- **RLS:** absent from all checked-in SQL — see 3.1 (CRITICAL if unverified on the live project).
- **Write access via anon key:** the migration script demonstrates anon-key writes are possible if RLS is off.
- **No auth/user isolation:** none needed today (no user data server-side), but if favorites/accounts move to Supabase, RLS policies must be added.
- **Input handling:** search (dead path) escapes LIKE wildcards — good practice; no SQL injection vector in the live query path (all parameterized Supabase filters).
- **Dependencies:** `@qoder-ai/qoder-agent-sdk` is installed but unused — supply-chain surface with no benefit (MEDIUM hygiene).
- **No HTTPS/redirect concerns** for an Expo client; remote audio URLs are plain HTTPs (soundhelix is https). Fine.
- **Sensitive data exposure:** none (no user data stored).

---

## 13. Code Quality & Technical Debt

**Good:**
- Strict TypeScript; `npm run typecheck` passes. Clean, small component files; clear naming; localized strings centralized (even if many are unused); theme tokens centralize colors/spacing/typography/elevation; Supabase access confined to `data/queries.ts`; Arabic-numeral helper is clean.

**Issues:**
- `any` usage: `navigation: any`, `(props: any)`, `mapRecipe(r: any)`, `rows: any[]`, `route: any`… — moderate, contained to navigation & DB mapping; recommend typing with navigation generics (RootStackParamList exists) and generated DB row types. (MEDIUM)
- Dead code is pervasive: dead data providers (`searchRecipes`, `getRecipeDetail`), dead strings (~40+ keys), dead theme tokens/exports, unused imports/styles, dead `onVoicePress` prop, unused `Recipe.imageUrl`. (MEDIUM → LOW, see §6)
- Duplication: three DB schema files; recipe content duplicated across `src/data/recipes.ts`, `src/db/seed.sql`, and `src/i18n/strings.ts` `sample` (already diverged); per-screen copy-pasted fixed-header pattern; per-screen duplicate styles (grid wrapper, paddings).
- Magic numbers: see 6.6.
- Typo: `encouragmentTitle`/`encouragmentBody`/`encouragmentCta` (missing “e”); also `implementaion.md` filename typo.
- The comments above `headerTitleBlock`/logo and many file headers are helpful; a few stale comments remain (e.g., `index.js` comment says “matches the Web preview on every platform” which no longer reflects the RTL=true intent).

---

## 14. Dependencies & Configuration

- **SDK match:** Expo 57 with RN 0.86.3, React 19.2.3 — internally consistent; `react-native-web` ^0.21.2 matches SDK expectations; navigation v6 works with this RN.
- **Unused/suspicious dependencies:** `@qoder-ai/qoder-agent-sdk` (never imported), `expo-asset` (plugin only; no `Asset` usage), `expo-linking` (no linking configured), `expo-splash-screen` (installed, never called/plugin not listed), `react-native-gesture-handler` (never imported; not required by current navigators), `expo-updates` (added for a now-removed restart path — could be removed; note it also slightly increases bundle), `@expo/vector-icons` (used), `zustand` (used).
- **Config problems:** `app.json` lacks app icons/splash image references (only `android.adaptiveIcon.backgroundColor`); plugins `expo-audio` + `expo-asset` present, no `expo-updates` plugin (not needed for Expo Go). `.env` is unused by the app (see §4.3). `assetBundlePatterns` legacy key present. `expo.extra` duplicates `.env`.
- **Scripts:** minimal (`start/android/ios/web/typecheck`). No `lint`, `test`, `export` script.
- **Lockfile churn:** `package-lock.json` shows a very large diff vs. the previous state (1.7k lines) from the recent dependency additions.
- **Backup artifact:** `package.json.backup-51` (old Expo 51 manifest) is committed — remove or ignore.

---

## 15. Testing & Validation

- **In place:** `npm run typecheck` (TS strict). Manual/web validation performed during development (RTL probes, shadow checks on the web export).
- **Missing (HIGH for a release):** no unit tests, no component/snapshot tests, no navigation tests, no Supabase integration/mocking tests, no lint, no CI, no device test matrix (Android/Web at minimum). The recent history (infinite reload loop, RTL divergence, shadow clipping, double safe-area insets) shows exactly the class of regressions that automated tests + a real-device checklist would catch.
- **High-regression-risk areas:** RTL layout order on device, floating bottom-nav geometry, fixed-header overlap, safe-area behavior on notched/gesture Android, audio lifecycle, and data-path consistency (local vs Supabase).

---

## 16. Project Hygiene

- **Generated/unwanted artifacts in the repo:** `dist/` and `.expo/` are gitignored; `dist-check/` (a static web export) is **not** ignored and is untracked — remove or gitignore. `stitch-screens/*.html` (design references), `shot-home-*.png` screenshots, many `brief-*.txt`, `plan.md`, `implementaion.md`, `design.md`, `package.json.backup-51`, and `scripts/*-check/measure/probe*.cjs` dev scripts are committed — mostly intentional working notes; recommend moving design docs/screenshots to a docs folder and pruning scripts.
- **Debug code:** `console.log('notifications')`, `console.log('voice', …)` (dead), `[rtl]` startup log (intentional diagnostic), `console.error` on Supabase errors (legit). 
- **Stray empty folders:** `public/` is empty (Expo will use a default web template).
- **Naming:** `implementaion.md` typo; `encouragment*` typo in string keys; `useAudioPlayerHook` is oddly named (there is no plain `useAudioPlayer` local export, but expo-audio exports one — the name invites confusion).
- **.vscode/launch.json + .vscode/.react:** tooling-specific; fine to keep locally, consider not committing.

---

## 17. What's Already Good

1. **Clean architecture:** strict layering, UI/data/infra separation, theme + i18n centralized, Supabase isolated in one module.
2. **TypeScript strict + typecheck passes.**
3. **Android shadow correctness:** overflow/`elevation` split for the bottom nav and recipe cards; Web `box-shadow` values preserved; elevation tokens live in the theme.
4. **Safe-area deduplication:** nested per-screen `SafeAreaView` top-insets were removed; one app-level inset now governs tabs; CookingMode only adds the bottom inset.
5. **RTL direction discipline:** a single `rtl.ts` source of truth, web root `dir="rtl"`, logical authoring of the shared header and tab order, no `row-reverse` hacks, and the infinite self-reload loop was removed.
6. **Polish of shared UI:** consistent AppHeader, RecipeCard, floating tab bar with active pill, category chips, empty/loading/error states on the main flows.
7. **Defensive data mapping:** `mapRecipe` applies sensible defaults (minutes/persons/difficulty/categoryColor).
8. **Security-minded search code** (in the unused path): LIKE-wildcard escaping is done correctly.
9. **Arabic localization quality:** content and Eastern-Arabic numerals handled via a small helper; strings centralized (despite dead keys).
10. **No runtime JS errors** in the current web export during development checks; startup is stable (no reload loop).

---

## 18. Recommended Fix Roadmap

### Fix immediately
1. Supabase: enable RLS + read-only anon policies (or confirm they exist server-side); stop using the anon key for writes; remove the anon-key migration script (3.1, 4.3, 12).
2. Reconcile the data source split + id scheme so Search/Favorites → RecipeDetail cannot 404 (4.1); single schema file (9).
3. Confirm RTL on a cold-started Android device via the `[rtl] … isRTL=true` log; decide and document the LTR fallback behavior if the host ignores the pref (4.2).

### Fix before release
4. Decide voice scope: implement real audio assistant features or strip the dead voice UI and demo MP3s (3.2, 10).
5. Persist favorites locally and remove mock counts (4.5); wire Profile stats to real data.
6. Add error/empty/loading polish and functional filters, or visibly disable them (5.1/6.3/7).
7. Audio hook: stop polling when idle, surface load errors, consider the built-in expo-audio hook (5.1).
8. Reduce detail to fewer queries and check all errors (5.2); order recipes and add an empty state on Home (5.3).
9. Add lint, a smoke test suite, and CI running typecheck + tests + web export (4.4, 15).
10. Environment config hygiene: move keys to `EXPO_PUBLIC_*`/secret store; delete committed duplicates (4.3).

### Improve later
11. Consistency pass: safe-area/header offsets via insets (5.5), typography re-baseline (6.4), icon standardization (6.7), token-driven spacing (6.6).
12. Dead-code removal sweep: unused data providers, ~40 i18n keys, theme tokens, imports, styles, `Recipe.imageUrl` (6.1/6.2, 13).
13. Grid responsiveness for narrow devices (6.5); virtualization when the catalog grows (11).
14. Remove unused dependencies (`@qoder-ai/qoder-agent-sdk`, `expo-linking`, `expo-splash-screen`, `expo-asset`, `react-native-gesture-handler`, possibly `expo-updates`) and stale config artifacts (`package.json.backup-51`, `dist-check/`, stray docs/screenshots) (14, 16).
15. Bundle-size analysis and caching strategy (staleTime/pagination) (11).

---

## 19. Final Assessment

**Overall health: FAIR (prototype-quality UI, release-blocking gaps in data/security/validation).**

Strengths: clean, typed, well-organized code; a coherent Arabic RTL design system; genuinely good Android shadow/safe-area engineering after the recent fixes; stable startup after removing the reload loop; the shared UI (header, cards, tab bar) is consistent and matches the design reference on Web.

Biggest remaining risks:
1. **Data integrity & security**: RLS posture is unverified, credentials are duplicated into committed files, and the local-placeholder ↔ Supabase split can produce broken detail screens depending on the live schema (UUID vs TEXT ids).
2. **Product completeness**: the flagship voice/hands-free features are not implemented; demo MP3s and inert controls currently stand in for them.
3. **RTL on real Android** is configured but not yet confirmed end-to-end on a cold device start; Web is RTL-correct by construction.
4. **No automated testing or lint/CI** around a codebase with a documented history of platform-specific regressions.

Recommendation: address items in “Fix immediately” first (RLS/schema/RTL confirmation), then the “Fix before release” set (voice scope, favorites persistence, data error paths, test tooling). The codebase is small and clean enough that these are all tractable without restructuring.

---

*Audit method: full read of every source/config/SQL file in the working tree, targeted greps for dead code/usage counts, API signature verification against installed `expo-audio`, verification of `npm run typecheck`. No runtime device instrumentation performed; on-device claims are flagged as unverified. No files were modified during this audit.*

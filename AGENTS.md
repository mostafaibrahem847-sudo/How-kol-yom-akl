# AGENTS.md — how to work in this repo

> Working reference for AI coding agents (Claude, Cursor, Codex, etc.).
> Facts below were verified by reading the code, `git`, and a read-only query of
> the live Supabase project on **2026-10-21**. Anything not verified is marked
> **[UNVERIFIED]** or **[UNKNOWN]**. Do not silently "fix" statements here —
> re-verify and update this file when the repo changes.

---

## 1. Read this first (non-negotiable rules)

1. **Test UI, animation, and interaction changes on a real device via Expo Go
   (Android-first).** `tsc` green and a web preview are *not* proof. The
   Home list/grid toggle has regressed repeatedly (commits `5b49126`,
   `b478078`, `2fed1c1`): lag, flash, and scroll-position loss only show up on
   device.
2. **Run `git status` and `git diff` before every commit.** This working tree
   routinely contains unrelated WIP (media deletions, `app.json`, skills
   metadata, Home-screen refactors). Stage only the files your change needs.
3. **Never commit lockfile changes blindly.** Run a fresh `npm install`, then
   diff the lock against `package.json`. A phantom dependency
   (`@qoder-ai/qoder-agent-sdk`: in the lock but not in `package.json`) and an
   unrelated web dependency (`shadcn`) have both polluted the tree before, even
   though a `chore: remove unused qoder-agent-sdk dependency` commit exists.
4. **Keep `npm run typecheck` green.** There is no lint, test suite, or CI.
5. **Never commit secrets.** `.env` is gitignored and has never been committed;
   only `.env.example` (placeholders) is tracked. Never rename a server key to
   `EXPO_PUBLIC_*`.
6. **Use theme tokens, never raw colors/spacing.** `src/theme` is the source of
   truth and mirrors `design.md`.
7. **Arabic copy is Egyptian colloquial, and must not default to feminine
   address.** Use `ابدأ` (not `ابدئي`), `سجّل` (not `سجّلي`), `اختار` (not
   `اختاري`), `جرّب` (not `جرّبي`). Current copy follows this; keep it that way.
8. **Do not reintroduce removed features/patterns** (search box/`useRecipeSearch`,
   category chip filter, random featured hero card, `heroPick.ts`, the animated
   feed wrapper — see §13).

---

## 2. Project identity

| Item | Value |
|---|---|
| Name | **هو كل يوم أكل** / `howa-kol-yom-akl` |
| Slug / scheme | `howa-kol-yom-akl` / `howakolyomakl` |
| What it is | Voice-first Egyptian-Arabic home-recipe app ("a relative in the kitchen") |
| Audience | Egyptian home cooks, Arabic-first, RTL |
| Language | Egyptian colloquial Arabic in UI, content, and narration (not MSA) |
| Platforms | Android (primary), Web (react-native-web), iOS |
| Entry | `index.js` → `configureRtl()` → `src/app/App.tsx` |
| Status | Live product on a real Supabase backend; active development |

Core loop: browse recipes on Home (cuisine row + list/grid feed) → open recipe
detail (ingredients / steps / tips) → optionally play narration → favorite
locally.

---

## 3. Documentation freshness (read the code first)

| Doc | State |
|---|---|
| `README.md` | **Partly stale.** Says 50 recipes (live DB has 100), documents a search box + `searchRecipes` + `useRecipeCategories` (deleted in `f813d52`), a category chip filter (replaced by the cuisine row in `a933eb6`), a rotating featured hero card (removed in `78f307c`), and lists `heroPick.ts` / `CategoryFilter` in the tree. Treat §3–§10 architecture claims carefully. |
| `PROJECT_CONTEXT.md` | **Mostly accurate.** Still lists fixed items as open (4 ungated `console.error`s — now gated; the random hero — removed) and says 100 recipes / 30 with audio (that part is correct). |
| `design.md` | Design spec; palette matches `src/theme/colors.ts`. Useful for intent, but code wins. |
| `audit/security-cleanliness-audit.md` | Dated **2026-10-06**, untracked. Many findings are now fixed (see §18). |
| `audit/audit.md`, `audit/roadmap.md`, `plan.md`, `implementaion.md` | Historical/planning docs; partially superseded. |
| `public/recipe.md` | Authored content for the **first 50** recipes (tracked). |
| `.work/*.sql` | **Gitignored** and holds the second 50 recipes + the `cuisine` backfill (see §6). |

Known doc contradictions (verify against the DB/code, don't trust either):
recipe count (50 vs 100), narration coverage (~20 vs 70 missing), whether search
exists (it does not).

---

## 4. Verified tech stack

| Layer | Version / choice | Where |
|---|---|---|
| Expo SDK | **57** (installed `expo@57.0.26`) | `package.json`, `app.json` |
| React Native | **0.86.3** | installed |
| React | **19.2.3** | installed |
| TypeScript | **~6.0.3**, `strict: true`, `jsx: react-native`, `moduleResolution: bundler` | `tsconfig.json` |
| Path alias | `@/* → src/*` configured but **unused** (code uses relative imports) | `tsconfig.json` |
| Navigation | React Navigation **v6** — `@react-navigation/native-stack ^6.11.0`, `bottom-tabs ^6.6.1` | `src/navigation/RootNavigator.tsx` |
| Server data | **Supabase** `@supabase/supabase-js ^2.45.4` | `src/lib/supabase.ts` |
| Auth | **Clerk** `@clerk/expo ^4.6.8` + `tokenCache` (SecureStore) | `src/app/App.tsx` |
| Query cache | **TanStack Query v5** (`^5.59.0`), stale 5 min / gc 30 min / no refetch-on-focus | `src/app/App.tsx` |
| Client state | **Zustand `^4.5.5`** + `persist` + AsyncStorage (favorites, view mode) | `src/state/*` |
| Audio | **expo-audio ~57.0.5** (`useAudioPlayer`, `useAudioPlayerStatus`) | `src/hooks/useAudioPlayer.ts` |
| Images | **Cloudinary** (cloud `decj37mm0`); URLs come from the DB | `src/lib/imageUrl.ts` |
| Fonts | **Cairo** static per-weight files (not the variable font) | `assets/fonts/`, `src/theme/typography.ts` |
| Icons | `@expo/vector-icons` — Feather + MaterialCommunityIcons | components |
| Gradients | `expo-linear-gradient` | cards, hero |
| Tooling | **No ESLint / Jest / Prettier / CI config exists** | repo root |

Not directly imported in `src/` (present for Expo config/transitive reasons):
`expo-asset`, `expo-constants`, `expo-crypto`, `expo-linking`,
`expo-secure-store`, `expo-splash-screen`, `react-native-screens`,
`react-native-gesture-handler`. Do not add new code that depends on
`expo-splash-screen` without wiring it in `app.json` too.

---

## 5. Architecture

Three layers, one direction — **screens never import the Supabase client**:

```
screens/components  →  data/queries.ts + state/*  →  lib/supabase.ts
```

- **`src/app/App.tsx`** — ClerkProvider → QueryClientProvider → SafeAreaProvider →
  NavigationContainer → ResponsiveProvider → RootNavigator. Blocks first paint
  until fonts load and RTL resolves.
- **`src/navigation/RootNavigator.tsx`** — native stack, `initialRouteName="Welcome"`,
  routes: `Welcome`, `SignIn`, `SignUp`, `Tabs`, `RecipeDetail`, `PrivacyPolicy`,
  `Terms`. Custom animated bottom tab bar with a sliding active pill and
  Reduce Motion support.
- **`src/data/queries.ts`** — the only Supabase read layer:
  `useRecipes()`, `useRecipesByCuisine(cuisine)`, `useRecipe(id)`.
- **`src/state/`** — Zustand stores (`favorites.ts`, `viewMode.ts`) persisted to
  AsyncStorage with resilient wrappers and hydration guards.
- **`src/lib/`** — `supabase.ts` (client), `audio.ts` (`hasRealAudio`),
  `images.ts` (`hasRealPhoto`), `imageUrl.ts` (`cardImageUrl`), `clerkErrors.ts`.
- **`src/theme/`** — tokens + `ResponsiveProvider` (single measured frame).
- **`src/i18n/`** — `strings.ts` (all copy), `numerals.ts`, `rtl.ts`.
- **`src/hooks/`** — `useAudioPlayer.ts`, `useRecipeDetailData.ts`.
- **`src/db/`** — canonical `schema.sql`, seeds, plus live-DB drift (see §6).

### Folder map (`src/`)

| Path | Purpose |
|---|---|
| `app/` | Root providers + boot gate |
| `navigation/` | Stack + custom tab bar + `RootStackParamList` |
| `screens/` | Home, Favorites, Profile, RecipeDetail, Welcome, SignIn, SignUp, PrivacyPolicy, Terms |
| `components/` | AppHeader, cuisine cards/row, recipe cards (grid/list/media), detail sections (hero/overview/stats/tabs/ingredients/steps/tips/top bar/sticky bar/voice card), auth form/inputs, toggles |
| `data/` | `queries.ts`, `cuisines.ts` |
| `state/` | Zustand persisted stores |
| `hooks/` | Audio player + recipe-detail data/actions |
| `lib/` | Infrastructure + URL/error guards |
| `theme/` | Colors, spacing, typography, elevation, responsive frame |
| `i18n/` | Strings, numerals, RTL resolution |
| `types/` | `Recipe`, `RecipeDetail` |
| `db/` | `schema.sql`, `seed.sql`, `seed-recipe-md.sql` |

Dead code to be aware of: **`src/components/RecipeCard.tsx` has zero imports**
(legacy featured card). `hasRealPhoto()` in `src/lib/images.ts` is exported but
unused. `t.search` in `strings.ts` is a leftover from the removed search.

---

## 6. Data layer & database

**Supabase project:** `lawoormzqfeyafjrptwc`. Client built once in
`src/lib/supabase.ts` from `EXPO_PUBLIC_SUPABASE_URL` +
`EXPO_PUBLIC_SUPABASE_ANON_KEY`. The anon key is public **only because** RLS is
SELECT-only.

**Live data snapshot (read-only query, 2026-10-21):**

| Metric | Value |
|---|---|
| `recipes` | **100** |
| Recipes with ingredients | 100 |
| `audio_urls` rows / `audio_available = true` | **30** (all real URLs) |
| Cuisines | 7 — `global` 32, `egyptian` 25, `asian` 15, `levantine` 14, `gulf` 6, `moroccan` 4, `turkish` 4 |
| Recipes without `image_url` | 1 — `shrimp-scampi` |

**Tables** (`src/db/schema.sql`): `recipes` (TEXT slug PK, e.g. `molokhia`),
`ingredients`, `steps`, `tips` (UUID PKs, `recipe_id` TEXT FK, `sort_order`),
`audio_urls` (unique index on `recipe_id` — one narration row per recipe).
RLS is enabled on all five with one `SELECT` policy each for role `anon`; no
write policies exist (writes need the service role). Deterministic ordering:
`recipes.sort_order`, then child `sort_order`.

**Schema drift — important:** the live `recipes` table has a `cuisine` text
column used by `useRecipesByCuisine()`, but **`src/db/schema.sql` does NOT define
it**. The only migration is `.work/add-cuisine-column.sql`, which is
**gitignored**, says "NOT executed", and is in fact already reflected in the live
DB. Likewise, the tracked seeds contain **only the first 50 recipes**
(`src/db/seed-recipe-md.sql`, `seed.sql`); the second 50 live in gitignored
`.work/recipe2-insert.sql` / `public/recipe2.md`. A fresh environment cannot be
reproduced from tracked files alone. If you touch schema/content, move these into
tracked files (and update `schema.sql`).

**Queries (`src/data/queries.ts`):**

- Single `mapRecipe()` mapper for list and detail — add columns there once.
- List query selects `ingredients!inner(id)` so recipes without authored
  ingredients never appear (and reappear automatically once added).
- `RECIPES_LIST_LIMIT = 500` — a safety cap, **not pagination**. Add pagination
  before the catalog approaches it.
- Detail query uses one embedded select including `audio_urls(url)`,
  ordered child reads, `.single()`; `PGRST116` (missing row) resolves to `null`
  (distinct from a thrown error).
- Dev-only `assertCatalogIds()` warns on duplicate/empty recipe ids — ids are
  navigation keys everywhere.
- `console.error` for query failures is gated behind `__DEV__`.

**Cuisine cards:** `src/data/cuisines.ts` is the metadata source for the Home
row (7 entries, Arabic titles, Cloudinary URLs). Its `id`s must match live
`recipes.cuisine` values exactly. URLs follow
`https://res.cloudinary.com/decj37mm0/image/upload/v<ts>/cuisine-images/<id>.jpg`.
Recipe images follow `.../image/upload/v<ts>/<slug>.jpg` (no folder).
`cardImageUrl(url, width)` injects `w_<width>,q_auto,f_auto` for cards (default
600; cuisine cards 450); full-size URLs are used for hero images.

**Local untracked photos:** `public/*.jpg` (7 files) are the *source* photos
uploaded to `cuisine-images/*` (byte-size match confirmed), **not** runtime
assets — the app reads the Cloudinary URLs in `cuisines.ts`. Do not wire the
local files into components.

---

## 7. Authentication (Clerk)

- `ClerkProvider` is always mounted in `src/app/App.tsx`, configured by
  `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`; native sessions persist via
  `tokenCache` (expo-secure-store). A missing key only logs a dev warning and
  Clerk fails at runtime.
- Stack starts at **Welcome**; `SignIn` / `SignUp` use the shared `AuthForm`
  (email+password + Google SSO) and then `navigation.replace('Tabs')`.
- Clerk is **identity only**: recipe data access is anonymous/RLS-read-only, and
  favorites are device-local (AsyncStorage), not per-user server data.
- Favorite affordances are gated by `useAuth().isSignedIn`
  (`RecipeCardMedia` hides the heart; `FavoritesScreen` shows a sign-in card).
  `welcome → Tabs` is still reachable without signing in (product decision).
- Clerk error codes → Arabic copy in `src/lib/clerkErrors.ts`.

---

## 8. Audio & narration

- Playback: `src/hooks/useAudioPlayer.ts` wraps `expo-audio`; state machine
  `idle | loading | playing | paused`, driven by `useAudioPlayerStatus` events
  (`didJustFinish` rewinds and returns to idle; pause keeps position).
- One player per detail screen, created in `useRecipeDetailData()` and shared by
  the inline `VoiceAssistantCard` and the `RecipeStickyBar` (`ListenButton`).
  `useAudioPlayerHook` is called unconditionally before early returns — keep that
  hook order.
- `hasRealAudio()` (`src/lib/audio.ts`) hides listen UI for non-`https` and
  `example.com` placeholder URLs.
- DB shape: one `audio_urls` row per recipe; live URLs are
  `https://lawoormzqfeyafjrptwc.supabase.co/storage/v1/object/public/recipe-audio/<recipe-id>.mp3`
  (public `recipe-audio` bucket, file name = recipe id).
- Generation tooling:
  - ElevenLabs: `scripts/generate-narration.ts` + shared `scripts/elevenlabs.ts`
    (voice `kRMdi13Pz8QNEEDACcfH`, model `eleven_multilingual_v2`, output
    `mp3_44100_128`, resumable, dry-run supported). `npm run narration:dry` /
    `npm run narration`.
  - Edge TTS (free): `scripts/generate_recipe_audio.py` (`ar-EG-SalmaNeural`).
  - Narration text: `voice-scripts-egyptian-story.md`, keyed by recipe id.
  - The batch script writes to `output/<id>.mp3` (gitignored); it does **not**
    upload or write to Supabase — register URLs separately.
- Stale comment warning: `scripts/generate-narration.ts` still claims every
  `audio_urls` URL is an `example.com` placeholder. That is no longer true.

---

## 9. Design system

Palette (`src/theme/colors.ts`, mirrors `design.md`):

| Token | Hex | Use |
|---|---|---|
| `primary` | `#D35400` | Terracotta: CTAs, active states, brand |
| `primaryLight` | `#F4A261` | Soft fills / highlights |
| `primaryDark` | `#C94F0E` | Pressed/borders |
| `primaryDeep` | `#9E3D00` | Small brand text/icons (WCAG AA; `primary` fails at normal size) |
| `secondary` | `#FDFBF7` | Cream app background |
| `secondaryLight` | `#FAF3E0` | Light card/input bg |
| `secondaryDark` / `border` | `#EDE9D0` | Dividers / borders |
| `accent` | `#556B2F` | Deep olive: tags, success, highlights |
| `accentLight` / `accentDark` | `#8DAA91` / `#3E5424` | Accent variants |
| `neutralDark/Mid/Muted/Light` | `#1A1A1A` / `#333333` / `#555555` / `#777777` | Text |
| `error` | `#BA1A1A` | Errors |

The bottom tab bar defines its own local accent `#7e1911` / tint
`rgba(154,19,7,0.12)` in `RootNavigator.tsx` — keep it local unless the design
changes globally.

Other tokens: `spacing` (`xs 4`, `sm 8`, `md/lg 15`, `xl 24`, `xxl 32`),
`radius` (`full 9999`, `card 12`, `medium/large 20`, `input 8`), `elevation`,
`headerHeight = 64`, `screenPadding = { horizontal: 16, vertical: 24 }`.

**Typography:** Cairo static files only. Use `fontFamilyFor(weight)` +
`fontWeight: 'normal'` (typography presets already do). Never use plain
`fontWeight: 'bold'` — that causes synthetic bold and platform drift. Families:
`Cairo-Regular/-Medium/-SemiBold/-Bold/-ExtraBold`, plus a real oblique
`Cairo-Medium-Oblique` (`fontFamilyOblique`) instead of `fontStyle: 'italic'`.
Fonts are loaded via `FONT_ASSETS` in `App.tsx`.

**Responsive:** consume `ResponsiveProvider` / `useResponsive()` — not
`Dimensions`/ad-hoc `onLayout`. Reference frame `390×844`, single-column cap
`SINGLE_COLUMN_MAX_WIDTH = 520`, breakpoints: compact `< 380`, wide `>= 600`.

**Numerals:** use `toArabicNumerals()` from `src/i18n/numerals.ts` for counts and
quantities (Eastern Arabic digits ٠–٩) — e.g. tab labels and ingredient counters.

**RTL:** single source `src/i18n/rtl.ts`. `index.js` calls `configureRtl()`;
`App.tsx` awaits `resolveLayoutDirection()` before paint. Native uses
`I18nManager.forceRTL` with a one-shot surface reload guarded in AsyncStorage
(never reload in a loop) and `swapLeftAndRightInRTL(false)` so physical
`left:/right:` styles keep their meaning. Web sets `document.dir="rtl"` and adds
a `dir` prop wrapper. Author layouts in logical order; avoid hard-coded physical
sides unless you account for mirrored styles.

---

## 10. Language & copy rules

- All user-facing text lives in `src/i18n/strings.ts` (`t.*`). Add strings there,
  not inline (existing debt: a few hardcoded Arabic strings in
  `FavoritesScreen.tsx`, the share message in `RecipeDetailScreen.tsx`, and the
  `'سهلة'` fallback in `queries.ts`).
- Egyptian colloquial Arabic; avoid MSA constructions.
- **Gender rule:** do not address the user with feminine imperatives. Current
  copy uses the masculine/default form (`ابدأ`, `سجّل`, `اختار`, `جرّب`,
  `حاول تاني`) — grep confirms no feminine forms exist. Keep it consistent.
- Numbers in Arabic-Indic digits via `toArabicNumerals`.
- Placeholder/dead-media guards: never render a Listen button or an image for a
  placeholder URL (`hasRealAudio`, `hasRealPhoto`).

---

## 11. Navigation & screens

| Screen | Notes |
|---|---|
| Welcome | Initial route; `replace('Tabs')` without auth |
| SignIn / SignUp | Shared `AuthForm`; `replace('Tabs')` on success |
| Tabs → Home | Fixed `AppHeader` overlay + `FlatList` feed (see §12) |
| Tabs → Favorites | `ScrollView` (not virtualized), sign-in gate, prunes stale ids against catalog |
| Tabs → Profile | Clerk user, sign-out, legal links |
| RecipeDetail | Thin screen; `useRecipeDetailData` + section components; back/share/favorite top bar; sticky bottom bar |
| PrivacyPolicy / Terms | Static content from `strings.ts` (largely duplicated — known debt) |

Detail extras: ingredient checklist is local `Set<string>` state; steps accordion
uses `undefined` = first step open by default, `null` = all closed;
"start cooking" only switches to the Steps tab (cooking mode is not built).

---

## 12. Load-bearing patterns (keep these)

**Home feed / list-grid toggle (current working-tree direction):**

- One `FlatList`, `numColumns` **always 1**. Rows are *chunks* of recipes:
  1 recipe in list mode, 2 in grid mode (`src/components/RecipeRow.tsx`), so
  toggling changes row composition rather than remounting the list. This is what
  preserves scroll offset.
- `RecipeRow` is `React.memo`; `rows` and `feedData` are `useMemo`-stabilized;
  `keyExtractor` is the joined recipe ids of the chunk.
- `RecipeViewToggle` animates only its own tap scale and calls
  `LayoutAnimation.configureNext(...)` (Android `setLayoutAnimationEnabledExperimental`
  is enabled there) before `setMode`. No feed-level Animated wrapper.
- Mode comes from the shared `useViewMode` Zustand store (persisted, hydration-safe).
- Header content (greeting, cuisine row, feed heading + toggle) is the
  `ListHeaderComponent`, so it scrolls with the feed. `AppHeader` is an
  **absolute fixed overlay** (`zIndex: 10`) and the list has
  `contentContainerStyle.paddingTop = headerHeight` so content clears it.
- Empty/loading/error states are the `ListEmptyComponent`.

**Cards:** media is clipped on an inner view (`overflow: 'hidden'`), never on the
shadowed card, so Android elevation shadows are not clipped. Thumbnails go
through `cardImageUrl()`.

**Stores:** both Zustand stores use a resilient AsyncStorage wrapper (failed
writes warn in dev and are swallowed), a persisted minimal shape, normalization
of untrusted storage, and a hydration guard (favorites unions early toggles
rather than clobbering them). Reuse this pattern for new persisted state.

---

## 13. Removed patterns — do NOT reintroduce

- **No search.** `searchRecipes`, `useRecipeSearch`, `useRecipeCategories`, the
  search UI, and the search tab were removed (`f813d52` + earlier). `t.search`
  is leftover copy only.
- **No category chip filter.** `CategoryFilter.tsx` was deleted; the cuisine row
  (`CuisineRow` + `CuisineCard` + `data/cuisines.ts`) replaces it (`a933eb6`).
- **No random featured hero card.** `src/lib/heroPick.ts` and the Home hero were
  removed (`78f307c`); `src/components/RecipeCard.tsx` is the unused remnant.
- **No `Animated.View` scale/fade wrapper around the feed.** Commit `2fed1c1`
  (HEAD) implemented a settle animation that the current working tree replaces
  with row-chunking + `LayoutAnimation`. Do not restore the wrapper.
- **No `numColumns` swapping** or re-keying the `FlatList` to change layout — it
  remounts the list and loses scroll position.
- **No new dependency for a few lines.** Do not add `shadcn`, Next.js tooling, or
  coding-agent SDKs; both previously polluted this app's dependency tree.

---

## 14. Code conventions (observed, not aspirational)

- Function components, `export default function Name(...)`, `StyleSheet.create`
  at the bottom of the file, styles named semantically (`feedHeaderRow`,
  `gridCell`).
- Relative imports (`../theme`, `./RecipeRow`); the `@/` alias is configured but
  not used.
- `src/data/queries.ts` is organized in labelled sections with rationale
  comments; keep the single mapper and `__DEV__`-gated logging.
- Comments explain *why* (platform quirks, RTL, caching, scroll preservation) —
  match that style for non-obvious decisions.
- Accessibility is expected: `accessibilityRole`, `accessibilityLabel`,
  `accessibilityState={{ selected }}`, 44×44 touch targets where interactive.
- Every `useEffect` that subscribes (audio, reduce motion) cleans up.
- Types are local and explicit (`Props` type above components); `any` appears in
  navigation/mappers but is not a free pass to add more.
- No `TODO`/`FIXME` markers exist in `src/` — don't add them; put decisions in
  this file or an issue.

---

## 15. Commit conventions

Conventional Commits, confirmed by `git log` (71 non-merge commits; prefixes:
`fix` 16, `feat` 15, `refactor` 11, `chore` 6, `style` 5, `docs` 4, `perf` 3;
some older commits predate the convention).

- Format: `type: lowercase imperative summary` (e.g.
  `perf: virtualize home feed with FlatList to fix list/grid toggle lag`).
- Bodies are optional but used for rationale on non-trivial changes.
- Don't mix unrelated changes in one commit (media deletions, dependency cleanup,
  and UI refactors have historically been separate).
- Never commit `.env`, `node_modules`, generated audio (`output/`,
  `audio_output/`), `dist*`, or `.work/`.

---

## 16. Verification checklist before you call it done

1. `npm run typecheck` → green.
2. Any UI/interaction change → run on a real device in Expo Go (Android first).
   For Home: toggle list↔grid repeatedly and confirm (a) no lag/flash,
   (b) scroll position survives, (c) rapid re-toggles don't strand the feed.
3. Web (`npm run web`) sanity check for parity, especially RTL mirroring and
   fonts (no synthetic bold).
4. `git status` + `git diff` — confirm only intended files.
5. If dependencies changed: fresh `npm install`, diff `package.json` vs
   `package-lock.json`, confirm no undeclared/phantom packages, then
   `npm ci --dry-run` (should exit 0).
6. If DB/schema changed: update `src/db/schema.sql` + seeds, and verify against
   the live project (read-only query) instead of assuming.
7. **[UNVERIFIED]** Whether the Clerk/`expo-*` config plugins require a
   development build rather than Expo Go on some platforms — check before
   promising "works in Expo Go".

---

## 17. Environment & secrets

Required variable **names** (values are never committed):

| Variable | Scope | Consumer |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | client (public) | `src/lib/supabase.ts` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | client (public, RLS-protected) | `src/lib/supabase.ts` |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | client (public) | `src/app/App.tsx` |
| `ELEVENLABS_API_KEY` | server only | `scripts/elevenlabs.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | `scripts/migrate.js`, `scripts/seed-from-recipe-md.js` |
| `SUPABASE_URL` | server only | same scripts (documented in README) |

Status (verified):

- `.env` exists locally (has a service-role key and an ElevenLabs `sk_` key),
  is ignored by `.gitignore:7`, and has **never been committed**.
- Only `.env.example` is tracked, with placeholders and comments warning never to
  expose the service role or the ElevenLabs key.
- No tracked file contains `service_role`, `sk-…`, or private-key material.
- `.env` is not currently present in any bundle — keep it that way; do not zip or
  hand off the repo directory including it.

`.gitignore` also excludes: `node_modules/`, `.expo/`, `dist/`, `dist-check/`,
`web-build/`, `*.log`, `.env.local`, `.DS_Store`, `.work/`,
`.claude/settings.local.json`, `.codex/`, `.graphifyignore`, `graphify-out/`,
`output/`, `outputs/`, `audio_output/`, `recipe-images-batch2/`,
`public/recipe2.md`, `.pi/skills/`, `.agents/skills/`.

Note: `skills-lock.json` is tracked (tooling metadata); `.pi/skills/` and
`.agents/skills/` contents are ignored.

---

## 18. Current repo state (2026-10-21)

**Branch:** `main` @ `2fed1c1` (`fix: replace flash transition with scale+fade
settle animation on home toggle`).

**Remote — blocked/anomalous:**
- `git fetch` shows `origin/main` was **deleted** on GitHub and a new
  `origin/master` (`546e613`) exists.
- `origin/master` is an **unrelated history**: a Next.js project named
  `my-landing-page` (no merge base with this repo). The recipe app is **not on
  GitHub anymore** under `origin/main`.
- Local `main`'s upstream is broken (`main@{upstream}` unresolved).
- Last-known `origin/main` was `79a8763`; `main` is **6 commits ahead** of it.
  Do not push to `origin/main` without first deciding how to restore the branch
  (or configure a new remote). Do not force-push over `master`.

**Unpushed commits (`79a8763..main`):**

| SHA | Summary |
|---|---|
| `a933eb6` | feat: cuisine browsing row replaces the category chip filter |
| `78f307c` | refactor: remove featured hero card + `heroPick.ts` |
| `f813d52` | chore: remove unused category-search exports from queries |
| `5b49126` | perf: virtualize Home feed with FlatList (row chunking) |
| `b478078` | feat: fade transition for list/grid toggle |
| `2fed1c1` | fix: replace flash with scale+fade settle (HEAD) |

**Uncommitted working tree (do not "clean up" blindly):**

- `package.json` + `package-lock.json` — dependency cleanup done in this session:
  `shadcn` removed from devDependencies, phantom `@qoder-ai/qoder-agent-sdk`
  purged from the lock; six intentional Expo bumps kept (`expo ~57.0.26`,
  `expo-audio ~57.0.5`, `expo-auth-session ~57.0.13`, `expo-linking ~57.0.11`,
  `expo-splash-screen ~57.0.9`, `expo-updates ~57.0.24`).
- `app.json` — adds `expo-splash-screen` to `plugins`.
- `skills-lock.json` — +222 lines of HyperFrames/heygen skill registry entries.
- `src/screens/HomeScreen.tsx`, `src/components/RecipeViewToggle.tsx` — in-progress
  replacement of the settle animation with row chunking + `LayoutAnimation`
  (removes the HEAD `Animated.View` wrapper).
- `src/components/RecipeRow.tsx` — **untracked**, new row chunking component.
- Deletions of tracked artifacts: 10 `audio_output/*.mp3`, `output/ful-medames.mp3`,
  7 `brief-*.txt`, `.welcome-390x844.png`, 2 `screenshots/photo_2026-09-29_*.jpg`.
- Untracked: `audit/security-cleanliness-audit.md`, 7 `public/*_2026*.jpg`
  (Cloudinary cuisine sources), `screenshots/Screenshot 2026-10-05 201654.png`.

**Backup branches (local only, no remote copy):**
- `backup/pre-recipe-cleanup-2026-10-03` @ `bb96052` — fully merged into `main`.
- `backup/pre-remote-merge-2026-10-06` @ `5397dfd` — **3 commits not in `main`**
  (profile screen redesign + settings-card removal). Don't delete it.

**[UNKNOWN]** Whether the 6 unpushed commits and the row-chunking WIP have been
device-tested. Treat the toggle work as **not yet verified on device**.

---

## 19. Open items & audit status

**Product / content**
- 70 of 100 recipes have **no narration** (30 with real audio).
- `shrimp-scampi` has no image (renders the letter placeholder).
- Cooking mode (step-by-step full screen + timer + per-step audio) is **not built**;
  the sticky "start cooking" button only switches to the Steps tab.
- No offline mode — catalog requires network.
- Favorites are device-local only (no cross-device sync).
- Tabs (Home/Favorites/Profile) are reachable while signed out; only
  favorites/profile surfaces gate on auth.

**Engineering**
- No tests, linting, CI, or formatting config.
- `audit/security-cleanliness-audit.md` (2026-10-06): still-relevant findings —
  RLS policies target `anon` only (add policies if Supabase auth is ever used),
  repo contains large non-source artifacts, Privacy/Terms screens + back-button
  blocks are duplicated, `useAudioPlayerHook` naming, `theme → i18n` import edge,
  type-only `navigation ↔ screens` cycle. Fixed since the report: ungated
  `console.error`s, `heroPick.ts`, the 999-line `RecipeDetailScreen` (now 168
  lines + components), duplicated SignIn/SignUp (now `AuthForm`), dead theme
  tokens, and the qoder dependency (removed from `package.json`).
- `npm audit` (2026-10-21): 44 advisories — 20 moderate, 23 high, 1 critical
  (`shell-quote`, dev/build tooling via Expo CLI). Not cleared by the cleanup;
  affects the dev machine, not the shipped bundle. Don't run `npm audit fix
  --force` blindly.
- Schema drift: `cuisine` column missing from `src/db/schema.sql`; seeds cover
  only 50 of the 100 live recipes (§6).
- `npm ls` warns `typescript@6.0.3 invalid: "^5.0.0"` under
  `@solana/web3.js` (transitive via `@clerk/clerk-js` wallet adapters).
  Pre-existing; ignore unless it breaks typecheck.
- Stale comments/docs to fix opportunistically: README feature list (search/hero/
  category filter/50 recipes), `src/lib/images.ts` ("Home featured card"),
  `scripts/generate-narration.ts` (placeholder-URL claim), `seed.sql`
  (placeholder narration claim).

---

## 20. Commands

```bash
npm install              # deps (run fresh before trusting the lockfile)
npm start                # Expo dev server (press a / i / w)
npm run android          # Android via Expo Go / emulator
npm run ios              # iOS via Expo Go / simulator
npm run web              # react-native-web
npm run typecheck        # tsc --noEmit — must stay green

npm run narration:dry    # validate narration script mapping, no API calls
npm run narration        # generate missing MP3s (ElevenLabs; needs ELEVENLABS_API_KEY)

node scripts/migrate.js              # apply src/db/seed.sql (needs SUPABASE_* service creds)
node scripts/seed-from-recipe-md.js  # seed the 50 recipes parsed from public/recipe.md
```

Web measurement probes live in `scripts/check-*.cjs` (headless Edge + WebSocket,
serve `dist-check/`). They are debugging aids, not tests.

---

## 21. Where to look next

1. `src/data/queries.ts` — every read, the mapper, the integrity rules.
2. `src/screens/HomeScreen.tsx` + `src/components/RecipeRow.tsx` —
   the list/grid architecture and scroll-preservation constraints.
3. `src/theme/` + `design.md` — tokens before any visual change.
4. `src/i18n/strings.ts` — copy before inventing Arabic text.
5. `src/db/schema.sql` — canonical schema (plus the drift note in §6).
6. `audit/security-cleanliness-audit.md` — background debt (superseded in places).
7. `PROJECT_CONTEXT.md` — stable facts, with the staleness caveats in §3.

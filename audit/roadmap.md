# Implementation Roadmap — هو كل يوم أكل (Howa Kol Yom Akl)

> **Purpose:** Dependency-aware, phase-by-phase execution plan to take the app from its current prototype state to a production-ready MVP.
> **Authoritative inputs:** `audit/audit.md` (read-only source audit), `plan.md` (product plan), `design.md` (design system), `implementaion.md` + `brief-*.txt` (build history), and the actual working tree (`src/`, `scripts/`, `src/db/*.sql`, `package.json`, `app.json`).
> **Constraint:** This document is a **ROADMAP ONLY**. Nothing in it authorizes code changes. Each phase is executed, validated, reviewed, and approved independently before the next phase starts.
> **Architecture stance:** The existing layering (UI screens/components → `data/queries.ts` + Zustand → `lib/supabase.ts`) is clean and must be preserved. **No rewrite.** No UI redesign phases. Every proposed change below is traceable to an audit finding or a documented product requirement.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State](#current-state)
3. [Target State](#target-state)
4. [Phase 0 — Baseline & Safety](#phase-0--baseline--safety)
5. [Phase 1 — Backend / Supabase Foundation](#phase-1--backend--supabase-foundation)
6. [Phase 2 — Data Architecture Unification](#phase-2--data-architecture-unification)
7. [Phase 3 — Core Recipe Experience](#phase-3--core-recipe-experience)
8. [Phase 4 — Favorites & User State](#phase-4--favorites--user-state)
9. [Phase 5 — Search & Filtering](#phase-5--search--filtering)
10. [Phase 6 — Voice / Audio Core](#phase-6--voice--audio-core)
11. [Phase 7 — Cooking Mode](#phase-7--cooking-mode)
12. [Phase 8 — UX / Accessibility / Cross-Platform Hardening](#phase-8--ux--accessibility--cross-platform-hardening)
13. [Phase 9 — Performance & Code Quality](#phase-9--performance--code-quality)
14. [Phase 10 — Testing & Release Readiness](#phase-10--testing--release-readiness)
15. [Critical Path](#critical-path)
16. [Parallelizable Work](#parallelizable-work)
17. [High-Risk Areas](#high-risk-areas)
18. [Release Gate](#release-gate)

---

## Executive Summary

هو كل يوم أكل is an Arabic (RTL) recipe app — Expo SDK 57 / RN 0.86 / React 19 / react-native-web 0.21 / React Navigation v6 / TanStack Query 5 / Zustand 4 / Supabase / expo-audio — currently best described by the audit as a **visual prototype on a live back-end**. The UI chrome is consistent and well-engineered (Android shadows, safe areas, RTL authoring, shared header/cards/tab bar, Cairo font), TypeScript strict typechecks, and the architecture layering is correct.

The audit's central findings that shape this roadmap:

1. **Security/data integrity first (CRITICAL):** No Row-Level Security is defined anywhere in the checked-in SQL and the posture is unverified against the live Supabase project; the anon key is duplicated into committed config and used for writes by `scripts/migrate.js`.
2. **Two parallel data sources (HIGH):** Home/Detail read Supabase while Search/Favorites read `src/data/recipes.ts` placeholders; `getRecipeDetail()` and `searchRecipes()` are dead code; three diverging schema files (TEXT vs UUID ids; `recipes.audio_url` vs separate `audio_urls`) make broken-detail navigation possible depending on the live DB.
3. **Product core not implemented (CRITICAL vs. product):** The flagship voice experience (ElevenLabs narration, hands-free mode, real timer) does not exist — demo SoundHelix MP3s and inert chips stand in for it.
4. **No automated validation:** no tests, no lint, no CI.
5. **RTL on real Android is unverified** and favorites are in-memory only.

The strategy below: **freeze a baseline → make the data foundation secure and authoritative → unify the client data path → harden the core recipe journey → persist user state → real search → build the real voice/audio core → functional cooking mode → platform/a11y hardening → cleanup → test & release.** Product-defining voice work (Phase 6) is deliberately treated as a major engineering phase, not polish, and the external content/audio production track it needs is flagged as an early-start parallel workstream.

Priority order applied throughout: **security/data integrity → core recipe functionality → product-defining voice → user state/search/filters → reliability/a11y/performance → cleanup & polish.**

---

## Current State

Facts verified from `audit/audit.md` and the working tree:

- **Stack:** Expo SDK 57, RN 0.86.3, React 19.2.3, react-native-web 0.21.2, React Navigation v6 (native-stack + bottom-tabs with a custom floating tab bar), TanStack Query 5, Zustand 4, supabase-js 2, expo-audio, @expo/vector-icons, Cairo font (bundled asset), strict TypeScript (`npm run typecheck` passes).
- **Screens:** `Tabs` (Home / Search / Favorites / Profile) + pushed `RecipeDetail` and `CookingMode` (native-stack, `animation: 'slide_from_right'`).
- **Data flow today:** Home → `useRecipes()` (Supabase, all rows, no order/limit, no empty state). RecipeDetail → `useRecipe(id)` (Supabase, **5 parallel requests**; only the recipe request is error-checked). Search/Favorites → in-memory filter of `placeholderRecipes` (local `src/data/recipes.ts`). `searchRecipes()` (Supabase) and `getRecipeDetail()` (local) are dead code. `Recipe.imageUrl` has no DB column anywhere yet the UI already renders it when present (otherwise letter/glyph placeholders).
- **Favorites:** Zustand in-memory only; no persistence; FavoritesScreen "الكل" pill falls back to a mock `6`; Profile "وصفات بصوت طنط منى" reuses the favorites count and "أكلات مجربة" is hard-coded `0`.
- **Audio:** custom `useAudioPlayerHook` polls at 500 ms unconditionally, stores duration/position in ms while expo-audio reports seconds, has no load-error state (empty `catch {}`, can stick in `loading` forever), no `setAudioModeAsync`, no interruption handling. URLs are SoundHelix demo MP3s.
- **Cooking mode:** hard-coded okra placeholder steps (ignores the `id` param beyond typing), static timer label `(٠٠:٠٢)` that never counts, inert "عيدي تاني" chip, voice chips duplicate the bottom nav buttons, nested `SafeAreaProvider`.
- **Backend:** three schema variants checked in (`schema.sql` TEXT ids + `recipes.audio_url`; `supabase-schema.sql` / `supabase-full-setup.sql` UUID ids, no `recipes.audio_url`, GIN `to_tsvector('arabic', …)` indexes). No RLS anywhere. Anon key used for upserts by `scripts/migrate.js`; `.env` uses non-`EXPO_PUBLIC_` names so the app never reads it; `src/lib/supabase.ts` effectively always falls back to committed `app.json` `extra` values.
- **Repository state:** working tree has ~28 uncommitted changes on top of `b425387` (RTL work, screens, theme, new components `AppHeader.tsx` / `rtl.ts`, audit docs, scripts); several untracked artifacts (`dist-check/`, screenshots, `package.json.backup-51`, `brief-*.txt`, `plan.md`, `design.md`, `implementaion.md`).
- **Validation:** typecheck only. No lint, no tests, no CI, no device test matrix. RTL is configured (`I18nManager` + web `dir="rtl"`) but **Android runtime direction is unverified** on a cold start.

---

## Target State

A production-ready MVP that satisfies:

- **Data:** One canonical schema in the repo that matches the live Supabase project; one id strategy; RLS enabled with read-only anon policies and no anon write path; environment/configuration free of duplicated secrets; every recipe surface (Home / Search / Favorites / Detail / Cooking) reads the same authoritative recipe source; every card navigation reaches the correct Detail record.
- **Core experience:** Deterministic recipe ordering, correct loading/empty/error states with retry, efficient detail queries (not 5 blind requests), correct ingredients/steps/tips/audio handling.
- **User state:** Favorites persist across app restarts; no mock counts anywhere; Profile statistics are derived from real data.
- **Search & filtering:** Real search against the Supabase catalog using a strategy that matches the schema/indexes; Home/Search/Favorites filter controls are functional (or honestly disabled); Arabic search behavior validated.
- **Voice (product core):** Real AI-generated Arabic narration (ElevenLabs) replaces demo audio; a clear generated-remotely/played-locally architecture; per-recipe (and per-step where the cooking experience requires it) audio; robust player lifecycle/error handling; no API secrets in the mobile client.
- **Cooking mode:** Works end-to-end from real recipe data — step navigation, a real timer, working next/previous/replay, narration integration, no inert controls. Hands-free/voice control only where genuinely implemented.
- **Platform:** Android and Web parity verified; RTL confirmed on cold-started Android devices; consistent safe-area/header geometry; accessible labels/touch targets; typography matches `design.md`; responsive grids.
- **Engineering:** lint, unit/component tests, navigation smoke tests, CI; dead code/dependencies removed; performance items addressed; a documented Android/Web release checklist and a clean production build.

Preserved throughout: the current architecture, the visual design system (`design.md` tokens), the Arabic colloquial voice/tone, and the RTL layout model.

---

## Execution Model (applies to every phase)

Every phase runs the same loop and cannot be skipped:

> **Phase → implementation → validation → user review → approval → next Phase**

- **Start condition** — what must already be true (previous approvals, artifacts, environment) before implementation may begin.
- **Implementation scope** — the bounded change set for this phase (files, features, decisions).
- **Validation gate** — the checks (commands, manual tests, review evidence) that must pass.
- **Approval required before next phase** — who/what signs off and what the sign-off artifact is.
- Every phase is independently reviewable: a self-contained diff, its own validation, and its own Definition of Done. No phase mixes unrelated features.
- **Global non-negotiables for all phases:** `npm run typecheck` must pass; screens must never call Supabase directly (all access via `src/data/queries.ts`); no secrets added to the client bundle or to committed files; no changes to the visual design language unless the phase explicitly owns that change; nothing removed/renamed without a grep confirming zero usages.

---

## Phase 0 — Baseline & Safety

### Phase name
Baseline & Safety — freeze the working state and define the regression oracle.

### Objective
Record the currently working state as a reviewable baseline, define the validation checklist and the critical runtime flows that must keep working, and capture environmental facts (live Supabase posture, device/RTL state) that later phases need — before any implementation starts.

### Why this phase comes here
The audit describes a healthy but unrecorded state: the working tree has ~28 uncommitted changes, there is no test suite, and several runtime behaviors (Supabase reachability, which schema variant is live, Android RTL, audio playback) are only "believed working." Every later phase needs (a) a known-good snapshot to diff against and (b) a short regression checklist to re-run. Without Phase 0, regressions are indistinguishable from intended change and the audit's "fix immediately" items cannot be verified as fixes.

### Tasks
1. **Freeze the working state.** Commit the current working tree as a single baseline commit or tag (e.g. `baseline-prototype-v1`) so every later phase produces a reviewable diff against it. Decide repository hygiene policy for untracked artifacts (see Task 4) without deleting source.
2. **Reproduce the app.** Run Web (`npm run web` or a static export) and confirm: startup with no JS errors, Cairo font gate, all four tabs render, Home loads recipes from Supabase, a card opens RecipeDetail with ingredients/steps/tips, favorites toggle works in-memory, CookingMode opens and exits, demo audio plays/pauses/replays. Record the exact environment (Node version, Expo CLI, device/emulator availability).
3. **Write the Baseline Validation Checklist** into this roadmap (Section: the 8–12 flows in Task 2 plus the items below). This checklist is the regression oracle reused in Phase 10's final pass.
4. **Capture environmental facts** (measurement only, no changes):
   - Live Supabase project state: which schema variant is actually applied (TEXT vs UUID ids; does `recipes` have `audio_url` or a separate `audio_urls` table), row counts, and **whether RLS is enabled** (try an anon `select` and an anon `insert`/`update` from a scratch script or dashboard SQL). Record findings for Phase 1.
   - Android RTL probe (best effort now): cold-start the app on a real device and read the `[rtl] … isRTL=` log; record whether RTL is honored. If no device is available now, record that as an open risk owned by Phase 8, and note that this probe should be run **as early as a device exists** because a host-level RTL fix would ripple.
   - Note which demo audio URLs resolve (SoundHelix reachability) — expected to be replaced in Phase 6.
5. **Verify the typecheck baseline** (`npm run typecheck`) and record the pass state.
6. **Record known-good geometry/UI facts** for later regression checks: header behavior per screen, tab bar geometry, detail-screen header offsets, safe-area usage (the audit already documents these; Phase 0 just pins them as the baseline to compare against in Phase 8).

### Files / areas expected to be affected
- `audit/roadmap.md` (this file — the checklist lives here).
- Git metadata: one baseline commit/tag; `audit/` notes of the live-DB and device probe results (append to this file or `audit.md` only; no new files outside `audit/` unless already tracked).
- **No application source changes.**

### Dependencies / prerequisites
- None (first phase). A reachable Supabase project and (ideally) one Android device improve the quality of the baseline but are not blockers — unavailable items become recorded risks.

### Risks
- The large uncommitted diff means the "baseline" mixes several workstreams; committing it as one unit is acceptable for now but makes later bisection coarse (mitigate by keeping Phase 0's commit message descriptive).
- Live Supabase state may already differ from every checked-in SQL file — record, don't guess.
- Device probe may reveal RTL is broken on Android; do **not** fix it here (that is Phase 8/1 follow-up) — just record it.

### Validation requirements (Validation gate)
- Baseline commit/tag exists and is cleanly reproducible (`git status` matches recorded tree).
- All checklist flows pass on Web and are recorded (name each as PASS / FAIL / NOT-TESTED).
- `npm run typecheck` passes.
- Environmental findings (Supabase schema/RLS posture, RTL probe) are written down with evidence.

### Definition of Done
- A tagged/committed baseline of the exact working state.
- A written validation checklist with explicit PASS/FAIL results.
- Written answers to: *which schema is live, is RLS on, does Android render RTL on cold start, does audio play.*
- No source code modified during the phase.

### What must NOT be changed in this phase
- No source code, no config, no SQL, no dependencies, no `.env`. This phase produces records, not fixes.

### Start condition / Implementation scope / Approval
- **Start condition:** none (phase 0).
- **Implementation scope:** baseline commit + measurement/checklist only.
- **Validation gate:** the checklist above, reviewed by the user.
- **Approval required before next phase:** user review of the baseline record; explicit approval to start backend work.

---

## Phase 1 — Backend / Supabase Foundation

### Phase name
Backend / Supabase Foundation — RLS, one canonical schema, one id strategy, environment hygiene.

### Objective
Make the data foundation secure and authoritative so every later feature builds on it: verify/enforce Row-Level Security with read-only anon policies; collapse three diverging schema files into one canonical schema that matches the live project; fix the recipe id strategy; stop anon-key writes; remove duplicated credentials and make environment configuration honest.

### Why this phase comes here
Audit priority #1 is security/data integrity. The audit's CRITICAL finding (no RLS anywhere, anon key capable of writes) and HIGH findings (three conflicting schema files, id-type disagreement, credentials duplicated into committed files and hard-coded script fallbacks) are all foundation-level: schema and id decisions cascade into every query, seed, and screen in Phases 2–7, and RLS posture determines whether the app is safe to ship at all. Fixing this now prevents building features on a schema that must be torn up later.

### Tasks
1. **Verify the live project first.** Confirm which of the three schema variants is actually deployed (id type, `recipes.audio_url` presence vs the separate `audio_urls` table, existing indexes) and whether RLS/policies already exist server-side. Treat server-side reality as the source of truth; checked-in SQL must be made to match it, not the reverse.
2. **Choose and document the canonical id strategy.** Recommended: stable **TEXT slug ids** (`okra`, `molokhia`, …) — they already exist in `src/data/recipes.ts`, `seed.sql`, and all navigation params; they are human-readable for content operations; and they survive content edits (UUIDs churn on re-seed). Document the decision and its consequences in the schema header. Keep `audio_urls` as a separate table (the live DB and current code already use it); **do not** reintroduce `recipes.audio_url`.
3. **Produce ONE canonical schema file** (`src/db/schema.sql`) and ONE seed file (`src/db/seed.sql`), incorporating the best of all three variants:
   - TEXT `recipes.id` (per the decision), FKs as TEXT, `ON DELETE CASCADE` on children.
   - Add a deterministic **ordering column** on `recipes` (e.g. `sort_order INTEGER` and/or `featured BOOLEAN`) now, because Phase 3 needs stable list ordering — this avoids a later schema migration. Seed values must produce a stable hero + feed order.
   - Add `image_url TEXT` to `recipes`: the product model (`plan.md`: dish image) and the UI (`RecipeCard`/`RecipeDetail` already render `imageUrl`) both expect images; the current type field has no column. Alternatively record an explicit product decision to drop image support — do not leave the type/schema mismatch silently.
   - Add `kind`/step-scoping to `audio_urls` only if Phase 6/7's per-step audio decision requires it (decide in Phase 6; do not pre-add unused columns speculatively — but do add a **unique index on `(recipe_id)`** if `.single()` stays the access pattern, so duplicate rows cannot break `useRecipe`).
   - Keep Arabic full-text GIN indexes (`to_tsvector('arabic', …)` on `title`/`description`) and the `category` btree index for Phase 5.
   - Delete/archive `supabase-schema.sql` and `supabase-full-setup.sql` (the divergence itself is the hazard). Archive = remove from `src/db/`; history remains in git.
4. **Enable RLS and add read-only policies** for all five tables, e.g. (schema for `recipes`, repeated per table):
   ```sql
   alter table recipes enable row level security;
   create policy "recipes_public_read"
     on recipes for select to anon using (true);
   ```
   **Verify** with the anon key: `select` works, `insert`/`update`/`delete` are denied. Writes must go through the service role (local tooling/edge functions only) — never the anon key.
5. **Retire the anon-write path.** Rebuild `scripts/migrate.js` (or replace it) so it (a) requires the **service-role** key from the environment and refuses to run without it, (b) has **no hard-coded fallback credentials**, and (c) upserts into the canonical schema. Delete committed copies of keys.
6. **Environment/config hygiene:**
   - Rename `.env` keys to `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Expo inlines `EXPO_PUBLIC_*` into the bundle) and keep `.env` gitignored (it already is). Commit a `.env.example` with placeholder values.
   - Update `src/lib/supabase.ts` to read `process.env.EXPO_PUBLIC_SUPABASE_URL/ANON_KEY`; add the small `env.d.ts` typing needed for strict TS.
   - Remove the `supabaseUrl`/`supabaseAnonKey` duplication from `app.json` `extra` (or mark it clearly stale) — one source of truth.
   - State plainly in code comments: the anon key is public-by-design and safe **only because RLS** restricts it to reads.
7. **Apply the canonical schema to the live project** (SQL editor or `supabase db` with the service role), re-seed, and confirm the app's Home/Detail still work.
8. **Run `npm run typecheck` and the Phase 0 Web checklist** (subset: Home loads, Detail opens, no console errors).

### Files / areas expected to be affected
- `src/db/schema.sql`, `src/db/seed.sql` (canonical); deletion of `src/db/supabase-schema.sql`, `src/db/supabase-full-setup.sql`.
- `src/lib/supabase.ts`, `.env`, new `.env.example`, `app.json`, `scripts/migrate.js`, a new `env.d.ts`.
- Supabase project (SQL applied) — outside the repo but part of the change set.
- **Not** screens/components/hooks/theme/i18n.

### Dependencies / prerequisites
- Phase 0 approval and its live-DB findings.
- Access to the Supabase project (SQL editor or CLI) and the service-role key (never committed).

### Risks
- Enabling RLS **before** adding policies makes every query return empty → app screens go blank. Mitigate: apply policies in the same step as enabling, then verify reads immediately.
- If the live DB is UUID-based, migrating to TEXT ids is a destructive re-seed — acceptable at prototype stage with zero real users, but must be done deliberately with the service role and verified.
- Touching `app.json`/env can break local dev if `EXPO_PUBLIC_*` is not exported before `expo start` — document in `.env.example` and the README-in-code.
- Risk of scope drift into client features — this phase is SQL/config/scripts only.

### Validation requirements (Validation gate)
- `grep -rin "policy\|enable row" src/db` now returns the RLS statements; anon write attempts fail; anon reads succeed.
- Exactly one schema file + one seed file remain; no `recipes.audio_url` column; seed and `src/data/recipes.ts` agree on ids.
- `app.json`/`supabase.ts`/scripts contain no duplicated or hard-coded secrets (grep for the known key material returns nothing outside `.env`/`.env.example`).
- `npm run typecheck` passes; Home + Detail work on Web against the canonical DB.
- Recipe list order is deterministic (repeated loads return the same first row).

### Definition of Done
- RLS verified on the live project (anon read-only); no anon write path exists in any script.
- One canonical `schema.sql` + `seed.sql` match the live DB; id strategy documented; ordering + `image_url` decisions resolved; superseded schema files gone.
- Environment uses `EXPO_PUBLIC_*`; no committed secrets; `migrate.js` is service-role-only.
- Typecheck + Web checklist subset pass.

### What must NOT be changed in this phase
- No screens, components, navigation, theme, i18n, audio hooks, or feature logic. No UI changes. No search/filter implementation (Phase 5). No data-source rewiring (Phase 2).

### Start condition / Implementation scope / Validation gate / Approval
- **Start condition:** Phase 0 approved; live-DB posture recorded.
- **Implementation scope:** SQL consolidation + RLS + env/scripts hygiene + id strategy decision. Server-side work is as much "implementation" here as repo work.
- **Validation gate:** security greps + anon read/write proof + typecheck + Web subset.
- **Approval required before next phase:** user reviews the schema/id decision and the RLS verification evidence. This is a high-consequence approval — the schema is the contract for Phases 2–7.

---

## Phase 2 — Data Architecture Unification

### Phase name
Data Architecture Unification — one coherent recipe source for every surface.

### Objective
Remove the local-vs-Supabase recipe split so Home / Search / Favorites / Detail all resolve recipes through one coherent data path, and navigation from every recipe surface reaches the correct Detail record. No UI redesign.

### Why this phase comes here
The audit's key architectural finding (Section 2) and HIGH issue 4.1: Search and Favorites render from `placeholderRecipes` while Detail always queries Supabase, so a card tap can navigate to a detail query that 404s depending on the live schema/id set. This split is the root cause of a broken core journey, and Phases 3–5 (states, favorites persistence, real search) all assume one recipe source. Phase 1 must precede it so the id strategy and schema are settled first.

### Tasks
1. **Declare the data-source policy:** Supabase is the single authoritative recipe catalog at runtime. `src/data/recipes.ts` ceases to be a runtime data source for screens. Its content remains valuable only as the seed reference (it mirrors `seed.sql`); mark it accordingly and delete it in Phase 9 once the seed is authoritative.
2. **Unify list consumption.** Make Search and Favorites consume the same remote recipe data as Home — recommended interim mechanism: share the cached `useRecipes()` result (react-query already dedupes a single `['recipes']` fetch) and keep each screen's current *user-visible* behavior (client-side filtering of the loaded set) until Phase 5 replaces client filtering with real server search. This removes the duplicate data path with minimal churn while the catalog is ~10 rows.
3. **Wire Favorites to ids that exist.** Favorites store id-only references; FavoritesScreen resolves them against the unified remote list. If a stored id no longer exists (seed/content changed), drop it from the displayed set (and, once Phase 4 persists favorites, prune stale ids on hydration).
4. **Delete dead providers:** remove `getRecipeDetail()` and any local-detail fallback consumers. `searchRecipes()` stays dormant until Phase 5 (it is already Supabase-based) but must not be called yet.
5. **Prove navigation integrity:** every card surface (Home hero, Home feed, Search results, Favorites grid) passes the recipe's real id into `RecipeDetail { id }`, and `useRecipe(id)` resolves that id against the same catalog. Add a dev-time check or simple test asserting every navigation id exists in the dataset.
6. **Align types/mapping with the canonical schema:** extend `mapRecipe` to map the Phase 1 columns (`image_url`, ordering fields as needed); confirm `Recipe`/`RecipeDetail` field-by-field against the schema (audit §6.1/§9). Make `mapRecipe` the single mapper used by list and detail (it already is — keep it that way and extend it).
7. **Run `npm run typecheck`** and a full end-to-end pass on Web: add favorites on Detail, verify they appear in Favorites, tap through Search results → Detail, verify all four surfaces show the same 10 recipes from the DB.

### Files / areas expected to be affected
- `src/data/queries.ts` (mapping, maybe a shared list hook shape).
- `src/screens/SearchScreen.tsx`, `src/screens/FavoritesScreen.tsx` (data source swaps only — visual styles untouched).
- `src/data/recipes.ts` (demoted to seed reference / flagged; `getRecipeDetail` removed).
- `src/types/recipe.ts`, `src/screens/HomeScreen.tsx` / `RecipeDetailScreen.tsx` only if type/mapping changes force it (avoid otherwise).
- `src/state/favorites.ts` (stale-id pruning hook only if needed now).

### Dependencies / prerequisites
- Phase 1 (canonical schema + id strategy + RLS verified).
- The live DB seeded with the canonical data.

### Risks
- The interim "share the Home list" approach means Search/Favorites appear to load slowly on first open (they now wait on network) — mitigate with the loading states already present and, later, react-query cache priming/staleTime (Phase 9).
- If the catalog grows toward 50–100 rows before Phase 5 lands, client-side filtering of the full list becomes sluggish and the Phase 2 interim mechanism must be called out as temporary (see Phase 5 dependency note).
- Removing local fallback reduces offline tolerance: with no network, Search/Favorites now show empty/error. Acceptable for MVP (recipes are remote); record the decision.

### Validation requirements (Validation gate)
- Grep: no screen imports `placeholderRecipes` or `getRecipeDetail` anymore.
- All four surfaces render the same DB-backed recipes; search-and-favorite → Detail navigation succeeds for every card (no error branch reachable via normal taps).
- Favorites count shown matches the real in-memory set.
- `npm run typecheck` passes; Web full end-to-end pass recorded against the Phase 0 checklist subset.
- No visual diffs beyond data-driven content (styles untouched).

### Definition of Done
- One coherent runtime recipe source (Supabase) used by all surfaces; dead local providers removed from the runtime path; navigation to Detail proven from every surface; types reconciled with the canonical schema.

### What must NOT be changed in this phase
- No UI redesign, no style/token changes, no search UX implementation (Phase 5), no favorites persistence (Phase 4), no ordering/state polish (Phase 3), no audio work (Phase 6).

### Start condition / Implementation scope / Validation gate / Approval
- **Start condition:** Phase 1 approved and canonical schema live.
- **Implementation scope:** data-layer rewiring + dead-path removal + navigation-integrity proof.
- **Validation gate:** grep assertions + end-to-end Web pass + typecheck.
- **Approval required before next phase:** user reviews the end-to-end demo (favorite → find in Favorites → open from Search).

---

## Phase 3 — Core Recipe Experience

### Phase name
Core Recipe Experience — production-ready listing and detail flows.

### Objective
Make the central recipe journey (list → detail) reliable and efficient: deterministic ordering, explicit loading/empty/error states with retry, efficient detail queries that surface real errors, and correct handling of ingredients/steps/tips/audio data.

### Why this phase comes here
This is the app's daily driver — the audit's Medium issues 5.2/5.3 describe unstable ordering, 5 blind detail requests, silently ignored sub-request errors (an empty ingredients tab looks like "recipe has no ingredients"), and a missing Home empty state. It must precede feature layering (favorites filters, search, cooking) so those features sit on a trustworthy list/detail foundation. It depends on Phase 2 (single source) and Phase 1 (schema with ordering + audio_urls guarantee).

### Tasks
1. **Stable ordering:** order `useRecipes` by the Phase 1 ordering column (or `created_at`), so the hero/feed are deterministic. Add `.limit()`/pagination parameters that scale with the catalog (the MVP target of 50–100 rows makes a simple limit + "load more"/infinite scroll appropriate; do not build full cursor pagination speculatively).
2. **Efficient detail query:** replace the 5 parallel requests with one embedded-relations query, e.g. `recipes.select('*, ingredients(*), steps(*), tips(*), audio_urls(url)')`, **or** keep parallel requests but check every sub-result's error. Requirement: sub-resource failures must be distinguishable from legitimately-empty content (e.g., "no tips yet" vs "couldn't load"). Set `staleTime` so revisiting a recipe does not refetch; keep `enabled: Boolean(id)`.
3. **States:** Home empty state when the feed is legitimately empty (currently silent); Home/Detail error states with a **retry** affordance and localized copy (currently a bare unlocalized string on Home, and Detail's error screen only offers "back"); Detail "empty ingredients/steps/tips" messaging only when data is truly absent (see Task 2 semantics).
4. **Data correctness:** guard missing arrays; keep `audioUrl` resolution precedence explicit (Phase 1 `audio_urls` table row → legacy field → undefined) and consistent with `audioAvailable`; extend `mapRecipe` for the new schema columns.
5. **Add a tiny data-layer test seam:** keep query functions pure/importable so Phase 10 can unit-test mapping and error handling with a mocked Supabase client.
6. **Run typecheck + Web checklist** with three manual probes: happy path, network-off (correct error/empty with retry), and a recipe that genuinely has no tips (correct empty message, not an error).

### Files / areas expected to be affected
- `src/data/queries.ts` (order/limit, embedded or error-checked detail query, staleTime).
- `src/screens/HomeScreen.tsx`, `src/screens/RecipeDetailScreen.tsx` (state branches/retry only — no visual redesign).
- `src/i18n/strings.ts` (localized empty/error/retry copy).
- Possibly `src/types/recipe.ts` if the query shape exposes new fields.

### Dependencies / prerequisites
- Phases 1 and 2.
- For the network-off probe: ability to disable networking in dev (airplane mode / dev-tools throttling).

### Risks
- Embedded-relations queries interact with RLS: if a policy is missing on a child table the whole join silently drops rows — re-verify the Phase 1 read policies cover all five tables after this change.
- `.single()` on `audio_urls` returns an error if duplicate rows exist — the Phase 1 unique index mitigates; code should still tolerate it.
- Retry affordances invite double-tap/refetch loops — keep retry manual and idempotent.
- Scope drift into "improving" the Detail layout — explicitly forbidden here.

### Validation requirements (Validation gate)
- Ordering is stable across repeated loads; pagination parameter exists and is honored.
- Detail uses ≤1–2 network requests (measure in devtools) and surfaces per-section errors, not silent empties.
- Home empty + error/retry states and Detail error/retry demonstrated; copy is localized.
- `npm run typecheck` passes; Web checklist subset passes.

### Definition of Done
- Deterministic list ordering; explicit, localized loading/empty/error/retry states on list and detail; efficient detail query with honest error semantics for ingredients/steps/tips/audio; mapping matches the schema.

### What must NOT be changed in this phase
- No favorites/search/filter features (Phases 4–5), no audio changes (Phase 6), no cooking mode (Phase 7), no visual design changes.

### Start condition / Implementation scope / Validation gate / Approval
- **Start condition:** Phase 2 approved (single data source, live catalog).
- **Implementation scope:** queries + states + data correctness in the list/detail path.
- **Validation gate:** the three manual probes (happy / offline / sparse-data) + typecheck.
- **Approval required before next phase:** user walks the list → detail journey offline and online.

---

## Phase 4 — Favorites & User State

### Phase name
Favorites & User State — persistence and honest statistics.

### Objective
Make favorites survive app restarts, remove every mock count, and make Profile statistics meaningful. Keep the current visual design.

### Why this phase comes here
Favorites currently die on restart, the "الكل" pill lies (mock `6`), and Profile stats are wrong (`favorites.size` reused for the audio stat; hard-coded `0` for tried). This is core user value and a data-integrity issue, and it must sit on the stable id/data foundation (Phases 1–2) and the resolved-Favorites path built in Phase 2. It precedes Phase 5 because the Favorites filter pills need a real state model to filter.

### Tasks
1. **Persist favorites.** Add AsyncStorage (or MMKV with web fallback — AsyncStorage's web/localStorage support keeps Android+Web parity simple) and persist the Zustand favorites set; hydrate synchronously-or-async at startup with a defined hydration strategy (no visible flicker; stale ids pruned against the Phase 2 catalog on hydration).
2. **Make the FavoritesScreen honest:** "الكل" pill count = real persisted set size (delete `count > 0 ? count : 6`); results grid derives from persisted ids → unified recipe list (Phase 2 path).
3. **Decide the fate of the extra pills** ("أكلات مجربة" / "عايزة أجرب" / "حلويات العيد"). The product plan does not define these states. Options, to be decided by the user:
   - **(a) Minimal status model:** extend the store to a per-recipe status (`favorite` always; optional `tried` flag written when a cooking session completes — see Phase 7 coupling). Implements "أكلات مجربة" truthfully; the other two pills stay disabled until their data source exists.
   - **(b) Remove/hide the unsupported pills** until the product defines them.
   - Default recommendation: **(a)** with "tried" set by Cooking Mode completion — it makes the Profile "أكلات مجربة" stat and the pill real with zero invented features. Everything else must be visibly disabled, never silently inert.
4. **Fix Profile statistics:** "الوصفات المفضلة" from the persisted store; "أكلات مجربة" from the tried state (Task 3); "وصفات بصوت طنط منى" from the **catalog** (count of recipes with `audio_available`/an audio row), not from favorites.size. Compute from the already-fetched unified list when possible (no extra queries at this scale).
5. **Run typecheck + manual persistence probes** on Web and, if available, Android: favorite → kill app → reopen → still favorited; empty-state → no mock `6`; Profile numbers match reality.

### Files / areas expected to be affected
- `src/state/favorites.ts` (persistence middleware/hydration + optional status model).
- `src/screens/FavoritesScreen.tsx` (counts, pill behavior per decision — styles only as required by "disabled" state).
- `src/screens/ProfileScreen.tsx` (derived stats — layout untouched).
- `package.json` (+storage dependency); app startup point (hydration), likely `src/app/App.tsx` or the store module.

### Dependencies / prerequisites
- Phases 1–3 (stable ids, unified catalog, honest list states).
- A user decision on the extra-pills model (Task 3) before implementation starts.

### Risks
- Storage dependency adds a native module — verify it works in the project's Expo Go/SDK 57 setup before committing to it.
- Hydration timing: rendering before hydration causes a one-frame "empty favorites" flash — mitigate with an `hydrated` flag gating the screen or a splash hold.
- Persisting stale ids (from before a re-seed) — prune on hydration against the catalog (Phase 2 seam).
- Scope creep into redesigning the Favorites screen — forbidden.

### Validation requirements (Validation gate)
- Favorites survive a full app restart on Web and Android; hydration shows no flash of wrong counts.
- No mock numbers remain anywhere (`grep` for the `6` fallback and hard-coded `0` returns nothing).
- Profile stats derive from real store/catalog state and change correctly when data changes.
- Unsupported pills are either functional or visibly disabled — never silently inert.
- `npm run typecheck` passes.

### Definition of Done
- Favorites persisted and restart-safe; counts and Profile stats truthful and derived; pills decision implemented and honest; design unchanged.

### What must NOT be changed in this phase
- No search implementation (Phase 5), no audio (Phase 6), no cooking mode (Phase 7), no design/theme changes, no Home/Search behavior changes.

### Start condition / Implementation scope / Validation gate / Approval
- **Start condition:** Phases 1–3 approved; pills decision recorded.
- **Implementation scope:** store persistence + honest counts/stats + pill-state model.
- **Validation gate:** restart-persistence probes + mock-count greps + typecheck.
- **Approval required before next phase:** user approves the persisted-favorites demo and the pills decision outcome.

---

## Phase 5 — Search & Filtering

### Phase name
Search & Filtering — real search and functional filters.

### Objective
Implement real search against the Supabase catalog using a strategy that matches the existing schema/indexes; make Home/Search/Favorites filter controls functional with active-state management; validate Arabic search behavior. The voice-search affordance is **not** in scope (see Phase 6 dependency note).

### Why this phase comes here
Search is a headline tab but currently filters 10 local placeholders; the Supabase `searchRecipes()` path is dead and its triple-ILIKE approach cannot use the Arabic GIN indexes the schema defines. Filters on Home/Search/Favorites are visual-only. This phase needs the single data source (Phase 2), the ordering/data layer (Phase 3), and the Favorites state model (Phase 4, for the Favorites pills). It must land **before the catalog scales past the "load everything and filter client-side" point** — the Phase 2 interim mechanism is explicitly temporary.

### Tasks
1. **Decide the Supabase search strategy** (documented decision, backed by a test):
   - Preferred: full-text search using the **Arabic GIN indexes** already in the schema — `websearch_to_tsquery('arabic', …)` / `plainto_tsquery` via an RPC or a filtered `.textSearch()` — so the indexes are actually used. Validate against real Arabic/Egyptian-colloquial terms; note that `arabic` config stems MSA lexemes, so colloquial phrases may need a term-level OR fallback.
   - Fallback where FTS fails for colloquial input: bounded `ILIKE` on `title` (leading-anchored or with `.limit()` and a low cost ceiling) — never the current unbounded three-query ILIKE dedupe with no limit. Keep the existing LIKE-wildcard escaping.
   - Whichever is chosen must be exercised by a real code path (no dead query functions) and unit-testable (Phase 10).
2. **Wire SearchScreen to the server search:** debounced input → `searchRecipes`-v2 hook → results grid with loading/empty/error states ("ما لاقيناش وصفة" path already exists), result count, and clear button. Remove the in-memory filtering of the full list.
3. **Make filter chips functional on Home and Search:** category/time filters map to a server-side or client-side predicate on the fetched set with visible active-state management (selected chip highlighted, tappable to deselect). Scope filters to predicates the data actually supports (e.g., category, minutes bucket, difficulty, occasion). Where the data does not support a chip's label (e.g., "شوربات" with no soup rows), either the predicate returns an honest empty state or the chip is removed — no dead chips.
4. **Make Favorites pills functional** using the Phase 4 state model ("الكل", and "أكلات مجربة" where tried state exists); unsupported pills stay disabled per the Phase 4 decision.
5. **Validate Arabic search behavior:** build a short Arabic term list (dish names, ingredients, category words, a colloquial phrase, partial word) and record pass/fail per term on Web; document any stemming limitation and the chosen fallback.
6. **Performance guard:** all search paths bounded (limit + debounce); no full-table scan on keystroke.

### Files / areas expected to be affected
- `src/data/queries.ts` (`searchRecipes` rewritten/used; maybe an RPC call).
- `src/screens/SearchScreen.tsx`, `src/screens/HomeScreen.tsx`, `src/screens/FavoritesScreen.tsx` (filter state/behavior; minimal style changes for active states only).
- `src/i18n/strings.ts` (copy for states/errors), `src/db/schema.sql` comments (index intent) if the strategy needs an RPC function in SQL.
- Supabase (optional RPC function).

### Dependencies / prerequisites
- Phases 1–4.
- **Open coupling:** the Search screen's "🎙️ بحث صوتي" chip has no handler. It must not be wired here — real speech recognition is part of the Phase 6 voice-scope decision. Until then the chip must be visibly disabled or removed (never a silent no-op).
- Catalog size at or below the client-filter ceiling; if the catalog has already scaled up, land this phase before Phase 4 polish tasks that assume small lists.

### Risks
- Arabic FTS behavior is unpredictable for colloquial Egyptian text (the app's actual content language) — hence the explicit term-list validation and the documented fallback; do not ship "search returns nothing for common words."
- RPC + RLS interaction: any SQL function must be `SECURITY INVOKER` (or have its own policy) so the anon key cannot bypass RLS.
- Filter-scope creep (adding new filters the product never asked for) — implement only the chips that already exist in the UI.
- Debounce/race conditions (out-of-order responses) — cancel/stale-guard the query.

### Validation requirements (Validation gate)
- Arabic term list passes (or documented fallback handles it) on Web and Android.
- Every chip on Home/Search/Favorites changes the visible set and shows an active state; dead/no-op chips are gone or disabled.
- Search network traffic is bounded and debounced; results have loading/empty/error states.
- `npm run typecheck` passes; no dead `searchRecipes` variant remains (the old one is replaced).

### Definition of Done
- Search hits the server with a documented Arabic strategy; filters are functional with active states; Favorites pills follow the Phase 4 model; Arabic search validated with recorded evidence.

### What must NOT be changed in this phase
- No voice/search-voice implementation (Phase 6), no audio player changes, no cooking mode, no favorites-store redesign beyond what Phase 4 established, no visual redesign.

### Start condition / Implementation scope / Validation gate / Approval
- **Start condition:** Phases 1–4 approved.
- **Implementation scope:** server search path + functional filters + Arabic validation.
- **Validation gate:** term-list results + filter demo + typecheck.
- **Approval required before next phase:** user searches real Arabic terms on device/Web and exercises every filter chip.

---

## Phase 6 — Voice / Audio Core

### Phase name
Voice / Audio Core — the real ElevenLabs narration experience.

### Objective
Implement the product's defining feature per `plan.md`: an AI-generated Arabic voice narrating recipes. This means a real architecture decision (what is generated/stored remotely vs played locally), ElevenLabs integration on the server/production side, real narration URLs replacing SoundHelix demos, a robust player (lifecycle, errors, audio session), and **no API secrets in the mobile client**. This is a major product phase, not polish.

### Why this phase comes here
The audit is explicit: the flagship promise (voice narration; "hands-busy" cooking; the brand voice طنط منى) is unimplemented, and demo MP3s + inert mic UI are standing in for it. This phase is the highest *product* priority after the data/core journey are trustworthy (Phases 1–3), and it must come before Cooking Mode (Phase 7), which consumes the audio. It does **not** depend on Phases 4–5 (favorites/search), so its early groundwork can start in parallel with them (see Parallelizable Work), but its UI integration is staged here to keep reviews clean.

### Tasks
1. **Architecture decision (documented, with a diagram in this file):**
   - **Remote-generated, locally-played** is the plan.md model: narration is synthesized offline/in-batch per recipe (ElevenLabs, one consistent Arabic narrator voice = the brand identity), uploaded to Supabase Storage, and a row is written to `audio_urls`. The mobile client only **plays** URLs — it never calls ElevenLabs directly, so the ElevenLabs API key never ships.
   - Choose Storage visibility: a public-read bucket for narration MP3s is acceptable (content is not sensitive) — but it needs explicit Storage RLS/policies; signed/authenticated URLs are the alternative. Cacheability and cost should drive the choice.
   - Decide per-recipe vs per-step audio **now** because it shapes `audio_urls` and Phase 7: one full narration per recipe is the MVP floor (`plan.md`: "AI voice narration for every recipe"). Per-step narration is recommended for Cooking Mode; if adopted, extend `audio_urls` with a step key (`kind`/`step_order`) and populate it in the same pipeline. If not adopted, Phase 7's cooking mode narrates at recipe level or repeats sections.
2. **Build the production audio pipeline (server-side/script, outside the client):** an ElevenLabs-driven generator that takes the canonical recipe content (from `seed.sql`/content DB), synthesizes Egyptian-colloquial Arabic narration, uploads to Storage, and upserts `audio_urls` rows. It requires the ElevenLabs API key + Supabase service role from the environment only. Provide a dry-run + manifest mode. This pipeline is the tooling that later content production uses for 50–100 recipes.
3. **Replace demo audio:** regenerate real narration for the current `audio_available` recipes (okra, molokhia, oxtail, koshary, potatoChicken, chickenPotato) and remove all `soundhelix.com` URLs from seed + any residual references. Extend audio coverage per the MVP target as content lands (content-track dependency, not an app-code blocker).
4. **Upgrade the player (`src/hooks/useAudioPlayer.ts`):**
   - Replace unconditional 500 ms polling with expo-audio's event-driven status (or gate polling strictly by playing state) — audit §5.1.
   - Fix unit inconsistency (expo-audio reports seconds; code stores ms) and the `remove()` double-invoke guard.
   - Add a real **load-error state with retry** (no more infinite `…` when a URL fails) and a **no-URL idle state** distinct from loading.
   - Configure audio mode (`setAudioModeAsync`: play in silent mode where appropriate, ducking), and handle interruption/route changes.
   - **Single-player coordination:** one shared audio manager/context so the Detail dock and any Cooking audio cannot overlap (Phase 7 consumes this). Keep the design.md dock color rules (resting/playing/paused) — they are already implemented.
5. **Voice-dock UI integrity:** hide or disable the dock cleanly when no URL exists; make the "🎙️" FAB meaningful (it currently switches to the steps tab — either wire it to the real narration affordance or remove it); keep all controls labeled for accessibility. Disable (visibly) the Search "بحث صوتي" chip and Home voice-CTA strings unless real speech input ships in the voice-scope decision (Task 7).
6. **Secrets verification:** grep the bundle/source for `xi-api-key`, ElevenLabs key material, or service-role keys — must be absent from the client tree. Only `EXPO_PUBLIC_SUPABASE_URL/ANON_KEY` remain client-side (and anon is read-only per Phase 1 RLS).
7. **Voice-scope decision (product, documented):** what ships in the MVP — narration playback only (recommended floor) vs. also hands-free speech *input* (voice commands/search), which requires a speech-recognition service and is significantly more work. That decision gates Phase 7's hands-free claims and the mic affordances. If recognition is out of MVP scope, all mic/voice-input UI must be removed or visibly disabled so no dead voice UI ships (audit §3.2).

### Files / areas expected to be affected
- `src/hooks/useAudioPlayer.ts` (or a new `src/audio/` module + shared manager), `src/screens/RecipeDetailScreen.tsx` (dock/FAB), `src/i18n/strings.ts`.
- `src/db/seed.sql` (real URLs; per-step rows if adopted), `src/db/schema.sql` (`audio_urls` shape per decision).
- New scripts/ for the generation pipeline (server-side tooling); Supabase Storage setup + policies; environment for ElevenLabs + service role (gitignored).
- Content/audio artifacts (generated MP3s, manifests) — likely external to the repo or in a gitignored path.

### Dependencies / prerequisites
- Phases 1–3 (canonical schema with `audio_urls`, detail serving the URL).
- ElevenLabs account/API key (server-side), Supabase Storage, and the brand voice selected.
- Product decisions: per-step audio (yes/no), voice-input scope (Task 7), Storage visibility.

### Risks
- **Highest product risk in the plan.** TTS cost/volume for 50–100 recipes, voice consistency, and content quality are external unknowns — start the pipeline early (parallel with Phases 4–5) and validate on 2–3 recipes before batch production.
- Interruption/ducking and background playback behavior are easy to get wrong on Android — device testing required (see High-Risk Areas).
- The shared-player refactor touches a screen that already works; keep the diff reviewable and re-run the Phase 0 audio checklist.
- Scope creep into building a full voice assistant — bounded by the Task 7 decision.
- Secret leakage (ElevenLabs/service-role) into the client — enforced by the Task 6 grep as a hard gate.

### Validation requirements (Validation gate)
- Real narration plays end-to-end (load → play → pause → replay → completion → error/retry on a bad URL) on Android + Web for representative recipes.
- No SoundHelix URL remains in seed/source; every `audio_available` recipe resolves a real audio row.
- Secrets grep is clean; anon key remains read-only.
- Two audio sources cannot play simultaneously (dock vs cooking) once the shared manager exists.
- `npm run typecheck` passes; Phase 0 audio checklist subset passes.

### Definition of Done
- Architecture decision documented and implemented (remote-generate / local-play); ElevenLabs pipeline produces and stores real narration; player robust (states, errors, audio session, single-instance); demo audio gone; no secrets client-side; voice-input scope decision recorded and reflected in the UI (no dead mic affordances).

### What must NOT be changed in this phase
- No cooking-mode feature work (Phase 7 — though the shared audio manager is built here for it), no search/filters, no favorites changes, no visual redesign of the dock beyond wiring correct states, no DB schema churn beyond the `audio_urls` decision.

### Start condition / Implementation scope / Validation gate / Approval
- **Start condition:** Phases 1–3 approved; ElevenLabs + Storage access available; Task 7 scope decision recorded.
- **Implementation scope:** audio architecture + pipeline tooling + player refactor + dock honesty + secret hygiene.
- **Validation gate:** end-to-end playback + secrets grep + single-player proof + typecheck.
- **Approval required before next phase:** user listens to real narration on a device and approves the voice-scope decision (this decision directly bounds Phase 7).

---

## Phase 7 — Cooking Mode

### Phase name
Cooking Mode — real step-by-step flow, timer, and narration.

### Objective
Turn the current hard-coded, inert Cooking Mode into a real, data-driven step flow: real steps from the recipe, a working countdown timer, working next/previous/replay controls, narration integration from Phase 6, and no inert controls. Hands-free/voice interaction only where the Phase 6 scope decision explicitly supports it.

### Why this phase comes here
Cooking Mode is the *usage moment* the product exists for (hands busy, listening). It currently hard-codes okra steps (ignoring the real `id` param), shows a static `(٠٠:٠٢)` timer, and has an inert "عيدي تاني" chip. It depends on: real step data (Phases 1–3), the audio core (Phase 6), and the tried-state model if cooking completion should feed "أكلات مجربة" (Phase 4). It is staged after Phase 6 so narration exists to integrate.

### Tasks
1. **Real data:** load the recipe via `useRecipe(id)` and drive steps from `recipe.steps` (with the Phase 3 error/empty handling). If a recipe has no steps, show an honest state with a path back to Detail — never fabricated steps.
2. **Working timer:** a real countdown (duration selectable per recipe or a sensible default), start/pause/reset, accurate completion state ("خلصت الطشة!"), and honest time formatting via the existing Arabic-numeral helpers (fix the literal `(٠٠:٠٢)` and unused `t.cooking` timer strings). Handle backgrounding appropriately for MVP (document behavior).
3. **Working controls:** next/previous buttons (already functional — keep), "عيدي تاني" wired to restart-the-current-step or replay narration (per the product's meaning), progress indicator reflecting real step position, exit with confirm-if-mid-session only if cheap (else plain exit is fine).
4. **Narration integration:** play the current step's audio (per-step) or the full narration (per-recipe) through the Phase 6 shared player; auto-stop/switch on step change; keep touch controls fully functional regardless of audio (accessibility and headless contexts).
5. **Tried-state coupling:** on completing the final step (or explicit completion), mark the recipe tried in the Phase 4 store so Profile/"أكلات مجربة" become real.
6. **Hands-free:** only if the Phase 6 voice-scope decision included speech input: wire voice commands ("التالي", "عيدي تاني", timer) to the same recognition service. **Otherwise** remove or visibly disable mic/voice chips — under no circumstances ship a "قولي بالصوت" chip that does nothing (audit §3.2/§6.3).
7. **Clean the shell:** remove the nested `SafeAreaProvider` (audit §5.5) as part of this screen's rework; verify bottom-inset behavior.
8. **Run typecheck + a full cooking session** on Web and Android: open from Detail → step through all steps → timer to zero → replay → exit; verify no inert controls remain.

### Files / areas expected to be affected
- `src/screens/CookingModeScreen.tsx` (major rework of logic; visual design kept per `design.md`).
- A timer hook (`src/hooks/useCountdownTimer.ts` or similar), the Phase 6 audio manager consumer.
- `src/state/favorites.ts` (tried-marking), `src/i18n/strings.ts` (cooking copy), possibly `src/data/queries.ts` (no change expected).
- `src/screens/ProfileScreen.tsx` only if stat wiring reveals a gap (avoid otherwise).

### Dependencies / prerequisites
- Phases 1–4 and 6 (real data, tried model, audio core + scope decision).
- Device for timer/audio validation.

### Risks
- Timer accuracy under app backgrounding/Doze; document or mitigate (foreground timer + elapsed-time math is the robust MVP choice).
- Audio concurrency when leaving/re-entering Cooking Mode — the Phase 6 single-player manager must define stop-on-exit behavior.
- The Phase 6 voice-input decision may be "out of MVP scope," in which case removing the mic chips changes the accepted UI — get explicit user sign-off for removal-vs-disabled.
- Scope creep into adding cooking features the product never specified (shopping lists, timers-per-step beyond default, etc.).

### Validation requirements (Validation gate)
- Cooking session uses the real recipe's steps; a recipe without steps degrades honestly.
- Timer counts down to a real completion state; controls all do something observable; no inert chip remains (grep `onPress={() => {}}` in this screen returns nothing).
- Narration (whichever level was decided) plays and stops correctly with step changes and on exit; no overlapping audio with Detail.
- Completing a session updates the tried state if that model shipped.
- `npm run typecheck` passes; Phase 0 checklist cooking subset passes.

### Definition of Done
- Cooking Mode is data-driven and fully functional (steps, timer, navigation, narration per scope decision); all previously inert controls are implemented or honestly removed; tried-state coupling works; nested provider removed; design language preserved.

### What must NOT be changed in this phase
- No Recipe Detail/Home/Search/Favorites feature changes, no new cooking features beyond the plan (no invented "smart" functionality), no design redesign, no DB schema changes.

### Start condition / Implementation scope / Validation gate / Approval
- **Start condition:** Phases 1–4 + 6 approved; voice-scope decision in hand; a device available for timer/audio checks.
- **Implementation scope:** Cooking Mode logic rework + timer + audio integration + tried coupling.
- **Validation gate:** a full device cooking session + inert-control grep + typecheck.
- **Approval required before next phase:** user cooks through a full session on a real device (or Web + device for audio).

---

## Phase 8 — UX / Accessibility / Cross-Platform Hardening

### Phase name
UX / Accessibility / Cross-Platform Hardening.

### Objective
Android/Web parity, verified RTL, safe-area/header consistency, correct shadows/elevation, design.md typography, ≥44 dp touch targets, accessibility labels/roles, responsive grids. **Only fix verified issues — no redesign of accepted UI.**

### Why this phase comes here
All feature work (Phases 2–7) is now final, so hardening fixes won't be immediately invalidated by feature changes. The audit catalogues specific, verified issues (RTL unverified on Android, double top-offset on Detail's floating header, nested SafeAreaProvider now removed in Phase 7, `headlineMd` 12 px, `48%` grid overflow on narrow screens, contrast failures, a11y-label gaps, nested touchables in RecipeCard). This phase also owns the RTL-on-device outcome flagged since Phase 0.

### Tasks
1. **RTL on real Android (verify-then-fix):** cold-start on one or more Android devices and confirm `[rtl] … isRTL=true` and visually correct RTL on all four tabs + Detail + Cooking. If the host ignores the JS preference, apply the minimal host-level fix (native config forcing RTL) with its own review — never re-introduce the JS auto-restart that caused the reload loop. Re-verify Web parity (web is RTL by construction).
2. **Safe-area/header geometry consistency:** replace Platform-constant header offsets in RecipeDetail (`top: 40/50`) with `useSafeAreaInsets()` offsets relative to the screen root; audit per-screen fixed-header/padding so content never hides under the header or double-insets (Phase 0 baseline is the comparison point); confirm Cooking Mode bottom inset after the Phase 7 provider removal. Web (insets 0) should keep working identically.
3. **Accessibility pass:** `accessibilityLabel`/roles for all icon-only, glyph, and emoji controls (Detail back/share/replay/dock, Cooking nav/timer/exit, Favorites pills, header bell/profile already partly labeled); fix the nested-interactive pattern in `RecipeCard` (outer TouchableOpacity wrapping the CTA button) so screen readers don't double-activate; ensure ingredient checkboxes keep their role/state (already present — verify).
4. **Touch targets & contrast:** interactive elements ≥44 dp (audit found 40 dp icon buttons, 24 dp checkbox rows rely on row padding — verify effective hit areas); replace `#777`-on-cream secondary text with a passing color where it is genuinely interactive/secondary per `design.md`'s own contrast table.
5. **Typography re-baseline vs `design.md`:** fix the verified regressions (audit §6.4): `headlineMd` 12/34, Favorites title at 12 px, `h2` 17 px, unused divergent tokens (`h1Mobile`, `fontFamilyFallback`, `elevation.audioDock`). Apply the design.md type scale through the existing tokens — this is correcting tokens to the spec, not a redesign.
6. **Responsive grids:** make the 2-column grid math not overflow at ~320 dp widths (replace `width: '48%'` + gap with flex-basis/calc accounting for the gap) on Home/Search/Favorites.
7. **Iconography consistency (scoped):** standardize control glyphs/emoji on vector icons where they act as UI chrome (keep emoji in content strings where intended) — audit §6.7. Keep this bounded; only the controls flagged in the audit.
8. **Bottom nav / shadows / fixed headers:** verify Android elevation shadows + Web box-shadows after all changes (split-shell pattern is already correct — regression-check only), and the floating tab bar geometry across devices.
9. **Run the full cross-platform matrix:** Android devices (at least one notched, one with gesture nav, ideally one narrow 320 dp) + Web, against a per-screen checklist derived from the Phase 0 baseline and the audit's §7/§8 problem lists.

### Files / areas expected to be affected
- `src/screens/*` (offsets, labels, hit areas, typography application), `src/components/RecipeCard.tsx`, `RecipeCard`'s nested-touchable fix, `src/theme/typography.ts` (+ colors if contrast tokens corrected), `src/i18n/rtl.ts` or native host config only if the RTL fix requires it.
- Possibly `App.tsx`/navigation if header geometry standardization requires a shared approach.

### Dependencies / prerequisites
- Phases 0–7 (features final); real Android devices available (this phase should not be done blind — see High-Risk Areas); the Phase 0 baseline records for comparison.
- The RTL host-level fix decision (if needed) is a small, separately reviewed change within this phase.

### Risks
- This phase has the widest surface and the highest regression potential *per change* — mitigate by small reviewed commits, the device matrix, and re-running the Phase 0 checklist after every few fixes.
- "Polish" can balloon into redesign; the guard is the audit's verified-issue list and the explicit no-redesign rule.
- Contrast/typography changes alter the look slightly even when "correcting to spec" — get user visual sign-off before and after.

### Validation requirements (Validation gate)
- Device matrix checklist passes (RTL confirmed cold-start on Android; Web parity; safe areas; shadows; grid at 320 dp).
- Accessibility spot-check with a screen reader on Android (TalkBack) on the key flows.
- Audit §6.4/§7/§8 items are each resolved or explicitly accepted as known issues.
- `npm run typecheck` passes; Phase 0 checklist regression pass is clean.

### Definition of Done
- RTL verified/fixed on real Android; safe-area/header geometry consistent; a11y labels/roles/targets/contrast fixed for flagged items; typography re-baselined to design.md; grids do not overflow; no unapproved visual changes.

### What must NOT be changed in this phase
- No feature behavior changes (search, favorites, audio, timer logic), no data/query changes, no new screens or navigation structure, no redesign of accepted screens, no dependency changes.

### Start condition / Implementation scope / Validation gate / Approval
- **Start condition:** Phases 0–7 approved; real devices available; audit's verified-issue list as the work order.
- **Implementation scope:** verified-issue fixes across platform/a11y/typography/layout consistency.
- **Validation gate:** full device+Web matrix + TalkBack spot-check + Phase 0 regression pass.
- **Approval required before next phase:** user reviews before/after on real devices and signs off the RTL outcome.

---

## Phase 9 — Performance & Code Quality

### Phase name
Performance & Code Quality — cleanup and optimization without behavior change.

### Objective
Address the audit's performance and hygiene findings: audio lifecycle/polling (re-verify after Phase 6), react-query caching (staleTime/refetch-on-focus), query/render optimization, TypeScript `any` cleanup where valuable, dead-code/string/token cleanup, magic numbers → tokens, shared components/tokens, and removal of confirmed-unused dependencies. **No behavior changes.**

### Why this phase comes here
Cleanup must wait until features are final (Phases 2–8) so nothing deleted is a feature-in-waiting, and it must precede the test phase so tests are written against the final code shape. Performance work is low-risk relative to features and belongs at the end of the build, before the release-validation investment of Phase 10.

### Tasks
1. **Re-verify audio lifecycle** (already refactored in Phase 6): no idle polling, no ms/s mismatch, error states present; memoize the Detail voice dock so 500 ms ticks (if any remain) don't re-render the screen subtree.
2. **React Query tuning:** set sensible `staleTime`/`gcTime` for recipes + recipe detail (avoid refetch-on-every-focus/mount for static catalog data); keep pagination from Phase 3; dedupe where the same key is fetched by multiple screens.
3. **Rendering:** memoize expensive rows/docks; virtualize grids only if the catalog size warrants it (≤100 rows: not yet); fix the re-render-on-keystroke pattern in Search if measurable.
4. **TypeScript `any` cleanup (where valuable):** replace `navigation: any` / `route: any` with the existing `RootStackParamList` navigation generics; type Supabase row mapping with generated row types (or a small `Database` type) instead of `mapRecipe(r: any)`. Keep this pragmatic — don't churn files for zero type-safety gain.
5. **Dead-code sweep** (audit §6.1/§6.2/§13), each removal preceded by a grep proving zero usages:
   - `searchRecipes` old variant (replaced in Phase 5), `getRecipeDetail` (removed Phase 2 — verify), `placeholderRecipes`/`src/data/recipes.ts` runtime role (now seed-reference only — delete or move to `src/db/` as a seed source comment).
   - Unused i18n keys (~40+: `sample.*`, `recipeCard.*` list, `handsBusy*`, `micButton`, unused `cooking` voice/timer keys once Phase 7 ships their replacements, etc.). Rename the `encouragment*` typo keys to `encouragement*` and update references.
   - Unused theme tokens/exports (`fontFamilyFallback`, `h1Mobile`, `elevation.audioDock`, unused color keys, `minTouchTarget`/`heightLarge`/`heightHuge` if truly unused — verify), unused imports/styles (`FlatList` in Search, `Dimensions` in Favorites, `width`/`RoutePropType` in CookingMode), `Recipe.imageUrl` only if Phase 1 decided no images (otherwise it is now real).
   - Debug console calls (`console.log('notifications')`, dead `console.log('voice', …)`) or gate behind `__DEV__` (keep the `[rtl]` diagnostic only if still needed).
6. **Magic numbers → tokens:** Detail `top: 40/50` (already fixed in Phase 8 — verify), `fab bottom: 100`, Home `paddingBottom: 100`, tab bar `bottom: 2`/`elevation: 16`, `CARD_WIDTH` math — route through `headerHeight`/`bottomNavHeight`/spacing tokens or insets.
7. **Dependency hygiene (remove only after confirming unused):** `@qoder-ai/qoder-agent-sdk` (never imported), and verify `expo-linking`, `expo-splash-screen` (currently unused), `expo-asset`, `react-native-gesture-handler`, `expo-updates` (added for the removed restart path) — remove each only when the import/plugin check is conclusive. Remove `package.json.backup-51` and decide on `dist-check/`, screenshots, and stray dev scripts (prune or document).
8. **Shared components/tokens:** extract any remaining per-screen duplicated header/grid patterns only if it reduces real duplication without behavior change (audit §13) — keep this conservative.
9. **Run typecheck + full Web regression + the Phase 0 checklist** to prove no behavior change; capture a before/after bundle-size note if tooling permits.

### Files / areas expected to be affected
- Broad but shallow: `src/**` (dead code/strings/tokens/imports), `package.json` (dependency removals), `src/data/queries.ts`, `src/navigation/RootNavigator.tsx` (typing), `src/theme/*`, repo-hygiene files (`package.json.backup-51`, `.gitignore` for `dist-check/`).

### Dependencies / prerequisites
- Phases 0–8 (feature-complete codebase).
- Grep tooling discipline: every deletion backed by a zero-usage proof.

### Risks
- Cleanup regressions are silent (they typecheck but change behavior subtly) — the guard is no-behavior-change + full regression pass + keeping cleanup commits small and separate from perf commits.
- Removing an Expo plugin/dependency can break the native build in ways typecheck can't see — always run a web export and, if feasible, an Android build after dependency removal.
- Over-typing (full Supabase `Database` codegen) can balloon scope — cap it at row-mapping types.

### Validation requirements (Validation gate)
- Typecheck passes; Web export builds; Phase 0 checklist regression pass clean.
- Grep asserts: listed dead symbols/strings/tokens/imports are gone; no `console.log` outside `__DEV__` guards (except intentional diagnostics).
- `npm audit`/dependency check run and recorded; removed dependencies confirmed unused by import/plugin grep.
- No behavioral or visual diffs beyond intended cleanup (compare against the Phase 8-approved state).

### Definition of Done
- Performance items addressed with evidence; dead code/strings/tokens/dependencies removed (each grep-proven); `any` reduced where valuable; magic numbers tokenized; bundle note recorded; zero behavior change.

### What must NOT be changed in this phase
- No feature logic changes, no UI/visual changes, no query *results* changes (only caching/timing), no schema changes, no new features.

### Start condition / Implementation scope / Validation gate / Approval
- **Start condition:** Phases 0–8 approved; final feature shape confirmed.
- **Implementation scope:** caching/perf tuning + dead-code/dependency cleanup + typing + tokenization.
- **Validation gate:** regression pass + greps + build + typecheck.
- **Approval required before next phase:** user reviews the (empty) behavior-diff and signs off the cleanup.

---

## Phase 10 — Testing & Release Readiness

### Phase name
Testing & Release Readiness — automated validation and the release path.

### Objective
Add the missing engineering rails (audit §4.4/§15): lint, unit/component tests for critical flows, navigation smoke tests, data/query tests, CI, a defined Android/Web release checklist, production-build validation, security verification, and a final regression pass.

### Why this phase comes here
The audit notes a documented history of platform-specific regressions (reload loop, RTL divergence, shadow clipping, double insets) with zero automated protection. Tests and CI are most valuable against the final code shape (after Phase 9 cleanup), and the release gate needs everything above it to already be true. This is the last phase before production.

### Tasks
1. **Lint:** add ESLint (`expo lint`) with a project-appropriate config; fix or baseline existing findings; add `npm run lint` to scripts.
2. **Unit/component tests (Jest + React Native Testing Library, jest-expo preset) for critical flows:**
   - Favorites store: persistence/hydration, stale-id pruning, tried-marking (Phase 4).
   - `mapRecipe`/row mapping and detail-query error semantics (mocked Supabase client) — incl. sub-resource failure vs empty (Phase 3).
   - Search function: Arabic term list behavior, wildcard escaping, limit (Phase 5).
   - Countdown timer logic (Phase 7) and the audio player hook with expo-audio mocked (states incl. load-error, unit consistency) (Phase 6).
   - Shared components: RecipeCard, AppHeader, dock states, ingredient-row roles (accessibility assertions).
3. **Navigation smoke tests:** render the navigator (mocked queries/audio) and assert: four tabs render; Home → Detail → Cooking path; Detail error branch; Favorites empty → CTA → Home.
4. **CI:** a pipeline (GitHub Actions or equivalent) running typecheck + lint + tests + web export on every PR; make it the merge gate. Keep the first CI run green before adding more.
5. **Release checklist (documented in this file or `audit.md`):** Android (EAS build APK: install on ≥2 devices incl. a notched one, RTL cold-start check, safe areas, audio interruption, timer backgrounding, storage permissions none needed) and Web (production export, RTL, fonts, share links). Each item has an owner and a sign-off field.
6. **Production build validation:** `eas build` (or `expo export`) for Android + Web production export; verify Cairo font bundling, `EXPO_PUBLIC_*` env inlining, and no dev-only behavior.
7. **Security verification (final):** re-run the Phase 1 evidence (RLS read-only anon, no anon writes), secret grep over the whole tree + built bundle (no ElevenLabs/service-role keys), `npm audit` review, and confirm the client contains only the two `EXPO_PUBLIC_SUPABASE_*` values.
8. **Final regression pass:** execute the complete Phase 0 Baseline Validation Checklist on devices + Web and record results.

### Files / areas expected to be affected
- `package.json` (scripts + devDeps), `eslint.config.*`, `jest.config.*`/preset, `__tests__/` or co-located `*.test.ts(x)`, CI workflow file, `app.json` only if build config gaps surface (icons/splash — see audit §14; adding an icon/splash is release-readiness, not design).
- `audit/roadmap.md` or `audit.md` (release checklist record).

### Dependencies / prerequisites
- Phases 0–9; access to EAS/Expo build tooling; at least one Android device + Web; CI provider credentials.

### Risks
- First-time test/CI setup can consume disproportionate time — cap the initial suite at the critical flows above and expand later.
- Tests that mock Supabase/expo-audio can drift from real behavior — the device checklist in the Release Gate is the compensating control.
- CI on a Windows/local setup may need containerization for the web export step — plan the workflow accordingly.

### Validation requirements (Validation gate)
- `npm run lint`, `npm run typecheck`, `npm test` all green; CI green on a clean checkout.
- Web export + Android build succeed from CI/local with no secrets in the bundle.
- Release checklist executed on device(s) with recorded sign-offs.
- Phase 0 regression pass fully green.

### Definition of Done
- Lint + critical-flow tests + navigation smoke tests + data/query tests exist and run in CI; Android/Web release checklist executed; production build validated; security verification clean; final regression pass recorded.

### What must NOT be changed in this phase
- No feature/UI/behavior changes (this phase only adds validation tooling and records; any bug found is filed as a small fix with its own review, then the test is added), no schema changes, no dependency churn beyond dev tooling.

### Start condition / Implementation scope / Validation gate / Approval
- **Start condition:** Phases 0–9 approved; codebase feature-complete and cleaned.
- **Implementation scope:** lint + test suite + CI + release checklist + build/security/regression validation.
- **Validation gate:** all green checks + signed-off device checklist + clean security scan.
- **Approval required before next phase:** user reviews the Release Gate (below) and makes the go/no-go production decision.

---

## Critical Path

The minimum chain where delay compounds (each link must be complete before the next starts):

```
Phase 0 (baseline) → Phase 1 (schema + RLS) → Phase 2 (single data source)
   → Phase 3 (core list/detail) → Phase 6 (voice/audio core, starts here once 1–3 are done)
   → Phase 7 (cooking mode) → Phase 8 (platform hardening) → Phase 9 (cleanup)
   → Phase 10 (tests/CI/release)
```

Two non-negotiable external dependencies sit on this path:

1. **The canonical schema + id strategy (Phase 1)** — every query, seed, navigation id, and audio row depends on it. This is the single most consequential approval in the plan.
2. **The voice/audio architecture + ElevenLabs pipeline (Phase 6)** — the product's defining feature and its longest engineering lead. Its *early groundwork* can begin once Phases 1–3 land, even while Phases 4–5 run, because it does not depend on favorites/search.

Phases 4 and 5 sit off the strict critical path of the *product-defining* chain but are required before Phase 10 (they are user-facing MVP features). Phase 8 must not be attempted before real-device validation is available.

---

## Parallelizable Work

- **Voice/audio groundwork (Phase 6 pipeline) ∥ Phases 4–5:** once Phase 1's schema (`audio_urls`) and Phase 3's content shape are fixed, the ElevenLabs generation pipeline, Storage setup, and 2–3 pilot narrations can be built and validated while favorites/search are implemented. This is the single biggest schedule lever because TTS batch production for 50–100 recipes is the plan's long pole.
- **Content/recipe production track (external):** authoring the 50–100 recipe corpus (text + images + narrations) is independent of all app engineering once Phase 1 defines the content contract (columns, id slugs, audio rows). It must feed `seed.sql`/content DB continuously; the app-side code handles whatever rows exist.
- **Phase 0 environmental probes:** the live-Supabase inventory and Android RTL probe can run the moment credentials/device exist, independent of implementation order — feed results into Phase 1 and Phase 8 respectively.
- **Low-risk hygiene fixes (folded into owning phases):** dead `console.log`s, unused imports, and obvious local dead code can be removed *within the phase that owns the file* rather than waiting for Phase 9 — keep them as separate commits for reviewability.
- **Phase 10 test scaffolding:** the first lint config and a tiny jest-expo smoke test can be introduced as early as Phase 3 (per-phase validation evidence), then expanded to the full suite in Phase 10. Guardrail: don't let test-setup churn slow feature phases; a minimal harness is enough.

Not parallelizable: Phase 1 must precede Phase 2 (schema before data path); Phase 2 before 3/4/5 (single source before features); Phase 6 before 7 (audio before cooking-mode narration); Phase 9 before 10's full suite (cleanup before writing tests against final shape).

---

## High-Risk Areas

1. **Phase 1 — RLS/schema changes against a live project.** Enabling RLS without policies blanks the app; migrating UUID→TEXT ids is destructive; the id decision cascades everywhere. *Mitigation:* verify-first, apply policies atomically with enablement, use the service role only, and gate the schema on explicit user approval.
2. **Phase 6 — Voice/audio (highest product + engineering risk).** New external service (ElevenLabs), a production pipeline, per-step audio decisions, Android audio lifecycle (interruptions, ducking, backgrounding), cost/scale of TTS, secret hygiene. *Mitigation:* pilot 2–3 recipes before batch; document the remote-generate/local-play architecture; shared single-player manager; secrets grep as a hard gate; start early in parallel.
3. **RTL on real Android.** Configured but unverified; the fix may require a host-level change that Phase 8 owns. *Mitigation:* probe at Phase 0, resolve in Phase 8 with its own review, never re-introduce the JS auto-restart.
4. **Phase 2 — data-path rewiring.** Replacing local placeholder sources can silently change Search/Favorites behavior and offline tolerance. *Mitigation:* interim shared-list approach, end-to-end navigation proof, explicit temporary-mechanism note.
5. **Arabic search (Phase 5).** FTS `arabic` config against Egyptian-colloquial content may miss common terms. *Mitigation:* explicit Arabic term-list validation and a documented ILIKE fallback before shipping.
6. **Phase 8 — broad hardening surface.** Wide, per-change regression potential. *Mitigation:* verified-issue work order, small reviewed commits, device matrix, Phase 0 checklist re-runs, no-redesign guard.
7. **Phase 10 — test/CI first-time setup.** Time sink with little visible product change. *Mitigation:* cap the initial suite to the critical flows; CI is a merge gate, not a feature.

---

## Phases That Require Real-Device Validation

- **Phase 0** (best-effort baseline probe; becomes mandatory evidence later), **Phase 6** (audio lifecycle/interruptions on Android), **Phase 7** (timer + narration + backgrounding during a real cooking session), **Phase 8** (the entire hardening phase is meaningless without Android devices — RTL, safe areas, shadows, TalkBack), **Phase 10** (release checklist + final regression).
- Phases 1–5 and 9 can be validated on Web + typecheck, but their **acceptance demos should still be re-run on a device** when one is available, because the audit explicitly flags Web-verified claims that were never device-verified.

---

## Release Gate

Minimum conditions that must all be true before the MVP is considered production-ready. Split into **hard requirements** and **decision-gated items** (which may be excluded from MVP only by explicit user decision).

### Hard requirements
- [ ] **Security:** RLS enabled on all five tables with read-only anon policies, verified live (anon read works, anon write denied). No secrets in the repo or built bundle (grep-clean); `scripts/` write paths require the service role. Client contains only `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] **Schema integrity:** one canonical schema + seed in the repo matches the live DB; id strategy stable; no `recipes.audio_url` column; `audio_urls` unique per recipe; ordering column present.
- [ ] **Single data source:** no screen reads local placeholder recipes at runtime; every card surface navigates to a Detail record that resolves; Search/Favorites/Home/Detail show the same catalog.
- [ ] **Core journey:** deterministic list ordering; loading/empty/error/retry states on list and detail; detail query efficient and sub-resource errors honest.
- [ ] **Favorites:** persist across restarts on Android and Web; no mock counts; Profile stats derived from real store/catalog state.
- [ ] **Search & filters:** search hits the server with a documented Arabic strategy validated against a real term list; every existing filter chip is functional or visibly disabled — none silently inert.
- [ ] **Voice (product core):** every recipe shipped in the MVP catalog has a real narration URL (no SoundHelix anywhere); player handles load/play/pause/replay/completion and load-error-with-retry; audio session/lifecycle correct on Android; single-player coordination; ElevenLabs key absent from the client.
- [ ] **Cooking mode:** driven by real recipe data; working timer; working next/previous/replay; no inert controls; narration integrated per the approved scope.
- [ ] **Platform:** RTL confirmed on a cold-started Android device; Android/Web parity checklist passes; safe-area/header geometry consistent; a11y labels/roles, ≥44 dp targets, and contrast fixes verified; grids don't overflow at 320 dp.
- [ ] **Engineering:** `npm run lint`, `npm run typecheck`, `npm test`, and CI are green; unit/component tests cover the critical flows; navigation smoke tests pass; production build (Android + Web export) succeeds from CI.
- [ ] **Regression:** the full Phase 0 Baseline Validation Checklist passes on devices + Web at the end of Phase 10.
- [ ] **Release checklist:** the Phase 10 Android/Web release checklist is executed with recorded sign-offs.

### Decision-gated (explicit user sign-off required — not automatic MVP blockers)
- [ ] Hands-free speech *input* (voice commands/search) in or out of MVP scope. If out: all mic/voice-input affordances removed or visibly disabled; the product ships narration-only.
- [ ] Per-step audio vs full-recipe narration for Cooking Mode.
- [ ] The Favorites extra-pills model (tried/want-to-try/eid-sweets) per Phase 4 option (a) or (b).
- [ ] Dish images: content production will supply `image_url` values (column added in Phase 1), or image support is explicitly deferred.
- [ ] Recipe catalog size at launch (plan.md targets 50–100 with full audio coverage) — a content-track commitment, not an app-code condition, but it determines whether the "every recipe narrated from day one" promise is met at launch.
- [ ] Monetization/notifications/settings rows in Profile remain placeholders ("قريباً") — acceptable for MVP only by explicit decision.

**Final rule:** this document is a roadmap only. Each phase requires its own user review and explicit approval before the next begins; nothing is implemented until a phase is started, and no phase may exceed its scope.

---

## Phase 0 — Baseline Record (executed 2026-09-10)

> **Execution note.** This phase was executed **read-only**. Per the execution instruction, **no commit, tag, or push was created**. Task 1's "freeze" step is therefore recorded as *pending user action*; the exact working state is already captured by commit `e5a9594` (see §0.2). No application source, config, SQL, dependency, or `.env` file was changed. The only file written by this phase is this roadmap record.

### 0.1 Environment — VERIFIED

- OS: Windows (MINGW64_NT-10.0-26200); Node **v24.11.0**; npm **11.6.1**.
- Expo SDK **57.0.20**; Expo CLI **57.0.22**; React Native **0.86.3**; React **19.2.3**; react-native-web **^0.21.2**.
- React Navigation **^6.1.18**; TanStack Query **^5.59.0**; Zustand **^4.5.5**; supabase-js **^2.45.4**; expo-audio **~57.0.4**; expo-updates **~57.0.21**; TypeScript **~6.0.3**.
- Dev commands: `npm run start` (`expo start`), `npm run web` (`expo start --web`), `npm run android`, `npm run ios`, `npm run typecheck` (`tsc --noEmit`).
- Android tooling: **`adb` is not on PATH and no physical device is reachable from this environment** → on-device checks are NOT VERIFIED (see §0.5). A dev server (`expo start --web`) was already listening on `:8081`.

### 0.2 Repository state — VERIFIED

- `git status --porcelain` → **empty**; working tree clean.
- `HEAD` = `origin/main` = **`e5a9594`** ("fix: optimize recipe cards for mobile grid"). Branch `main` tracks `origin/main`, up to date.
- Commit `e5a9594` contains 4 files: `.vscode/launch.json`, `src/components/CategoryChip.tsx`, `src/components/RecipeCard.tsx`, `src/screens/SearchScreen.tsx` (the most recent RecipeCard/QR work).
- No tags; no stashes.
- **Freeze (Task 1): NOT CREATED** (execution instruction forbids commit/tag/push). Diff anchor for later phases: `e5a9594`.

### 0.3 App startup / dev server — VERIFIED

- Fresh `npx expo start --port 8099` boots cleanly: `Starting project at …` → `Waiting on http://localhost:8099`; TCP listener confirmed; probe server stopped afterwards. No boot errors.
- Running `expo start --web` on `:8081` serves this project; `GET http://127.0.0.1:8081/_expo/open` → android `exp://192.168.1.4:8081`, web `http://192.168.1.4:8081`.
- Android bundle `GET /index.bundle?platform=android&dev=true` → **HTTP 200** (6,759,471 B).
- Cairo font gate: `document.fonts` → `Cairo:loaded`, `material-community:loaded`, `feather:loaded`; header title computed `font-family: Cairo`. App renders only after the font resolves.
- `npm run typecheck` → **exit 0** (clean).

### 0.4 Baseline Validation Checklist (regression oracle)

Web reproduction via headless Edge (CDP) against the live dev server at **390×844**, committing nothing:

| # | Flow | Result | Evidence |
|---|------|--------|----------|
| 1 | Web root is RTL | **PASS** | `document.documentElement.dir = "rtl"` |
| 2 | Home loads recipes from Supabase | **PASS** | hero + 9 feed cards; no "حدث خطأ" error state; greeting visible |
| 3 | Home → RecipeDetail (okra) | **PASS** | ingredients tab shows 8 real rows; title/stats/CTA present |
| 4 | Detail tabs (Ingredient / Steps / Tips) | **PASS** | Steps shows "تشويح اللحمة مع السمنة"; Tips shows "بلاش تقليب كتير في البامية!" |
| 5 | Favorite toggle (in-memory) | **PASS** | button flips "أضيفي للمفضلة" → "إزالة من المفضلة" |
| 6 | Detail → CookingMode | **PASS** | exit label, step 1 ("تجهيز المكونات"), timer chip, next button present |
| 7 | CookingMode next step | **PASS** | advances to "التشويح" |
| 8 | CookingMode exit → Detail | **PASS** | returns to the detail screen |
| 9 | Favorites tab reflects toggle | **PASS** | shows "1 وصفة مفضلة" + okra card (non-empty branch) |
| 10 | Search tab renders input + results | **PASS** | input present; 10 local placeholder cards |
| 11 | Search query filters | **PASS** | typing "ملوخية" → "تم العثور على ١ وصفة" |
| 12 | Search results are 2-column | **PASS** | 4 cards: `172×136` at left 202 / 18, row tops 285 / 433 |
| 13 | Profile tab renders | **PASS** | stats (المفضلة / أكل مجربة / بصوت طنط منى) + settings render |
| 14 | Console errors during run | **PASS** | no `console.error`/`Log` errors captured |
| 15 | Demo audio plays/pauses/replays | **FAIL** | see §0.6 / §0.8 — dock requests `https://example.com/audio/okra.mp3` and sticks in the `…` loading state |

### 0.5 NOT VERIFIED (blocked by environment)

- **Physical Android runtime** — cold-start RTL (`[rtl] … isRTL=…`), floating tab-bar geometry, safe-area/insets, shadows, gestures, and the **2-column RecipeCard on device** (no `adb`, no device).
- **Web ↔ Android parity** of headers/safe areas/typography (only Web measured here).
- **iOS** — not testable in this environment.
- Live Supabase **dashboard-side** settings beyond what the anon REST probe reveals (e.g. whether RLS exists but is bypassed by a permissive policy — the write probes show writes are authorized from the anon role regardless).

### 0.6 CURRENT ISSUES (recorded, deliberately not fixed in this phase)

- **CRITICAL — Supabase RLS is effectively OFF.** Anon `PATCH` (0-match) → **HTTP 204**, anon `DELETE` (0-match) → **HTTP 204**, anon `INSERT` reached a table constraint (**HTTP 400 / 23502**) instead of a permission error. The public anon key can therefore read **and write/delete** every table. No data was mutated by the probes (0-match update/delete; duplicate/NOT-NULL insert), and all row counts were unchanged afterwards. [audit §3.1]
- **HIGH — Demo audio is unreachable on the Supabase path.** Live `audio_urls` point to `https://example.com/audio/*.mp3` → **404**. Clicking play on the okra detail issues 2 requests to that URL and the dock stays in the loading state (matches audit §5.1: no error state).
- **HIGH — Two parallel data sources / id scheme.** Home + Detail read Supabase (TEXT ids); Search + Favorites read `src/data/recipes.ts` placeholders. The live DB happens to use the same TEXT ids, so navigation resolves today — but the invariant lives only in data, not code. [audit §2, §4.1]
- **MEDIUM — Only okra has full detail content.** Live rows: `ingredients` 8, `steps` 5, `tips` 2 — all okra. The other 9 recipes open a detail screen with empty tabs (audit §5.2).
- **MEDIUM — Favorites are in-memory only**, with a mock `6` fallback in the empty pill count and a Western numeral in the Favorites count ("1 وصفة مفضلة"), inconsistent with the app-wide Eastern-Arabic numerals. Profile "وصفات بصوت طنط منى" reuses the favorites count; "أكلات مجربة" is hard-coded `0`. [audit §4.5]
- **MEDIUM — Home list is unordered** (`useRecipes` has no `.order()/.limit()`), so the hero/feed are non-deterministic; no Home empty state. [audit §5.3]
- **MEDIUM — Inert controls:** Home/Search filter chips and the Search voice chip have no `onPress`; CookingMode "عيدي تاني" is `() => {}` and the timer label is static `(٠٠:٠٢)`. [audit §3.2, §6.3]
- **HIGH — Android RTL unverified** (configuration is RTL=true with no reload logic; see §0.7). [audit §4.2]
- **HIGH — No tests/lint/CI** (typecheck + manual Web only). [audit §4.4]
- Hygiene/dead code (dead `searchRecipes`/`getRecipeDetail`, unused deps such as `@qoder-ai/qoder-agent-sdk`, committed `package.json.backup-51`, unignored `dist-check/`, three diverging SQL files) — carried forward from the audit; not re-verified line-by-line here.

### 0.7 RTL configuration (VERIFIED on Web / NOT VERIFIED on Android)

- Single source of truth `src/i18n/rtl.ts`: `I18nManager.allowRTL(true)` + `forceRTL(true)` + `swapLeftAndRightInRTL(false)`; Web sets `document.documentElement dir="rtl"`. Call-site `index.js` → before root render.
- **No automatic reload/restart logic exists** (intentionally removed): `Updates.reloadAsync` / `DevSettings.reload` appear only in the explanatory comment, never as calls. This must stay true.
- Web verified: root `dir="rtl"`, image/leading content on the right, tab order Home-rightmost.
- Android: requires a cold device start to confirm the `[rtl] platform=android runtime I18nManager.isRTL=…` log — **NOT VERIFIED**.

### 0.8 Live Supabase posture (for Phase 1) — VERIFIED (anon REST)

- Project: `https://lawoormzqfeyafjrptwc.supabase.co` (anon/publishable key from `app.json expo.extra`).
- **Canonical/live schema = TEXT ids** (samples: `okra`, `molokhia`, `kofta`, `bechamel`, `oxtail`) — matches `src/db/schema.sql` / `src/db/seed.sql`, **not** the UUID variants.
- Tables / columns / exact row counts:
  - `recipes` (10): id, title, subtitle, description, category, minutes, persons, difficulty, rating, audio_available, occasion, category_color, created_at
  - `ingredients` (8): id, recipe_id, text, created_at
  - `steps` (5): id, recipe_id, title, body, image_hint, sort_order, created_at
  - `tips` (2): id, recipe_id, title, body, created_at
  - `audio_urls` (6): id, recipe_id, url, created_at
- **`recipes.audio_url` does NOT exist** (`select=audio_url` → HTTP 400 / `42703`) — audio is the separate `audio_urls` table. **No `image_url` column exists on `recipes`.**
- **RLS/write posture: OFF** (see §0.6).
- Probe method: anon `select` with `Prefer: count=exact`; write authorization tested with a zero-match `PATCH`, a zero-match `DELETE`, and a duplicate-PK `INSERT`. Row counts re-checked after (10/8/5/2/6 — unchanged); probe id absent.

### 0.9 Audio reachability — VERIFIED

- **DB (Home/Detail path):** `https://example.com/audio/{okra,molokhia}.mp3` → **HTTP 404** (`text/html`).
- **Local placeholder path (Search/Favorites data):** `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1..6.mp3` → **HTTP 200**, `audio/mpeg` (6.7–10.2 MB each).
- `useRecipe()` resolves `audioUrl` from the `audio_urls` row first, so the detail dock uses the **unreachable** `example.com` URL for the 6 seeded recipes. Expected to be replaced in Phase 6.

### 0.10 MUST PRESERVE — current UI/geometry facts (Web @390×844, measured)

- **Home header (AppHeader):** `top 0`, height **64**, full width 390; brand right, bell/avatar left (RTL).
- **Floating bottom tab bar:** container `top 782 → bottom 832`, left 20, **351×50**; labels RTL right-to-left: الرئيسية (left 308) · بحث ووصفات (211) · المفضلة (133) · حسابي (49).
- **RecipeCard — feed (Home & Search):** compact horizontal 2-column tile, **172×136** at 390 px (157×136 at 360 px, 138×136 at 320 px); column lefts 202 / 18; row gap 12 (row pitch 148). Image half fills the fixed height; first child (image) on the **right**; content sits inside the card (no clipping).
- **RecipeCard — hero (Home):** **280×461** (vertical, unchanged).
- **RecipeDetail:** back/share button `top 40`, 40×40 at left 334 (right in RTL); hero image **390×293** (3/4).
- **RTL:** Web `dir="rtl"`; native `forceRTL(true)`, `swapLeftAndRightInRTL(false)`, **no reload/restart logic**.
- **Typography:** Cairo loaded; Eastern-Arabic numerals used app-wide (exception noted in §0.6).
- **Architecture invariant:** screens never call Supabase directly — all access via `src/data/queries.ts`; theme/i18n centralized; `src/i18n/rtl.ts` is the only RTL source.

### 0.11 Phase 0 Definition of Done — status

- [ ] Tagged/committed baseline of the exact working state — **NOT DONE by instruction** (commit/tag prohibited). State is captured at `e5a9594`; user may create a tag if desired.
- [x] Written validation checklist with explicit PASS/FAIL results — this record, §0.4.
- [x] Written answers: live schema = **TEXT ids**; RLS = **OFF**; audio = **DB URLs 404, dock sticks loading**; Web RTL = **yes**; Android RTL = **NOT VERIFIED**.
- [x] No source code modified during the phase (only this roadmap record written).
- [ ] User review of this baseline record; explicit approval to start Phase 1 — **pending**.

### 0.12 Limitations of this baseline

- Runtime checks were performed on the **Web target** (react-native-web) via headless Edge/CDP at a mobile viewport; they are strong evidence but not a substitute for a physical Android run.
- Supabase RLS was inferred from anon-role REST responses, not from the Supabase dashboard or SQL editor; the conclusion (writes authorized) is evidence-backed but should be confirmed authoritatively in Phase 1.
- No load/stress, memory, or bundle-size measurements were taken.

---

## Phase 1 — Implementation Record (executed 2026-09-10)

> **Execution note.** Phase 1 was executed against the live Supabase project `lawoormzqfeyafjrptwc` with the service role (MCP). No UI, screens, components, navigation, theme, i18n, hooks, or feature logic were changed. No production rows were created, updated, or deleted (verified — see §1.6). The one schema migration applied is `20260910112513 phase_1_canonical_schema_rls`.

### 1.1 Live-database inventory (source of truth, inspected first)

- Project `lawoormzqfeyafjrptwc` (`https://lawoormzqfeyafjrptwc.supabase.co`), status ACTIVE_HEALTHY. Migrations on record: `20260904111438 phase_7_supabase_schema`, `20260904111545 seed_recipes_data`.
- **The recorded migration statements do not match the live columns** (they declare UUID `recipes.id`/`recipe_id`; the live table uses TEXT). The live catalog therefore proves the checked-in/recorded SQL is not authoritative — live was inspected directly.
- Tables / row counts / id types (unchanged by Phase 1):
  - `recipes` (10): `id TEXT PK`, `recipe_id`-referenced children; no `audio_url`, no `image_url` before Phase 1.
  - `ingredients` (8), `steps` (5), `tips` (2), `audio_urls` (6): `id UUID PK`, `recipe_id TEXT` FK → `recipes(id) ON DELETE CASCADE`.
- Indexes before Phase 1: PKs, `idx_recipes_category`, `idx_recipes_title`/`idx_recipes_description` (GIN, `to_tsvector('arabic', …)`). `pg_ts_config` confirms the `arabic` configuration exists.
- No `pg_policies` rows; **RLS disabled on all five tables**. anon/authenticated held full table grants (SELECT/INSERT/UPDATE/DELETE/…).
- Data integrity: no orphan child `recipe_id`s; exactly one `audio_urls` row per audio recipe.

### 1.2 Final canonical schema decision

- **ID strategy: TEXT slug recipe ids** (`okra`, `molokhia`, …) — matches live, `src/data/recipes.ts`, seed, and all navigation params. Child tables keep **UUID** primary keys (live truth); `recipe_id` is a **TEXT FK** with `ON DELETE CASCADE`.
- `recipes.audio_url` remains **absent**; audio stays in the separate `audio_urls` table (architecture preserved).
- **`image_url TEXT` (nullable) added to `recipes`** per the roadmap/UI model. No URLs were invented; the content track supplies values later. (Mapping into `Recipe.imageUrl` is deferred to Phase 2, as the roadmap specifies.)
- **Deterministic ordering added:** `recipes.sort_order` (curated 1–10, hero `okra` first), plus `sort_order` on `ingredients` and `tips` (steps already had it). Live values were backfilled deterministically without changing content.
- **Uniqueness:** `audio_urls (recipe_id)` unique (supports the current `.single()` access pattern; revisit if Phase 6 adopts per-step audio); `(recipe_id, sort_order)` unique on `ingredients`/`steps`/`tips`.
- Arabic search indexes kept on `to_tsvector('arabic', title|description)` plus the `category` btree (Phase 5 consumes them).

### 1.3 RLS / security result — VERIFIED

- RLS enabled on `recipes`, `ingredients`, `steps`, `tips`, `audio_urls`; one `SELECT` policy per table granted to `anon` (`using (true)`). No write policies exist.
- **Role-switch probes** (`begin; set local role anon; …; rollback;`): `select count(*) from recipes` → **10**; `update recipes … returning 1` → **0 rows**; `delete … returning 1` → **0 rows**; `insert` → **ERROR 42501 (row-level security policy)**.
- **Live REST probes with the anon key** (what the app uses): `GET /rest/v1/recipes` → **200** (ordered rows); `POST /rest/v1/recipes` → **401 / 42501**; `PATCH …?id=eq.okra` → **204, 0 rows**; `DELETE` → **204, 0 rows**. `recipes.id='okra'` title re-read unchanged; no probe rows exist.
- No anon write path remains in any script (`scripts/migrate.js` is service-role-only and has no fallback credentials).

### 1.4 Environment configuration decision

- Client config now comes solely from **`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`** (`src/lib/supabase.ts` + `env.d.ts`). The duplicated `supabaseUrl`/`supabaseAnonKey` were **removed from `app.json` `extra`**.
- `.env` (gitignored) renamed to `EXPO_PUBLIC_*`; committed **`.env.example`** carries placeholders only. Expo confirmed it loads/exports both vars, and the values are inlined into the built bundle.
- A stale **tracked** web export (`dist-check/`) that embedded the superseded `app.json` credentials was untracked (`git rm --cached`; files remain on disk) and added to `.gitignore`. A tracked-file grep for the key material is now clean.
- No service-role or ElevenLabs keys exist client-side. The anon key is public-by-design and safe **only because of the RLS policies above**.

### 1.5 Authoritative files after Phase 1

- **Schema:** `src/db/schema.sql` — the single canonical, idempotent schema (tables, ordering backfill, indexes/constraints, RLS + policies). Safe to re-run on live or fresh.
- **Seed:** `src/db/seed.sql` — the single canonical seed, schema-compatible and idempotent (recipes upsert by `id`; children by `(recipe_id, sort_order)`; `audio_urls` by `recipe_id`). Parsed/validated: 10/79/55/20/6 rows, zero duplicate conflict keys.
- **Superseded files removed:** `src/db/supabase-schema.sql`, `src/db/supabase-full-setup.sql` (history retained in git).
- **Scripts:** `scripts/migrate.js` — service-role-only seeder that reads `src/db/seed.sql`; refuses to run without `SUPABASE_SERVICE_ROLE_KEY`; no hard-coded credentials. DDL is applied from `schema.sql` via the SQL editor/CLI.

### 1.6 Validation results

| Check | Result | Evidence |
|-------|--------|----------|
| `npm run typecheck` | **PASS** | exit 0 |
| App starts with new env | **PASS** | `expo start --web` on :8099 → root 200; Android bundle 200 (6.75 MB) |
| `EXPO_PUBLIC_*` inlined | **PASS** | bundle contains both URL and key |
| anon SELECT (app queries) | **PASS** | recipes 10; okra ingredients 8 / steps 5 / tips 2 / audio 1; molokhia ingredients 0 (no error) |
| anon INSERT / UPDATE / DELETE | **DENIED** | REST 401 (42501) / 204 (0 rows) / 204 (0 rows); SQL role-switch 0 / 0 / 42501 |
| RLS enabled + policies | **PASS** | `pg_tables.rowsecurity=true` ×5; 5 `anon` SELECT policies |
| Row counts unchanged | **PASS** | 10 / 8 / 5 / 2 / 6 before and after |
| Content unchanged | **PASS** | `okra` title identical; no probe rows persisted |
| Deterministic ordering | **PASS** | `recipes.sort_order` 1–10 (okra hero first); okra children ordered 1–8 / 1–2 |
| One schema + one seed | **PASS** | `src/db/` contains only `schema.sql` + `seed.sql` |
| Secrets grep (tracked files) | **PASS** | no publishable/service-role key outside `.env` / `.env.example` |
| UI/geometry/RTL untouched | **PASS** | no screen/component/theme/i18n/navigation files changed |

### 1.7 Unresolved / deferred (later phases)

- **Seed vs. live content divergence:** `seed.sql` preserves the full authored child content (all 10 recipes); the live DB still contains the okra-only child subset (8/5/2). Phase 1 deliberately did **not** apply the seed to production. Applying it later would be additive (idempotent) — a content-track decision, not a Phase 1 requirement. The Release-Gate "seed matches live" item is therefore pending until that decision.
- **`recipes.image_url`** is added but not yet mapped in `mapRecipe`/selects — Phase 2 (per roadmap Task 6).
- **Ingredient/tip ordering** is now backed by `sort_order` and wired in `queries.ts`; full pagination/limit work remains Phase 3.
- **Demo audio:** live/seed URLs are still `https://example.com/audio/*.mp3` placeholders; Phase 6 replaces them with real narration.
- **RLS scope:** policies are `anon`-only (no auth exists). If accounts are added, `authenticated` policies and per-user tables need their own review.
- **`audio_urls` unique index** assumes one narration row per recipe; Phase 6 revisits it if per-step audio is adopted.
- **`dist-check/`** was untracked; the on-disk files were not deleted (local build artifact).

---

## Phase 2 — Implementation Record (executed 2026-09-10)

> **Execution note.** Data-architecture phase only. Supabase is now the single authoritative runtime recipe source for Home, Search, Favorites, and Recipe Detail. No UI was redesigned, no styles/tokens changed, no persistence added, no server search, no audio/cooking/RTL changes, and no Supabase schema changes.

### 2.1 What changed

- **`src/data/queries.ts`** — `mapRecipe` (the single list+detail mapper) now maps `image_url → imageUrl`; `useRecipes` selects `image_url`. Added dev-only (`__DEV__`) integrity checks: catalog ids must be non-empty/unique, and `useRecipe` warns when a navigation id does not resolve. No production UI.
- **`src/screens/SearchScreen.tsx`** — replaced `placeholderRecipes` with the shared `useRecipes()` cache; still filters the loaded set client-side (Phase 5 owns server search). Added loading spinner + error text; empty-message now gated on load completion.
- **`src/screens/FavoritesScreen.tsx`** — resolves stored favorite ids against the shared `useRecipes()` catalog (unknown ids are not rendered); removed the mock `count > 0 ? count : 6` fallback so the pill shows the real set size; added loading spinner + error text.
- **`src/data/recipes.ts`** — removed the dead local detail provider (`getRecipeDetail` + its `fullDetails` block). The file is retained only as a temporary seed/reference dataset and is no longer imported by any screen.

### 2.2 Validation

- Grep: no screen imports `placeholderRecipes`, `getRecipeDetail`, or `../data/recipes`; `searchRecipes` has no callers (reserved for Phase 5). ✅
- `npm run typecheck` → exit 0. ✅
- Web E2E (headless Edge over CDP, 390×844, live Supabase): **15/15 PASS** —
  Home shows 10 DB cards; Home→Detail resolves okra; favorite toggle works; Favorites shows the resolved DB recipe with real count `1` (and `0` when empty — mock `6` gone); Search shows the same 10-card DB catalog; client-side filter (ملوخية → 1) works; Search→Detail resolves; no error states; no console/runtime errors.
- Only the four files above were modified; no visual/style tokens touched.

### 2.3 Remaining / deferred

- Search still filters the full loaded catalog client-side (interim by design; Phase 5 replaces with server FTS).
- Favorites remain in-memory (Phase 4 adds persistence + stale-id pruning + status pills).
- `RecipeCard`'s inline heart toggles favorites but the UI updates are outside this phase's scope.
- `image_url` is mapped but all rows are NULL (content track); cards/detail fall back to placeholders as before.
- `placeholderRecipes` remains an unused export until Phase 9 removes the file.

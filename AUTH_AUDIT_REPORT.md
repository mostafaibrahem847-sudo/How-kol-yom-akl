# Auth Audit Report — هو كل يوم أكل

- **Date:** 2026-09-23
- **Method:** Static review of the client tree + live read-only inspection of the Supabase project
  (`lawoormzqfeyafjrptwc`, "how kol yom akl").
- **Not verified on device:** per the guardian ground rule, auth/RLS behaviour on the phone (Expo Go)
  was **not** tested. The user must confirm the real sign-in / fetch / write flow on a device before
  this audit is treated as final for native.
- **No files were modified** except the creation of this report.

---

## 1. Current architecture

**Client auth provider: Clerk (mounted conditionally, effectively disabled).**

- `package.json` ships `@clerk/expo` `^4.6.8`; `app.json` registers the `@clerk/expo` plugin.
- `src/app/App.tsx:70-87` mounts `ClerkProvider` **only** when
  `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is non-empty, and wires `tokenCache` from
  `@clerk/expo/token-cache` (SecureStore-backed on native).
- The working `.env` currently has `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` **empty**, so
  `ClerkAuthProvider` logs a warning and renders children **without** a provider
  (`src/app/App.tsx:73-80`). Clerk is dark at runtime.

**No auth implementation exists.** There is no `useAuth`/`useUser`/`SignedIn`/`SignedOut`, no
`signIn`/`signUp`/`signOut`, no OAuth callback, and no auth screens anywhere in `src/`. Grep for
Clerk usage returns only the provider in `App.tsx`.

**Backend identity: none.** `src/lib/supabase.ts:13` creates a single client with
`createClient(url, anonKey)` — no `accessToken` callback, no `auth` options, no session/storage
adapter. Supabase Auth is never used: the live project has **0 rows in `auth.users`**.

**Route protection: none.** `src/navigation/RootNavigator.tsx` starts on `Welcome` and exposes
`Tabs` (Home/Search/Favorites/Profile) and `RecipeDetail` to everyone. There is no guard and no
role model. The Welcome "login" control is a navigation shortcut, not a login:
`src/screens/WelcomeScreen.tsx:376-379` (`handleLogin` → `navigation.replace('Tabs',{screen:'Profile'})`).

**User state: device-local only.** Favorites are a Zustand store persisted to `AsyncStorage`
(`src/state/favorites.ts`), never tied to an account and never sent to Supabase.

**Data access: anonymous, read-only by design.** All queries in `src/data/queries.ts` run as the
`anon` role against the public recipe catalog. Live RLS: enabled on all 5 tables, with a single
`SELECT ... using (true)` policy per table granted `to anon` only. No write policies exist, so
writes are denied.

---

## 2. Findings

### 🔴 Critical

1. **Authentication is a facade — there is no auth flow.**
   No sign-in, sign-up, session, sign-out, or gating. The account tab (`ProfileScreen`) is cosmetic
   and shows an avatar letter + local favorite counts. The "تسجيل الدخول" (login) button only
   navigates to Profile. `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is also empty, so even the mounted
   provider is disabled.

2. **No Clerk→Supabase identity bridge.**
   Even if Clerk is enabled, `createClient(url, anonKey)` sends no user JWT, so every Supabase query
   stays in the `anon` role. Clerk users are functionally anonymous to Postgres, so no row can ever
   be scoped to `auth.uid()`. Required for anything per-user.

3. **RLS policies exclude the `authenticated` role (blocks any future auth).**
   Live verification: all 5 policies are `roles = {anon}` with `qual = true`. If a Supabase JWT is
   ever attached (role `authenticated`), **no SELECT policy matches**, so the catalog returns zero
   rows and Home/Search/Detail appear empty. This must be fixed *before* wiring auth.

### 🟠 High

4. **Broad DML grants held by `anon` on every catalog table.**
   Live grants show `anon` has `SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER` on
   `recipes`, `ingredients`, `steps`, `tips`, `audio_urls`. Today RLS (no write policy) denies the
   writes, so this is not currently exploitable — but **RLS is the only barrier**. A single mistaken
   permissive write policy, or a migration that disables RLS, immediately restores public write/delete.

5. **Auth is runtime-dark and unverified on device.**
   Empty Clerk key means no auth at all; and with the key set there are still no screens to exercise.
   Nothing has been validated in Expo Go on a real phone.

6. **Auth/security documentation contradicts the code and live DB.**
   `README.md` §7/§9 still describes credentials in `app.json` `extra`, non-`EXPO_PUBLIC_*` vars, and
   "RLS not yet defined / unverified". Current code uses `EXPO_PUBLIC_*` and the live project has RLS
   enabled with read-only policies. Maintainer-drift risk.

### 🟡 Medium

7. **No per-user data model or ownership policies.**
   Favorites are the only user state and live on-device. There is no `profiles`/`favorites` table and
   no `auth.uid()` ownership policies, so accounts have nothing to attach to.
8. **No Supabase session/token configuration.**
   No native-safe storage adapter, no `autoRefreshToken`, no `detectSessionInUrl: false`. Inert while
   Supabase Auth is unused, required the moment it (or a Clerk JWT bridge) is introduced.
9. **No authorization/role layer.**
   No roles, permissions, or protected routes. Any future admin/moderation must be enforced in RLS,
   never in the client.
10. **`expo-crypto` (optional peer of `@clerk/expo`) is not installed.**
    Some Clerk flows may need it. Verify before enabling Clerk.

### 🟢 Low

11. Favorites persisted in plain `AsyncStorage` (not SecureStore) — fine for recipe IDs, revisit if
    it becomes account-linked.
12. `src/data/queries.ts` uses `console.error('Supabase recipes error:', error)` outside a `__DEV__`
    guard (recipes.ts:61, 163, 237), which can surface raw backend error detail in logs.
13. The `token-cache` import path is only exercised when Clerk mounts; validate it on both web and
    native once a key is configured.
14. No rate-limiting/abuse controls — irrelevant today (no auth endpoints in use).

---

## 3. Security risks (summary)

| Risk | Severity | Status |
|---|---|---|
| No authentication / no user isolation | Critical | Design gap — no user data exists yet |
| Clerk-keyed users still anonymous to Supabase | Critical | Would silently fail per-user features |
| `authenticated` role has zero read policy | Critical | Latent — breaks app the moment auth is added |
| `anon` holds full DML grants (RLS-only guard) | High | Present in live DB |
| Stale security docs vs. reality | High | Present |
| Public catalog reads | — | **Intentional and correct** (catalog is non-sensitive) |
| Service-role key in client | — | **Clean**: only used by `scripts/*.js` (Node, not shipped) |

The recipe catalog is public-by-design and its public read is acceptable. The danger is purely
**latent**: the entire stack is safe only while there is no user data. Adding accounts without
per-user RLS and a real identity bridge would expose or orphan user data.

---

## 4. Recommended fixes

**Decision required first (one question):** `plan.md:34` says the backend is **Supabase Auth**, while
the code ships **Clerk**. Pick one path:

- **Option A — Supabase Auth:** remove `@clerk/expo`; use `supabase.auth.*`; add an AsyncStorage/
  SecureStore adapter; set `detectSessionInUrl: false` on native; enable `autoRefreshToken`.
- **Option B — Clerk + Supabase third-party auth:** register Clerk as a Supabase third-party auth
  provider, then pass the Clerk JWT to Supabase via an async `accessToken` callback
  (`getToken({ template: 'supabase' })`).

Independently of the choice:

**1. Make catalog read policies cover both roles** (fixes Critical #3):

```sql
drop policy if exists recipes_public_read on public.recipes;
create policy recipes_public_read on public.recipes
  for select to anon, authenticated using (true);
-- repeat verbatim for public.ingredients, public.steps, public.tips, public.audio_urls
```

**2. Revoke DML grants from `anon`** (defense-in-depth, fixes High #4):

```sql
revoke insert, update, delete, truncate, references, trigger
  on public.recipes, public.ingredients, public.steps, public.tips, public.audio_urls
  from anon;
```

**3. If favorites become per-user, add an owned table + policies:**

```sql
create table if not exists public.favorites (
  user_id   uuid not null references auth.users(id) on delete cascade,
  recipe_id text not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);
alter table public.favorites enable row level security;
create policy favorites_select_own on public.favorites
  for select to authenticated using (auth.uid() = user_id);
create policy favorites_insert_own on public.favorites
  for insert to authenticated with check (auth.uid() = user_id);
create policy favorites_delete_own on public.favorites
  for delete to authenticated using (auth.uid() = user_id);
```

**4. Build the actual auth surface:** sign-in/sign-up/sign-out screens, a session-aware route guard
(`SignedIn`/`SignedOut` or `useAuth`), and replace the Welcome login shortcut with a real route.

**5. Bridge identity to Supabase** (Option A or B above) so Postgres sees the user, then scope
per-user queries to `auth.uid()` — never to a client-supplied `user_id`.

**6. Fix the docs:** update `README.md` §7/§9 to match the `EXPO_PUBLIC_*` reality and the verified
RLS state.

**7. Verify on the phone (required):** with a real key configured, in Expo Go — sign in, load the
catalog, add/remove a favorite, sign out, sign back in. Confirm the authenticated user sees exactly
the right rows and that a signed-out user cannot read another user's data.

---

## 5. Files involved

| File | Role in auth |
|---|---|
| `src/lib/supabase.ts` | Single anon client; **no Clerk/token bridge, no auth options** |
| `src/app/App.tsx` | Conditional `ClerkProvider` + `tokenCache` (lines 70-87) |
| `src/navigation/RootNavigator.tsx` | No route guard; all screens public |
| `src/screens/WelcomeScreen.tsx` | Fake login → `Tabs/Profile` (lines 376-379) |
| `src/screens/ProfileScreen.tsx` | Cosmetic account UI; local fake stats |
| `src/screens/FavoritesScreen.tsx`, `src/state/favorites.ts` | Only user state; device-local, no identity |
| `src/data/queries.ts` | All Supabase reads run as `anon` |
| `src/db/schema.sql` | RLS: 5 `anon`-only `SELECT` policies; no writes |
| `.env`, `.env.example`, `env.d.ts` | `EXPO_PUBLIC_*` typing; Clerk key currently empty |
| `app.json` | `@clerk/expo` plugin, `expo-secure-store` |
| `package.json` | `@clerk/expo 4.6.8`; `expo-crypto` peer missing |
| `scripts/migrate.js`, `scripts/seed-from-recipe-md.js` | Service-role only (server-side, not shipped) |
| `README.md` | Stale auth/env/RLS documentation |
| `plan.md`, `audit/roadmap.md`, `audit/audit.md` | Stated intent (`plan.md` → Supabase Auth; roadmap line 1032 already flags `anon`-only RLS) |
| Live project `lawoormzqfeyafjrptwc` | RLS enabled ×5, anon-only SELECT policies, `auth.users = 0`, no storage buckets |

---

**Bottom line:** the app has **no working authentication**. Clerk is scaffolding with an empty key;
Supabase is anonymous read-only; favourites are device-local. Nothing is currently leaking user data
because no user data exists server-side — but the moment accounts are added, the three Critical items
(no flow, no identity bridge, `authenticated` role with no read policy) must be fixed together, or
users will either see an empty catalog or have no data isolation.

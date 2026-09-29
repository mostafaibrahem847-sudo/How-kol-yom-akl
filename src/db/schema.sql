-- ============================================================================
-- هو كل يوم أكل — Canonical Supabase schema (Phase 1 — Backend Foundation)
-- ============================================================================
-- This is the SINGLE authoritative schema for the project. It is idempotent and
-- safe to run repeatedly against both the live project and a fresh database.
--
-- Decisions reconciled against the live project (lawoormzqfeyafjrptwc) on
-- 2026-09-10:
--   * recipes.id is TEXT — stable, human-readable slug ids ('molokhia',
--     'koshari', ...). Child tables keep UUID primary keys; recipe_id is a TEXT FK.
--   * recipes.audio_url does NOT exist. Narration lives in the separate
--     audio_urls table (one row per recipe today; see the unique index below).
--   * image_url is added here (nullable). The UI and the Recipe type already
--     model it; the content track populates values later. No URLs are invented.
--   * Deterministic ordering: recipes.sort_order plus sort_order on every child
--     table (steps already had it). Values are curated/backfilled below.
--   * Arabic full-text GIN indexes use the 'arabic' text-search configuration.
--
-- Security: RLS is enabled on all five application tables with SELECT-only
-- policies for the anonymous role. Writes require the service role (local
-- tooling / future edge functions) and never the anon key. The anon key is
-- public by design and safe ONLY because of these policies.
--
-- Apply with the service role (Supabase SQL editor or `supabase db`).
-- ============================================================================

-- ── Tables ──────────────────────────────────────────────────────────────────

create table if not exists public.recipes (
  id text primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  description text not null,
  image_url text,
  category text not null,
  minutes integer,
  persons integer,
  difficulty text,
  rating numeric,
  audio_available boolean default false,
  occasion text,
  category_color text,
  sort_order integer,
  created_at timestamptz default now()
);

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id text references public.recipes(id) on delete cascade,
  text text not null,
  sort_order integer,
  created_at timestamptz default now()
);

create table if not exists public.steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id text references public.recipes(id) on delete cascade,
  title text not null,
  body text not null,
  image_hint text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.tips (
  id uuid primary key default gen_random_uuid(),
  recipe_id text references public.recipes(id) on delete cascade,
  title text not null,
  body text not null,
  sort_order integer,
  created_at timestamptz default now()
);

create table if not exists public.audio_urls (
  id uuid primary key default gen_random_uuid(),
  recipe_id text references public.recipes(id) on delete cascade,
  url text not null,
  created_at timestamptz default now()
);

-- ── Bring pre-existing tables up to the canonical shape ─────────────────────
-- (no-ops on a fresh database created above)

alter table public.recipes     add column if not exists image_url text;
alter table public.recipes     add column if not exists sort_order integer;
alter table public.ingredients add column if not exists sort_order integer;
alter table public.tips        add column if not exists sort_order integer;
alter table public.steps       add column if not exists sort_order integer default 0;

-- ── Deterministic ordering backfill (idempotent, content-preserving) ────────

-- Recipe list order: curated, hero first. Any id outside the known set sorts
-- after it using a stable (created_at, id) rank.
update public.recipes r
set sort_order = s.ord
from (
  select r2.id,
         coalesce(v.ord, 100 + row_number() over (order by r2.created_at, r2.id))::int as ord
  from public.recipes r2
  left join (values
    ('molokhia', 2), ('kofta', 3), ('bechamel', 4), ('oxtail', 5),
    ('koshary', 6), ('potatoChicken', 7), ('omAli', 8), ('chickenPotato', 9),
    ('hawawshi', 10)
  ) as v(id, ord) on v.id = r2.id
) s
where r.id = s.id
  and r.sort_order is distinct from s.ord;

-- Generic fallback: any remaining null child positions get a stable per-recipe
-- rank so ordering never depends on random UUID values.
update public.ingredients i
set sort_order = s.rn
from (
  select id, row_number() over (partition by recipe_id order by created_at, id)::int as rn
  from public.ingredients where sort_order is null
) s
where i.id = s.id;

update public.tips t
set sort_order = s.rn
from (
  select id, row_number() over (partition by recipe_id order by created_at, id)::int as rn
  from public.tips where sort_order is null
) s
where t.id = s.id;

update public.steps s
set sort_order = x.rn
from (
  select id, row_number() over (partition by recipe_id order by created_at, id)::int as rn
  from public.steps where sort_order is null
) x
where s.id = x.id;

-- ── Indexes & constraints ───────────────────────────────────────────────────

create index if not exists idx_recipes_category
  on public.recipes (category);
create index if not exists idx_recipes_sort_order
  on public.recipes (sort_order);
create index if not exists idx_recipes_title
  on public.recipes using gin (to_tsvector('arabic', title));
create index if not exists idx_recipes_description
  on public.recipes using gin (to_tsvector('arabic', description));

-- One narration row per recipe while the app resolves audio via .single().
-- If Phase 6 adopts per-step audio this index is revisited (see roadmap).
create unique index if not exists audio_urls_recipe_id_key
  on public.audio_urls (recipe_id);

-- Ordered child records are unique within their recipe.
create unique index if not exists ingredients_recipe_order_key
  on public.ingredients (recipe_id, sort_order);
create unique index if not exists steps_recipe_order_key
  on public.steps (recipe_id, sort_order);
create unique index if not exists tips_recipe_order_key
  on public.tips (recipe_id, sort_order);

-- ── Row-Level Security ──────────────────────────────────────────────────────
-- Anonymous (anon key) = read-only on the recipe catalog. No write policies
-- exist, so INSERT/UPDATE/DELETE are denied. Writes require the service role.

alter table public.recipes     enable row level security;
alter table public.ingredients enable row level security;
alter table public.steps       enable row level security;
alter table public.tips        enable row level security;
alter table public.audio_urls  enable row level security;

drop policy if exists recipes_public_read     on public.recipes;
drop policy if exists ingredients_public_read on public.ingredients;
drop policy if exists steps_public_read       on public.steps;
drop policy if exists tips_public_read        on public.tips;
drop policy if exists audio_urls_public_read  on public.audio_urls;

create policy recipes_public_read
  on public.recipes for select to anon using (true);
create policy ingredients_public_read
  on public.ingredients for select to anon using (true);
create policy steps_public_read
  on public.steps for select to anon using (true);
create policy tips_public_read
  on public.tips for select to anon using (true);
create policy audio_urls_public_read
  on public.audio_urls for select to anon using (true);

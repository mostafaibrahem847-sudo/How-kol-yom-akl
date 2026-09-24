import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Recipe, RecipeDetail } from '../types/recipe';

// Helper mapper for Recipe object — the single mapping used by list and detail.
const mapRecipe = (r: any): Recipe => ({
  id: r.id,
  title: r.title,
  subtitle: r.subtitle ?? undefined,
  description: r.description,
  imageUrl: r.image_url ?? undefined,
  category: r.category,
  minutes: r.minutes ?? 30,
  persons: r.persons ?? 4,
  difficulty: r.difficulty ?? 'سهلة',
  rating: r.rating ?? undefined,
  audioAvailable: r.audio_available ?? false,
  occasion: r.occasion ?? undefined,
  categoryColor: r.category_color ?? 'olive',
});

// Dev-only integrity check: recipe ids are the navigation keys for every
// surface (Home/Search/Favorites → RecipeDetail), so they must be non-empty and
// unique within the loaded catalog. Never rendered in the UI.
const assertCatalogIds = (recipes: Recipe[]) => {
  if (!__DEV__) return;
  const seen = new Set<string>();
  for (const recipe of recipes) {
    if (!recipe.id) {
      console.warn('[data] recipe loaded without an id', recipe);
      continue;
    }
    if (seen.has(recipe.id)) {
      console.warn('[data] duplicate recipe id in catalog:', recipe.id);
    }
    seen.add(recipe.id);
  }
};

// ─── Recipes list ──────────────────────────────────────────────────────────────

// Upper bound for the list query. The catalog is ~10 rows today and targets
// 50–100; a plain limit keeps the query bounded without inventing pagination
// (Phase 9 owns broader list performance work).
const RECIPES_LIST_LIMIT = 100;

// Recipes whose ingredients/steps are not authored yet would open an empty
// details screen. The embedded `!inner` join drops any recipe with zero
// ingredients at the source, so Home, Search, Favorites and the category chips
// stay consistent — and the recipe reappears automatically as soon as its
// ingredients are added. Rows and audio are never deleted.
const RECIPE_IDENTITY_COLUMNS =
  'id, title, subtitle, description, image_url, category, minutes, persons, difficulty, rating, audio_available, occasion, category_color';

const RECIPE_LIST_COLUMNS = `${RECIPE_IDENTITY_COLUMNS}, ingredients!inner(id)`;

export const useRecipes = () =>
  useQuery<Recipe[]>({
    queryKey: ['recipes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select(RECIPE_LIST_COLUMNS)
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true })
        .limit(RECIPES_LIST_LIMIT);

      if (error) {
        console.error('Supabase recipes error:', error);
        throw error;
      }

      const recipes = (data ?? []).map(mapRecipe);
      assertCatalogIds(recipes);
      return recipes;
    },
  });

// ─── Recipe detail ─────────────────────────────────────────────────────────────

export const useRecipe = (id: string) =>
  useQuery<RecipeDetail | null>({
    queryKey: ['recipe', id],
    queryFn: async () => {
      // One embedded request: the recipe, its ordered children, and the
      // narration URL. Embedded reads rely on the Phase 1 SELECT policies on
      // every table; a missing policy would silently drop child rows.
      const { data, error } = await supabase
        .from('recipes')
        .select(
          'id, title, subtitle, description, image_url, category, category_color, minutes, persons, difficulty, rating, audio_available, occasion, ingredients(id, text), steps(id, title, body, image_hint), tips(id, title, body), audio_urls(url)'
        )
        .eq('id', id)
        .order('sort_order', { referencedTable: 'ingredients', ascending: true })
        .order('sort_order', { referencedTable: 'steps', ascending: true })
        .order('sort_order', { referencedTable: 'tips', ascending: true })
        .single();

      if (error) {
        // PGRST116 = no row for this id → the recipe simply does not exist.
        // Anything else is a real query failure and is surfaced to the screen.
        if (error.code === 'PGRST116') {
          if (__DEV__) {
            console.warn(`[nav] RecipeDetail id "${id}" did not resolve in the Supabase catalog`);
          }
          // React Query v5 rejects `undefined` as query data, so a missing
          // recipe resolves to `null` (distinct from a thrown query error).
          return null;
        }
        throw error;
      }

      const r: any = data;
      if (!r) return null;

      return {
        ...mapRecipe(r),
        ingredients: (r.ingredients ?? []).map((i: any) => ({ id: i.id, text: i.text })),
        steps: (r.steps ?? []).map((s: any) => ({
          id: s.id,
          title: s.title,
          body: s.body,
          imageHint: s.image_hint ?? undefined,
        })),
        tips: (r.tips ?? []).map((tp: any) => ({ id: tp.id, title: tp.title, body: tp.body })),
        audioUrl: r.audio_urls?.[0]?.url ?? undefined,
      };
    },
    enabled: Boolean(id),
  });

// ─── Search recipes ────────────────────────────────────────────────────────────

// Search/filter strategy (Phase 5 decision, backed by a live-DB probe): bounded
// per-column ILIKE. The Arabic GIN FTS indexes from Phase 1 were probed against
// the real catalog and matched ZERO rows for every tested term — exact dish
// names included (كشري, بامية, ملوخية) — so Postgres' 'arabic' FTS config is
// unusable for this colloquial content without a schema/RPC change, which this
// phase forbids. ILIKE substring matching handles what recipe search actually
// needs (ملوخ → ملوخية, شاميل → بشاميل). Every query below is bounded by
// order + RECIPES_LIST_LIMIT; user input is escaped before reaching a filter.
export async function searchRecipes(query: string, category?: string | null): Promise<Recipe[]> {
  const trimmed = query.trim();
  const activeCategory = category?.trim() || null;
  if (!trimmed && !activeCategory) return [];

  // Escape Postgres LIKE/ILIKE wildcards (default escape char is backslash) so
  // user input is matched literally instead of acting as a search pattern.
  const pattern = trimmed ? `%${trimmed.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%` : null;

  const cols = RECIPE_LIST_COLUMNS;

  // Parameterized per-column filters (no user string interpolated into a raw
  // .or() filter). With a search term, three parallel queries keep OR semantics
  // across title/description/category; results are deduped by id below.
  const searchQuery = (ilikeColumn?: 'title' | 'description' | 'category') => {
    let q = supabase.from('recipes').select(cols);
    if (activeCategory) q = q.eq('category', activeCategory);
    if (pattern && ilikeColumn) q = q.ilike(ilikeColumn, pattern);
    return q
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })
      .limit(RECIPES_LIST_LIMIT);
  };

  if (!pattern) {
    // Category-only filter: one bounded server-side query.
    const { data, error } = await searchQuery();
    if (error) {
      console.error('Supabase category filter error:', error);
      throw error;
    }
    const recipes = (data ?? []).map(mapRecipe);
    assertCatalogIds(recipes);
    return recipes;
  }

  const [byTitle, byDescription, byCategory] = await Promise.all([
    searchQuery('title'),
    searchQuery('description'),
    searchQuery('category'),
  ]);

  for (const res of [byTitle, byDescription, byCategory]) {
    if (res.error) {
      console.error('Supabase search error:', res.error);
      throw res.error;
    }
  }

  const seen = new Set<string>();
  const rows: any[] = [];
  for (const res of [byTitle, byDescription, byCategory]) {
    for (const row of res.data ?? []) {
      if (!seen.has(row.id)) {
        seen.add(row.id);
        rows.push(row);
      }
    }
  }

  const recipes = rows.map(mapRecipe);
  assertCatalogIds(recipes);
  return recipes;
}

// ─── Server-side search hook ───────────────────────────────────────────────────

// Search/filter results for the Search screen. Disabled while there is nothing
// to filter by: the empty-search state reuses the shared ['recipes'] catalog
// cache instead, so no request fires for the idle screen and no catalog copy is
// downloaded just to filter it. Distinct term/category combinations get distinct
// keys; React Query keys also neutralize out-of-order responses (a stale result
// can never overwrite a newer term's cache entry).
export const useRecipeSearch = (
  query: string,
  category: string | null,
  options?: { enabled?: boolean },
) =>
  useQuery<Recipe[]>({
    queryKey: ['recipes', 'search', { q: query.trim(), category: category ?? 'all' }],
    queryFn: () => searchRecipes(query, category),
    enabled: options?.enabled ?? true,
  });

// ─── Recipe categories ─────────────────────────────────────────────────────────

// Distinct canonical category values for the Search filter chips — derived from
// the recipes table itself, not a hard-coded list. Only the single category
// column is fetched (a metadata query, not a catalog download), ordered by the
// catalog's curated sort_order so the chip row is stable.
export const useRecipeCategories = () =>
  useQuery<string[]>({
    queryKey: ['recipe-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('category, ingredients!inner(id)')
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true })
        .limit(RECIPES_LIST_LIMIT);

      if (error) {
        console.error('Supabase categories error:', error);
        throw error;
      }

      const seen = new Set<string>();
      const categories: string[] = [];
      for (const row of data ?? []) {
        const category = (row as { category?: string | null }).category?.trim();
        if (category && !seen.has(category)) {
          seen.add(category);
          categories.push(category);
        }
      }
      return categories;
    },
  });

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

export const useRecipes = () =>
  useQuery<Recipe[]>({
    queryKey: ['recipes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select(
          'id, title, subtitle, description, image_url, category, minutes, persons, difficulty, rating, audio_available, occasion, category_color'
        )
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

export async function searchRecipes(query: string): Promise<Recipe[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Escape Postgres LIKE/ILIKE wildcards (default escape char is backslash) so
  // user input is matched literally instead of acting as a search pattern.
  const escaped = trimmed.replace(/[\\%_]/g, (ch) => `\\${ch}`);
  const pattern = `%${escaped}%`;

  const cols =
    'id, title, subtitle, description, category, minutes, persons, difficulty, rating, audio_available, occasion, category_color';

  // Parameterized per-column ILIKE filters (no user string interpolated into a
  // raw .or() filter). Three parallel queries keep OR semantics: title matches
  // first, then description, then category; results are deduped by id.
  const [byTitle, byDescription, byCategory] = await Promise.all([
    supabase.from('recipes').select(cols).ilike('title', pattern),
    supabase.from('recipes').select(cols).ilike('description', pattern),
    supabase.from('recipes').select(cols).ilike('category', pattern),
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

  return rows.map(mapRecipe);
}

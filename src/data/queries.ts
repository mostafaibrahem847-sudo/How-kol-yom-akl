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

// Safety cap, not a real pagination limit: the live catalog is at 100 recipes
// today. Add proper pagination before the catalog approaches this number.
const RECIPES_LIST_LIMIT = 500;

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
        if (__DEV__) {
          console.error('Supabase recipes error:', error);
        }
        throw error;
      }

      const recipes = (data ?? []).map(mapRecipe);
      assertCatalogIds(recipes);
      return recipes;
    },
  });

// ─── Recipes filtered by cuisine ────────────────────────────────────────────────

// Same bounded list shape as useRecipes(), narrowed server-side to one cuisine
// value. Disabled while no cuisine is selected, so the idle Home screen keeps
// serving the shared ['recipes'] catalog cache with no extra request.
export const useRecipesByCuisine = (cuisine: string | null) =>
  useQuery<Recipe[]>({
    queryKey: ['recipes', 'cuisine', cuisine ?? 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select(RECIPE_LIST_COLUMNS)
        .eq('cuisine', cuisine)
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true })
        .limit(RECIPES_LIST_LIMIT);

      if (error) {
        if (__DEV__) {
          console.error('Supabase cuisine filter error:', error);
        }
        throw error;
      }

      const recipes = (data ?? []).map(mapRecipe);
      assertCatalogIds(recipes);
      return recipes;
    },
    enabled: cuisine !== null,
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

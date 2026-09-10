import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Recipe, RecipeDetail } from '../types/recipe';

// Helper mapper for Recipe object
const mapRecipe = (r: any): Recipe => ({
  id: r.id,
  title: r.title,
  subtitle: r.subtitle ?? undefined,
  description: r.description,
  category: r.category,
  minutes: r.minutes ?? 30,
  persons: r.persons ?? 4,
  difficulty: r.difficulty ?? 'سهلة',
  rating: r.rating ?? undefined,
  audioAvailable: r.audio_available ?? false,
  audioUrl: r.audio_url ?? undefined,
  occasion: r.occasion ?? undefined,
  categoryColor: r.category_color ?? 'olive',
});

// ─── Recipes list ──────────────────────────────────────────────────────────────

export const useRecipes = () =>
  useQuery<Recipe[]>({
    queryKey: ['recipes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select(
          'id, title, subtitle, description, category, minutes, persons, difficulty, rating, audio_available, occasion, category_color'
        )
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true });

      if (error) {
        console.error('Supabase recipes error:', error);
        throw error;
      }

      return (data ?? []).map(mapRecipe);
    },
  });

// ─── Recipe detail ─────────────────────────────────────────────────────────────

export const useRecipe = (id: string) =>
  useQuery<RecipeDetail | undefined>({
    queryKey: ['recipe', id],
    queryFn: async () => {
      const [recipeRes, ingredientsRes, stepsRes, tipsRes, audioRes] = await Promise.all([
        supabase.from('recipes').select('*').eq('id', id).single(),
        supabase.from('ingredients').select('*').eq('recipe_id', id).order('sort_order'),
        supabase.from('steps').select('*').eq('recipe_id', id).order('sort_order'),
        supabase.from('tips').select('*').eq('recipe_id', id).order('sort_order'),
        supabase.from('audio_urls').select('url').eq('recipe_id', id).single(),
      ]);

      if (recipeRes.error || !recipeRes.data) return undefined;

      const r = recipeRes.data;
      const mappedBase = mapRecipe(r);

      return {
        ...mappedBase,
        ingredients: (ingredientsRes.data ?? []).map((i) => ({ id: i.id, text: i.text })),
        steps: (stepsRes.data ?? []).map((s) => ({
          id: s.id,
          title: s.title,
          body: s.body,
          imageHint: s.image_hint ?? undefined,
        })),
        tips: (tipsRes.data ?? []).map((t) => ({ id: t.id, title: t.title, body: t.body })),
        audioUrl: audioRes.data?.url ?? mappedBase.audioUrl ?? undefined,
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

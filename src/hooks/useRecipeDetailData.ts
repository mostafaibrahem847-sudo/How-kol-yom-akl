import { useCallback } from 'react';
import { useRecipe } from '../data/queries';
import { useFavorites } from '../state/favorites';
import { useAudioPlayerHook } from './useAudioPlayer';
import { hasRealAudio } from '../lib/audio';

// Data + shared action layer for the recipe detail screen. Keeps the fetch,
// the device-local favorite flag and the one narration player in a single
// hook so the screen can stay a thin composition of section components.
//
// Note: useAudioPlayerHook is called unconditionally here, before the screen's
// early returns, so its position in the hook order never changes.
export function useRecipeDetailData(id: string) {
  const { data: recipe, isLoading, isError, refetch } = useRecipe(id);
  const { has, toggle } = useFavorites();
  const audio = useAudioPlayerHook(recipe?.audioUrl);

  const isFav = recipe ? has(recipe.id) : false;
  const showAudio = recipe ? hasRealAudio(recipe.audioUrl) : false;

  const toggleFavorite = useCallback(() => {
    if (recipe) toggle(recipe.id);
  }, [recipe, toggle]);

  return { recipe, isLoading, isError, refetch, isFav, toggleFavorite, showAudio, audio };
}

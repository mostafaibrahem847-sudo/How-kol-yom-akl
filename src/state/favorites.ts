import { create } from 'zustand';

type FavoritesState = {
  favorites: Set<string>;
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  hydrate: (ids: string[]) => void;
};

export const useFavorites = create<FavoritesState>((set, get) => ({
  favorites: new Set<string>(),
  toggle: (id) =>
    set((s) => {
      const next = new Set(s.favorites);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { favorites: next };
    }),
  has: (id) => get().favorites.has(id),
  hydrate: (ids) => set({ favorites: new Set(ids) }),
}));

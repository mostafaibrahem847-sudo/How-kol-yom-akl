import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'howa-kol-yom-akl.favorites.v1';

// Wrap AsyncStorage so a failed write/remove is logged (dev only) and swallowed
// instead of surfacing as an unhandled rejection. The in-memory Set is the
// source of truth; a failed persist must never break the UI. Reads are left
// uncaught so the persist middleware's rehydration error path handles them.
const resilientStorage: StateStorage = {
  getItem: (name) => AsyncStorage.getItem(name),
  setItem: (name, value) => {
    try {
      return AsyncStorage.setItem(name, value).catch((e: unknown) => {
        if (__DEV__) console.warn('[favorites] failed to persist favorites', e);
      });
    } catch (e) {
      if (__DEV__) console.warn('[favorites] failed to persist favorites', e);
      return undefined;
    }
  },
  removeItem: (name) => {
    try {
      return AsyncStorage.removeItem(name).catch(() => {});
    } catch {
      return undefined;
    }
  },
};

// Persisted shape is intentionally minimal: recipe ids only (never whole recipe
// objects). The in-memory Set is the single runtime source of truth; the array
// is only the JSON-safe on-disk representation.
type PersistedFavorites = { favorites: string[] };

type FavoritesState = {
  favorites: Set<string>;
  /** True once the persisted snapshot has been merged (or a failed read was
   *  recovered from). Lets consumers wait out the async hydration window. */
  hydrated: boolean;
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  /** Drop ids that are not in the authoritative remote catalog. Safe no-op
   *  when nothing changed. */
  pruneStale: (validIds: ReadonlySet<string>) => void;
};

// Race guard for the async hydration window: if the user toggles a favorite
// before the persisted snapshot is read, the in-memory state must win.
// Because favorites start empty, an early toggle can only ADD ids, so the
// merge below unions the persisted set with the early additions instead of
// letting the persisted snapshot clobber the user's action.
let mutatedBeforeHydration = false;

// Recover safely from anything that is not a clean array of non-empty string
// ids (missing key, wrong type, junk entries, over-long values). Never throws.
function normalizeFavorites(raw: unknown): Set<string> {
  const ids = new Set<string>();
  if (!Array.isArray(raw)) return ids;
  for (const item of raw) {
    if (typeof item === 'string' && item.length > 0 && item.length <= 200) {
      ids.add(item);
    }
  }
  return ids;
}

export const useFavorites = create<FavoritesState>()(
  persist<FavoritesState, [], [], PersistedFavorites>(
    (set, get) => ({
      favorites: new Set<string>(),
      hydrated: false,

      toggle: (id) => {
        mutatedBeforeHydration = true;
        set((s) => {
          const next = new Set(s.favorites);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return { favorites: next };
        });
      },

      has: (id) => get().favorites.has(id),

      pruneStale: (validIds) => {
        const next = new Set<string>();
        let changed = false;
        for (const id of get().favorites) {
          if (validIds.has(id)) next.add(id);
          else changed = true;
        }
        if (changed) set({ favorites: next });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage<PersistedFavorites>(() => resilientStorage),
      partialize: (state) => ({ favorites: Array.from(state.favorites) }),
      merge: (persistedState, currentState) => {
        const persistedFavorites = normalizeFavorites(
          (persistedState as Partial<PersistedFavorites> | undefined)?.favorites,
        );
        const favorites = mutatedBeforeHydration
          ? new Set<string>([...persistedFavorites, ...currentState.favorites])
          : persistedFavorites;
        return { ...currentState, favorites, hydrated: true };
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          // Missing / unreadable / corrupted local storage: continue with an
          // empty favorites set rather than crashing. Technical detail stays
          // in the console; nothing is surfaced to the user.
          if (__DEV__) {
            console.warn('[favorites] hydration failed; starting with an empty favorites set', error);
          }
        }
      },
    },
  ),
);

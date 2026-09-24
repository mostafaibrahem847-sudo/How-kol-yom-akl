import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'howa-kol-yom-akl.view-mode.v1';

export type RecipeViewMode = 'list' | 'grid';

// Same resilient storage wrapper used by the favorites store: a failed
// write/remove is logged in dev and swallowed, so a broken storage backend can
// never crash the UI. The in-memory mode is the source of truth.
const resilientStorage: StateStorage = {
  getItem: (name) => AsyncStorage.getItem(name),
  setItem: (name, value) => {
    try {
      return AsyncStorage.setItem(name, value).catch((e: unknown) => {
        if (__DEV__) console.warn('[viewMode] failed to persist view mode', e);
      });
    } catch (e) {
      if (__DEV__) console.warn('[viewMode] failed to persist view mode', e);
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

type PersistedViewMode = { mode: RecipeViewMode };

type ViewModeState = {
  mode: RecipeViewMode;
  setMode: (mode: RecipeViewMode) => void;
};

// Anything that is not a clean 'grid' resolves to the default list view, so
// corrupted or future storage values can never put the UI in a bad state.
const normalizeMode = (raw: unknown): RecipeViewMode => (raw === 'grid' ? 'grid' : 'list');

export const useViewMode = create<ViewModeState>()(
  persist<ViewModeState, [], [], PersistedViewMode>(
    (set) => ({
      mode: 'list',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage<PersistedViewMode>(() => resilientStorage),
      partialize: (state) => ({ mode: state.mode }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        mode: normalizeMode((persistedState as Partial<PersistedViewMode> | undefined)?.mode),
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error && __DEV__) {
          console.warn('[viewMode] hydration failed; defaulting to list view', error);
        }
      },
    },
  ),
);

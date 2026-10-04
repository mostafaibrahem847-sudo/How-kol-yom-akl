import AsyncStorage from '@react-native-async-storage/async-storage';

// Remembers which recipe the featured card showed last launch, so the next cold
// start can avoid repeating it.
export const LAST_HERO_KEY = 'howa-kol-yom-akl.last-hero.v1';

// Chosen once per cold start. Module scope (not component state) so navigating
// away and back to Home — which remounts the screen — keeps the same pick for
// the whole session instead of re-rolling.
let sessionHeroId: string | null = null;

export function getSessionHeroId(): string | null {
  return sessionHeroId;
}

export function setSessionHeroId(id: string | null): void {
  sessionHeroId = id;
}

// Pure random pick. Avoids lastId whenever there is more than one candidate so
// consecutive launches differ; with a single candidate (or no other option) it
// returns that candidate. Returns null for an empty list.
export function pickHeroId(candidateIds: string[], lastId: string | null): string | null {
  if (candidateIds.length === 0) return null;

  const pool =
    candidateIds.length > 1 && lastId
      ? candidateIds.filter((id) => id !== lastId)
      : candidateIds;
  const options = pool.length > 0 ? pool : candidateIds;

  return options[Math.floor(Math.random() * options.length)] ?? null;
}

// Storage failures never throw: a failed read yields null (plain random pick)
// and a failed write is swallowed.
export async function readLastHeroId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_HERO_KEY);
  } catch (e) {
    if (__DEV__) console.warn('[hero] read last id failed', e);
    return null;
  }
}

export async function writeLastHeroId(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_HERO_KEY, id);
  } catch (e) {
    if (__DEV__) console.warn('[hero] write last id failed', e);
  }
}

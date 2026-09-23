import { DevSettings, I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';

/**
 * App-wide layout direction — the single source of truth for RTL in this app.
 *
 * This is an Arabic app whose design reference is genuine right-to-left (the
 * stitch-screen mockups are authored with dir="rtl"): brand starts on the
 * right, primary navigation sits on the right, and content reads from right to
 * left. Web and Native must therefore resolve to the SAME direction.
 *
 * The problem this file solves: Web is mirrored by react-native-web through
 * `dir="rtl"`, while Native mirrors through `I18nManager`. `forceRTL()` only
 * writes the preference — the *running* JS surface keeps its original
 * `isRTL` until a new native surface is created. Without recreating it, native
 * stayed LTR while web was RTL, which mirrored the whole Welcome composition.
 *
 * The fix is one shared resolution path:
 *   - Web: set the document direction (react-native-web mirrors from it).
 *   - Native: force RTL and recreate the surface exactly ONCE per install,
 *     guarded by persistent storage so a host that refuses the preference can
 *     never cause a reload loop.
 */
export const APP_LAYOUT_DIRECTION = 'rtl' as const;
export const APP_IS_RTL = APP_LAYOUT_DIRECTION === 'rtl';

const RTL_RELOAD_FLAG = 'howa-kol-yom-akl.rtl-reload-attempted.v1';

/**
 * Apply the app-wide layout direction. Call once at startup (see index.js)
 * before the root component renders. It only configures I18nManager on native;
 * `resolveLayoutDirection()` below performs the one-time surface recreation.
 */
export function configureRtl(): void {
  I18nManager.allowRTL(APP_IS_RTL);
  I18nManager.forceRTL(APP_IS_RTL);

  // react-native-web does not mirror through I18nManager, so set the document
  // direction explicitly. The in-tree dir wrapper in App.tsx additionally makes
  // react-native-web localize layout like native.
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('dir', APP_LAYOUT_DIRECTION);
    }
    return;
  }

  // Native only: disable React Native's automatic left/right STYLE swapping.
  // Layout mirroring (rows/order/text) stays on via allowRTL/forceRTL, but
  // physical styles like `right:`/`marginRight:` keep their authored meaning —
  // exactly like react-native-web, which only mirrors layout through dir="rtl"
  // and never swaps physical style values. Not available on the
  // react-native-web I18nManager stub, so it must not run on web.
  I18nManager.swapLeftAndRightInRTL(false);
}

let directionResolved = false;

/**
 * Resolve direction before the app renders. Web resolves synchronously; native
 * returns immediately when RTL is already active, and otherwise recreates the
 * surface once so the forced direction actually takes effect.
 *
 * This function is intentionally idempotent and loop-proof:
 *   1. `I18nManager.isRTL` true  -> nothing to do.
 *   2. reload already attempted  -> stop (never reload twice), log a warning.
 *   3. otherwise                 -> persist the attempt, then reload.
 */
export async function resolveLayoutDirection(): Promise<void> {
  if (directionResolved || Platform.OS === 'web' || I18nManager.isRTL) {
    directionResolved = true;
    return;
  }

  try {
    const attempted = await AsyncStorage.getItem(RTL_RELOAD_FLAG);
    if (attempted) {
      directionResolved = true;
      if (__DEV__) {
        console.warn(
          '[rtl] native host did not activate forced RTL after one reload; continuing without another reload to avoid a loop.',
        );
      }
      return;
    }
    await AsyncStorage.setItem(RTL_RELOAD_FLAG, '1');
  } catch {
    // If storage is unavailable, do not risk an unguarded reload loop.
    directionResolved = true;
    return;
  }

  try {
    await Updates.reloadAsync();
  } catch {
    try {
      DevSettings.reload();
    } catch {
      // Last resort: keep running. The guard above prevents any loop.
    }
  }
}

/** Test/dev helper: clear the one-time reload guard. */
export async function resetRtlReloadGuard(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RTL_RELOAD_FLAG);
  } catch {
    // ignore
  }
}

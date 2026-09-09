import { I18nManager, Platform } from 'react-native';

/**
 * App-wide layout direction — the single source of truth for RTL in this app.
 *
 * This is an Arabic app whose design reference is genuine right-to-left
 * (the stitch-screen mockups are authored with dir="rtl"): brand starts on
 * the right, primary navigation sits on the right, and content reads from
 * right to left.
 *
 * NOTE ON RESTARTS: changing I18nManager settings on Android only takes effect
 * when a brand-new native React surface is created. Automatic restart logic
 * (Updates.reloadAsync / DevSettings.reload) was intentionally REMOVED here:
 * if the runtime value can never match the configured value (e.g. the host
 * does not honor the preference), that logic re-triggers on every launch and
 * causes an infinite reload/bundle loop. The app must start and stay running;
 * RTL behavior itself is handled separately.
 */
const APP_LAYOUT_DIRECTION_IS_RTL = true;

/**
 * Apply the app-wide layout direction. Call once at startup (see index.js)
 * before the root component renders. It only configures I18nManager and never
 * reloads/restarts the app, so launching is always stable.
 */
export function configureRtl(): void {
  I18nManager.allowRTL(APP_LAYOUT_DIRECTION_IS_RTL);
  I18nManager.forceRTL(APP_LAYOUT_DIRECTION_IS_RTL);

  // react-native-web does not mirror through I18nManager, so flip the whole
  // document explicitly. The in-tree dir="rtl" wrapper (App.tsx) additionally
  // makes react-native-web localize layout like native.
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('dir', 'rtl');
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

  // Runtime diagnostic: printed once per launch to the Expo dev-server
  // terminal so the value can be observed while the app runs on the device.
  if (__DEV__) {
    console.log(
      `[rtl] platform=${Platform.OS} runtime I18nManager.isRTL=${I18nManager.isRTL} (configured RTL=${APP_LAYOUT_DIRECTION_IS_RTL})`,
    );
  }
}

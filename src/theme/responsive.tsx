import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_IS_RTL } from '../i18n/rtl';

/**
 * Shared responsive system — the single place where viewport metrics, safe-area
 * insets and layout direction are resolved for BOTH Web and Native.
 *
 * Why this exists: screens used to re-derive their own frame with a mix of
 * `Dimensions.get('window')`, `useWindowDimensions`, `useSafeAreaInsets` and
 * local `onLayout` measurement. Those inputs differ between react-native-web
 * and Android (web viewport vs. native window, zero web insets vs. real native
 * insets, first-launch RTL state), so every screen could drift independently and
 * each drift needed its own platform fix.
 *
 * Every screen now consumes one normalized frame, so a section added/removed/
 * changed only has to be written once and renders on both platforms.
 */

export type ResponsiveBreakpoint = 'compact' | 'regular' | 'wide';

/** Design reference the approved Welcome composition is authored against. */
export const DESIGN_REFERENCE = {
  width: 390,
  height: 844,
} as const;

/** Single-column cap so a phone composition stays a phone composition on wide web. */
export const SINGLE_COLUMN_MAX_WIDTH = 520;

/** Breakpoints (dp/pt). Mobile-first: regular is the base. */
const COMPACT_MAX_WIDTH = 380;
const WIDE_MIN_WIDTH = 600;

export type ResponsiveFrame = {
  /** Viewport width in dp/pt. */
  width: number;
  /** Viewport height in dp/pt, as reported by the platform window. */
  height: number;
  /** Real safe-area insets for the current platform (0 on desktop web). */
  insets: EdgeInsets;
  /** Width of the app shell, after its own safe-area padding. */
  contentWidth: number;
  /** Height of the app shell, after its own safe-area padding. */
  contentHeight: number;
  /**
   * `contentHeight + insets.top`. This is the height a full-bleed hero can
   * paint into: `contentHeight` is already inset at the top by the shell, so
   * adding the inset back yields the true full-screen frame on native while
   * resolving to the plain viewport on web (where the inset is 0).
   */
  fullHeight: number;
  /** Effective layout direction. Explicit so screens never guess from Platform.OS. */
  isRTL: boolean;
  isLandscape: boolean;
  breakpoint: ResponsiveBreakpoint;
  isCompact: boolean;
  isWide: boolean;
  /** Cap for a single-column composition on wide viewports. */
  singleColumnMaxWidth: number;
};

const ResponsiveContext = createContext<ResponsiveFrame | null>(null);

/**
 * Measures the app shell once and shares the resolved frame with the whole
 * tree. Must be rendered inside `SafeAreaProvider` and inside the shell that
 * applies the top inset (see App.tsx).
 */
export function ResponsiveProvider({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [shell, setShell] = useState<{ width: number; height: number } | null>(null);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setShell((prev) =>
      prev !== null &&
      Math.abs(prev.width - width) < 0.5 &&
      Math.abs(prev.height - height) < 0.5
        ? prev
        : { width, height },
    );
  }, []);

  const frame = useMemo<ResponsiveFrame>(() => {
    const contentWidth = shell?.width ?? window.width;
    // Before the first layout pass, derive the shell box from the window the
    // same way the layout engine will, so the first frame is never blown up to
    // full screen on native.
    const contentHeight = shell?.height ?? Math.max(0, window.height - insets.top);
    const fullHeight = contentHeight + insets.top;
    const breakpoint: ResponsiveBreakpoint =
      window.width >= WIDE_MIN_WIDTH ? 'wide' : window.width < COMPACT_MAX_WIDTH ? 'compact' : 'regular';

    return {
      width: window.width,
      height: window.height,
      insets,
      contentWidth,
      contentHeight,
      fullHeight,
      isRTL: APP_IS_RTL,
      isLandscape: window.width > window.height,
      breakpoint,
      isCompact: breakpoint === 'compact',
      isWide: breakpoint === 'wide',
      singleColumnMaxWidth: SINGLE_COLUMN_MAX_WIDTH,
    };
  }, [shell, window.width, window.height, insets]);

  return (
    <ResponsiveContext.Provider value={frame}>
      <View style={[styles.shell, style]} onLayout={handleLayout}>
        {children}
      </View>
    </ResponsiveContext.Provider>
  );
}

/** Read the shared responsive frame. Throws if used outside ResponsiveProvider. */
export function useResponsive(): ResponsiveFrame {
  const frame = useContext(ResponsiveContext);
  if (!frame) {
    throw new Error('useResponsive() must be used inside <ResponsiveProvider>.');
  }
  return frame;
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
});

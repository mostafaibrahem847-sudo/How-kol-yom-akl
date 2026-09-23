import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import * as Font from 'expo-font';
import RootNavigator from '../navigation/RootNavigator';
import { colors, ResponsiveProvider, FONT_ASSETS } from '../theme';
import { APP_LAYOUT_DIRECTION, resolveLayoutDirection } from '../i18n/rtl';

// Catalog data is small and changes rarely (content edits happen out-of-band).
// Fresh-for-5-minutes + no focus refetch means tab switches and refocuses serve
// from cache instead of re-hitting Supabase; mutations of favorites are local
// (Zustand) and unaffected.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function boot() {
      // Register every static Cairo weight under its own family name (see
      // src/theme/typography.ts). Loading the weights separately is what keeps
      // Web and Native on the same real glyphs instead of each platform's
      // synthetic bold.
      await Font.loadAsync(FONT_ASSETS);
      // Resolve the one shared layout direction before first paint. On native
      // this may recreate the surface once (see src/i18n/rtl.ts); on web it is
      // a no-op. Gating here avoids a flash of the wrong direction.
      await resolveLayoutDirection();
      setReady(true);
    }
    boot();
  }, []);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.secondary }} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />
            {/* One measured responsive frame shared by every screen. */}
            <ResponsiveProvider>
              <RootNavigator />
            </ResponsiveProvider>
          </SafeAreaView>
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

// Clerk is the active authentication provider, configured through
// EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. ClerkProvider is always mounted (no
// no-auth fallback); the native tokenCache persists the device JWT in
// expo-secure-store. The key must be set in .env — without it Clerk fails to
// initialize and surfaces its own error.
function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (__DEV__ && !publishableKey) {
    console.warn(
      '[clerk] EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set; Clerk will fail to initialize. Add the key to .env.',
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey ?? ''} tokenCache={tokenCache}>
      {children}
    </ClerkProvider>
  );
}

function RootApp() {
  // react-native-web does not mirror layout through I18nManager. Setting
  // dir="rtl" on the web root makes react-native-web flip flex rows AND
  // localize physical left/right styles (via its locale context), which is
  // what the native engine does automatically when I18nManager.isRTL=true.
  // The prop is a react-native-web DOM prop; native ignores it entirely.
  if (Platform.OS === 'web') {
    return (
      <View {...({ dir: APP_LAYOUT_DIRECTION } as object)} style={{ flex: 1 }}>
        <AppContent />
      </View>
    );
  }
  return <AppContent />;
}

export default function App() {
  return (
    <ClerkAuthProvider>
      <RootApp />
    </ClerkAuthProvider>
  );
}

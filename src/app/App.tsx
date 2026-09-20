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
import { colors } from '../theme';

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
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        Cairo: require('../../assets/fonts/Cairo-Variable.ttf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.secondary }} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />
            <RootNavigator />
          </SafeAreaView>
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

// Clerk is configured through EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. The provider is
// only mounted when a key is present so the app keeps launching (with auth
// disabled) until a Clerk instance is connected. Setting the key in .env mounts
// ClerkProvider automatically — no further wiring is needed here.
function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    if (__DEV__) {
      console.warn(
        '[clerk] EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set. Clerk authentication is disabled; add the key to .env to enable it.',
      );
    }
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
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
      <View {...({ dir: 'rtl' } as object)} style={{ flex: 1 }}>
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

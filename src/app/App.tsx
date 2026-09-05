import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Font from 'expo-font';
import RootNavigator from '../navigation/RootNavigator';
import { colors } from '../theme';

const queryClient = new QueryClient();

export default function App() {
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

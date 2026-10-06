import React, { useEffect, useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  AccessibilityInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import HomeScreen from '../screens/HomeScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsScreen from '../screens/TermsScreen';
import { colors, radius, typography, elevation } from '../theme';
import { t } from '../i18n/strings';

type TabKey = 'Home' | 'Favorites' | 'Profile';

type TabIconName = keyof typeof Feather.glyphMap;

type TabItemDef = { key: TabKey; label: string; icon: TabIconName };

const TAB_ITEMS: TabItemDef[] = [
  { key: 'Home', label: t.nav.home, icon: 'home' },
  { key: 'Favorites', label: t.nav.favorites, icon: 'heart' },
  { key: 'Profile', label: t.nav.account, icon: 'user' },
];

// Active-tab accent for the bottom nav ONLY (soft light red/coral).
// Kept local so the global palette in src/theme and other screens stay untouched.
const ACTIVE_TAB_ACCENT = '#7e1911';
const ACTIVE_TAB_TINT = 'rgba(154, 19, 7, 0.12)';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Active icon scale: quick and settled, no bounce or overshoot.
const TAB_ANIMATION_MS = 220;
// Pill slide between tabs: measured targets, ease-out, no overshoot.
const PILL_SLIDE_MS = 270;
// Matches the old `left: 6` / `right: 6` pill insets inside a tab.
const PILL_INSET = 6;

// Honors the OS "Reduce Motion" setting. Defaults to false while the async
// check resolves, then follows any later changes.
function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

function TabItem({
  item,
  isActive,
  reduceMotion,
  onPress,
  onMeasure,
}: {
  item: TabItemDef;
  isActive: boolean;
  reduceMotion: boolean;
  onPress: () => void;
  onMeasure: (x: number, width: number) => void;
}) {
  // Drives the active icon scale only; the pill is a single shared element in
  // TabBar that slides between tabs.
  const progress = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(isActive ? 1 : 0);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: isActive ? 1 : 0,
      duration: TAB_ANIMATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [isActive, reduceMotion, progress]);

  const iconScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.75}
      onLayout={(e) => onMeasure(e.nativeEvent.layout.x, e.nativeEvent.layout.width)}
    >
      <Animated.View style={[styles.tabIcon, { transform: [{ scale: iconScale }] }]}>
        <Feather
          name={item.icon}
          size={22}
          color={isActive ? ACTIVE_TAB_ACCENT : colors.neutralMuted}
        />
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          isActive ? styles.tabLabelActive : styles.tabLabelInactive,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );
}

function TabBar({ navigation, state }: { navigation: any; state: any }) {
  const insets = useSafeAreaInsets();
  const activeIndex = state.index;
  const reduceMotion = useReduceMotion();

  // Measured tab geometry (x, width relative to the bar), captured by onLayout.
  // All tabs share flex:1, so the pill width comes from the first measurement
  // and is never resized.
  const layoutsRef = useRef<({ x: number; width: number } | null)[]>([]);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;
  const [pillWidth, setPillWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const handleTabLayout = (index: number, x: number, width: number) => {
    layoutsRef.current[index] = { x, width };
    setPillWidth((prev) => (prev === 0 ? Math.max(0, width - PILL_INSET * 2) : prev));
    // First placement is immediate — no slide on app start / first layout.
    if (index === activeIndexRef.current) {
      translateX.setValue(x + PILL_INSET);
    }
  };

  // Slide only when the active tab changes (on mount the pill was already
  // placed by onLayout). Horizontal position only — no width/height/margin.
  useEffect(() => {
    const layout = layoutsRef.current[activeIndex];
    if (!layout) return;

    const target = layout.x + PILL_INSET;
    if (reduceMotion) {
      translateX.setValue(target);
      return;
    }
    const animation = Animated.timing(translateX, {
      toValue: target,
      duration: PILL_SLIDE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [activeIndex, reduceMotion, translateX]);

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom + 10 }]}>
      {/*
        Shadow shell is kept separate from the clipping surface. On Android the
        elevation shadow of a view is clipped when that same view has
        overflow:'hidden' (which the inner bar needs to round the active pill),
        so the bar was shadowless on real devices while Web/iOS showed it.
      */}
      <View style={styles.tabBarShadow}>
        <View style={styles.tabBar}>
          {pillWidth > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.activePill,
                { width: pillWidth, transform: [{ translateX }] },
              ]}
            />
          )}
          {TAB_ITEMS.map((item, index) => (
            <TabItem
              key={item.key}
              item={item}
              isActive={index === activeIndex}
              reduceMotion={reduceMotion}
              onPress={() => navigation.navigate(item.key)}
              onMeasure={(x, width) => handleTabLayout(index, x, width)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props: any) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_TAB_ACCENT,
        tabBarInactiveTintColor: colors.neutralMuted,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t.nav.home }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: t.nav.favorites }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t.nav.account }} />
    </Tab.Navigator>
  );
}

export type RootStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Tabs: { screen?: TabKey } | undefined;
  RecipeDetail: { id: string };
  PrivacyPolicy: undefined;
  Terms: undefined;
};

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.secondary },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    paddingHorizontal: '5%',
    paddingTop: 8,
  },
  tabBarShadow: {
    backgroundColor: colors.secondary,
    opacity: 0.80,
    borderRadius: radius.large,
    // iOS/Web shadow (react-native-web maps shadow* to box-shadow; elevation
    // is ignored there).
    ...elevation.cardResting,
    shadowColor: '#3e1d02',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    // Android: elevation renders the shadow on real devices (shadow* props
    // alone do nothing on Android).
    elevation: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    borderRadius: radius.large,
    overflow: 'hidden',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    minWidth: 0,
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    top: 4,
    left: 0,
    height: 40,
    backgroundColor: ACTIVE_TAB_TINT,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 17,
    overflow: 'hidden',  },
  tabIcon: {
    zIndex: 1,
  },
  // Shared metrics for every tab label. `typography.labelSm` already pins the
  // family + fontWeight: 'normal'; the active state must only recolor it, never
  // re-weight it (a stray fontWeight here would synthesise a different face on
  // the active tab).
  tabLabel: {
    ...typography.labelSm,
    marginTop: 2,
    fontSize: 10,
    zIndex: 1,
  },
  tabLabelActive: {
    color: ACTIVE_TAB_ACCENT,
  },
  tabLabelInactive: {
    color: colors.neutralMuted,
  },
});

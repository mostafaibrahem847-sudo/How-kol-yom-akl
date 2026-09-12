import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import { colors, radius, typography, elevation } from '../theme';
import { t } from '../i18n/strings';

type TabKey = 'Home' | 'Search' | 'Favorites' | 'Profile';

type TabIconName = keyof typeof Feather.glyphMap;

const TAB_ITEMS: { key: TabKey; label: string; icon: TabIconName }[] = [
  { key: 'Home', label: t.nav.home, icon: 'home' },
  { key: 'Search', label: t.nav.search, icon: 'search' },
  { key: 'Favorites', label: t.nav.favorites, icon: 'heart' },
  { key: 'Profile', label: t.nav.account, icon: 'user' },
];

// Active-tab accent for the bottom nav ONLY (soft light red/coral).
// Kept local so the global palette in src/theme and other screens stay untouched.
const ACTIVE_TAB_ACCENT = '#7e1911';
const ACTIVE_TAB_TINT = 'rgba(154, 19, 7, 0.12)';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabBar({ navigation, state }: { navigation: any; state: any }) {
  const insets = useSafeAreaInsets();
  const activeIndex = state.index;

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
          {TAB_ITEMS.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <TouchableOpacity
                key={item.key}
                style={styles.tabItem}
                onPress={() => navigation.navigate(item.key)}
                activeOpacity={0.75}
              >
                {isActive && <View style={styles.activePill} />}
                <Feather
                  name={item.icon}
                  size={22}
                  color={isActive ? ACTIVE_TAB_ACCENT : colors.neutralMuted}
                  style={styles.tabIcon}
                />
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
          })}
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
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: t.nav.search }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: t.nav.favorites }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t.nav.account }} />
    </Tab.Navigator>
  );
}

export type RootStackParamList = {
  Tabs: undefined;
  RecipeDetail: { id: string };
};

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.secondary },
      }}
    >
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
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
    left: 6,
    right: 6,
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
  tabLabel: {
    ...typography.labelSm,
    marginTop: 2,
    fontSize: 10,
    zIndex: 1,
  },
  tabLabelActive: {
    color: ACTIVE_TAB_ACCENT,
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: colors.neutralMuted,
  },
});

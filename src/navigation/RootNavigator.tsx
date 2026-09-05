import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, Platform } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import CookingModeScreen from '../screens/CookingModeScreen';
import { colors, buttonSize, typography } from '../theme';
import { t } from '../i18n/strings';

type TabIconProps = { focused: boolean; label: string };
const TabIcon = ({ focused, label }: TabIconProps) => (
  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    <Text
      style={{
        fontSize: 12,
        color: focused ? colors.primary : colors.neutralMuted,
        ...typography.labelSm,
      }}
    >
      {label}
    </Text>
  </View>
);

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.neutralMuted,
        tabBarStyle: {
          backgroundColor: colors.secondary,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? buttonSize.heightHuge + 16 : buttonSize.heightHuge,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
        },
        tabBarLabelStyle: { ...typography.labelSm, marginTop: 2 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t.nav.home,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="🍲" />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: t.nav.search,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="🔍" />,
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarLabel: t.nav.favorites,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="❤️" />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t.nav.account,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="👤" />,
        }}
      />
    </Tab.Navigator>
  );
}

export type RootStackParamList = {
  Tabs: undefined;
  RecipeDetail: { id: string };
  CookingMode: { id: string };
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
      <Stack.Screen name="CookingMode" component={CookingModeScreen} />
    </Stack.Navigator>
  );
}

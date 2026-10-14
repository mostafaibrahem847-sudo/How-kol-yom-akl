import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, headerHeight, SINGLE_COLUMN_MAX_WIDTH } from '../theme';
import { screenPadding } from '../theme/spacing';
import { t } from '../i18n/strings';
import { useRecipes, useRecipesByCuisine } from '../data/queries';
import RecipeCardList from '../components/RecipeCardList';
import RecipeCardGrid from '../components/RecipeCardGrid';
import RecipeViewToggle from '../components/RecipeViewToggle';
import CuisineRow from '../components/CuisineRow';
import AppHeader from '../components/AppHeader';
import { useViewMode } from '../state/viewMode';

// Feed cross-fade on view-mode change: 90ms out + 110ms in = 200ms total.
const FADE_OUT_MS = 90;
const FADE_IN_MS = 110;

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const mode = useViewMode((s) => s.mode);

  // Deferred copy of `mode`: the FlatList swaps to it at the fade midpoint, so
  // the old layout fades out before the new one appears. The ref lets the
  // effect read the current value without re-running on its own setState.
  const [displayMode, setDisplayMode] = useState(mode);
  const displayModeRef = useRef(displayMode);
  const opacity = useRef(new Animated.Value(1)).current;
  const fadeRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Reverted (rapid re-toggle) or already current: recover to fully visible
    // so a cancelled fade can never strand the feed at opacity 0.
    if (mode === displayModeRef.current) {
      fadeRef.current?.stop();
      const restore = Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_IN_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      });
      fadeRef.current = restore;
      restore.start();
      return;
    }
    fadeRef.current?.stop();
    const out = Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_OUT_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    fadeRef.current = out;
    out.start(({ finished }) => {
      if (!finished) return; // superseded; the newer effect owns opacity now
      displayModeRef.current = mode;
      setDisplayMode(mode);
      const inn = Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_IN_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      });
      fadeRef.current = inn;
      inn.start();
    });
    // Only a real mode change re-runs this; cleanup stops the fade on unmount
    // or hands off to the next toggle.
    return () => fadeRef.current?.stop();
  }, [mode, opacity]);

  // No cuisine = the shared cached catalog Home always used. Selecting a
  // cuisine card switches to a real server-side `cuisine = ...` query, so the
  // filter is data-backed, not a decorative row.
  const catalogQuery = useRecipes();
  const isFiltering = selectedCuisine !== null;
  const cuisineQuery = useRecipesByCuisine(selectedCuisine);
  const activeQuery = isFiltering ? cuisineQuery : catalogQuery;
  const { data, isLoading, isError, refetch, isRefetching } = activeQuery;
  const list = data ?? [];

  // Error wins over stale content, matching the old ScrollView precedence:
  // isLoading -> spinner, isError -> error, else the feed.
  const feedData = isError ? [] : list;

  const header = (
    <>
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>{t.home.greeting}</Text>
        <Text style={styles.subtitle}>{t.home.subtitle}</Text>
      </View>

      {/* Browse by cuisine (replaces the old category chip filter) */}
      <Text style={styles.sectionHeader}>{t.home.browseCuisine}</Text>
      <CuisineRow selectedCuisine={selectedCuisine} onSelectCuisine={setSelectedCuisine} />

      {/* Feed heading with the view switcher on the physical left */}
      <View style={styles.feedHeaderRow}>
        <View style={styles.feedHeaderText}>
          <Text style={styles.feedHeader}>{t.home.feedHeader}</Text>
          <Text style={styles.feedSub}>{t.home.feedSubheader}</Text>
        </View>
        <RecipeViewToggle />
      </View>
    </>
  );

  const empty = isLoading ? (
    <ActivityIndicator color={colors.primary} size="large" style={{ marginVertical: spacing.xl }} />
  ) : isError ? (
    <View style={{ alignItems: 'center', marginVertical: spacing.xl }}>
      <Text style={styles.feedSub}>{t.common.loadError}</Text>
      <TouchableOpacity style={styles.filterChip} onPress={() => refetch()} accessibilityRole="button">
        <Text style={styles.filterChipText}>{t.common.retry}</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <View style={{ alignItems: 'center', marginVertical: spacing.xl }}>
      <Text style={styles.feedHeader}>{isFiltering ? t.home.cuisineEmpty : t.home.empty}</Text>
      <Text style={styles.feedSub}>{isFiltering ? t.home.cuisineEmptyBody : t.home.emptyBody}</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      {/* Cross-fade wraps only the scrolling feed. numColumns cannot change in
          place, so the FlatList swaps to `displayMode` at the fade midpoint. */}
      <Animated.View style={[styles.feedWrap, { opacity }]}>
        <FlatList
          key={displayMode}
          data={feedData}
          keyExtractor={(r) => r.id}
          numColumns={displayMode === 'grid' ? 2 : 1}
          columnWrapperStyle={displayMode === 'grid' ? styles.columnWrapper : undefined}
          renderItem={({ item: r }) => (
            <View style={displayMode === 'grid' ? styles.cardWrapperGrid : styles.cardWrapperFull}>
              {displayMode === 'grid' ? (
                <RecipeCardGrid
                  recipe={r}
                  onPress={() => navigation.navigate('RecipeDetail', { id: r.id })}
                />
              ) : (
                <RecipeCardList
                  recipe={r}
                  onPress={() => navigation.navigate('RecipeDetail', { id: r.id })}
                />
              )}
            </View>
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={empty}
          style={styles.scrollView}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
        />
      </Animated.View>

      {/* Fixed top header overlay */}
      <View style={styles.fixedHeader}>
        <AppHeader indicator={t.nav.home} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.secondary },
  feedWrap: { flex: 1 },
  scrollView: { flex: 1 },
  scroll: {
    paddingHorizontal: screenPadding.horizontal,
    paddingTop: headerHeight,
    paddingBottom: 100,
  },
  greeting: { marginTop: spacing.md, marginBottom: spacing.xl },
  greetingText: { ...typography.h1, color: colors.neutralDark, marginBottom: spacing.sm },
  subtitle: { ...typography.bodyLarge, color: colors.neutralMid },
  sectionHeader: { ...typography.h2, color: colors.neutralDark, marginBottom: spacing.sm },
  filterChip: {
    backgroundColor: colors.neutralSurface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  filterChipText: { ...typography.label, color: colors.neutralMid },
  feedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  feedHeaderText: { flex: 1, minWidth: 0, marginLeft: spacing.md },
  feedHeader: { ...typography.h2, color: colors.neutralDark, marginBottom: spacing.xs },
  feedSub: { ...typography.body, color: colors.neutralMuted },
  columnWrapper: {
    width: '100%',
    maxWidth: SINGLE_COLUMN_MAX_WIDTH,
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  cardWrapperFull: {
    width: '100%',
    maxWidth: SINGLE_COLUMN_MAX_WIDTH,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  cardWrapperGrid: { width: '48%', marginBottom: spacing.md },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});

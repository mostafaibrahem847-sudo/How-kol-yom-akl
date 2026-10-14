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

// Feed "settle" on view-mode change: shrink/dim over 140ms, then grow/restore
// over 160ms (300ms total). Opacity never reaches 0 so content stays faintly
// visible while the layout swaps, reading as a settle instead of a flash.
const SETTLE_OUT_MS = 140;
const SETTLE_IN_MS = 160;
const SETTLE_OPACITY = 0.55;
const SETTLE_SCALE = 0.96;

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const mode = useViewMode((s) => s.mode);

  // Deferred copy of `mode`: the FlatList swaps to it at the settle midpoint, so
  // the old layout dims/shrinks out before the new one grows in. The ref lets
  // the effect read the current value without re-running on its own setState.
  const [displayMode, setDisplayMode] = useState(mode);
  const displayModeRef = useRef(displayMode);
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const fadeRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Reverted (rapid re-toggle) or already current: settle opacity AND scale
    // back so a cancelled transition can never strand the feed dimmed/shrunk.
    if (mode === displayModeRef.current) {
      fadeRef.current?.stop();
      const restore = Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: SETTLE_IN_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: SETTLE_IN_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);
      fadeRef.current = restore;
      restore.start();
      return;
    }
    fadeRef.current?.stop();
    const out = Animated.parallel([
      Animated.timing(opacity, {
        toValue: SETTLE_OPACITY,
        duration: SETTLE_OUT_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: SETTLE_SCALE,
        duration: SETTLE_OUT_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    fadeRef.current = out;
    out.start(({ finished }) => {
      if (!finished) return; // superseded; the newer effect owns the values now
      displayModeRef.current = mode;
      setDisplayMode(mode);
      const inn = Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: SETTLE_IN_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: SETTLE_IN_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);
      fadeRef.current = inn;
      inn.start();
    });
    // Only a real mode change re-runs this; cleanup stops both opacity and
    // scale on unmount or hands them off to the next toggle.
    return () => fadeRef.current?.stop();
  }, [mode, opacity, scale]);

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
      {/* Scale + fade wraps only the scrolling feed. numColumns cannot change
          in place, so the FlatList swaps to `displayMode` at the settle midpoint. */}
      <Animated.View style={[styles.feedWrap, { opacity, transform: [{ scale }] }]}>
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

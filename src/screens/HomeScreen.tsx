import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, headerHeight, SINGLE_COLUMN_MAX_WIDTH } from '../theme';
import { screenPadding } from '../theme/spacing';
import { t } from '../i18n/strings';
import { useRecipes, useRecipeCategories, useRecipeSearch } from '../data/queries';
import RecipeCard from '../components/RecipeCard';
import RecipeCardList from '../components/RecipeCardList';
import RecipeCardGrid from '../components/RecipeCardGrid';
import RecipeViewToggle from '../components/RecipeViewToggle';
import CategoryFilter from '../components/CategoryFilter';
import AppHeader from '../components/AppHeader';
import { useViewMode } from '../state/viewMode';
import { hasRealPhoto } from '../lib/images';
import {
  getSessionHeroId,
  pickHeroId,
  readLastHeroId,
  setSessionHeroId,
  writeLastHeroId,
} from '../lib/heroPick';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const mode = useViewMode((s) => s.mode);

  // No category = the shared cached catalog Home always used. A selected chip
  // switches to the same server-side category query Search uses, so the filter
  // is real data, not a decorative row.
  const catalogQuery = useRecipes();
  const categoriesQuery = useRecipeCategories();
  const isFiltering = selectedCategory !== null;
  const searchQuery = useRecipeSearch('', selectedCategory, { enabled: isFiltering });
  const activeQuery = isFiltering ? searchQuery : catalogQuery;
  const { data, isLoading, isError, refetch } = activeQuery;
  const list = data ?? [];

  // The featured card is full-bleed, so it must show a real photo. Candidates
  // come from the full catalog (not the filtered results); shrimp-scampi is
  // excluded explicitly because it has no usable image. The choice is random
  // per cold start and held in heroPick's module scope so it survives Home
  // remounts for the whole session.
  const catalogList = useMemo(() => catalogQuery.data ?? [], [catalogQuery.data]);
  const heroCandidates = useMemo(
    () => catalogList.filter((r) => hasRealPhoto(r.imageUrl) && r.id !== 'shrimp-scampi'),
    [catalogList],
  );
  const candidateIds = useMemo(() => heroCandidates.map((r) => r.id), [heroCandidates]);

  const [heroId, setHeroId] = useState<string | null>(() => getSessionHeroId());

  useEffect(() => {
    if (candidateIds.length === 0) return;

    // Already chosen this session and still in the catalog → reuse as-is.
    const session = getSessionHeroId();
    if (session && candidateIds.includes(session)) {
      setHeroId(session);
      return;
    }

    // Otherwise choose once for this cold start, avoiding last launch's pick.
    let cancelled = false;
    (async () => {
      const lastId = await readLastHeroId();
      if (cancelled) return;
      const chosen = pickHeroId(candidateIds, lastId);
      if (!chosen) return;
      setSessionHeroId(chosen);
      setHeroId(chosen);
      await writeLastHeroId(chosen);
    })();

    return () => {
      cancelled = true;
    };
  }, [candidateIds]);

  const heroRecipe = useMemo(
    () => (heroId ? catalogList.find((r) => r.id === heroId) ?? null : null),
    [catalogList, heroId],
  );

  // While a category is active the hero is hidden so the filtered results read
  // unambiguously.
  const showHero = !isFiltering;

  // Lift the hero out of the feed wherever it sits (not just when it happens to
  // be first), so no recipe is ever shown twice on Home.
  const feedRecipes = useMemo(
    () => (showHero && heroRecipe ? list.filter((r) => r.id !== heroRecipe.id) : list),
    [list, heroRecipe, showHero],
  );

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>{t.home.greeting}</Text>
          <Text style={styles.subtitle}>{t.home.subtitle}</Text>
        </View>

        {/* Hero Card (hidden while a category filter is active) */}
        {showHero && heroRecipe && (
          <View style={styles.heroWrapper}>
            <RecipeCard
              recipe={heroRecipe}
              onPress={() => navigation.navigate('RecipeDetail', { id: heroRecipe.id })}
            />
          </View>
        )}

        {/* Category filter (shared with Search) */}
        <CategoryFilter
          categories={categoriesQuery.data ?? []}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          allLabel={t.search.filters.all}
        />

        {/* Feed heading with the view switcher on the physical left */}
        <View style={styles.feedHeaderRow}>
          <View style={styles.feedHeaderText}>
            <Text style={styles.feedHeader}>{t.home.feedHeader}</Text>
            <Text style={styles.feedSub}>{t.home.feedSubheader}</Text>
          </View>
          <RecipeViewToggle />
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginVertical: spacing.xl }} />
        ) : isError ? (
          <View style={{ alignItems: 'center', marginVertical: spacing.xl }}>
            <Text style={styles.feedSub}>{t.common.loadError}</Text>
            <TouchableOpacity style={styles.filterChip} onPress={() => refetch()} accessibilityRole="button">
              <Text style={styles.filterChipText}>{t.common.retry}</Text>
            </TouchableOpacity>
          </View>
        ) : list.length === 0 ? (
          <View style={{ alignItems: 'center', marginVertical: spacing.xl }}>
            <Text style={styles.feedHeader}>{t.home.empty}</Text>
            <Text style={styles.feedSub}>{t.home.emptyBody}</Text>
          </View>
        ) : (
          <View style={styles.feedGrid}>
            {feedRecipes.map((r) => (
              <View
                key={r.id}
                style={mode === 'grid' ? styles.cardWrapperGrid : styles.cardWrapperFull}
              >
                {mode === 'grid' ? (
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
            ))}
          </View>
        )}
      </ScrollView>

      {/* Fixed top header overlay */}
      <View style={styles.fixedHeader}>
        <AppHeader indicator={t.nav.home} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.secondary },
  scrollView: { flex: 1 },
  scroll: {
    paddingHorizontal: screenPadding.horizontal,
    paddingTop: headerHeight,
    paddingBottom: 100,
  },
  greeting: { marginTop: spacing.md, marginBottom: spacing.xl },
  greetingText: { ...typography.h1, color: colors.neutralDark, marginBottom: spacing.sm },
  subtitle: { ...typography.bodyLarge, color: colors.neutralMid },
  heroWrapper: { marginBottom: spacing.xl, alignItems: 'center' },
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
  feedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: SINGLE_COLUMN_MAX_WIDTH,
    alignSelf: 'center',
  },
  cardWrapperFull: { width: '100%', marginBottom: spacing.md },
  cardWrapperGrid: { width: '48%', marginBottom: spacing.md },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});

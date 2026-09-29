import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, headerHeight, SINGLE_COLUMN_MAX_WIDTH } from '../theme';
import { screenPadding } from '../theme/spacing';
import { t } from '../i18n/strings';
import { useRecipes } from '../data/queries';
import RecipeCard from '../components/RecipeCard';
import RecipeCardList from '../components/RecipeCardList';
import RecipeCardGrid from '../components/RecipeCardGrid';
import RecipeViewToggle from '../components/RecipeViewToggle';
import AppHeader from '../components/AppHeader';
import { useViewMode } from '../state/viewMode';
import { hasRealPhoto } from '../lib/images';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { data: recipes, isLoading, isError, refetch } = useRecipes();
  const mode = useViewMode((s) => s.mode);
  const list = recipes ?? [];

  // The featured card is full-bleed, so it must show a real photo. Take the
  // first recipe in catalog order that actually has one. Nothing here is tied
  // to a specific recipe by id or name: if that recipe is deleted, or its image
  // is cleared, the next eligible recipe is promoted automatically.
  const heroRecipe = useMemo(() => list.find((r) => hasRealPhoto(r.imageUrl)), [list]);

  // Lift the hero out of the feed wherever it sits (not just when it happens to
  // be first), so no recipe is ever shown twice on Home.
  const feedRecipes = useMemo(
    () => (heroRecipe ? list.filter((r) => r.id !== heroRecipe.id) : list),
    [list, heroRecipe],
  );

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>{t.home.greeting}</Text>
          <Text style={styles.subtitle}>{t.home.subtitle}</Text>
        </View>

        {/* Hero Card */}
        {heroRecipe && (
          <View style={styles.heroWrapper}>
            <RecipeCard
              recipe={heroRecipe}
              onPress={() => navigation.navigate('RecipeDetail', { id: heroRecipe.id })}
            />
          </View>
        )}

        {/* Filter chips row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {Object.entries(t.home.filters).map(([key, label]) => (
            <TouchableOpacity key={key} style={styles.filterChip} activeOpacity={0.8}>
              <Text style={styles.filterChipText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
  filterRow: { paddingBottom: spacing.md, gap: spacing.sm },
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

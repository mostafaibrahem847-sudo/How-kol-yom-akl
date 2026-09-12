import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { colors, spacing, typography, headerHeight } from '../theme';
import { screenPadding } from '../theme/spacing';
import { t } from '../i18n/strings';
import { useFavorites } from '../state/favorites';
import { useRecipes } from '../data/queries';
import RecipeCard from '../components/RecipeCard';
import AppHeader from '../components/AppHeader';
import { useNavigation } from '@react-navigation/native';

export default function FavoritesScreen() {
  const navigation = useNavigation<any>();
  const { favorites, hydrated, pruneStale } = useFavorites();
  const count = favorites.size;

  // Resolve the stored favorite ids against the single Supabase catalog (the
  // same cached useRecipes() result Home and Search use). Ids that no longer
  // exist in the catalog are simply not rendered.
  const { data: recipes, isLoading, isError } = useRecipes();
  const favRecipes = (recipes ?? []).filter((r) => favorites.has(r.id));

  // After the authoritative remote catalog is available AND the persisted
  // snapshot has been merged, drop any favorite ids that no longer exist in
  // the catalog so the count stays honest and no ghost entries linger.
  useEffect(() => {
    if (!hydrated || !recipes || recipes.length === 0) return;
    const validIds = new Set(recipes.map((r) => r.id));
    pruneStale(validIds);
  }, [hydrated, recipes, pruneStale]);

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.favoriteBadge}>
            <Text style={styles.favoriteBadgeIcon}>❤️</Text>
            <Text style={styles.favoriteBadgeText}>{t.favorites.pill}</Text>
          </View>
          <Text style={styles.title}>{t.favorites.title}</Text>
          <Text style={styles.subtitle}>{t.favorites.subtitle}</Text>
          <View style={styles.pillRow}>
            <TouchableOpacity style={[styles.pill, styles.pillActive]} hitSlop={{ top: 4, bottom: 4 }}>
              <Text style={[styles.pillText, styles.pillTextActive]}>{t.favorites.filters.all}</Text>
              <View style={styles.pillCountBadge}><Text style={styles.pillCountText}>{count}</Text></View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pill} hitSlop={{ top: 4, bottom: 4 }}>
              <Text style={styles.pillText}>{t.favorites.filters.tried}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pill} hitSlop={{ top: 4, bottom: 4 }}>
              <Text style={styles.pillText}>{t.favorites.filters.wantToTry}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pill} hitSlop={{ top: 4, bottom: 4 }}>
              <Text style={styles.pillText}>{t.favorites.filters.eidSweets}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {count === 0 ? (
          <View style={styles.emptySection}>
            <View style={styles.emptyTopRow}>
              <Text style={styles.emptyTopLabel}>{t.favorites.emptyHint}</Text>
              <View style={styles.emptyTopTag}><Text style={styles.emptyTopTagText}>{t.favorites.emptyHintTag}</Text></View>
            </View>
            <View style={styles.emptyCard}>
              <View style={styles.illustration}>
                <Text style={styles.illustrationIcon}>🍲</Text>
              </View>
              <View style={styles.emptyContent}>
                <Text style={styles.emptyTitle}>{t.favorites.emptyTitle}</Text>
                <Text style={styles.emptyBody}>{t.favorites.emptyBody}</Text>
              </View>
              <TouchableOpacity style={styles.ctaButton} activeOpacity={0.85} onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}>
                <Text style={styles.ctaIcon}>🍲</Text>
                <Text style={styles.ctaText}>{t.favorites.emptyCta}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : isLoading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginVertical: spacing.xl }} />
        ) : isError ? (
          <Text style={styles.emptyBody}>حدث خطأ في تحميل الوصفات</Text>
        ) : (
          <>
            <Text style={styles.resultsCount}>{`${count} وصفة مفضلة`}</Text>
            <View style={styles.grid}>
              {favRecipes.map((r) => (
                <View key={r.id} style={styles.cardWrapper}>
                  <RecipeCard
                    recipe={r}
                    onPress={() => navigation.navigate('RecipeDetail', { id: r.id })}
                  />
                </View>
              ))}
            </View>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Fixed top header overlay */}
      <View style={styles.fixedHeader}>
        <AppHeader indicator={t.nav.favorites} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.secondary },
  scrollView: { flex: 1 },
  scroll: {
    paddingHorizontal: screenPadding.horizontal,
    paddingTop: headerHeight + spacing.md,
    paddingBottom: 100,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: { marginBottom: spacing.md, gap: spacing.xs },
  favoriteBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.neutralSurface, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 9999, alignSelf: 'flex-start', marginBottom: spacing.md },
  favoriteBadgeIcon: { fontSize: 16, lineHeight: 16 },
  favoriteBadgeText: { ...typography.labelSm, fontWeight: '700', color: colors.primary },
  title: { ...typography.headlineSm, fontWeight: '700', color: colors.neutralDark, marginBottom: spacing.sm },
  subtitle: { ...typography.bodyMedium, fontWeight: '500', color: colors.neutralMid, marginBottom: spacing.md, lineHeight: 24 },
  pillRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 9999, backgroundColor: colors.neutralSurface },
  pillActive: { backgroundColor: colors.primary },
  pillCountBadge: { backgroundColor: colors.primaryDark, borderRadius: 9999, paddingHorizontal: spacing.xs, paddingVertical: 2, minWidth: 18, alignItems: 'center', justifyContent: 'center' },
  pillCountText: { ...typography.labelSm, color: colors.white, fontWeight: '700' },
  pillText: { ...typography.buttonLarge, color: colors.neutralDark },
  pillTextActive: { color: colors.white },
  emptyState: { alignItems: 'center', paddingTop: spacing.xl },
  emptySection: { alignItems: 'center', gap: spacing.md },
  emptyTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: spacing.md },
  emptyTopLabel: { ...typography.label, color: colors.neutralMid, fontWeight: '600' },
  emptyTopTag: { backgroundColor: colors.accent, borderRadius: 9999, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  emptyTopTagText: { ...typography.labelSm, color: colors.white, fontWeight: '700' },
  emptyCard: { width: '100%', backgroundColor: colors.neutralSurface, borderRadius: 16, padding: spacing.lg, alignItems: 'center', shadowColor: '#D4A781', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 2 },
  illustration: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4A781',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  illustrationIcon: { fontSize: 32, lineHeight: 32 },
  emptyContent: { alignItems: 'center', gap: spacing.xs, maxWidth: '90%' },
  illustrationText: { fontSize: 48 },
  emptyTitle: { ...typography.headlineSm, fontWeight: '700', color: colors.neutralDark, marginBottom: spacing.xs, textAlign: 'center' },
  emptyBody: { ...typography.bodyMedium, fontWeight: '400', color: colors.neutralMuted, textAlign: 'center', lineHeight: 24, marginBottom: spacing.md },
  ctaButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, width: '100%', maxWidth: 280, height: 52, backgroundColor: colors.primary, borderRadius: 16, shadowColor: colors.primaryDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  ctaIcon: { fontSize: 20, lineHeight: 20 },
  ctaText: { ...typography.headlineSm, fontWeight: '700', color: colors.white },
  resultsCount: { ...typography.bodyMedium, fontWeight: '500', color: colors.neutralMid, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'flex-start' },
  cardWrapper: { width: '47.5%' },
});

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography, headerHeight, SINGLE_COLUMN_MAX_WIDTH } from '../theme';
import { screenPadding } from '../theme/spacing';
import { t } from '../i18n/strings';
import { useRecipes, useRecipeCategories, useRecipeSearch } from '../data/queries';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import RecipeCardList from '../components/RecipeCardList';
import RecipeCardGrid from '../components/RecipeCardGrid';
import RecipeViewToggle from '../components/RecipeViewToggle';
import CategoryFilter from '../components/CategoryFilter';
import AppHeader from '../components/AppHeader';
import { useViewMode } from '../state/viewMode';
import { useNavigation } from '@react-navigation/native';

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const mode = useViewMode((s) => s.mode);

  // Keystrokes settle for 300ms before a request goes out; the input itself
  // stays fully controlled and instant.
  const debouncedQuery = useDebouncedValue(query.trim(), 300);

  // Empty search + no category = the shared cached catalog (the exact same
  // ['recipes'] query Home uses — no extra request, nothing filtered in JS).
  const catalogQuery = useRecipes();

  // Chip labels are the catalog's own canonical category values (Supabase).
  const categoriesQuery = useRecipeCategories();

  // Any active constraint (term or category) switches to server-side search;
  // the search query stays disabled otherwise, so the idle screen never fires
  // search requests.
  const isFiltering = debouncedQuery.length > 0 || selectedCategory !== null;
  const searchQuery = useRecipeSearch(debouncedQuery, selectedCategory, { enabled: isFiltering });

  const activeQuery = isFiltering ? searchQuery : catalogQuery;
  const results = activeQuery.data ?? [];
  const { isLoading, isError, refetch } = activeQuery;

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.pageTitle}>{t.nav.search}</Text>

        {/* Search input */}
        <View style={styles.searchRow}>
          <TextInput
            style={[styles.input, focused && styles.inputFocused]}
            placeholder={t.search.placeholder}
            placeholderTextColor={colors.neutralMuted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={() => setQuery('')} accessibilityLabel={t.search.clear}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Voice search chip */}
        <TouchableOpacity style={styles.voiceChip} activeOpacity={0.8}>
          <Text style={styles.voiceChipText}>🎙️ {t.search.voice}</Text>
        </TouchableOpacity>

        {/* Filter chips — canonical categories, shared with Home */}
        <CategoryFilter
          categories={categoriesQuery.data ?? []}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          allLabel={t.search.filters.all}
        />

        {/* Results count (hidden while the query is in the error state —
            "found 0" would read as a real answer next to the error message) */}
        {isFiltering && !isError && (
          <Text style={styles.resultsLabel}>{t.search.resultsLabel(results.length)}</Text>
        )}

        {/* View switcher sits right above the first result card */}
        {!isLoading && !isError && results.length > 0 && (
          <View style={styles.toolbarRow}>
            <RecipeViewToggle />
          </View>
        )}

        {/* Results: loading / error+retry / no-results / empty catalog / grid */}
        {isLoading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginVertical: spacing.xl }} />
        ) : isError ? (
          <View style={{ alignItems: 'center', marginVertical: spacing.xl }}>
            <Text style={styles.emptyText}>{t.common.loadError}</Text>
            <TouchableOpacity style={styles.filterChip} onPress={() => refetch()} accessibilityRole="button">
              <Text style={styles.filterChipText}>{t.common.retry}</Text>
            </TouchableOpacity>
          </View>
        ) : results.length === 0 && isFiltering ? (
          <Text style={styles.emptyText}>
            {debouncedQuery
              ? `ما لاقيناش وصفة بـ "${debouncedQuery}"`
              : `ما لاقيناش وصفة في "${selectedCategory}"`}
          </Text>
        ) : results.length === 0 ? (
          <View style={{ alignItems: 'center', marginVertical: spacing.xl }}>
            <Text style={styles.emptyTitle}>{t.home.empty}</Text>
            <Text style={styles.emptyText}>{t.home.emptyBody}</Text>
          </View>
        ) : (
          <View style={styles.resultsGrid}>
            {results.map((r) => (
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

        {/* Encouragement */}
        <View style={styles.encourageBox}>
          <Text style={styles.encourageTitle}>{t.search.encouragementTitle}</Text>
          <Text style={styles.encourageBody}>{t.search.encouragementBody}</Text>
          <TouchableOpacity style={styles.encourageCta} activeOpacity={0.85}>
            <Text style={styles.encourageCtaText}>{t.search.encouragementCta}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Fixed top header overlay */}
      <View style={styles.fixedHeader}>
        <AppHeader indicator={t.nav.search} />
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
  pageTitle: { ...typography.h1, color: colors.neutralDark, marginBottom: spacing.md },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  input: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.neutralDark,
    borderWidth: 1,
    borderColor: colors.border,
    ...typography.body,
  },
  inputFocused: { borderColor: colors.primary, borderWidth: 2 },
  clearBtn: { padding: spacing.sm, marginLeft: spacing.sm },
  clearText: { fontSize: 14, color: colors.neutralMuted },
  voiceChip: {
    backgroundColor: colors.primary,
    borderRadius: 9999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  voiceChipText: { ...typography.label, color: colors.white },
  filterChip: {
    backgroundColor: colors.neutralSurface,
    borderRadius: 9999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  filterChipText: { ...typography.label, color: colors.neutralMid },
  resultsLabel: { ...typography.body, color: colors.neutralMuted, marginBottom: spacing.md },
  // Toggle aligned to the physical left edge (RTL: flex-end resolves to left).
  toolbarRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: SINGLE_COLUMN_MAX_WIDTH,
    alignSelf: 'center',
  },
  cardWrapperFull: { width: '100%', marginBottom: spacing.md },
  cardWrapperGrid: { width: '48%', marginBottom: spacing.md },
  emptyText: { ...typography.bodyLarge, color: colors.neutralMuted, textAlign: 'center', marginVertical: spacing.xl },
  emptyTitle: { ...typography.h2, color: colors.neutralDark, marginBottom: spacing.sm, textAlign: 'center' },
  encourageBox: { backgroundColor: colors.secondaryLight, borderRadius: 12, padding: spacing.lg, marginTop: spacing.lg },
  encourageTitle: { ...typography.h2, color: colors.neutralDark, marginBottom: spacing.sm },
  encourageBody: { ...typography.body, color: colors.neutralMid, marginBottom: spacing.md },
  encourageCta: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center' },
  encourageCtaText: { ...typography.button, color: colors.white },
});

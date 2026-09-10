import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList, ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography, headerHeight } from '../theme';
import { screenPadding } from '../theme/spacing';
import { t } from '../i18n/strings';
import { useRecipes } from '../data/queries';
import { toArabicNumerals } from '../i18n/numerals';
import RecipeCard from '../components/RecipeCard';
import AppHeader from '../components/AppHeader';
import { useNavigation } from '@react-navigation/native';

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  // Single authoritative catalog: the same cached useRecipes() result Home uses.
  // Search still filters that loaded set client-side (real server search is Phase 5).
  const { data: recipes, isLoading, isError } = useRecipes();
  const results = (recipes ?? []).filter((r) =>
    r.title.includes(query) || r.description.includes(query) || r.category.includes(query)
  );

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

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {Object.entries(t.search.filters).map(([key, label]) => (
            <TouchableOpacity key={key} style={styles.filterChip} activeOpacity={0.8}>
              <Text style={styles.filterChipText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results count */}
        {query.length > 0 && (
          <Text style={styles.resultsLabel}>{t.search.resultsLabel(results.length)}</Text>
        )}

        {/* Results grid */}
        {isLoading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginVertical: spacing.xl }} />
        ) : isError ? (
          <Text style={styles.emptyText}>حدث خطأ في تحميل الوصفات</Text>
        ) : (
          <View style={styles.resultsGrid}>
            {results.map((r) => (
              <View key={r.id} style={styles.cardWrapper}>
                <RecipeCard
                  recipe={r}
                  onPress={() => navigation.navigate('RecipeDetail', { id: r.id })}
                />
              </View>
            ))}
          </View>
        )}

        {!isLoading && !isError && results.length === 0 && query.length > 0 && (
          <Text style={styles.emptyText}>ما لاقيناش وصفة بـ "{query}"</Text>
        )}

        {/* Encouragement */}
        <View style={styles.encourageBox}>
          <Text style={styles.encourageTitle}>{t.search.encouragmentTitle}</Text>
          <Text style={styles.encourageBody}>{t.search.encouragmentBody}</Text>
          <TouchableOpacity style={styles.encourageCta} activeOpacity={0.85}>
            <Text style={styles.encourageCtaText}>{t.search.encouragmentCta}</Text>
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
  filterRow: { gap: spacing.sm, paddingBottom: spacing.md },
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
  resultsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'flex-start' },
  cardWrapper: { width: '48%' },
  emptyText: { ...typography.bodyLarge, color: colors.neutralMuted, textAlign: 'center', marginVertical: spacing.xl },
  encourageBox: { backgroundColor: colors.secondaryLight, borderRadius: 12, padding: spacing.lg, marginTop: spacing.lg },
  encourageTitle: { ...typography.h2, color: colors.neutralDark, marginBottom: spacing.sm },
  encourageBody: { ...typography.body, color: colors.neutralMid, marginBottom: spacing.md },
  encourageCta: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center' },
  encourageCtaText: { ...typography.button, color: colors.white },
});

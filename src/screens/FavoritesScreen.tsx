import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';
import { screenPadding } from '../theme/spacing';
import { t } from '../i18n/strings';
import { useFavorites } from '../state/favorites';
import { placeholderRecipes } from '../data/recipes';
import RecipeCard from '../components/RecipeCard';
import { useNavigation } from '@react-navigation/native';

export default function FavoritesScreen() {
  const navigation = useNavigation<any>();
  const { favorites } = useFavorites();
  const count = favorites.size;

  const favRecipes = placeholderRecipes.filter((r) => favorites.has(r.id));

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t.favorites.title}</Text>
          <Text style={styles.subtitle}>{t.favorites.subtitle}</Text>
          <View style={styles.pillRow}>
            <View style={styles.pill}><Text style={styles.pillText}>{t.favorites.filters.all}</Text></View>
            <View style={styles.pill}><Text style={styles.pillText}>{t.favorites.filters.tried}</Text></View>
          </View>
        </View>

        {count === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.illustration}>
              <Text style={styles.illustrationText}>🍲 ❤️</Text>
            </View>
            <Text style={styles.emptyTitle}>{t.favorites.emptyTitle}</Text>
            <Text style={styles.emptyBody}>{t.favorites.emptyBody}</Text>
            <TouchableOpacity style={styles.ctaButton} activeOpacity={0.85} onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}>
              <Text style={styles.ctaText}>{t.favorites.emptyCta}</Text>
            </TouchableOpacity>
            <Text style={styles.emptyHint}>{t.favorites.emptyHint} <Text style={styles.emptyHintTag}>{t.favorites.emptyHintTag}</Text></Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>{`${count} وصفة مفضلة`}</Text>
            <View style={styles.grid}>
              {favRecipes.map((r) => (
                <RecipeCard
                  key={r.id}
                  recipe={r}
                  onPress={() => navigation.navigate('RecipeDetail', { id: r.id })}
                />
              ))}
            </View>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.secondary },
  scroll: { paddingHorizontal: screenPadding.horizontal, paddingVertical: spacing.xl, paddingBottom: 100 },
  header: { marginBottom: spacing.xl },
  title: { ...typography.h1, color: colors.neutralDark, marginBottom: spacing.sm },
  subtitle: { ...typography.bodyLarge, color: colors.neutralMid, marginBottom: spacing.md },
  pillRow: { flexDirection: 'row', gap: spacing.sm },
  pill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 9999, borderWidth: 1, borderColor: colors.border },
  pillText: { ...typography.label, color: colors.neutralMid },
  emptyState: { alignItems: 'center', paddingTop: spacing.xl },
  illustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  illustrationText: { fontSize: 48 },
  emptyTitle: { ...typography.h2, color: colors.neutralDark, marginBottom: spacing.md },
  emptyBody: { ...typography.body, color: colors.neutralMuted, textAlign: 'center', marginBottom: spacing.xl, paddingHorizontal: spacing.sm },
  ctaButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: 12, ...{ shadowColor: colors.primaryDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 } },
  ctaText: { ...typography.button, color: colors.white },
  emptyHint: { ...typography.bodySmall, color: colors.neutralLight, textAlign: 'center', marginTop: spacing.md },
  emptyHintTag: { color: colors.accent, fontWeight: '600' },
  resultsCount: { ...typography.bodyLarge, color: colors.neutralMid, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between' },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, headerHeight } from '../theme';
import { screenPadding } from '../theme/spacing';
import { t } from '../i18n/strings';
import { useRecipes } from '../data/queries';
import RecipeCard from '../components/RecipeCard';
import AppHeader from '../components/AppHeader';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { data: recipes, isLoading, isError, refetch } = useRecipes();
  const list = recipes ?? [];
  const heroRecipe = list[0];
  const feedRecipes = list.slice(1);

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
              onVoicePress={() => console.log('voice', heroRecipe.id)}
              variant="hero"
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

        {/* Feed */}
        <Text style={styles.feedHeader}>{t.home.feedHeader}</Text>
        <Text style={styles.feedSub}>{t.home.feedSubheader}</Text>

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
              <View key={r.id} style={styles.cardWrapper}>
                <RecipeCard
                  recipe={r}
                  onPress={() => navigation.navigate('RecipeDetail', { id: r.id })}
                  onVoicePress={r.audioAvailable ? () => console.log('voice', r.id) : undefined}
                />
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
  feedHeader: { ...typography.h2, color: colors.neutralDark, marginBottom: spacing.sm },
  feedSub: { ...typography.body, color: colors.neutralMuted, marginBottom: spacing.lg },
  feedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'flex-start' },
  cardWrapper: { width: '48%' },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, buttonSize } from '../theme';
import { screenPadding } from '../theme/spacing';
import { t } from '../i18n/strings';
import { useRecipes } from '../data/queries';
import RecipeCard from '../components/RecipeCard';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { data: recipes, isLoading, isError } = useRecipes();
  const heroRecipe = recipes?.[0];
  const feedRecipes = recipes?.slice(1) ?? [];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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
          <Text style={{ ...typography.body, color: colors.neutralMuted, textAlign: 'center', marginVertical: spacing.xl }}>
            حدث خطأ في تحميل الوصفات
          </Text>
        ) : (
          <View style={styles.feedGrid}>
            {feedRecipes.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                onPress={() => navigation.navigate('RecipeDetail', { id: r.id })}
                onVoicePress={r.audioAvailable ? () => console.log('voice', r.id) : undefined}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.secondary },
  scroll: { paddingHorizontal: screenPadding.horizontal, paddingBottom: 100 },
  greeting: { marginTop: spacing.xl, marginBottom: spacing.xl },
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
  feedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center' },
});

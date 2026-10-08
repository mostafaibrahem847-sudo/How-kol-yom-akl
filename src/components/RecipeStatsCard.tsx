import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { colors, spacing, typography, radius, elevation } from '../theme';
import { toArabicNumerals } from '../i18n/numerals';
import { t } from '../i18n/strings';
import type { RecipeDetail } from '../types/recipe';
import { statValueText } from './recipeDetailSharedStyles';

type FeatherName = keyof typeof Feather.glyphMap;

type Props = {
  recipe: RecipeDetail;
};

export default function RecipeStatsCard({ recipe }: Props) {
  const stats: { key: string; icon: FeatherName; label: string; value: string }[] = [
    {
      key: 'time',
      icon: 'clock',
      label: t.recipeDetail.stats.time,
      value: `${toArabicNumerals(recipe.minutes)} ${t.common.minutes}`,
    },
    {
      key: 'persons',
      icon: 'users',
      label: t.recipeDetail.stats.persons,
      value: `${toArabicNumerals(recipe.persons)} ${t.common.persons}`,
    },
  ];
  if (recipe.difficulty) {
    stats.push({
      key: 'difficulty',
      icon: 'zap',
      label: t.recipeDetail.stats.difficulty,
      value: recipe.difficulty,
    });
  }
  if (recipe.rating) {
    stats.push({
      key: 'rating',
      icon: 'star',
      label: t.recipeDetail.stats.rating,
      value: toArabicNumerals(recipe.rating),
    });
  }

  return (
    <View style={styles.statsCard}>
      {stats.map((stat, index) => (
        <React.Fragment key={stat.key}>
          {index > 0 ? <View style={styles.statDivider} /> : null}
          <View style={styles.statItem}>
            <Feather
              name={stat.icon}
              size={16}
              color={colors.primary}
              style={styles.statIcon}
            />
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue} numberOfLines={1}>
              {stat.value}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  statsCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.secondaryLight,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(244,162,97,0.35)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    ...elevation.cardResting,
  },
  statItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  statIcon: { marginBottom: 2 },
  statLabel: {
    ...typography.caption,
    color: colors.neutralMuted,
    marginBottom: 1,
    textAlign: 'center',
  },
  statValue: { ...statValueText, color: colors.neutralDark, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(244,162,97,0.35)', marginVertical: spacing.xs },
});

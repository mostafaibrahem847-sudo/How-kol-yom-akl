import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, elevation, fontWeight, fontFamily } from '../theme';
import { Recipe } from '../types/recipe';
import CategoryChip from './CategoryChip';
import RecipeCardMedia from './RecipeCardMedia';
import RecipeMeta from './RecipeMeta';

const CARD_WIDE_MAX = 520;

type Props = {
  recipe: Recipe;
  onPress: () => void;
};

// Vertical card for the two-column grid: image on top, then the category
// badge, the title (capped at two lines) and the meta line. Shares its props
// and all media/favorite logic with RecipeCardList.
export default function RecipeCardGrid({ recipe, onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.card}>
      <RecipeCardMedia recipe={recipe} style={styles.media} />

      <View style={styles.content}>
        <View style={styles.chipRow}>
          <CategoryChip label={recipe.category} color={recipe.categoryColor ?? 'olive'} dense />
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {recipe.title}
        </Text>

        <RecipeMeta
          minutes={recipe.minutes}
          persons={recipe.persons}
          difficulty={recipe.difficulty}
          compact
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: CARD_WIDE_MAX,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.cardResting,
  },
  media: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
  },
  content: {
    padding: spacing.md,
  },
  chipRow: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    overflow: 'hidden',
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: fontWeight.bold,
    color: colors.neutralDark,
    marginBottom: spacing.sm,
  },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, elevation, fontFamilyFor } from '../theme';
import { Recipe } from '../types/recipe';
import CategoryChip from './CategoryChip';
import RecipeCardMedia from './RecipeCardMedia';
import RecipeMeta from './RecipeMeta';

// Full-width horizontal card: image half on the physical right (RTL first
// child), content on the left. A fixed height keeps every row uniform.
const CARD_HEIGHT = 116;
const CARD_WIDE_MAX = 520;

type Props = {
  recipe: Recipe;
  onPress: () => void;
};

export default function RecipeCardList({ recipe, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { height: CARD_HEIGHT }]}
    >
      <View style={styles.row}>
        {/* Image half — physically the right side of the card (RTL app) */}
        <RecipeCardMedia recipe={recipe} style={styles.media} />

        {/* Content half — physically the left side of the card */}
        <View style={styles.content}>
          <View style={styles.chipRow}>
            <CategoryChip label={recipe.category} color={recipe.categoryColor ?? 'olive'} dense />
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {recipe.title}
          </Text>

          <View style={styles.spacer} />

          <RecipeMeta
            minutes={recipe.minutes}
            persons={recipe.persons}
            difficulty={recipe.difficulty}
          />
        </View>
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
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  media: {
    width: '40%',
    // The image half is physically the right side of the card, so only its
    // right corners carry the card radius.
    borderTopRightRadius: radius.card,
    borderBottomRightRadius: radius.card,
  },
  content: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  chipRow: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    overflow: 'hidden',
    borderRadius: 4,
  },
  title: {
    // Same family/weight as the RecipeDetail title (fontFamilyFor('800'));
    // fontSize stays reduced to fit the list card.
    fontFamily: fontFamilyFor('800'),
    fontSize: 15,
    lineHeight: 21,
    fontWeight: 'normal',
    color: colors.neutralDark,
    marginTop: 6,
  },
  spacer: { flex: 1, minHeight: 6 },
});

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { colors, spacing, typography, radius, fontFamilyFor } from '../theme';
import { t } from '../i18n/strings';
import { strongText, statValueText, rowPressed, emptyText } from './recipeDetailSharedStyles';

type Ingredient = { id: string; text: string };

function IngredientRow({
  text,
  checked,
  onToggle,
}: {
  text: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.ingredientRow, pressed && rowPressed]}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={text}
    >
      <View style={styles.ingredientLeft}>
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && <Feather name="check" size={13} color={colors.white} />}
        </View>
        <Text
          style={[styles.ingredientText, checked && styles.ingredientTextChecked]}
          numberOfLines={2}
        >
          {text}
        </Text>
      </View>
    </Pressable>
  );
}

type Props = {
  ingredients: Ingredient[];
  checked: Set<string>;
  onToggle: (id: string) => void;
};

export default function RecipeIngredientsTab({ ingredients, checked, onToggle }: Props) {
  const totalCount = ingredients.length;
  const checkedCount = checked.size;

  return (
    <View>
      <View style={styles.ingredientsHeader}>
        <Text style={styles.ingredientsHelper} numberOfLines={2}>
          {t.recipeDetail.ingredientsHelper}
        </Text>
        {checkedCount > 0 ? (
          <View style={styles.counterPill}>
            <Text style={styles.counterPillText}>
              {t.recipeDetail.ingredientsCounter(checkedCount, totalCount)}
            </Text>
          </View>
        ) : null}
      </View>

      {totalCount === 0 ? (
        <Text style={emptyText}>{t.recipeDetail.noIngredients}</Text>
      ) : (
        ingredients.map((ing) => (
          <IngredientRow
            key={ing.id}
            text={ing.text}
            checked={checked.has(ing.id)}
            onToggle={() => onToggle(ing.id)}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ingredientsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: 2,
  },
  ingredientsHelper: {
    ...typography.bodySmall,
    ...strongText,
    color: colors.neutralMuted,
    flex: 1,
    textAlign: 'left',
  },
  counterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutralSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    flexShrink: 0,
  },
  counterPillText: { ...statValueText, color: colors.primary },
  ingredientRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    marginBottom: 6,
  },
  ingredientLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  ingredientText: {
    flex: 1,
    fontFamily: fontFamilyFor('600'),
    fontWeight: 'normal',
    fontSize: 13,
    lineHeight: 19,
    color: colors.neutralMid,
    textAlign: 'left',
  },
  ingredientTextChecked: {
    textDecorationLine: 'line-through',
    color: colors.neutralLight,
  },
});

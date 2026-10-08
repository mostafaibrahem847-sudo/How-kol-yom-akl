import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, elevation } from '../theme';
import { t } from '../i18n/strings';
import { strongText, rowPressed } from './recipeDetailSharedStyles';

export type DetailTab = 'ingredients' | 'steps' | 'tips';

type Props = {
  activeTab: DetailTab;
  onChange: (tab: DetailTab) => void;
  ingredientCount: number;
  stepCount: number;
};

function DetailTabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.tab,
        active && styles.tabActive,
        pressed && rowPressed,
      ]}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      hitSlop={{ top: 2, bottom: 2 }}
    >
      {active ? <View style={styles.tabDot} /> : null}
      <Text
        style={[styles.tabText, active && styles.tabTextActive]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function RecipeTabs({ activeTab, onChange, ingredientCount, stepCount }: Props) {
  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      <DetailTabButton
        label={t.recipeDetail.tabIngredients(ingredientCount)}
        active={activeTab === 'ingredients'}
        onPress={() => onChange('ingredients')}
      />
      <DetailTabButton
        label={t.recipeDetail.tabSteps(stepCount)}
        active={activeTab === 'steps'}
        onPress={() => onChange('steps')}
      />
      <DetailTabButton
        label={t.recipeDetail.tabTips}
        active={activeTab === 'tips'}
        onPress={() => onChange('tips')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.neutralSurface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(244,162,97,0.3)',
    padding: spacing.xs,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    borderRadius: radius.input,
  },
  tabActive: { backgroundColor: colors.primary, ...elevation.cardResting },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
    marginLeft: spacing.xs,
  },
  tabText: {
    ...strongText,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.neutralMid,
    textAlign: 'center',
  },
  tabTextActive: { color: colors.white },
});

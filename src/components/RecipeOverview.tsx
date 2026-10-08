import React from 'react';
import { View, Text, StyleSheet, type TextStyle } from 'react-native';
import { colors, spacing, typography, radius, screenPadding, fontFamilyFor } from '../theme';
import { strongText } from './recipeDetailSharedStyles';

const titleText: TextStyle = {
  fontFamily: fontFamilyFor('800'),
  fontSize: 22,
  lineHeight: 31,
  fontWeight: 'normal',
};

type Props = {
  title: string;
  description: string;
  occasion?: string;
  children?: React.ReactNode;
};

export default function RecipeOverview({ title, description, occasion, children }: Props) {
  return (
    <View style={styles.overview}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {occasion ? (
          <View style={styles.occasionBadge}>
            <Text style={styles.occasionBadgeText} numberOfLines={1}>
              {occasion}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.description}>{description}</Text>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  overview: {
    paddingHorizontal: screenPadding.horizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: { ...titleText, color: colors.neutralDark, flex: 1, minWidth: 0, textAlign: 'left' },
  occasionBadge: {
    backgroundColor: colors.neutralSurface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    maxWidth: '42%',
  },
  occasionBadgeText: {
    ...typography.labelSm,
    ...strongText,
    color: colors.accent,
    textAlign: 'left',
  },
  description: {
    ...typography.body,
    color: colors.neutralMuted,
    textAlign: 'left',
    marginBottom: spacing.md,
  },
});

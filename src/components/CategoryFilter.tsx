import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../theme';

// Horizontal, scrollable category filter shared by Home and Search. The chip
// labels are the catalog's own canonical `category` values plus a leading "all"
// chip; tapping the active chip (or "all") clears the selection.
type Props = {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
  allLabel: string;
};

export default function CategoryFilter({ categories, selected, onSelect, allLabel }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {[allLabel, ...categories].map((label) => {
        const isAllChip = label === allLabel;
        const isActive = isAllChip ? selected === null : selected === label;
        return (
          <TouchableOpacity
            key={label}
            style={[styles.chip, isActive && styles.chipActive]}
            activeOpacity={0.8}
            hitSlop={{ top: 5, bottom: 5 }}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onSelect(isAllChip || isActive ? null : label)}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingBottom: spacing.md },
  chip: {
    backgroundColor: colors.neutralSurface,
    borderRadius: 9999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  chipText: { ...typography.label, color: colors.neutralMid },
  // Selected chip: same shape, primary fill — mirrors the app's existing
  // active-pill language (FavoritesScreen pillActive).
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTextActive: { color: colors.white },
});

import type { TextStyle, ViewStyle } from 'react-native';
import { colors, spacing, screenPadding, typography, fontFamilyFor } from '../theme';

// Style fragments shared by more than one RecipeDetail section. Kept in one
// place so the split components cannot drift visually from each other. Values
// are copied verbatim from the original RecipeDetailScreen styles.

export const strongText: TextStyle = {
  fontFamily: fontFamilyFor('700'),
  fontWeight: 'normal',
};

export const extraStrongText: TextStyle = {
  fontFamily: fontFamilyFor('800'),
  fontWeight: 'normal',
};

export const statValueText: TextStyle = {
  fontFamily: fontFamilyFor('700'),
  fontSize: 12,
  lineHeight: 17,
  fontWeight: 'normal',
};

export const rowPressed: ViewStyle = { opacity: 0.7 };

export const btnPressed: ViewStyle = { opacity: 0.9, transform: [{ scale: 0.98 }] };

export const emptyText: TextStyle = {
  ...typography.body,
  color: colors.neutralMuted,
  textAlign: 'left',
  paddingVertical: spacing.md,
};

export const headerBar: ViewStyle = {
  position: 'absolute',
  top: spacing.sm,
  left: screenPadding.horizontal,
  right: screenPadding.horizontal,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  zIndex: 20,
};

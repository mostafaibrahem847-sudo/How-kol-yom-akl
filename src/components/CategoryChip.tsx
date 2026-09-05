import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

type Props = {
  label: string;
  color?: 'olive' | 'amber' | 'mint' | 'terracottaLight' | 'oliveDark';
  small?: boolean;
};

export default function CategoryChip({ label, color = 'olive', small = false }: Props) {
  const bgColor =
    color === 'olive' ? colors.accent :
    color === 'amber' ? colors.success :
    color === 'mint' ? colors.accentLight :
    color === 'terracottaLight' ? colors.primaryLight :
    color === 'oliveDark' ? colors.accentDark :
    colors.accent;

  return (
    <View style={[styles.chip, { backgroundColor: bgColor, paddingHorizontal: small ? spacing.sm : spacing.md, paddingVertical: small ? 2 : spacing.xs }]}>
      <Text style={[styles.text, { fontSize: small ? 10 : 11 }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    color: colors.white,
    ...typography.label,
    fontWeight: '600',
  },
});

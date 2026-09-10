import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

type Props = {
  label: string;
  color?: 'olive' | 'amber' | 'mint' | 'terracottaLight' | 'oliveDark';
  small?: boolean;
  /** Extra-compact vertical metrics for the compact horizontal recipe tile. */
  dense?: boolean;
};

export default function CategoryChip({ label, color = 'olive', small = false, dense = false }: Props) {
  const bgColor =
    color === 'olive' ? colors.accent :
    color === 'amber' ? colors.success :
    color === 'mint' ? colors.accentLight :
    color === 'terracottaLight' ? colors.primaryLight :
    color === 'oliveDark' ? colors.accentDark :
    colors.accent;

  return (
    <View style={[styles.chip, { backgroundColor: bgColor, paddingHorizontal: small || dense ? spacing.sm : spacing.md, paddingVertical: small || dense ? 2 : spacing.xs }]}>
      <Text
        style={[styles.text, dense ? styles.textDense : small ? styles.textSmall : styles.textDefault]}
        numberOfLines={1}
      >
        {label}
      </Text>
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
  textDefault: { fontSize: 11 },
  textSmall: { fontSize: 10 },
  // Compact card chip: tighter line box so the chip stays small without
  // changing the chip sizes used elsewhere (detail screen keeps textDefault).
  textDense: { fontSize: 10, lineHeight: 15 },
});

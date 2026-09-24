import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { colors, fontFamily } from '../theme';
import { toArabicNumerals } from '../i18n/numerals';
import { t } from '../i18n/strings';

// Shared meta line (time · servings · difficulty) used by both card layouts so
// the two presentations never drift apart.
type Props = {
  minutes: number;
  persons: number;
  difficulty?: string;
  /** Tighter metrics for the narrow two-column grid card. */
  compact?: boolean;
};

export default function RecipeMeta({ minutes, persons, difficulty, compact = false }: Props) {
  const textStyle = compact ? styles.textCompact : styles.text;
  const dotStyle = compact ? styles.dotCompact : styles.dot;

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <Feather name="clock" size={12} color={colors.neutralMuted} />
      <Text style={textStyle} numberOfLines={1}>
        {toArabicNumerals(minutes)} {t.common.minutes}
      </Text>
      {persons ? (
        <>
          <Text style={dotStyle}>·</Text>
          <Text style={textStyle} numberOfLines={1}>
            {toArabicNumerals(persons)} {t.common.persons}
          </Text>
        </>
      ) : null}
      {difficulty ? (
        <>
          <Text style={dotStyle}>·</Text>
          <Text style={textStyle} numberOfLines={1}>
            {difficulty}
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  rowCompact: { gap: 3 },
  text: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    color: colors.neutralMuted,
    flexShrink: 1,
  },
  textCompact: {
    fontFamily,
    fontSize: 11,
    lineHeight: 15,
    color: colors.neutralMuted,
    flexShrink: 1,
  },
  dot: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    color: colors.neutralLight,
    marginHorizontal: 2,
  },
  dotCompact: {
    fontFamily,
    fontSize: 11,
    lineHeight: 15,
    color: colors.neutralLight,
    marginHorizontal: 1,
  },
});

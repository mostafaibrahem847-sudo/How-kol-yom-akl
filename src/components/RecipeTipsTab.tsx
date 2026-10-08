import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { colors, spacing, typography, radius } from '../theme';
import { t } from '../i18n/strings';
import { strongText, emptyText } from './recipeDetailSharedStyles';

type Tip = { id: string; title: string; body: string };

type Props = {
  tips: Tip[];
};

export default function RecipeTipsTab({ tips }: Props) {
  if (tips.length === 0) {
    return <Text style={emptyText}>{t.recipeDetail.noTips}</Text>;
  }

  return (
    <>
      {tips.map((tip) => (
        <View key={tip.id} style={styles.tipCard}>
          <View style={styles.tipTitleRow}>
            <Feather name="star" size={14} color={colors.accentDark} />
            <Text style={styles.tipTitle}>{tip.title}</Text>
          </View>
          <Text style={styles.tipBody}>{tip.body}</Text>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  tipCard: {
    backgroundColor: colors.secondaryLight,
    borderWidth: 1,
    borderColor: 'rgba(244,162,97,0.35)',
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  tipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  tipTitle: {
    ...strongText,
    fontSize: 14,
    lineHeight: 20,
    color: colors.accentDark,
    flex: 1,
    textAlign: 'left',
  },
  tipBody: {
    ...typography.bodySmall,
    fontSize: 13,
    lineHeight: 21,
    color: colors.neutralMid,
    textAlign: 'left',
  },
});

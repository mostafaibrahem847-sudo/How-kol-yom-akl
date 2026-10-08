import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { colors, spacing, typography, radius, elevation } from '../theme';
import { toArabicNumerals } from '../i18n/numerals';
import { t } from '../i18n/strings';
import { strongText, extraStrongText, rowPressed, emptyText } from './recipeDetailSharedStyles';

type Step = { id: string; title: string; body: string };

function StepAccordion({
  number,
  title,
  body,
  open,
  onToggle,
}: {
  number: number;
  title: string;
  body: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.stepCard}>
      <Pressable
        style={({ pressed }) => [styles.stepHeader, pressed && rowPressed]}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={open ? t.recipeDetail.collapseStep : t.recipeDetail.expandStep}
        hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
      >
        <View style={styles.stepHeaderStart}>
          <View style={styles.stepNumberBox}>
            <Text style={styles.stepNumberText}>{toArabicNumerals(number)}</Text>
          </View>
          <Text style={styles.stepTitle} numberOfLines={2}>
            {title}
          </Text>
        </View>
        <Feather
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.neutralMuted}
        />
      </Pressable>

      {open ? (
        <View style={styles.stepBody}>
          <Text style={styles.stepBodyText}>{body}</Text>
        </View>
      ) : null}
    </View>
  );
}

type Props = {
  steps: Step[];
  openStepId: string | null;
  onToggle: (stepId: string) => void;
};

export default function RecipeStepsTab({ steps, openStepId, onToggle }: Props) {
  if (steps.length === 0) {
    return <Text style={emptyText}>{t.recipeDetail.noSteps}</Text>;
  }

  return (
    <>
      {steps.map((step, i) => (
        <StepAccordion
          key={step.id}
          number={i + 1}
          title={step.title}
          body={step.body}
          open={openStepId === step.id}
          onToggle={() => onToggle(step.id)}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  stepCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    ...elevation.cardResting,
  },
  stepHeader: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
  },
  stepHeaderStart: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepNumberBox: {
    width: 26,
    height: 26,
    borderRadius: radius.input,
    backgroundColor: colors.secondaryLight,
    borderWidth: 1,
    borderColor: 'rgba(244,162,97,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumberText: { ...extraStrongText, fontSize: 12, lineHeight: 16, color: colors.primary },
  stepTitle: {
    ...strongText,
    fontSize: 13,
    lineHeight: 19,
    color: colors.neutralDark,
    flex: 1,
    textAlign: 'left',
  },
  stepBody: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
  },
  stepBodyText: {
    ...typography.body,
    color: colors.neutralMid,
    textAlign: 'left',
    lineHeight: 23,
  },
});

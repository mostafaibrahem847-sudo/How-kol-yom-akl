import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { colors, spacing, typography, radius, screenPadding } from '../theme';
import { t } from '../i18n/strings';
import GlassIconButton from './GlassIconButton';
import { btnPressed, headerBar } from './recipeDetailSharedStyles';

type Props = {
  status: 'loading' | 'missing' | 'error';
  onBack: () => void;
  onRetry: () => void;
};

export default function RecipeDetailState({ status, onBack, onRetry }: Props) {
  if (status === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const missing = status === 'missing';
  return (
    <View style={styles.root}>
      <View style={headerBar}>
        <GlassIconButton
          onPress={onBack}
          accessibilityLabel={t.common.back}
        >
          <Feather name="arrow-right" size={20} color={colors.primary} />
        </GlassIconButton>
        <View style={styles.glassSpacer} />
      </View>

      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {missing ? t.recipeDetail.notFound : t.recipeDetail.loadError}
        </Text>
        {missing ? <Text style={styles.errorBody}>{t.recipeDetail.notFoundBody}</Text> : null}
        {!missing ? (
          <Pressable
            style={({ pressed }) => [styles.retryBtn, pressed && btnPressed]}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel={t.common.retry}
          >
            <Text style={styles.retryBtnText}>{t.common.retry}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.secondary },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: screenPadding.horizontal,
  },
  glassSpacer: { width: 40, height: 40 },
  errorText: { ...typography.bodyLarge, color: colors.neutralMid, marginBottom: spacing.sm },
  errorBody: {
    ...typography.body,
    color: colors.neutralMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryBtn: {
    marginTop: spacing.sm,
    height: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: { ...typography.button, color: colors.white },
});

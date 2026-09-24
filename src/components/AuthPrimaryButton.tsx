import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography, elevation } from '../theme';

type AuthButtonVariant = 'primary' | 'outline';

type AuthPrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  /** 'primary' is the filled brand button; 'outline' is used for the Google action. */
  variant?: AuthButtonVariant;
  /** Optional leading glyph (e.g. the Google icon). Hidden while loading. */
  icon?: React.ReactNode;
};

export default function AuthPrimaryButton({
  label,
  onPress,
  loading,
  loadingLabel,
  disabled,
  variant = 'primary',
  icon,
}: AuthPrimaryButtonProps) {
  const blocked = disabled || loading;
  const isOutline = variant === 'outline';
  // The filled button always sits on a dark/colored surface; the outline button
  // sits on the cream background, so its spinner must use a visible tone.
  const spinnerColor = isOutline ? colors.primary : colors.white;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isOutline ? styles.buttonOutline : styles.buttonPrimary,
        blocked && styles.buttonBlocked,
      ]}
      onPress={onPress}
      disabled={blocked}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!blocked, busy: !!loading }}
    >
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={spinnerColor} />
          {loadingLabel ? (
            <Text style={[styles.label, isOutline && styles.labelOutline]}>{loadingLabel}</Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.contentRow}>
          {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
          <Text style={[styles.label, isOutline && styles.labelOutline]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonPrimary: { backgroundColor: colors.primary, ...elevation.primary },
  buttonOutline: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonBlocked: { opacity: 0.6 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  label: { ...typography.button, color: colors.white },
  labelOutline: { color: colors.primary },
});

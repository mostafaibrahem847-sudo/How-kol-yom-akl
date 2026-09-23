import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography, elevation } from '../theme';

type AuthPrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
};

export default function AuthPrimaryButton({
  label,
  onPress,
  loading,
  loadingLabel,
  disabled,
}: AuthPrimaryButtonProps) {
  const blocked = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.button, blocked && styles.buttonBlocked]}
      onPress={onPress}
      disabled={blocked}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!blocked, busy: !!loading }}
    >
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.white} />
          {loadingLabel ? <Text style={styles.label}>{loadingLabel}</Text> : null}
        </View>
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.input,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    ...elevation.primary,
  },
  buttonBlocked: { opacity: 0.6 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { ...typography.button, color: colors.white },
});

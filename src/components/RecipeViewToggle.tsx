import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { colors, spacing, radius } from '../theme';
import { t } from '../i18n/strings';
import { useViewMode, type RecipeViewMode } from '../state/viewMode';

type ToggleIcon = 'list' | 'grid';

const OPTIONS: { mode: RecipeViewMode; icon: ToggleIcon; label: string }[] = [
  { mode: 'list', icon: 'list', label: t.viewMode.list },
  { mode: 'grid', icon: 'grid', label: t.viewMode.grid },
];

// Compact segmented control backed by the shared view-mode store, so Home and
// Search always read and write the same value. Each option is a >=44x44 touch
// target; the active one is filled with the brand primary, the inactive muted.
export default function RecipeViewToggle() {
  const mode = useViewMode((s) => s.mode);
  const setMode = useViewMode((s) => s.setMode);

  return (
    <View style={styles.container}>
      {OPTIONS.map((option) => {
        const selected = mode === option.mode;
        return (
          <TouchableOpacity
            key={option.mode}
            style={[styles.button, selected && styles.buttonActive]}
            onPress={() => setMode(option.mode)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
          >
            <Feather
              name={option.icon}
              size={20}
              color={selected ? colors.white : colors.neutralMuted}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutralSurface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: colors.primary,
  },
});

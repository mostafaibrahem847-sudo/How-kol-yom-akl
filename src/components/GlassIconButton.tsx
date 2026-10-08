import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { elevation } from '../theme';

// Circular translucent "glass" control used by the floating recipe top bar and
// the missing/error header. Extracted so both share one identical hit area,
// opacity, border and elevation instead of duplicating the style.
const SIZE = 40;

type Props = {
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityState?: { selected?: boolean };
  children: React.ReactNode;
};

export default function GlassIconButton({
  onPress,
  accessibilityLabel,
  accessibilityState,
  children,
}: Props) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      activeOpacity={0.85}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: 'rgba(253,251,247,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.cardResting,
  },
});

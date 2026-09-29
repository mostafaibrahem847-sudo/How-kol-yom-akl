import React from 'react';
import { Text, Pressable, StyleSheet, TextStyle } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { colors, spacing, radius, fontFamilyFor } from '../theme';
import { t } from '../i18n/strings';
import type { AudioPlayerHook } from '../hooks/useAudioPlayer';

// "اسمعني" (listen) action that sits to the start of the sticky bottom bar's
// primary button, on every recipe detail screen. Kept as a sibling of the
// primary button rather than merged into it, so "start cooking" stays the
// single strongest action on the screen.
//
// Shown on every recipe: when there is no narration yet it renders in a
// disabled state, so the bottom bar's layout is identical across recipes.
// Generic by design — it is driven entirely by the props it is handed.
type Props = {
  recipeId: string;
  enabled: boolean;
  audio: AudioPlayerHook;
};

const strongText: TextStyle = {
  fontFamily: fontFamilyFor('700'),
  fontWeight: 'normal',
};

export default function ListenButton({ recipeId, enabled, audio }: Props) {
  const active = enabled && audio.isPlaying;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.listenBtn,
        active && styles.listenBtnActive,
        !enabled && styles.listenBtnDisabled,
        pressed && enabled && styles.btnPressed,
      ]}
      onPress={enabled ? audio.togglePlay : undefined}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !enabled }}
      accessibilityLabel={enabled ? t.recipeDetail.micButton : t.recipeDetail.audioUnavailable}
      testID={`listen-button-${recipeId}`}
    >
      <Feather
        name="mic"
        size={16}
        color={active ? colors.white : enabled ? colors.primary : colors.neutralLight}
      />
      <Text
        style={[
          styles.listenText,
          active && styles.listenTextActive,
          !enabled && styles.listenTextDisabled,
        ]}
      >
        {t.recipeDetail.micButton}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  listenBtn: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.secondaryLight,
    borderWidth: 1,
    borderColor: 'rgba(211,84,0,0.4)',
  },
  listenBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  listenBtnDisabled: {
    backgroundColor: colors.neutralSurface,
    borderColor: colors.border,
  },
  listenText: { ...strongText, fontSize: 13, lineHeight: 18, color: colors.primary },
  listenTextActive: { color: colors.white },
  listenTextDisabled: { color: colors.neutralLight },
  btnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
});

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, radius, elevation, screenPadding } from '../theme';
import { t } from '../i18n/strings';
import ListenButton from './ListenButton';
import { strongText, btnPressed } from './recipeDetailSharedStyles';
import type { AudioPlayerHook } from '../hooks/useAudioPlayer';

// Reserved height of the sticky bottom bar's own content (buttons + padding),
// excluding the device bottom inset which is added at runtime by the screen.
export const BOTTOM_BAR_CONTENT = 44 + spacing.sm * 2;

type Props = {
  recipeId: string;
  showAudio: boolean;
  audio: AudioPlayerHook;
  bottomInset: number;
  onStartCooking: () => void;
};

export default function RecipeStickyBar({
  recipeId,
  showAudio,
  audio,
  bottomInset,
  onStartCooking,
}: Props) {
  return (
    <View style={[styles.bottomBar, { paddingBottom: bottomInset + spacing.sm }]}>
      {showAudio ? (
        <ListenButton recipeId={recipeId} enabled={showAudio} audio={audio} />
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.primaryBtn, pressed && btnPressed]}
        onPress={onStartCooking}
        accessibilityRole="button"
        accessibilityLabel={t.recipeDetail.startCooking}
      >
        <MaterialCommunityIcons
          name="pot-steam-outline"
          size={17}
          color={colors.white}
        />
        <Text style={styles.primaryBtnText}>{t.recipeDetail.startCooking}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: screenPadding.horizontal,
    paddingTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    zIndex: 30,
    shadowColor: '#3e1d02',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  primaryBtn: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.card,
    backgroundColor: colors.primary,
    ...elevation.primary,
  },
  primaryBtnText: { ...strongText, fontSize: 13.5, lineHeight: 18, color: colors.white },
});

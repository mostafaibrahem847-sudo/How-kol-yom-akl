import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  colors,
  spacing,
  typography,
  radius,
  elevation,
  screenPadding,
  fontFamilyFor,
} from '../theme';
import { t } from '../i18n/strings';
import type { AudioPlayerHook } from '../hooks/useAudioPlayer';

// Kitchen voice-assistant card shown on every recipe detail screen, directly
// under the stats card. Rendered for every recipe so the layout never shifts:
// when the recipe has no narration yet the card is shown in a disabled state
// instead of being hidden.
//
// The component is purely presentational — it holds no recipe data of its own
// and never assumes a specific recipe. The screen passes the recipe id (for
// testIDs/accessibility) plus the shared narration state, so the inline card
// and the sticky bar stay driven by ONE audio player.
type Props = {
  recipeId: string;
  enabled: boolean;
  audio: AudioPlayerHook;
};

const BAR_BASE = [6, 12, 16, 8, 14, 6];
const BAR_PEAK = [11, 18, 7, 16, 11, 10];

const GRADIENT_READY = ['#FAF0E6', '#FCEAD4', '#FAF0E6'] as const;
const GRADIENT_DISABLED = ['#F2F0EA', '#EDEBE2', '#F2F0EA'] as const;

const strongText: TextStyle = {
  fontFamily: fontFamilyFor('700'),
  fontWeight: 'normal',
};

const extraStrongText: TextStyle = {
  fontFamily: fontFamilyFor('800'),
  fontWeight: 'normal',
};

// ─── Sound bars (decorative, animate only while the narration plays) ──────────

function SoundBars({ playing, muted }: { playing: boolean; muted?: boolean }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!playing) {
      progress.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 520,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 520,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [playing, progress]);

  return (
    <View
      style={styles.soundBars}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
    >
      {BAR_BASE.map((base, i) => (
        <Animated.View
          key={i}
          style={[
            styles.soundBar,
            muted && styles.soundBarMuted,
            {
              height: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [base, BAR_PEAK[i]],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export default function VoiceAssistantCard({ recipeId, enabled, audio }: Props) {
  const playing = enabled && audio.isPlaying;

  const subtitle = !enabled
    ? t.recipeDetail.audioUnavailable
    : audio.state === 'playing'
      ? t.recipeDetail.audioPlaying
      : audio.state === 'paused'
        ? t.recipeDetail.audioPaused
        : t.recipeDetail.audioIdle;

  return (
    <View
      style={[styles.audioCard, !enabled && styles.audioCardDisabled]}
      testID={`voice-assistant-card-${recipeId}`}
    >
      <LinearGradient
        colors={enabled ? GRADIENT_READY : GRADIENT_DISABLED}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.audioInner}
      >
        <View style={styles.audioInfo}>
          <View style={[styles.audioMic, !enabled && styles.audioMicDisabled]}>
            <Feather
              name="mic"
              size={18}
              color={enabled ? colors.primary : colors.neutralLight}
            />
          </View>
          <View style={styles.audioTextCol}>
            <View style={styles.audioTitleRow}>
              <Text
                style={[styles.audioTitle, !enabled && styles.audioTitleDisabled]}
                numberOfLines={1}
              >
                {t.recipeDetail.audioTitle}
              </Text>
              <View style={[styles.audioBadge, !enabled && styles.audioBadgeDisabled]}>
                <Text style={styles.audioBadgeText}>{t.recipeDetail.audioBadge}</Text>
              </View>
            </View>
            <Text
              style={[styles.audioSub, !enabled && styles.audioSubDisabled]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          </View>
        </View>

        <View style={styles.audioControls}>
          <SoundBars playing={playing} muted={!enabled} />

          {enabled && audio.state !== 'idle' ? (
            <TouchableOpacity
              style={styles.audioReplay}
              onPress={audio.replay}
              accessibilityRole="button"
              accessibilityLabel={t.recipeDetail.replayLabel}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Feather name="rotate-ccw" size={16} color={colors.primary} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.audioPlay, !enabled && styles.audioPlayDisabled]}
            onPress={enabled ? audio.togglePlay : undefined}
            disabled={!enabled}
            accessibilityRole="button"
            accessibilityState={{ disabled: !enabled }}
            accessibilityLabel={
              !enabled
                ? t.recipeDetail.audioUnavailable
                : audio.isPlaying
                  ? t.recipeDetail.pauseLabel
                  : t.recipeDetail.playLabel
            }
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            activeOpacity={0.85}
          >
            {enabled && audio.state === 'loading' ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <MaterialCommunityIcons
                name={playing ? 'pause' : 'play'}
                size={18}
                color={enabled ? colors.white : colors.neutralLight}
              />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  audioCard: {
    marginHorizontal: screenPadding.horizontal,
    marginBottom: spacing.lg,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: 'rgba(244,162,97,0.5)',
    overflow: 'hidden',
    ...elevation.cardResting,
  },
  audioCardDisabled: {
    borderColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  audioInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: spacing.sm + 2,
  },
  audioInfo: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  audioMic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(211,84,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(211,84,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioMicDisabled: {
    backgroundColor: 'rgba(119,119,119,0.10)',
    borderColor: 'rgba(119,119,119,0.35)',
  },
  audioTextCol: { flex: 1, minWidth: 0 },
  audioTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  audioTitle: {
    ...strongText,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.neutralDark,
    flexShrink: 1,
  },
  audioTitleDisabled: { color: colors.neutralLight },
  audioBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  audioBadgeDisabled: { backgroundColor: colors.neutralLight },
  audioBadgeText: { ...extraStrongText, fontSize: 9, lineHeight: 13, color: colors.white },
  audioSub: {
    ...typography.labelSm,
    color: colors.primary,
    textAlign: 'left',
    marginTop: 1,
  },
  audioSubDisabled: { color: colors.neutralLight },
  audioControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 0 },
  soundBars: { flexDirection: 'row', alignItems: 'flex-end', height: 18, gap: 2 },
  soundBar: { width: 3, borderRadius: 2, backgroundColor: colors.primary },
  soundBarMuted: { backgroundColor: colors.neutralLight },
  audioReplay: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  audioPlay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.primary,
  },
  audioPlayDisabled: { backgroundColor: colors.neutralSurface, shadowOpacity: 0, elevation: 0 },
});

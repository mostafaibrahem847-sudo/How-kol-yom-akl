import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, elevation, radius, spacing, typography } from '../theme';
import { cardImageUrl } from '../lib/imageUrl';

// "Option 1" cuisine card: a full-bleed 4:5 photo with the cuisine name over a
// dark bottom scrim. The photo is clipped by an inner view (never the shadowed
// card) so the Android elevation shadow is not clipped — same structure
// RecipeCard/RecipeCardMedia use.

const CARD_WIDTH = 150;
const CARD_ASPECT_RATIO = 4 / 5;

// Bottom-up dark scrim so the white label stays legible over any photo. Mirrors
// the approved preview's stops (opaque at the bottom, clear above ~60%).
const SCRIM_COLORS = [
  'rgba(26,26,26,0.88)',
  'rgba(26,26,26,0.52)',
  'rgba(26,26,26,0.10)',
  'rgba(26,26,26,0)',
] as const;
const SCRIM_LOCATIONS = [0, 0.3, 0.58, 0.78] as const;

type Props = {
  cuisineId: string;
  titleAr: string;
  imageUrl: string;
  isActive: boolean;
  onPress: () => void;
};

export default function CuisineCard({ titleAr, imageUrl, isActive, onPress }: Props) {
  const uri = cardImageUrl(imageUrl, 450) ?? imageUrl;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, isActive && styles.cardActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={titleAr}
    >
      <View style={styles.media}>
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessible={false} />
        <LinearGradient
          colors={SCRIM_COLORS}
          locations={SCRIM_LOCATIONS}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <Text style={styles.title} numberOfLines={1}>
          {titleAr}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    aspectRatio: CARD_ASPECT_RATIO,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    // Always bordered so the active border never shifts the card's bounds.
    borderWidth: 2,
    borderColor: 'transparent',
    ...elevation.cardResting,
  },
  cardActive: { borderColor: colors.primary },
  media: {
    flex: 1,
    borderRadius: radius.card,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  title: {
    ...typography.h2,
    lineHeight: 24,
    color: colors.white,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography, radius, screenPadding } from '../theme';

const HERO_HEIGHT = 245;

// The photo fades into the cream page on both ends: a warm scrim at the top so
// the floating controls stay legible, and a cream fade at the bottom so the
// headline block flows out of the image. Stops are distributed evenly (0/50/100)
// which is exactly the design's from/via/to treatment.
const HERO_FADE_UP = [colors.secondary, 'rgba(26,26,26,0.22)', 'rgba(0,0,0,0.55)'] as const;
const HERO_FADE_DOWN = ['rgba(0,0,0,0.40)', 'transparent', colors.secondary] as const;

// Category → chip colour, mirroring CategoryChip so the hero tag stays
// data-driven without duplicating the whole component just for a pill shape.
const categoryColor = (color?: string): string => {
  switch (color) {
    case 'amber':
      return colors.success;
    case 'mint':
      return colors.accentLight;
    case 'terracottaLight':
      return colors.primaryLight;
    case 'oliveDark':
      return colors.accentDark;
    case 'olive':
    default:
      return colors.accent;
  }
};

type Props = {
  imageUrl?: string;
  category: string;
  categoryColor?: string;
};

export default function RecipeHero({ imageUrl, category, categoryColor: tagColor }: Props) {
  return (
    <View style={styles.hero}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessible={false}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.heroPlaceholder]}>
          <MaterialCommunityIcons
            name="pot-steam-outline"
            size={56}
            color={colors.primaryLight}
          />
        </View>
      )}

      <LinearGradient
        colors={HERO_FADE_DOWN}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 2 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient
        colors={HERO_FADE_UP}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0.1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.heroCategory}>
        <View
          style={[
            styles.heroTag,
            { backgroundColor: categoryColor(tagColor) },
          ]}
        >
          <MaterialCommunityIcons name="star" size={12} color={colors.white} />
          <Text style={styles.heroTagText} numberOfLines={1}>
            {category}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    height: HERO_HEIGHT,
    overflow: 'hidden',
    backgroundColor: colors.secondaryDark,
  },
  heroPlaceholder: {
    backgroundColor: colors.secondaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCategory: {
    position: 'absolute',
    bottom: spacing.md,
    right: screenPadding.horizontal,
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroTagText: {
    ...typography.label,
    fontSize: 11,
    color: colors.white,
    maxWidth: 180,
  },
});

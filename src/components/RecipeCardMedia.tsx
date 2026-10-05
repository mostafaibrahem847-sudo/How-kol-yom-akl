import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, radius, fontWeight, fontFamily } from '../theme';
import { Recipe } from '../types/recipe';
import { cardImageUrl } from '../lib/imageUrl';
import { t } from '../i18n/strings';
import { useFavorites } from '../state/favorites';

// Shared image block for the list and grid cards: the full-bleed image (or the
// letter-fallback placeholder), the faint warm tint, the favorite heart and the
// audio badge. The caller supplies the container shape (corner radius / aspect
// ratio) so both layouts stay consistent without duplicating this logic.
type Props = {
  recipe: Recipe;
  style?: StyleProp<ViewStyle>;
};

export default function RecipeCardMedia({ recipe, style }: Props) {
  const isFavorite = useFavorites((s) => s.favorites.has(recipe.id));
  const toggleFavorite = useFavorites((s) => s.toggle);

  return (
    <View style={[styles.media, style]}>
      {recipe.imageUrl ? (
        <Image source={{ uri: cardImageUrl(recipe.imageUrl) }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>{recipe.title.slice(0, 2)}</Text>
        </View>
      )}

      {/* Faint warm tint for legibility over the photo */}
      <View style={styles.overlay} pointerEvents="none" />

      <TouchableOpacity
        style={styles.favBtn}
        onPress={() => toggleFavorite(recipe.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={isFavorite ? t.recipeDetail.favoriteRemove : t.recipeDetail.favoriteAdd}
      >
        <MaterialCommunityIcons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={17}
          color={colors.primary}
        />
      </TouchableOpacity>

      {recipe.audioAvailable && (
        <View style={styles.audioBadge} pointerEvents="none">
          <MaterialCommunityIcons name="microphone" size={10} color={colors.white} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  media: {
    backgroundColor: colors.neutralSurface,
    // Clip the full-bleed image to the caller-supplied corner radius. Kept on
    // this inner view (never on the card) so Android elevation shadows are not
    // clipped.
    overflow: 'hidden',
  },
  image: { ...StyleSheet.absoluteFill },
  placeholder: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.secondaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontFamily,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(212,167,129,0.08)',
  },
  favBtn: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    // No white-alpha token exists, so the translucent white is hard-coded to
    // keep the heart legible over both photos and the cream placeholder.
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
    width: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

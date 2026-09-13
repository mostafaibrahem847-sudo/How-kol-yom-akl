import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Feather from '@expo/vector-icons/Feather';
import {
  colors,
  spacing,
  typography,
  elevation,
  radius,
  fontWeight,
  fontFamily,
} from '../theme';
import { Recipe } from '../types/recipe';
import CategoryChip from './CategoryChip';
import { toArabicNumerals } from '../i18n/numerals';
import { t } from '../i18n/strings';
import { useFavorites } from '../state/favorites';

// Full-width list card. A fixed height keeps every row uniform and stops any
// image's intrinsic dimensions from stretching the layout; the 40% image half
// leaves the content side wide enough for Arabic titles to breathe on one or
// two lines instead of cramming into a half-screen column.
const CARD_HEIGHT = 116;
// Shared cap so the hero and list cards share one width on wide viewports.
const CARD_WIDE_MAX = 520;

type Props = {
  recipe: Recipe;
  onPress: () => void;
  variant?: 'default' | 'hero';
};

export default function RecipeCard({ recipe, onPress, variant = 'default' }: Props) {
  const isHero = variant === 'hero';
  const isFavorite = useFavorites((s) => s.favorites.has(recipe.id));
  const toggleFavorite = useFavorites((s) => s.toggle);

  if (isHero) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={[styles.card, styles.heroCard]}
      >
        {/* Image */}
        <View style={[styles.imageWrap, styles.heroImageWrap]}>
          {recipe.imageUrl ? (
            <Image source={{ uri: recipe.imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>
                {recipe.title.slice(0, 2)}
              </Text>
            </View>
          )}
          {/* Gradient overlay */}
          <View style={styles.imageOverlay} />
          {/* Audio badge */}
          {recipe.audioAvailable && (
            <View style={styles.audioBadge}>
              <MaterialCommunityIcons name="microphone" size={14} color={colors.white} />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.topRow}>
            <CategoryChip label={recipe.category} color={recipe.categoryColor ?? 'olive'} small />
          </View>

          <Text style={[styles.title, styles.heroTitle]} numberOfLines={2}>
            {recipe.title}
          </Text>

          {recipe.subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>{recipe.subtitle}</Text>
          )}

          {/* Info line */}
          <View style={styles.infoRow}>
            <Feather name="clock" size={12} color={colors.neutralMuted} style={styles.infoIcon} />
            <Text style={styles.infoText}>{toArabicNumerals(recipe.minutes)} {t.common.minutes}</Text>
            <Text style={styles.infoDot}>·</Text>
            <Text style={styles.infoText}>{toArabicNumerals(recipe.persons)} {t.common.persons}</Text>
            {recipe.difficulty && (
              <>
                <Text style={styles.infoDot}>·</Text>
                <Text style={styles.infoText}>{recipe.difficulty}</Text>
              </>
            )}
          </View>

          {/* CTA */}
          <View style={styles.ctaRow}>
            <TouchableOpacity
              onPress={onPress}
              style={styles.ctaBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaText}>{t.recipeCard.cook}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, styles.cardDefault, { height: CARD_HEIGHT }]}
    >
      {/*
        Horizontal 40/60 split. The app is RTL-only: in a flexDirection:'row'
        container the FIRST child (the image) is laid out on the RIGHT and the
        content follows on the LEFT — no row-reverse needed.
      */}
      <View style={styles.cardRow}>
        {/* IMAGE half — physically the right side of the card */}
        <View style={styles.imageHalf}>
          {recipe.imageUrl ? (
            <Image source={{ uri: recipe.imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>
                {recipe.title.slice(0, 2)}
              </Text>
            </View>
          )}

          {/* Faint warm tint for legibility over the photo */}
          <View style={styles.imageOverlayFaint} />

          {/* Favorite heart over the image area */}
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

          {/* Audio indicator */}
          {recipe.audioAvailable && (
            <View style={styles.audioBadgeSmall}>
              <MaterialCommunityIcons name="microphone" size={10} color={colors.white} />
            </View>
          )}
        </View>

        {/* CONTENT half — physically the left side of the card */}
        <View style={styles.contentHalf}>
          <View style={styles.chipRow}>
            <CategoryChip label={recipe.category} color={recipe.categoryColor ?? 'olive'} dense />
          </View>

          <Text style={styles.cardTitle} numberOfLines={2}>
            {recipe.title}
          </Text>

          <View style={styles.spacer} />

          {/* Meta line: time · servings · difficulty */}
          <View style={styles.metaRow}>
            <Feather name="clock" size={12} color={colors.neutralMuted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {toArabicNumerals(recipe.minutes)} {t.common.minutes}
            </Text>
            {recipe.persons ? (
              <>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaText} numberOfLines={1}>
                  {toArabicNumerals(recipe.persons)} {t.common.persons}
                </Text>
              </>
            ) : null}
            {recipe.difficulty ? (
              <>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaText} numberOfLines={1}>
                  {recipe.difficulty}
                </Text>
              </>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    ...elevation.cardResting,
    marginBottom: spacing.md,
  },
  heroCard: {
    width: '100%',
    maxWidth: CARD_WIDE_MAX,
  },

  // ---------- default (full-width horizontal, 40/60) ----------
  cardDefault: {
    borderWidth: 1,
    borderColor: colors.border,
    // Grids provide vertical spacing via `gap`; the base card margin would
    // double it.
    marginBottom: 0,
    // On wide (tablet/web) viewports the card caps and the grid centers it.
    maxWidth: 520,
  },
  cardRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  imageHalf: {
    width: '40%',
    backgroundColor: colors.neutralSurface,
    // Clip the full-bleed image inside the half — NEVER on the card itself: an
    // Android elevation shadow is clipped when the shadowed view clips its
    // children. The image half is physically the RIGHT side of the card (RTL
    // app), so only its right corners carry the card radius.
    overflow: 'hidden',
    borderTopRightRadius: radius.card,
    borderBottomRightRadius: radius.card,
  },
  // Fills the (already fixed) card height and is taken out of flow so it can
  // never contribute to the card's measured height.
  image: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.secondaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontFamily,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  imageOverlayFaint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(212,167,129,0.08)',
    pointerEvents: 'none',
  },
  favBtn: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    // No white-alpha token exists, so the translucent white is hard-coded to
    // keep the heart legible over both photos and the cream placeholder.
  },
  audioBadgeSmall: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
    width: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  contentHalf: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  chipRow: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    overflow: 'hidden',
    borderRadius: 4,
  },
  cardTitle: {
    fontFamily,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: fontWeight.bold,
    color: colors.neutralDark,
    marginTop: 6,
  },
  spacer: { flex: 1, minHeight: 6 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    color: colors.neutralMuted,
    flexShrink: 1,
  },
  metaDot: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    color: colors.neutralLight,
    marginHorizontal: 2,
  },

  // ---------- hero (unchanged vertical layout) ----------
  imageWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.neutralSurface,
    // Clip the full-bleed image to the card's rounded top corners here
    // instead of putting overflow:'hidden' on the card itself: an Android
    // elevation shadow is clipped when the shadowed view also clips its
    // children, which made card shadows missing on Android/iOS vs Web.
    overflow: 'hidden',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  heroImageWrap: {
    aspectRatio: 4 / 3,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(212,167,129,0.08)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  audioBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 9999,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: spacing.md },
  topRow: { flexDirection: 'row', marginBottom: spacing.sm },
  title: {
    ...typography.h2,
    color: colors.neutralDark,
    marginBottom: spacing.xs,
  },
  heroTitle: { ...typography.h1, fontSize: 28 },
  subtitle: {
    ...typography.body,
    color: colors.neutralMuted,
    marginBottom: spacing.sm,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  infoIcon: { marginLeft: spacing.xs },
  infoText: { ...typography.bodySmall, color: colors.neutralMuted },
  infoDot: { ...typography.bodySmall, color: colors.neutralLight, marginHorizontal: spacing.xs },
  ctaRow: { flexDirection: 'row', alignItems: 'center' },
  ctaBtn: {
    flex: 1,
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { ...typography.button, color: colors.white },
});

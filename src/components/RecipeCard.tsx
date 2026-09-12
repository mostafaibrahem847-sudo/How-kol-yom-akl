import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, LayoutChangeEvent } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Feather from '@expo/vector-icons/Feather';
import {
  colors,
  spacing,
  typography,
  elevation,
  buttonSize,
  radius,
  fontWeight,
  fontFamily,
  screenPadding,
} from '../theme';
import { Recipe } from '../types/recipe';
import CategoryChip from './CategoryChip';
import { toArabicNumerals } from '../i18n/numerals';
import { t } from '../i18n/strings';
import { useFavorites } from '../state/favorites';

const { width } = Dimensions.get('window');
const CARD_MAX_WIDTH = Math.min(width - spacing.lg * 2, 280);

// Compact horizontal-tile sizing.
// The card NEVER derives its height from the image: the height is computed
// from the measured grid-cell width, and the image half simply fills it. The
// ratio + clamp keep it a deliberate compact tile on 360-390px phones while
// stopping an image's intrinsic dimensions from stretching the card.
const CARD_RATIO = 0.78;
const CARD_MIN_HEIGHT = 136;
const CARD_MAX_HEIGHT = 184;
const FALLBACK_CELL_WIDTH = Math.max(
  120,
  (width - screenPadding.horizontal * 2 - spacing.md) / 2
);
const cardHeightForWidth = (w: number) =>
  Math.round(Math.min(Math.max(w * CARD_RATIO, CARD_MIN_HEIGHT), CARD_MAX_HEIGHT));

type Props = {
  recipe: Recipe;
  onPress: () => void;
  onVoicePress?: () => void;
  variant?: 'default' | 'hero';
};

export default function RecipeCard({ recipe, onPress, onVoicePress, variant = 'default' }: Props) {
  const isHero = variant === 'hero';
  const isFavorite = useFavorites((s) => s.favorites.has(recipe.id));
  const toggleFavorite = useFavorites((s) => s.toggle);

  // Responsive scale: the default card sits in a ~half-screen grid column. On
  // narrow phones every measure stays compact; once the content half gets real
  // width (larger phones / tablet / web) the card steps up to the roomier scale
  // and the difficulty label is shown beside the time (it only fits then).
  const [roomy, setRoomy] = useState(false);
  // Measured width of the actual grid cell this card was placed in. Drives the
  // controlled height so two cards in a row always match and intrinsic image
  // dimensions can never influence the layout.
  const [cardWidth, setCardWidth] = useState(FALLBACK_CELL_WIDTH);

  const handleCardLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - cardWidth) > 1) setCardWidth(w);
  };

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

  const cardHeight = cardHeightForWidth(cardWidth);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      onLayout={handleCardLayout}
      style={[styles.card, styles.cardDefault, { height: cardHeight }]}
    >
      {/*
        Balanced 50/50 row, compact-scaled for a ~half-screen grid column. The
        app is RTL-only: in a flexDirection:'row' container the FIRST child
        (the image) is laid out on the RIGHT half and the content follows on
        the LEFT half — no row-reverse needed. Everything inside is scaled
        down from the wide standalone concept so it reads as a deliberately
        compact card rather than a squeezed desktop card.
      */}
      <View style={styles.cardRow}>
        {/* IMAGE half — physically the right half of the card */}
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
              size={roomy ? 18 : 16}
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

        {/* CONTENT half — physically the left half of the card */}
          <View
            style={[styles.contentHalf, roomy && styles.contentHalfRoomy]}
            onLayout={(e) => setRoomy(e.nativeEvent.layout.width >= 120)}
          >
          <View style={styles.chipClip}>
            <CategoryChip label={recipe.category} color={recipe.categoryColor ?? 'olive'} dense />
          </View>

          <Text style={[styles.cardTitle, roomy && styles.cardTitleRoomy]} numberOfLines={2}>
            {recipe.title}
          </Text>

          {/* Time + (when it fits) difficulty — always a single clean line. */}
          <View style={styles.metaRow}>
            <Feather name="clock" size={roomy ? 11 : 10} color={colors.neutralMuted} />
            <Text style={[styles.metaText, roomy && styles.metaTextRoomy]} numberOfLines={1}>
              {toArabicNumerals(recipe.minutes)} {t.common.minutes}
            </Text>
            {roomy && recipe.difficulty ? (
              <>
                <Text style={styles.metaDot}>·</Text>
                <Text style={[styles.metaDifficulty, roomy && styles.metaTextRoomy]} numberOfLines={1}>
                  {recipe.difficulty}
                </Text>
              </>
            ) : null}
          </View>

          {recipe.description ? (
            <Text style={[styles.cardDesc, roomy && styles.cardDescRoomy]} numberOfLines={1}>
              {recipe.description}
            </Text>
          ) : null}

          <View style={styles.spacer} />

          <TouchableOpacity
            onPress={onPress}
            style={[styles.ctaCompact, roomy && styles.ctaCompactRoomy]}
            activeOpacity={0.8}
            hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }}
          >
            <Text style={[styles.ctaCompactText, roomy && styles.ctaTextRoomy]}>{t.recipeCard.cook}</Text>
          </TouchableOpacity>
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
    maxWidth: CARD_MAX_WIDTH,
  },

  // ---------- default (horizontal, balanced 50/50) ----------
  cardDefault: {
    borderWidth: 1,
    borderColor: colors.border,
    // Grids provide vertical spacing via `gap`; the base card margin would
    // double it (24px between rows instead of 12px).
    marginBottom: 0,
  },
  cardRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  imageHalf: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.neutralSurface,
    // Clip the full-bleed image inside the half — NEVER on the card itself: an
    // Android elevation shadow is clipped when the shadowed view clips its
    // children. The image half is physically the RIGHT half of the card (RTL
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
    ...typography.h1,
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
  // Compact-card scaling: the default card renders inside a ~half-screen grid
  // column, so every internal measure is proportionally reduced relative to
  // the wide standalone concept. Micro values (2–6px) intentionally sit below
  // the 4/8/12 spacing tokens — at this width token gaps would look oversized.
  contentHalf: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  chipClip: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    overflow: 'hidden',
    borderRadius: 4,
    marginBottom: 2,
  },
  cardTitle: {
    fontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: fontWeight.bold,
    color: colors.neutralDark,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  metaText: {
    fontFamily,
    fontSize: 11,
    lineHeight: 15,
    color: colors.neutralMuted,
    flexShrink: 1,
  },
  metaDot: {
    fontFamily,
    fontSize: 11,
    lineHeight: 15,
    color: colors.neutralLight,
    marginHorizontal: 3,
  },
  metaDifficulty: {
    fontFamily,
    fontSize: 11,
    lineHeight: 15,
    color: colors.neutralMuted,
    flexShrink: 1,
  },
  cardDesc: {
    fontFamily,
    fontSize: 11,
    lineHeight: 15,
    color: colors.neutralMuted,
    flexShrink: 1,
    marginBottom: 3,
  },
  spacer: { flex: 1, minHeight: 0 },
  ctaCompact: {
    height: 28,
    backgroundColor: colors.primary,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaCompactText: {
    fontFamily,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },

  // ---- roomier scale (larger phones / tablet / web columns) ----
  // Applied as array overrides on top of the compact styles once the content
  // half measures >= 120px wide, so proportions stay balanced at both sizes.
  contentHalfRoomy: { paddingHorizontal: 10, paddingVertical: 8 },
  cardTitleRoomy: { fontSize: 15, lineHeight: 21 },
  metaTextRoomy: { fontSize: 12, lineHeight: 19 },
  cardDescRoomy: { fontSize: 12, lineHeight: 19 },
  ctaCompactRoomy: { height: 34, borderRadius: 8 },
  ctaTextRoomy: { fontSize: 13, lineHeight: 18 },

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
    height: buttonSize.height,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { ...typography.button, color: colors.white },
});

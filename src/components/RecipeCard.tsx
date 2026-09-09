import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
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
} from '../theme';
import { Recipe } from '../types/recipe';
import CategoryChip from './CategoryChip';
import { toArabicNumerals } from '../i18n/numerals';
import { t } from '../i18n/strings';
import { useFavorites } from '../state/favorites';

const { width } = Dimensions.get('window');
const CARD_MAX_WIDTH = Math.min(width - spacing.lg * 2, 280);

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
      style={[styles.card, styles.cardDefault]}
    >
      {/*
        Balanced 50/50 row. The app is RTL-only: in a flexDirection:'row'
        container the FIRST child (the image) is laid out on the RIGHT half and
        the content follows on the LEFT half — no row-reverse needed.
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
          <View style={styles.imageOverlayFaint} pointerEvents="none" />

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
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>

          {/* Audio indicator */}
          {recipe.audioAvailable && (
            <View style={styles.audioBadgeSmall} pointerEvents="none">
              <MaterialCommunityIcons name="microphone" size={11} color={colors.white} />
            </View>
          )}
        </View>

        {/* CONTENT half — physically the left half of the card */}
        <View style={styles.contentHalf}>
          <View style={styles.chipClip}>
            <CategoryChip label={recipe.category} color={recipe.categoryColor ?? 'olive'} small />
          </View>

          <Text style={styles.cardTitle} numberOfLines={2}>
            {recipe.title}
          </Text>

          <View style={styles.metaRow}>
            <Feather name="clock" size={11} color={colors.neutralMuted} />
            <Text style={styles.metaText}>{toArabicNumerals(recipe.minutes)} {t.common.minutes}</Text>
            {recipe.difficulty ? (
              <>
                <Text style={styles.metaDot}>·</Text>
                <Text style={[styles.metaText, styles.metaTextShrink]} numberOfLines={1}>
                  {recipe.difficulty}
                </Text>
              </>
            ) : null}
          </View>

          {recipe.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {recipe.description}
            </Text>
          ) : null}

          <View style={styles.spacer} />

          <TouchableOpacity
            onPress={onPress}
            style={styles.ctaCompact}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaCompactText}>{t.recipeCard.cook}</Text>
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
  },
  cardRow: {
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
  image: { width: '100%', height: '100%' },
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
  },
  favBtn: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    // No white-alpha token exists, so the translucent white is hard-coded to
    // keep the heart legible over both photos and the cream placeholder.
  },
  audioBadgeSmall: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentHalf: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  chipClip: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    overflow: 'hidden',
    borderRadius: radius.small,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontFamily,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: fontWeight.bold,
    color: colors.neutralDark,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  metaText: { ...typography.bodySmall, color: colors.neutralMuted },
  metaTextShrink: { flexShrink: 1 },
  metaDot: { ...typography.bodySmall, color: colors.neutralLight },
  cardDesc: {
    ...typography.bodySmall,
    color: colors.neutralMuted,
    flexShrink: 1,
  },
  spacer: { flex: 1, minHeight: spacing.xs },
  ctaCompact: {
    height: 34,
    backgroundColor: colors.primary,
    borderRadius: radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaCompactText: {
    fontFamily,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: fontWeight.bold,
    color: colors.white,
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
    height: buttonSize.height,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { ...typography.button, color: colors.white },
});

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, typography, elevation, buttonSize } from '../theme';
import { Recipe } from '../types/recipe';
import CategoryChip from './CategoryChip';
import { toArabicNumerals } from '../i18n/numerals';

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

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, isHero && styles.heroCard]}
    >
      {/* Image */}
      <View style={[styles.imageWrap, isHero && styles.heroImageWrap]}>
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
            <Text style={styles.audioBadgeText}>🎙️</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <CategoryChip label={recipe.category} color={recipe.categoryColor ?? 'olive'} small />
        </View>

        <Text style={[styles.title, isHero && styles.heroTitle]} numberOfLines={2}>
          {recipe.title}
        </Text>

        {isHero && recipe.subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>{recipe.subtitle}</Text>
        )}

        {/* Info line */}
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>⏱ {toArabicNumerals(recipe.minutes)} دقيقة</Text>
          <Text style={styles.infoDot}>·</Text>
          <Text style={styles.infoText}>{toArabicNumerals(recipe.persons)} أشخاص</Text>
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
            <Text style={styles.ctaText}>شوفي الوصفة</Text>
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
    borderRadius: 12,
    ...elevation.cardResting,
    marginBottom: spacing.md,
  },
  heroCard: {
    width: '100%',
    maxWidth: CARD_MAX_WIDTH,
  },
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
  audioBadgeText: { fontSize: 14 },
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

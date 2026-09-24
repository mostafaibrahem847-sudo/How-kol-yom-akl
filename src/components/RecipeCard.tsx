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

// Shared cap so the hero card shares one width on wide viewports. The feed
// cards live in RecipeCardList / RecipeCardGrid.
const CARD_WIDE_MAX = 520;

type Props = {
  recipe: Recipe;
  onPress: () => void;
};

export default function RecipeCard({ recipe, onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.card}>
      {/* Image */}
      <View style={styles.imageWrap}>
        {recipe.imageUrl ? (
          <Image source={{ uri: recipe.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>{recipe.title.slice(0, 2)}</Text>
          </View>
        )}
        {/* Gradient overlay */}
        <View style={styles.imageOverlay} pointerEvents="none" />
        {/* Audio badge */}
        {recipe.audioAvailable && (
          <View style={styles.audioBadge} pointerEvents="none">
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
          <Text style={styles.subtitle} numberOfLines={1}>
            {recipe.subtitle}
          </Text>
        )}

        {/* Info line */}
        <View style={styles.infoRow}>
          <Feather name="clock" size={12} color={colors.neutralMuted} style={styles.infoIcon} />
          <Text style={styles.infoText}>
            {toArabicNumerals(recipe.minutes)} {t.common.minutes}
          </Text>
          <Text style={styles.infoDot}>·</Text>
          <Text style={styles.infoText}>
            {toArabicNumerals(recipe.persons)} {t.common.persons}
          </Text>
          {recipe.difficulty && (
            <>
              <Text style={styles.infoDot}>·</Text>
              <Text style={styles.infoText}>{recipe.difficulty}</Text>
            </>
          )}
        </View>

        {/* CTA */}
        <View style={styles.ctaRow}>
          <TouchableOpacity onPress={onPress} style={styles.ctaBtn} activeOpacity={0.8}>
            <Text style={styles.ctaText}>{t.recipeCard.cook}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: CARD_WIDE_MAX,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    ...elevation.cardResting,
  },

  imageWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.neutralSurface,
    // Clip the full-bleed image to the card's rounded top corners here instead
    // of putting overflow:'hidden' on the card itself: an Android elevation
    // shadow is clipped when the shadowed view also clips its children.
    overflow: 'hidden',
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
  },
  image: { ...StyleSheet.absoluteFill },
  imagePlaceholder: {
    ...StyleSheet.absoluteFill,
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
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(212,167,129,0.08)',
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
  },
  audioBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
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

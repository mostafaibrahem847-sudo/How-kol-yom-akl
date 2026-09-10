import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Share,
  ActivityIndicator,
  Dimensions,
  Pressable,
  Platform,
} from 'react-native';
import { useAudioPlayerHook } from '../hooks/useAudioPlayer';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { colors, spacing, typography, buttonSize, radius, elevation, screenPadding } from '../theme';
import { useRecipe } from '../data/queries';
import { useFavorites } from '../state/favorites';
import CategoryChip from '../components/CategoryChip';
import { RootStackParamList } from '../navigation/RootNavigator';
import { t } from '../i18n/strings';
import { toArabicNumerals } from '../i18n/numerals';

const { width } = Dimensions.get('window');
const HERO_WIDTH = width;
const HERO_HEIGHT = HERO_WIDTH * (3 / 4);

type DetailRouteProp = RouteProp<RootStackParamList, 'RecipeDetail'>;

// ─── Ingredient Row ────────────────────────────────────────────────────────────

function IngredientRow({ text, checked, onToggle }: { text: string; checked: boolean; onToggle: () => void }) {
  return (
    <Pressable style={styles.ingredientRow} onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={[styles.ingredientText, checked && styles.ingredientTextChecked]}>{text}</Text>
    </Pressable>
  );
}

// ─── Step Row ─────────────────────────────────────────────────────────────────

function StepRow({ number, title, body }: { number: number; title: string; body: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{toArabicNumerals(number)}</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepBody}>{body}</Text>
      </View>
    </View>
  );
}

// ─── Tip Row ──────────────────────────────────────────────────────────────────

function TipRow({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.tipRow}>
      <Text style={styles.tipTitle}>{title}</Text>
      <Text style={styles.tipBody}>{body}</Text>
    </View>
  );
}

// ─── Voice Player Dock ─────────────────────────────────────────────────────────

function VoicePlayerDock({ audioUrl }: { audioUrl?: string }) {
  const { state, isPlaying, togglePlay, replay } = useAudioPlayerHook(audioUrl);
  const hasUrl = !!audioUrl;

  // ── design.md voice rules ──────────────────────────────────────────────────
  // Resting: #D35400 bg, white icon
  // Playing: #FDFBF7 cream bg + glow, white icon
  // Paused:  #FFFFFF bg, #D35400 icon
  // ────────────────────────────────────────────────────────────────────────────
  const dockBg =
    state === 'playing' ? colors.secondary :
    state === 'paused'  ? colors.white      :
    hasUrl              ? colors.primary     :
    colors.neutralSurface;

  const iconColor =
    state === 'playing' ? colors.white       :
    state === 'paused'  ? colors.primary     :
    colors.white;

  const buttonBg =
    state === 'playing' ? colors.secondary   :
    state === 'paused'  ? colors.white       :
    colors.primary;

  return (
    <View style={[styles.voiceDock, { backgroundColor: dockBg }, state === 'playing' && styles.voiceDockPlaying]}>
      <View style={styles.voiceDockLeft}>
        <Text style={[styles.voiceDockIcon, state === 'playing' && styles.voiceDockIconPlaying]}>🎙️</Text>
        <View>
          <Text style={[styles.voiceDockTitle, state === 'playing' && styles.voiceDockTitlePlaying]}>
            {t.recipeDetail.audioTitle}
          </Text>
          <Text style={[styles.voiceDockSub, state === 'playing' && styles.voiceDockSubPlaying]}>
            {!hasUrl      ? t.recipeDetail.audioIdle :
             state === 'playing' ? t.recipeDetail.audioPlaying :
             state === 'paused'  ? t.recipeDetail.audioPaused  :
             t.recipeDetail.audioIdle}
          </Text>
        </View>
      </View>

      <View style={styles.voiceDockActions}>
        {hasUrl && state !== 'idle' && (
          <TouchableOpacity
            style={[styles.voiceDockActionBtn]}
            onPress={replay}
            accessibilityLabel={t.recipeDetail.replayLabel}
          >
            <Text style={[styles.voiceDockActionIcon, { color: iconColor }]}>↺</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.voiceDockButton, { backgroundColor: buttonBg }]}
          onPress={hasUrl ? togglePlay : undefined}
          activeOpacity={0.8}
          accessibilityLabel={isPlaying ? t.recipeDetail.pauseLabel : t.recipeDetail.playLabel}
        >
          <Text style={[styles.voiceDockButtonText, { color: iconColor }]}>
            {state === 'loading' ? '…' : isPlaying ? '⏸' : '▶'}
          </Text>
        </TouchableOpacity>
      </View>

      {!hasUrl && (
        <Text style={styles.voiceDockPlaceholder}>{t.recipeDetail.audioIdle}</Text>
      )}
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function RecipeDetailScreen() {
  const route = useRoute<DetailRouteProp>();
  const navigation = useNavigation<any>();
  const { id } = route.params;

  const { data: recipe, isLoading, isError, refetch } = useRecipe(id);
  const { has, toggle } = useFavorites();

  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps' | 'tips'>('ingredients');

  const isFav = recipe ? has(recipe.id) : false;

  const toggleIngredient = useCallback((ingId: string) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(ingId)) next.delete(ingId);
      else next.add(ingId);
      return next;
    });
  }, []);

  const handleFavorite = () => {
    if (recipe) toggle(recipe.id);
  };

  const handleShare = async () => {
    if (!recipe) return;
    try {
      await Share.share({
        message: `${recipe.title}\n${recipe.description}\n#هو_كل_يوم_أكل`,
        title: recipe.title,
      });
    } catch {}
  };

  const handleStartCooking = () => {
    navigation.navigate('CookingMode', { id });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // Missing recipe (valid id that is not in the catalog) and query failure are
  // distinct, honest states. Both keep the real back affordance; only the
  // failure state offers a retry.
  if (isError || !recipe) {
    const missing = !isError;
    return (
      <View style={styles.root}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()} accessibilityLabel={t.common.back}>
            <Text style={styles.iconBtnText}>←</Text>
          </TouchableOpacity>
          <View style={styles.iconBtn} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{missing ? t.recipeDetail.notFound : t.recipeDetail.loadError}</Text>
          {missing ? <Text style={styles.tipBody}>{t.recipeDetail.notFoundBody}</Text> : null}
          {!missing ? (
            <TouchableOpacity style={styles.backButton} onPress={() => refetch()} accessibilityRole="button">
              <Text style={styles.backButtonText}>{t.common.retry}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }

  const checkedCount = checkedIngredients.size;
  const totalCount = recipe.ingredients?.length ?? 0;

  return (
    <View style={styles.root}>
      {/* Header / Back */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()} accessibilityLabel={t.common.back}>
          <Text style={styles.iconBtnText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={handleShare} accessibilityLabel={t.common.share}>
          <Text style={styles.iconBtnText}>↗</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroImageWrapper}>
          {recipe.imageUrl ? (
            <Image source={{ uri: recipe.imageUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Text style={styles.heroPlaceholderText}>🍲</Text>
            </View>
          )}
          {/* Gradient overlay */}
          <View style={styles.heroOverlay} />
          {/* Category tag over image */}
          <View style={styles.heroCategory}>
            <CategoryChip label={recipe.category} color={recipe.categoryColor} />
          </View>
        </View>

        {/* Title block */}
        <View style={styles.titleBlock}>
          <Text style={styles.recipeTitle}>{recipe.title}</Text>
          {recipe.subtitle ? (
            <Text style={styles.recipeSubtitle}>{recipe.subtitle}</Text>
          ) : null}
          <Text style={styles.recipeDescription}>{recipe.description}</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>⏱</Text>
            <Text style={styles.statValue}>{toArabicNumerals(recipe.minutes)}</Text>
            <Text style={styles.statLabel}>{t.common.minutes}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🍽</Text>
            <Text style={styles.statValue}>{toArabicNumerals(recipe.persons)}</Text>
            <Text style={styles.statLabel}>{t.common.persons}</Text>
          </View>
          {recipe.difficulty ? (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>⚡</Text>
                <Text style={styles.statValue}>{recipe.difficulty}</Text>
              </View>
            </>
          ) : null}
          {recipe.rating ? (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>⭐</Text>
                <Text style={styles.statValue}>{recipe.rating}</Text>
              </View>
            </>
          ) : null}
        </View>

        {/* CTA: Start cooking */}
        <TouchableOpacity style={styles.ctaButton} onPress={handleStartCooking} activeOpacity={0.85}>
          <Text style={styles.ctaButtonText}>{t.recipeDetail.startVoice}</Text>
        </TouchableOpacity>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {(['ingredients', 'steps', 'tips'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'ingredients' ? t.recipeDetail.tabIngredients(recipe.ingredients?.length ?? 0) :
                 tab === 'steps'       ? t.recipeDetail.tabSteps(recipe.steps?.length ?? 0)  :
                 t.recipeDetail.tabTips}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'ingredients' && (
          <View style={styles.tabContent}>
            {(recipe.ingredients?.length ?? 0) === 0 ? (
              <Text style={styles.ingredientsHelper}>{t.recipeDetail.noIngredients}</Text>
            ) : (
              <>
                <Text style={styles.ingredientsHelper}>{t.recipeDetail.ingredientsHelper}</Text>
                {checkedCount > 0 && (
                  <Text style={styles.ingredientsCounter}>
                    {t.recipeDetail.ingredientsCounter(checkedCount, totalCount)}
                  </Text>
                )}
                {recipe.ingredients?.map((ing) => (
                  <IngredientRow
                    key={ing.id}
                    text={ing.text}
                    checked={checkedIngredients.has(ing.id)}
                    onToggle={() => toggleIngredient(ing.id)}
                  />
                ))}
              </>
            )}
          </View>
        )}

        {activeTab === 'steps' && (
          <View style={styles.tabContent}>
            {(recipe.steps?.length ?? 0) === 0 ? (
              <Text style={styles.ingredientsHelper}>{t.recipeDetail.noSteps}</Text>
            ) : (
              recipe.steps?.map((step, i) => (
                <StepRow key={step.id} number={i + 1} title={step.title} body={step.body} />
              ))
            )}
          </View>
        )}

        {activeTab === 'tips' && (
          <View style={styles.tabContent}>
            {(recipe.tips?.length ?? 0) === 0 ? (
              <Text style={styles.ingredientsHelper}>{t.recipeDetail.noTips}</Text>
            ) : (
              recipe.tips?.map((tip) => (
                <TipRow key={tip.id} title={tip.title} body={tip.body} />
              ))
            )}
          </View>
        )}

        {/* Favorite button */}
        <TouchableOpacity
          style={[styles.favoriteBtn, isFav && styles.favoriteBtnActive]}
          onPress={handleFavorite}
          activeOpacity={0.8}
        >
          <Text style={styles.favoriteBtnText}>
            {isFav ? `❤️ ${t.recipeDetail.favoriteRemove}` : `🤍 ${t.recipeDetail.favoriteAdd}`}
          </Text>
        </TouchableOpacity>

        {/* Voice dock */}
        <VoicePlayerDock audioUrl={recipe.audioUrl} />

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating voice button (always visible) */}
      {recipe.audioAvailable && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setActiveTab('steps')}
          accessibilityLabel={t.recipeDetail.micButton}
        >
          <Text style={styles.fabText}>🎙️</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.secondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.secondary },
  errorText: { ...typography.bodyLarge, color: colors.neutralMid, marginBottom: spacing.lg },

  headerBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    right: spacing.lg,
    left: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.medium,
    backgroundColor: 'rgba(253,251,247,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...elevation.cardLifted,
  },
  iconBtnText: { fontSize: 20, color: colors.primary },

  scroll: { paddingBottom: 0 },

  heroImageWrapper: { width: HERO_WIDTH, height: HERO_HEIGHT, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: {
    backgroundColor: colors.secondaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPlaceholderText: { fontSize: 80 },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(212,167,129,0.15)',
    borderBottomLeftRadius: radius.medium,
    borderBottomRightRadius: radius.medium,
  },
  heroCategory: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
  },

  titleBlock: {
    paddingHorizontal: screenPadding.horizontal,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  recipeTitle: { ...typography.h1, color: colors.neutralDark, marginBottom: spacing.sm },
  recipeSubtitle: { ...typography.bodyLarge, color: colors.neutralMid, marginBottom: spacing.sm },
  recipeDescription: { ...typography.body, color: colors.neutralMuted },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: screenPadding.horizontal,
    backgroundColor: colors.neutralSurface,
    borderRadius: radius.medium,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statIcon: { fontSize: 16, marginBottom: 2 },
  statValue: { ...typography.label, color: colors.neutralDark },
  statLabel: { ...typography.bodySmall, color: colors.neutralMuted },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },

  ctaButton: {
    marginHorizontal: screenPadding.horizontal,
    backgroundColor: colors.primary,
    borderRadius: buttonSize.height / 2,
    height: buttonSize.height,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...elevation.primary,
  },
  ctaButtonText: { ...typography.buttonLarge, color: colors.white },

  tabBar: {
    flexDirection: 'row',
    marginHorizontal: screenPadding.horizontal,
    borderRadius: radius.medium,
    backgroundColor: colors.neutralSurface,
    padding: spacing.xs,
    marginBottom: spacing.md,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.small },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.label, color: colors.neutralMuted },
  tabTextActive: { color: colors.white },

  tabContent: { paddingHorizontal: screenPadding.horizontal, paddingTop: spacing.md },

  ingredientRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  checkboxChecked: { backgroundColor: colors.primary },
  checkmark: { color: colors.white, fontWeight: 'bold', fontSize: 14, lineHeight: 16 },
  ingredientText: { ...typography.body, color: colors.neutralMid, flex: 1 },
  ingredientTextChecked: { textDecorationLine: 'line-through', color: colors.neutralLight },

  ingredientsHelper: { ...typography.bodySmall, color: colors.neutralMuted, marginBottom: spacing.sm },
  ingredientsCounter: { ...typography.body, color: colors.accent, marginBottom: spacing.md },

  stepRow: { flexDirection: 'row', paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  stepNumber: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, flexShrink: 0 },
  stepNumberText: { color: colors.white, ...typography.label, fontWeight: '700' },
  stepContent: { flex: 1 },
  stepTitle: { ...typography.h3, color: colors.neutralDark, marginBottom: spacing.xs },
  stepBody: { ...typography.bodyLarge, color: colors.neutralMid, lineHeight: 26 },

  tipRow: { backgroundColor: colors.secondaryLight, borderRadius: radius.medium, padding: spacing.md, marginBottom: spacing.md },
  tipTitle: { ...typography.h3, color: colors.accentDark, marginBottom: spacing.xs },
  tipBody: { ...typography.body, color: colors.neutralMid },

  favoriteBtn: {
    marginHorizontal: screenPadding.horizontal,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: buttonSize.height / 2,
    height: buttonSize.height,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  favoriteBtnActive: { backgroundColor: colors.primary },
  favoriteBtnText: { ...typography.button, color: colors.primary },

  voiceDock: {
    marginHorizontal: screenPadding.horizontal,
    borderRadius: radius.medium,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  voiceDockPlaying: {
    elevation: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  voiceDockLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  voiceDockIcon: { fontSize: 24, marginRight: spacing.md },
  voiceDockIconPlaying: { color: colors.white, textShadowColor: colors.primary, textShadowRadius: 6, textShadowOffset: { width: 0, height: 0 } },
  voiceDockTitle: { ...typography.label, color: colors.neutralDark },
  voiceDockTitlePlaying: { color: colors.neutralDark },
  voiceDockSub: { ...typography.bodySmall, color: colors.neutralMuted },
  voiceDockSubPlaying: { color: colors.accentDark },
  voiceDockPlaceholder: { ...typography.bodySmall, color: colors.neutralLight, fontStyle: 'italic' },
  voiceDockActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  voiceDockActionBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  voiceDockActionIcon: { fontSize: 22, fontWeight: '600' },
  voiceDockButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceDockButtonText: { fontSize: 18, fontWeight: 'bold' },

  fab: {
    position: 'absolute',
    bottom: 100,
    left: screenPadding.horizontal,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...elevation.primary,
  },
  fabText: { fontSize: 24 },

  backButton: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.small,
  },
  backButtonText: { ...typography.button, color: colors.white },
});

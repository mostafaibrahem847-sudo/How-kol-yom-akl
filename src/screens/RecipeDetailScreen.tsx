import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Image,
  Share,
  ActivityIndicator,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  colors,
  spacing,
  typography,
  radius,
  elevation,
  screenPadding,
  fontFamilyFor,
} from '../theme';
import { useRecipe } from '../data/queries';
import { useFavorites } from '../state/favorites';
import { RootStackParamList } from '../navigation/RootNavigator';
import { t } from '../i18n/strings';
import { toArabicNumerals } from '../i18n/numerals';
import { useAudioPlayerHook } from '../hooks/useAudioPlayer';
import { hasRealAudio } from '../lib/audio';
import VoiceAssistantCard from '../components/VoiceAssistantCard';
import ListenButton from '../components/ListenButton';

// ─── Layout constants ─────────────────────────────────────────────────────────

const HERO_HEIGHT = 245;
const CIRCLE_BTN = 40;
// Reserved height of the sticky bottom bar's own content (buttons + padding),
// excluding the device bottom inset which is added at runtime.
const BOTTOM_BAR_CONTENT = 44 + spacing.sm * 2;

// The photo fades into the cream page on both ends: a warm scrim at the top so
// the floating controls stay legible, and a cream fade at the bottom so the
// headline block flows out of the image. Stops are distributed evenly (0/50/100)
// which is exactly the design's from/via/to treatment.
const HERO_FADE_UP = [colors.secondary, 'rgba(26,26,26,0.22)', 'rgba(0,0,0,0.55)'] as const;
const HERO_FADE_DOWN = ['rgba(0,0,0,0.40)', 'transparent', colors.secondary] as const;

type FeatherName = keyof typeof Feather.glyphMap;
type DetailTab = 'ingredients' | 'steps' | 'tips';

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

// ─── Ingredient row ───────────────────────────────────────────────────────────

function IngredientRow({
  text,
  checked,
  onToggle,
}: {
  text: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.ingredientRow, pressed && styles.rowPressed]}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={text}
    >
      <View style={styles.ingredientLeft}>
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && <Feather name="check" size={13} color={colors.white} />}
        </View>
        <Text
          style={[styles.ingredientText, checked && styles.ingredientTextChecked]}
          numberOfLines={2}
        >
          {text}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Step accordion item ──────────────────────────────────────────────────────

function StepAccordion({
  number,
  title,
  body,
  open,
  onToggle,
}: {
  number: number;
  title: string;
  body: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.stepCard}>
      <Pressable
        style={({ pressed }) => [styles.stepHeader, pressed && styles.rowPressed]}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={open ? t.recipeDetail.collapseStep : t.recipeDetail.expandStep}
        hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
      >
        <View style={styles.stepHeaderStart}>
          <View style={styles.stepNumberBox}>
            <Text style={styles.stepNumberText}>{toArabicNumerals(number)}</Text>
          </View>
          <Text style={styles.stepTitle} numberOfLines={2}>
            {title}
          </Text>
        </View>
        <Feather
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.neutralMuted}
        />
      </Pressable>

      {open ? (
        <View style={styles.stepBody}>
          <Text style={styles.stepBodyText}>{body}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type DetailRouteProp = RouteProp<RootStackParamList, 'RecipeDetail'>;

export default function RecipeDetailScreen() {
  const route = useRoute<DetailRouteProp>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { id } = route.params;

  const { data: recipe, isLoading, isError, refetch } = useRecipe(id);
  const { has, toggle } = useFavorites();
  // One player owned by the screen so the inline card and the sticky bar share
  // the same narration state instead of creating two competing players.
  const audio = useAudioPlayerHook(recipe?.audioUrl);

  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<DetailTab>('ingredients');
  // `undefined` = untouched (first step expands by default); `null` = all closed.
  const [openStep, setOpenStep] = useState<string | null | undefined>(undefined);

  const isFav = recipe ? has(recipe.id) : false;

  const toggleIngredient = useCallback((ingId: string) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(ingId)) next.delete(ingId);
      else next.add(ingId);
      return next;
    });
  }, []);

  const handleFavorite = useCallback(() => {
    if (recipe) toggle(recipe.id);
  }, [recipe, toggle]);

  const handleShare = useCallback(async () => {
    if (!recipe) return;
    try {
      await Share.share({
        message: `${recipe.title}\n${recipe.description}\n#هو_كل_يوم_أكل`,
        title: recipe.title,
      });
    } catch {}
  }, [recipe]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // ── Missing recipe / query failure ─────────────────────────────────────────
  // Two distinct, honest states. Both keep the real back affordance; only the
  // failure state offers a retry.
  if (isError || !recipe) {
    const missing = !isError;
    return (
      <View style={styles.root}>
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.glassBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel={t.common.back}
            activeOpacity={0.85}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Feather name="arrow-right" size={20} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.glassSpacer} />
        </View>

        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {missing ? t.recipeDetail.notFound : t.recipeDetail.loadError}
          </Text>
          {missing ? <Text style={styles.errorBody}>{t.recipeDetail.notFoundBody}</Text> : null}
          {!missing ? (
            <Pressable
              style={({ pressed }) => [styles.retryBtn, pressed && styles.btnPressed]}
              onPress={() => refetch()}
              accessibilityRole="button"
              accessibilityLabel={t.common.retry}
            >
              <Text style={styles.retryBtnText}>{t.common.retry}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  const totalCount = recipe.ingredients?.length ?? 0;
  const checkedCount = checkedIngredients.size;
  const showAudio = hasRealAudio(recipe.audioUrl);

  const firstStepId = recipe.steps?.[0]?.id ?? null;
  const effectiveOpenStep = openStep === undefined ? firstStepId : openStep;
  const toggleStep = (stepId: string) => {
    const current = openStep === undefined ? firstStepId : openStep;
    setOpenStep(current === stepId ? null : stepId);
  };

  const stats: { key: string; icon: FeatherName; label: string; value: string }[] = [
    {
      key: 'time',
      icon: 'clock',
      label: t.recipeDetail.stats.time,
      value: `${toArabicNumerals(recipe.minutes)} ${t.common.minutes}`,
    },
    {
      key: 'persons',
      icon: 'users',
      label: t.recipeDetail.stats.persons,
      value: `${toArabicNumerals(recipe.persons)} ${t.common.persons}`,
    },
  ];
  if (recipe.difficulty) {
    stats.push({
      key: 'difficulty',
      icon: 'zap',
      label: t.recipeDetail.stats.difficulty,
      value: recipe.difficulty,
    });
  }
  if (recipe.rating) {
    stats.push({
      key: 'rating',
      icon: 'star',
      label: t.recipeDetail.stats.rating,
      value: toArabicNumerals(recipe.rating),
    });
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={[styles.scrollView, { marginTop: -insets.top }]}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: BOTTOM_BAR_CONTENT + insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          {recipe.imageUrl ? (
            <Image
              source={{ uri: recipe.imageUrl }}
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
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <LinearGradient
            colors={HERO_FADE_UP}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          <View style={styles.heroCategory}>
            <View
              style={[
                styles.heroTag,
                { backgroundColor: categoryColor(recipe.categoryColor) },
              ]}
            >
              <MaterialCommunityIcons name="star" size={12} color={colors.white} />
              <Text style={styles.heroTagText} numberOfLines={1}>
                {recipe.category}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Headline + metadata ──────────────────────────────────────────── */}
        <View style={styles.overview}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{recipe.title}</Text>
            {recipe.occasion ? (
              <View style={styles.occasionBadge}>
                <Text style={styles.occasionBadgeText} numberOfLines={1}>
                  {recipe.occasion}
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.description}>{recipe.description}</Text>

          <View style={styles.statsCard}>
            {stats.map((stat, index) => (
              <React.Fragment key={stat.key}>
                {index > 0 ? <View style={styles.statDivider} /> : null}
                <View style={styles.statItem}>
                  <Feather
                    name={stat.icon}
                    size={16}
                    color={colors.primary}
                    style={styles.statIcon}
                  />
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statValue} numberOfLines={1}>
                    {stat.value}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ── Narration card ───────────────────────────────────────────────── */}
        {showAudio ? (
          <VoiceAssistantCard recipeId={recipe.id} enabled={showAudio} audio={audio} />
        ) : null}

        {/* ── Section tabs + content ───────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.tabs} accessibilityRole="tablist">
            <DetailTabButton
              label={t.recipeDetail.tabIngredients(totalCount)}
              active={activeTab === 'ingredients'}
              onPress={() => setActiveTab('ingredients')}
            />
            <DetailTabButton
              label={t.recipeDetail.tabSteps(recipe.steps?.length ?? 0)}
              active={activeTab === 'steps'}
              onPress={() => setActiveTab('steps')}
            />
            <DetailTabButton
              label={t.recipeDetail.tabTips}
              active={activeTab === 'tips'}
              onPress={() => setActiveTab('tips')}
            />
          </View>

          {activeTab === 'ingredients' ? (
            <View>
              <View style={styles.ingredientsHeader}>
                <Text style={styles.ingredientsHelper} numberOfLines={2}>
                  {t.recipeDetail.ingredientsHelper}
                </Text>
                {checkedCount > 0 ? (
                  <View style={styles.counterPill}>
                    <Text style={styles.counterPillText}>
                      {t.recipeDetail.ingredientsCounter(checkedCount, totalCount)}
                    </Text>
                  </View>
                ) : null}
              </View>

              {totalCount === 0 ? (
                <Text style={styles.emptyText}>{t.recipeDetail.noIngredients}</Text>
              ) : (
                recipe.ingredients?.map((ing) => (
                  <IngredientRow
                    key={ing.id}
                    text={ing.text}
                    checked={checkedIngredients.has(ing.id)}
                    onToggle={() => toggleIngredient(ing.id)}
                  />
                ))
              )}
            </View>
          ) : null}

          {activeTab === 'steps' ? (
            (recipe.steps?.length ?? 0) === 0 ? (
              <Text style={styles.emptyText}>{t.recipeDetail.noSteps}</Text>
            ) : (
              recipe.steps?.map((step, i) => (
                <StepAccordion
                  key={step.id}
                  number={i + 1}
                  title={step.title}
                  body={step.body}
                  open={effectiveOpenStep === step.id}
                  onToggle={() => toggleStep(step.id)}
                />
              ))
            )
          ) : null}

          {activeTab === 'tips' ? (
            (recipe.tips?.length ?? 0) === 0 ? (
              <Text style={styles.emptyText}>{t.recipeDetail.noTips}</Text>
            ) : (
              recipe.tips?.map((tip) => (
                <View key={tip.id} style={styles.tipCard}>
                  <View style={styles.tipTitleRow}>
                    <Feather name="star" size={14} color={colors.accentDark} />
                    <Text style={styles.tipTitle}>{tip.title}</Text>
                  </View>
                  <Text style={styles.tipBody}>{tip.body}</Text>
                </View>
              ))
            )
          ) : null}
        </View>
      </ScrollView>

      {/* ── Floating top bar (over the hero) ──────────────────────────────── */}
      <View style={styles.headerBar} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.glassBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
          activeOpacity={0.85}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Feather name="arrow-right" size={20} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.glassBtn}
            onPress={handleFavorite}
            accessibilityRole="button"
            accessibilityState={{ selected: isFav }}
            accessibilityLabel={
              isFav ? t.recipeDetail.favoriteRemove : t.recipeDetail.favoriteAdd
            }
            activeOpacity={0.85}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <MaterialCommunityIcons
              name={isFav ? 'heart' : 'heart-outline'}
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.glassBtn}
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel={t.common.share}
            activeOpacity={0.85}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Feather name="share-2" size={19} color={colors.neutralMid} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Sticky bottom action bar ──────────────────────────────────────── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        {showAudio ? (
          <ListenButton recipeId={recipe.id} enabled={showAudio} audio={audio} />
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
          onPress={() => setActiveTab('steps')}
          accessibilityRole="button"
          accessibilityLabel={t.recipeDetail.startCooking}
        >
          <MaterialCommunityIcons
            name="pot-steam-outline"
            size={17}
            color={colors.white}
          />
          <Text style={styles.primaryBtnText}>{t.recipeDetail.startCooking}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Segmented tab button ─────────────────────────────────────────────────────

function DetailTabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.tab,
        active && styles.tabActive,
        pressed && styles.rowPressed,
      ]}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      hitSlop={{ top: 2, bottom: 2 }}
    >
      {active ? <View style={styles.tabDot} /> : null}
      <Text
        style={[styles.tabText, active && styles.tabTextActive]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const titleText: TextStyle = {
  fontFamily: fontFamilyFor('800'),
  fontSize: 22,
  lineHeight: 31,
  fontWeight: 'normal',
};

const statValueText: TextStyle = {
  fontFamily: fontFamilyFor('700'),
  fontSize: 12,
  lineHeight: 17,
  fontWeight: 'normal',
};

const strongText: TextStyle = {
  fontFamily: fontFamilyFor('700'),
  fontWeight: 'normal',
};

const extraStrongText: TextStyle = {
  fontFamily: fontFamilyFor('800'),
  fontWeight: 'normal',
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.secondary },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: screenPadding.horizontal,
  },
  scrollView: { flex: 1 },
  scroll: { paddingBottom: spacing.xl },
  errorText: { ...typography.bodyLarge, color: colors.neutralMid, marginBottom: spacing.sm },
  errorBody: {
    ...typography.body,
    color: colors.neutralMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryBtn: {
    marginTop: spacing.sm,
    height: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: { ...typography.button, color: colors.white },

  // ── Hero ─────────────────────────────────────────────────────────────────
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

  // ── Floating top bar ─────────────────────────────────────────────────────
  headerBar: {
    position: 'absolute',
    top: spacing.sm,
    left: screenPadding.horizontal,
    right: screenPadding.horizontal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  glassBtn: {
    width: CIRCLE_BTN,
    height: CIRCLE_BTN,
    borderRadius: CIRCLE_BTN / 2,
    backgroundColor: 'rgba(253,251,247,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.cardResting,
  },
  glassSpacer: { width: CIRCLE_BTN, height: CIRCLE_BTN },

  // ── Headline + metadata ──────────────────────────────────────────────────
  overview: {
    paddingHorizontal: screenPadding.horizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: { ...titleText, color: colors.neutralDark, flex: 1, minWidth: 0, textAlign: 'left' },
  occasionBadge: {
    backgroundColor: colors.neutralSurface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    maxWidth: '42%',
  },
  occasionBadgeText: {
    ...typography.labelSm,
    ...strongText,
    color: colors.accent,
    textAlign: 'left',
  },
  description: {
    ...typography.body,
    color: colors.neutralMuted,
    textAlign: 'left',
    marginBottom: spacing.md,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.secondaryLight,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(244,162,97,0.35)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    ...elevation.cardResting,
  },
  statItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  statIcon: { marginBottom: 2 },
  statLabel: {
    ...typography.caption,
    color: colors.neutralMuted,
    marginBottom: 1,
    textAlign: 'center',
  },
  statValue: { ...statValueText, color: colors.neutralDark, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(244,162,97,0.35)', marginVertical: spacing.xs },

  // ── Tabs ─────────────────────────────────────────────────────────────────
  section: { paddingHorizontal: screenPadding.horizontal },
  tabs: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.neutralSurface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(244,162,97,0.3)',
    padding: spacing.xs,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    borderRadius: radius.input,
  },
  tabActive: { backgroundColor: colors.primary, ...elevation.cardResting },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
    marginLeft: spacing.xs,
  },
  tabText: {
    ...strongText,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.neutralMid,
    textAlign: 'center',
  },
  tabTextActive: { color: colors.white },

  // ── Ingredients ──────────────────────────────────────────────────────────
  ingredientsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: 2,
  },
  ingredientsHelper: {
    ...typography.bodySmall,
    ...strongText,
    color: colors.neutralMuted,
    flex: 1,
    textAlign: 'left',
  },
  counterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutralSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    flexShrink: 0,
  },
  counterPillText: { ...statValueText, color: colors.primary },
  ingredientRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    marginBottom: 6,
  },
  rowPressed: { opacity: 0.7 },
  ingredientLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  ingredientText: {
    flex: 1,
    fontFamily: fontFamilyFor('600'),
    fontWeight: 'normal',
    fontSize: 13,
    lineHeight: 19,
    color: colors.neutralMid,
    textAlign: 'left',
  },
  ingredientTextChecked: {
    textDecorationLine: 'line-through',
    color: colors.neutralLight,
  },
  emptyText: {
    ...typography.body,
    color: colors.neutralMuted,
    textAlign: 'left',
    paddingVertical: spacing.md,
  },

  // ── Steps accordion ──────────────────────────────────────────────────────
  stepCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    ...elevation.cardResting,
  },
  stepHeader: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
  },
  stepHeaderStart: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepNumberBox: {
    width: 26,
    height: 26,
    borderRadius: radius.input,
    backgroundColor: colors.secondaryLight,
    borderWidth: 1,
    borderColor: 'rgba(244,162,97,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumberText: { ...extraStrongText, fontSize: 12, lineHeight: 16, color: colors.primary },
  stepTitle: {
    ...strongText,
    fontSize: 13,
    lineHeight: 19,
    color: colors.neutralDark,
    flex: 1,
    textAlign: 'left',
  },
  stepBody: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
  },
  stepBodyText: {
    ...typography.body,
    color: colors.neutralMid,
    textAlign: 'left',
    lineHeight: 23,
  },

  // ── Tips ─────────────────────────────────────────────────────────────────
  tipCard: {
    backgroundColor: colors.secondaryLight,
    borderWidth: 1,
    borderColor: 'rgba(244,162,97,0.35)',
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  tipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  tipTitle: {
    ...strongText,
    fontSize: 14,
    lineHeight: 20,
    color: colors.accentDark,
    flex: 1,
    textAlign: 'left',
  },
  tipBody: {
    ...typography.bodySmall,
    fontSize: 13,
    lineHeight: 21,
    color: colors.neutralMid,
    textAlign: 'left',
  },

  // ── Sticky bottom bar ────────────────────────────────────────────────────
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: screenPadding.horizontal,
    paddingTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    zIndex: 30,
    shadowColor: '#3e1d02',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  primaryBtn: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.card,
    backgroundColor: colors.primary,
    ...elevation.primary,
  },
  primaryBtnText: { ...strongText, fontSize: 13.5, lineHeight: 18, color: colors.white },
  btnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
});

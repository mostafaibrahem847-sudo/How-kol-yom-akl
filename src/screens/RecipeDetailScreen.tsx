import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Share } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, screenPadding } from '../theme';
import { RootStackParamList } from '../navigation/RootNavigator';
import { t } from '../i18n/strings';
import { useRecipeDetailData } from '../hooks/useRecipeDetailData';
import VoiceAssistantCard from '../components/VoiceAssistantCard';
import RecipeHero from '../components/RecipeHero';
import RecipeOverview from '../components/RecipeOverview';
import RecipeStatsCard from '../components/RecipeStatsCard';
import RecipeTabs, { type DetailTab } from '../components/RecipeTabs';
import RecipeIngredientsTab from '../components/RecipeIngredientsTab';
import RecipeStepsTab from '../components/RecipeStepsTab';
import RecipeTipsTab from '../components/RecipeTipsTab';
import RecipeTopBar from '../components/RecipeTopBar';
import RecipeStickyBar, { BOTTOM_BAR_CONTENT } from '../components/RecipeStickyBar';
import RecipeDetailState from '../components/RecipeDetailState';

type DetailRouteProp = RouteProp<RootStackParamList, 'RecipeDetail'>;

export default function RecipeDetailScreen() {
  const route = useRoute<DetailRouteProp>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { id } = route.params;

  const { recipe, isLoading, isError, refetch, isFav, toggleFavorite, showAudio, audio } =
    useRecipeDetailData(id);

  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<DetailTab>('ingredients');
  // `undefined` = untouched (first step expands by default); `null` = all closed.
  const [openStep, setOpenStep] = useState<string | null | undefined>(undefined);

  const toggleIngredient = useCallback((ingId: string) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(ingId)) next.delete(ingId);
      else next.add(ingId);
      return next;
    });
  }, []);

  const handleShare = useCallback(async () => {
    if (!recipe) return;
    try {
      await Share.share({
        message: `${recipe.title}\n${recipe.description}\n${t.profile.hashtag}`,
        title: recipe.title,
      });
    } catch {}
  }, [recipe]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <RecipeDetailState
        status="loading"
        onBack={() => navigation.goBack()}
        onRetry={refetch}
      />
    );
  }

  // ── Missing recipe / query failure ─────────────────────────────────────────
  // Two distinct, honest states. Both keep the real back affordance; only the
  // failure state offers a retry.
  if (isError || !recipe) {
    return (
      <RecipeDetailState
        status={isError ? 'error' : 'missing'}
        onBack={() => navigation.goBack()}
        onRetry={refetch}
      />
    );
  }

  const totalCount = recipe.ingredients?.length ?? 0;

  const firstStepId = recipe.steps?.[0]?.id ?? null;
  const effectiveOpenStep = openStep === undefined ? firstStepId : openStep;
  const toggleStep = (stepId: string) => {
    const current = openStep === undefined ? firstStepId : openStep;
    setOpenStep(current === stepId ? null : stepId);
  };

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
        <RecipeHero
          imageUrl={recipe.imageUrl}
          category={recipe.category}
          categoryColor={recipe.categoryColor}
        />

        <RecipeOverview
          title={recipe.title}
          description={recipe.description}
          occasion={recipe.occasion}
        >
          <RecipeStatsCard recipe={recipe} />
        </RecipeOverview>

        {showAudio ? (
          <VoiceAssistantCard recipeId={recipe.id} enabled={showAudio} audio={audio} />
        ) : null}

        <View style={styles.section}>
          <RecipeTabs
            activeTab={activeTab}
            onChange={setActiveTab}
            ingredientCount={totalCount}
            stepCount={recipe.steps?.length ?? 0}
          />

          {activeTab === 'ingredients' ? (
            <RecipeIngredientsTab
              ingredients={recipe.ingredients ?? []}
              checked={checkedIngredients}
              onToggle={toggleIngredient}
            />
          ) : null}

          {activeTab === 'steps' ? (
            <RecipeStepsTab
              steps={recipe.steps ?? []}
              openStepId={effectiveOpenStep}
              onToggle={toggleStep}
            />
          ) : null}

          {activeTab === 'tips' ? <RecipeTipsTab tips={recipe.tips ?? []} /> : null}
        </View>
      </ScrollView>

      <RecipeTopBar
        isFav={isFav}
        onBack={() => navigation.goBack()}
        onToggleFavorite={toggleFavorite}
        onShare={handleShare}
      />

      <RecipeStickyBar
        recipeId={recipe.id}
        showAudio={showAudio}
        audio={audio}
        bottomInset={insets.bottom}
        onStartCooking={() => setActiveTab('steps')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.secondary },
  scrollView: { flex: 1 },
  scroll: { paddingBottom: spacing.xl },
  section: { paddingHorizontal: screenPadding.horizontal },
});

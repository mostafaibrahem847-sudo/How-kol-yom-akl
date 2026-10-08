import React from 'react';
import { View, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../theme';
import { t } from '../i18n/strings';
import GlassIconButton from './GlassIconButton';
import { headerBar } from './recipeDetailSharedStyles';

type Props = {
  isFav: boolean;
  onBack: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
};

export default function RecipeTopBar({ isFav, onBack, onToggleFavorite, onShare }: Props) {
  return (
    <View style={headerBar} pointerEvents="box-none">
      <GlassIconButton
        onPress={onBack}
        accessibilityLabel={t.common.back}
      >
        <Feather name="arrow-right" size={20} color={colors.primary} />
      </GlassIconButton>

      <View style={styles.headerActions}>
        <GlassIconButton
          onPress={onToggleFavorite}
          accessibilityLabel={
            isFav ? t.recipeDetail.favoriteRemove : t.recipeDetail.favoriteAdd
          }
          accessibilityState={{ selected: isFav }}
        >
          <MaterialCommunityIcons
            name={isFav ? 'heart' : 'heart-outline'}
            size={20}
            color={colors.primary}
          />
        </GlassIconButton>

        <GlassIconButton
          onPress={onShare}
          accessibilityLabel={t.common.share}
        >
          <Feather name="share-2" size={19} color={colors.neutralMid} />
        </GlassIconButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { spacing } from '../theme';
import { cuisines } from '../data/cuisines';
import CuisineCard from './CuisineCard';

// Horizontal browse-by-cuisine row. Same scrolling primitive and RTL behaviour
// as the category chip row it replaces (a plain horizontal ScrollView, which
// the app's forced RTL mirrors automatically). Tapping the already-active card
// clears the filter.
type Props = {
  selectedCuisine: string | null;
  onSelectCuisine: (cuisineId: string | null) => void;
};

export default function CuisineRow({ selectedCuisine, onSelectCuisine }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {cuisines.map((cuisine) => {
        const isActive = selectedCuisine === cuisine.id;
        return (
          <CuisineCard
            key={cuisine.id}
            cuisineId={cuisine.id}
            titleAr={cuisine.titleAr}
            imageUrl={cuisine.imageUrl}
            isActive={isActive}
            onPress={() => onSelectCuisine(isActive ? null : cuisine.id)}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingBottom: spacing.md },
});

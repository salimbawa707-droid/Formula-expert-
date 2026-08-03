import React from 'react';
import { ScreenScaffold, EmptyState } from '@/src/components/ScreenScaffold';

export default function IngredientsScreen() {
  return (
    <ScreenScaffold
      testID="screen-ingredients"
      title="Ingredient Library"
      subtitle="Searchable database of surfactants, builders, and solvents"
      icon="droplet"
    >
      <EmptyState
        testID="ingredients-empty"
        icon="folder"
        title="Your library is empty"
        description="Import a starter list of raw materials or add ingredients manually to begin building your database."
        ctaLabel="Add ingredient"
      />
    </ScreenScaffold>
  );
}

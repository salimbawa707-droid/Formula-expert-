import React from 'react';
import { ScreenScaffold, EmptyState } from '@/src/components/ScreenScaffold';

export default function LibraryScreen() {
  return (
    <ScreenScaffold
      testID="screen-library"
      title="Formula Library"
      subtitle="Saved recipes, favorites, and reusable templates"
      icon="book-open"
    >
      <EmptyState
        testID="library-empty"
        icon="book-open"
        title="Nothing saved yet"
        description="Save a formulation from the Builder and it will show up here for one-tap retrieval."
        ctaLabel="Go to Builder"
      />
    </ScreenScaffold>
  );
}

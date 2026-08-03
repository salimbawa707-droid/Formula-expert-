import React from 'react';
import { ScreenScaffold, EmptyState } from '@/src/components/ScreenScaffold';

export default function BuilderScreen() {
  return (
    <ScreenScaffold
      testID="screen-builder"
      title="Formula Builder"
      subtitle="Author and tweak chemical compositions with precision"
      icon="edit-3"
    >
      <EmptyState
        testID="builder-empty"
        icon="edit-3"
        title="Start a new formulation"
        description="Add ingredients, set percentages, and shape your formula. Save it to your library when you're ready."
        ctaLabel="Add first ingredient"
      />
    </ScreenScaffold>
  );
}

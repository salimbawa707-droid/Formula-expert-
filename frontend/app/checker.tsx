import React from 'react';
import { ScreenScaffold, EmptyState } from '@/src/components/ScreenScaffold';

export default function CheckerScreen() {
  return (
    <ScreenScaffold
      testID="screen-checker"
      title="Formula Checker"
      subtitle="Validation and compliance review for your formulations"
      icon="check-circle"
    >
      <EmptyState
        testID="checker-empty"
        icon="shield"
        title="No formula selected"
        description="Pick a formula from your library, or build a new one, to run compliance and safety checks."
        ctaLabel="Select a formula"
      />
    </ScreenScaffold>
  );
}

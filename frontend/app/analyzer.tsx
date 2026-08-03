import React from 'react';
import { ScreenScaffold, EmptyState } from '@/src/components/ScreenScaffold';

export default function AnalyzerScreen() {
  return (
    <ScreenScaffold
      testID="screen-analyzer"
      title="Formula Analyzer"
      subtitle="Physical properties, cost, and composition breakdown"
      icon="bar-chart-2"
    >
      <EmptyState
        testID="analyzer-empty"
        icon="bar-chart-2"
        title="Awaiting formula input"
        description="Once a formulation is provided, you'll see viscosity estimates, cost per batch, and composition ratios."
        ctaLabel="Choose a formula"
      />
    </ScreenScaffold>
  );
}

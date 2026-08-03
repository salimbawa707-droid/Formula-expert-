import React from 'react';
import { ScreenScaffold, EmptyState } from '@/src/components/ScreenScaffold';

export default function ReportsScreen() {
  return (
    <ScreenScaffold
      testID="screen-reports"
      title="PDF Reports"
      subtitle="Export batch sheets, safety data sheets, and cost breakdowns"
      icon="file-text"
    >
      <EmptyState
        testID="reports-empty"
        icon="file-text"
        title="No reports generated"
        description="Select a formula and choose a template — Batch Sheet, SDS, or Cost Breakdown — to generate a PDF."
        ctaLabel="Choose a template"
      />
    </ScreenScaffold>
  );
}

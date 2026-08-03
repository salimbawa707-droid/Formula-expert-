import React from 'react';
import { ScreenScaffold, EmptyState } from '@/src/components/ScreenScaffold';

export default function AIExpertScreen() {
  return (
    <ScreenScaffold
      testID="screen-ai-expert"
      title="AI Formula Expert"
      subtitle="Chat-based troubleshooting and substitution guidance"
      icon="cpu"
    >
      <EmptyState
        testID="ai-expert-empty"
        icon="message-circle"
        title="Ready when you are"
        description="Ask questions like 'Suggest a milder surfactant' or 'Why is my formula separating?' to get expert help."
        ctaLabel="Start a conversation"
      />
    </ScreenScaffold>
  );
}

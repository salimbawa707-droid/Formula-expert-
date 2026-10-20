import { ResearchedIngredientResolver, ResolvedIngredient } from './researchedIngredientResolver';

export interface IngredientResearchControllerResult extends ResolvedIngredient {
  canUseInFormula: boolean;
  requiresReview: boolean;
}

/**
 * UI-safe entry point for researching an ingredient before it is added to a
 * formula. It deliberately exposes the verification state so callers cannot
 * accidentally treat incomplete AI research as validated science.
 */
export async function researchIngredientForFormula(
  name: string,
  options?: { grade?: string; apiKey?: string }
): Promise<IngredientResearchControllerResult> {
  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error('Ingredient name is required.');
  }

  const resolver = new ResearchedIngredientResolver();
  const resolved = await resolver.resolve(cleanName, options?.grade, options?.apiKey);

  return {
    ...resolved,
    canUseInFormula: resolved.status !== 'NEEDS_VERIFICATION',
    requiresReview: resolved.status === 'NEEDS_VERIFICATION'
  };
}

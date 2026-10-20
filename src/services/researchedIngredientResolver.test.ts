import { describe, expect, it } from 'vitest';
import { ResearchedIngredientResolver } from './researchedIngredientResolver';

describe('ResearchedIngredientResolver', () => {
  it('uses canonical local data before any research', () => {
    const resolver = new ResearchedIngredientResolver();
    const local = resolver.resolveLocal('SLES');
    expect(local).not.toBeNull();
  });

  it('does not treat an unknown ingredient as a known local chemical', () => {
    const resolver = new ResearchedIngredientResolver();
    expect(resolver.resolveLocal('Some Never Listed Chemical XYZ')).toBeNull();
  });
});

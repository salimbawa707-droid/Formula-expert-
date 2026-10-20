import { describe, expect, it, vi } from 'vitest';
import { IngredientResearchService } from './ingredientResearchService';
import { ResearchedIngredientResolver } from './researchedIngredientResolver';

describe('ResearchedIngredientResolver', () => {
  it('uses canonical local data before any research', async () => {
    const resolver = new ResearchedIngredientResolver();
    const researchSpy = vi.spyOn(IngredientResearchService, 'researchMultiSource');
    const local = await resolver.resolve('SLES');

    expect(local.status).toBe('LOCAL');
    expect(researchSpy).not.toHaveBeenCalled();
    researchSpy.mockRestore();
  });

  it('does not treat an unknown ingredient as a known local chemical', () => {
    const resolver = new ResearchedIngredientResolver();
    expect(resolver.resolveLocal('Some Never Listed Chemical XYZ')).toBeNull();
  });

  it('marks missing research evidence as NEEDS_VERIFICATION', async () => {
    const resolver = new ResearchedIngredientResolver();
    const researchSpy = vi.spyOn(IngredientResearchService, 'researchMultiSource').mockResolvedValue({
      researchId: 'test-no-evidence',
      query: 'Unknown XYZ',
      ingredientName: 'Unknown XYZ',
      resolvedName: 'Unknown XYZ',
      confidence: 'UNRESOLVED',
      status: 'INSUFFICIENT_EVIDENCE',
      sourcesRetrieved: [],
      propertiesExtracted: {},
      comparisonReport: [],
      requiresUserApproval: true,
      notes: 'No reliable sources.'
    });

    const result = await resolver.resolve('Unknown XYZ');

    expect(result.status).toBe('NEEDS_VERIFICATION');
    expect(result.ingredient.activeMatter).toBeUndefined();
    expect(result.ingredient.unknownProperties).toContain('activeMatter');
    researchSpy.mockRestore();
  });

  it('marks conflicting source evidence as NEEDS_VERIFICATION', async () => {
    const resolver = new ResearchedIngredientResolver();
    const researchSpy = vi.spyOn(IngredientResearchService, 'researchMultiSource').mockResolvedValue({
      researchId: 'test-conflict',
      query: 'Conflict Chemical',
      ingredientName: 'Conflict Chemical',
      resolvedName: 'Conflict Chemical',
      confidence: 'POSSIBLE_MATCH',
      status: 'CONFLICTING_EVIDENCE',
      sourcesRetrieved: [
        {
          sourceId: 's1',
          url: 'https://example.com/a',
          domain: 'example.com',
          title: 'Source A',
          publisher: 'Source A',
          sourceType: 'SUPPLIER_TDS',
          retrievedAt: new Date().toISOString(),
          extractedParameters: { activeMatter: 90 },
          rawContent: 'Active matter 90%'
        }
      ],
      propertiesExtracted: { activeMatter: 90 },
      comparisonReport: [{ property: 'activeMatter', comparisonStatus: 'CONFLICT', values: [90, 70] }],
      requiresUserApproval: true,
      notes: 'Conflicting active matter values.'
    });

    const result = await resolver.resolve('Conflict Chemical');

    expect(result.status).toBe('NEEDS_VERIFICATION');
    expect(result.ingredient.provenance?.verificationStatus).toBe('EVIDENCE_CONFLICT');
    researchSpy.mockRestore();
  });
});

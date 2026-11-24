import { IngredientResearchBridge } from './ingredientResearchBridge';
import { IngredientResearchService, MultiSourceResearchResult } from './ingredientResearchService';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`ingredientResearchRouting.test failed: ${message}`);
}

async function main(): Promise<void> {
  const directKnown = await IngredientResearchService.researchMultiSource({ ingredientName: 'LABSA 90% (Acid Slurry)' }, 'test-key');
  assert(directKnown.notes?.includes('intentionally skipped'), 'direct service call must short-circuit known local ingredient');
  assert(directKnown.sourcesRetrieved.length === 0, 'known local ingredient must not perform web retrieval');
  const directLegacy = await IngredientResearchService.researchIngredient('LABSA 90% (Acid Slurry)', 'test-key');
  assert(directLegacy.requiresUserApproval === false, 'legacy API must return local known ingredient without approval gate');
  assert(directLegacy.parameters.activeMatter === 90, 'legacy API must return local active matter rather than empty research data');

  const original = IngredientResearchService.researchMultiSource;
  let researchCalls = 0;

  try {
    IngredientResearchService.researchMultiSource = (async (request) => {
      researchCalls += 1;
      return {
        researchId: 'test-research-1',
        query: request.ingredientName,
        ingredientName: request.ingredientName,
        resolvedName: request.ingredientName,
        confidence: 'HIGH_CONFIDENCE_MATCH',
        status: 'SUCCESS',
        sourcesRetrieved: [{
          sourceId: 'manufacturer-tds-1',
          url: 'https://manufacturer.example/tds',
          domain: 'manufacturer.example',
          title: 'Manufacturer TDS',
          publisher: 'Manufacturer',
          sourceType: 'MANUFACTURER_TDS',
          retrievedAt: new Date().toISOString(),
          extractedParameters: { activeMatter: 72 },
          rawContent: 'Manufacturer TDS'
        }],
        propertiesExtracted: { activeMatter: 72 },
        comparisonReport: [],
        requiresUserApproval: false,
        notes: 'Mocked grounded manufacturer evidence'
      } as MultiSourceResearchResult;
    }) as typeof IngredientResearchService.researchMultiSource;

    const known = await IngredientResearchBridge.resolveForFormula('LABSA 90% (Acid Slurry)', { apiKey: 'test-key' });
    assert(known.source === 'LOCAL_LIBRARY', 'known master-database ingredient must resolve locally');
    assert(known.requiresUserApproval === false, 'known local ingredient should not require research approval');
    assert(researchCalls === 0, 'Gemini research must not be called for a known database ingredient');

    const unknown = await IngredientResearchBridge.resolveForFormula('Unlisted Specialty Surfactant ZX-947', { apiKey: 'test-key' });
    assert(unknown.source === 'WEB_RESEARCH', 'unlisted ingredient must enter the research path');
    assert(researchCalls === 1, 'unlisted ingredient must trigger exactly one research call');
    assert(unknown.ingredient?.activeMatterPct === 72, 'source-backed active matter should be carried into the research profile');
    assert(unknown.ingredient?.identityType === undefined, 'unknown chemical identity must not be guessed as UVCB');
  } finally {
    IngredientResearchService.researchMultiSource = original;
  }

  console.log('ingredientResearchRouting.test: PASS');
}

void main();

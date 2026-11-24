import { IngredientResearchBridge } from './ingredientResearchBridge';
import { db } from '../db/database';
import { IngredientResearchService, MultiSourceResearchResult } from './ingredientResearchService';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`ingredientResearchRouting.test failed: ${message}`);
}

async function main(): Promise<void> {
  const originalIdentityResolver = IngredientResearchService.resolveIdentity;
  let metrologyRegression: MultiSourceResearchResult;
  try {
    IngredientResearchService.resolveIdentity = (() => ({
      ingredient: null, resolvedName: 'Aristo-9', confidence: 'UNRESOLVED'
    })) as typeof IngredientResearchService.resolveIdentity;
    metrologyRegression = await IngredientResearchService.researchMultiSource(
      { ingredientName: 'Aristo-9' },
      'TEST_MODE'
    );
  } finally {
    IngredientResearchService.resolveIdentity = originalIdentityResolver;
  }
  assert(metrologyRegression.propertiesExtracted.pH === undefined, 'numeric pH observations without matched unit/basis/method/conditions must not enter calculation properties');
  assert(metrologyRegression.propertiesExtracted.activeMatter === undefined, 'active matter without explicit assay metrology must not enter calculation properties');
  assert(
    metrologyRegression.comparisonReport.some(item => item.property === 'pH' && item.comparisonStatus === 'INSUFFICIENT_DATA'),
    'numeric cross-source variation must be marked insufficient rather than tolerated within an arbitrary percentage'
  );
  const directKnown = await IngredientResearchService.researchMultiSource({ ingredientName: 'LABSA 90% (Acid Slurry)' }, 'test-key');
  assert(directKnown.notes?.includes('intentionally skipped'), 'direct service call must short-circuit known local ingredient');
  assert(directKnown.sourcesRetrieved.length === 0, 'known local ingredient must not perform web retrieval');
  const directLegacy = await IngredientResearchService.researchIngredient('LABSA 90% (Acid Slurry)', 'test-key');
  assert(directLegacy.requiresUserApproval === false, 'legacy API must return local known ingredient without approval gate');
  assert(directLegacy.parameters.activeMatter === 90, 'legacy API must return local active matter rather than empty research data');

  const originalSettingsGet = db.userSettings.get.bind(db.userSettings);
  try {
    const dynamicIngredient = {
      id: 'dynamic-verified-surfactant',
      name: 'Verified Dynamic Surfactant ZX-77',
      activeDefault: 72,
      activeMatterPct: 72,
      activeMatterInputSource: 'SOURCE_BACKED' as const,
      activeMatterEvidenceId: 'supplier-tds-assay-77',
      activeMatterEvidenceUrl: 'https://manufacturer.example/tds-77',
      activeMatterEvidenceSourceType: 'MANUFACTURER_TDS' as const,
      provenance: {
        sourceType: 'OFFICIAL_MANUFACTURER',
        source: 'Manufacturer',
        sourceUrl: 'https://manufacturer.example/tds-77',
        verificationStatus: 'VERIFIED'
      }
    };
    db.userSettings.get = (async (key: string) =>
      key === 'dynamic_ingredients' ? ({ key, value: [dynamicIngredient] } as any) : undefined
    ) as typeof db.userSettings.get;
    const dynamic = await IngredientResearchBridge.resolveForFormula('Verified Dynamic Surfactant ZX-77');
    assert(dynamic.source === 'LOCAL_LIBRARY', 'persisted dynamic ingredient should resolve locally');
    assert(dynamic.ingredient?.activeMatterInputSource === 'SOURCE_BACKED', 'dynamic ingredient lookup must preserve source-backed classification');
    assert(dynamic.ingredient?.activeMatterEvidenceId === 'supplier-tds-assay-77', 'dynamic ingredient lookup must preserve assay evidence identity');
    assert(dynamic.ingredient?.provenance?.verificationStatus === 'VERIFIED', 'dynamic ingredient lookup must preserve verified provenance');
  } finally {
    db.userSettings.get = originalSettingsGet as typeof db.userSettings.get;
  }

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
    const ambiguousCas = await IngredientResearchBridge.resolveForFormula('27176-87-0', { apiKey: 'test-key' });
    assert(ambiguousCas.source === 'UNRESOLVED', 'shared CAS across local commercial grades must request grade selection');
    assert(ambiguousCas.warning?.includes('multiple local database'), 'ambiguous local CAS must explain grade selection');
    assert(researchCalls === 0, 'ambiguous local CAS must not trigger Gemini research');

    const unknown = await IngredientResearchBridge.resolveForFormula('Unlisted Specialty Surfactant ZX-947', { apiKey: 'test-key' });
    assert(unknown.source === 'WEB_RESEARCH', 'unlisted ingredient must enter the research path');
    assert(researchCalls === 1, 'unlisted ingredient must trigger exactly one research call');
    assert(unknown.ingredient?.activeMatterPct === undefined, 'a trusted source elsewhere in the profile must not certify an active-matter value without property-level assay metadata');
    assert(unknown.requiresUserApproval, 'unverified active matter must require review');

    const evidenceBase: MultiSourceResearchResult = {
      researchId: 'property-evidence-test', query: 'test', ingredientName: 'Test Surfactant',
      resolvedName: 'Test Surfactant', confidence: 'HIGH_CONFIDENCE_MATCH', status: 'SUCCESS',
      sourcesRetrieved: [{
        sourceId: 'manufacturer', url: 'https://manufacturer.example/tds', domain: 'manufacturer.example',
        title: 'TDS', publisher: 'Manufacturer', sourceType: 'MANUFACTURER_TDS',
        retrievedAt: new Date().toISOString(),
        extractedParameters: {
          activeMatter: 72, activeMatterUnit: '% w/w', activeMatterBasis: 'AS_SUPPLIED',
          activeMatterMethod: 'Two-hour gravimetric oven assay', activeMatterConditions: '105 C to constant mass',
          grade: 'Test Surfactant standard grade'
        }, rawContent: 'Test Surfactant standard grade active matter 72 % w/w AS_SUPPLIED Two-hour gravimetric oven assay 105 C to constant mass'
      }],
      propertiesExtracted: { activeMatter: 72 }, comparisonReport: [], requiresUserApproval: false
    };
    assert(IngredientResearchBridge.hasCalculationGradeEvidence(evidenceBase), 'exact property value with manufacturer TDS metrology must pass');
    assert(!IngredientResearchBridge.hasCalculationGradeEvidence({ ...evidenceBase, propertiesExtracted: { activeMatter: 70 } }), 'different extracted value must fail property-level evidence');
    assert(!IngredientResearchBridge.hasCalculationGradeEvidence(evidenceBase, 'LABSA 90%'), 'requested commercial grade must match source grade');
    assert(!IngredientResearchBridge.hasCalculationGradeEvidence({
      ...evidenceBase,
      sourcesRetrieved: [{ ...evidenceBase.sourcesRetrieved[0], sourceType: 'TECHNICAL_REFERENCE' }]
    }), 'non-manufacturer technical reference cannot certify calculation-grade active matter');
    assert(unknown.ingredient?.identityType === undefined, 'unknown chemical identity must not be guessed as UVCB');
  } finally {
    IngredientResearchService.researchMultiSource = original;
  }

  console.log('ingredientResearchRouting.test: PASS');
}

void main();

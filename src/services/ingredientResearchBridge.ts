import { db, ResearchedIngredientRecord } from '../db/database';
import { FormulationIngredient } from '../types';
import { IngredientResearchService, MultiSourceResearchResult } from './ingredientResearchService';
import { UNIVERSAL_INGREDIENTS } from '../data/universalIngredientLibrary';

/**
 * Runtime bridge between the local ingredient library, Gemini-grounded research,
 * and the deterministic formula engine.
 *
 * Rules:
 * 1. Existing local ingredients are returned immediately; no web call is made.
 * 2. Unknown ingredients are researched through IngredientResearchService.
 * 3. Only source-backed values are copied into the formulation ingredient.
 * 4. Missing/conflicting values remain undefined instead of being guessed.
 * 5. Successful research is persisted so the same ingredient can be reused.
 */
export class IngredientResearchBridge {
  private static normalize(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  private static localIngredient(name: string) {
    const normalized = this.normalize(name);
    return UNIVERSAL_INGREDIENTS.find((ingredient) => {
      return [ingredient.id, ingredient.name, ingredient.productName, ingredient.inciName, ingredient.casNumber]
        .filter(Boolean)
        .some((candidate) => this.normalize(String(candidate)) === normalized);
    }) || null;
  }

  private static toFormulaIngredient(
    name: string,
    research: MultiSourceResearchResult,
    record?: ResearchedIngredientRecord
  ): FormulationIngredient {
    const p = research.propertiesExtracted || record?.parameters || {};
    const ingredient: FormulationIngredient = {
      id: record?.id || `researched-${this.normalize(name)}`,
      name: research.resolvedName || record?.canonicalName || name,
      canonicalIngredientId: record?.id,
      identityType: 'COMMERCIAL_UVCB',
      casStatus: 'UNKNOWN',
      notes: research.notes || 'Properties populated from source-backed ingredient research. Verify against the supplier TDS/COA before production use.',
    };

    const activeMatter = this.numberOrUndefined(p.activeMatter);
    const density = this.numberOrUndefined(p.density);
    const hlb = this.numberOrUndefined(p.hlb);
    const ph = this.numberOrUndefined(p.pH ?? p.ph);
    const nvr = this.numberOrUndefined(p.nvr ?? p.nonVolatileFraction);

    if (activeMatter !== undefined) {
      ingredient.activePercent = activeMatter;
      ingredient.activeMatterPct = activeMatter;
      ingredient.activeMatterPurity = activeMatter;
    }
    if (density !== undefined) ingredient.density = density;
    if (hlb !== undefined) {
      ingredient.hlb = hlb;
      ingredient.hlbValue = hlb;
    }
    if (nvr !== undefined) ingredient.nonVolatileFraction = nvr;
    if (ph !== undefined) {
      ingredient.phMin = ph;
      ingredient.phMax = ph;
    }

    if (typeof p.ionicNature === 'string') {
      ingredient.category = p.ionicNature;
    }
    if (typeof p.application === 'string') {
      ingredient.function = p.application;
      ingredient.role = p.application;
    }
    if (typeof p.inciName === 'string') ingredient.inciName = p.inciName;
    if (typeof p.casNumber === 'string') ingredient.casNumber = p.casNumber;

    return ingredient;
  }

  private static numberOrUndefined(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value.replace('%', '').trim());
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  }

  /**
   * Finds a local/researched ingredient first and only then performs grounded research.
   * This is the entry point that formula creation should call for an unknown ingredient.
   */
  public static async resolveForFormula(
    ingredientName: string,
    options?: { grade?: string; apiKey?: string; jurisdiction?: 'IN' | 'EU' | 'US' }
  ): Promise<{
    ingredient: FormulationIngredient | null;
    source: 'LOCAL_LIBRARY' | 'RESEARCH_CACHE' | 'WEB_RESEARCH' | 'UNRESOLVED';
    research?: MultiSourceResearchResult;
    requiresUserApproval: boolean;
    warning?: string;
  }> {
    const name = ingredientName.trim();
    if (!name) {
      return { ingredient: null, source: 'UNRESOLVED', requiresUserApproval: true, warning: 'Ingredient name is empty.' };
    }

    const local = this.localIngredient(name);
    if (local) {
      return {
        ingredient: {
          id: local.id,
          name: local.name,
          category: local.category,
          activePercent: local.activeMatterDefault ?? local.activeMatter,
          activeMatterPct: local.activeMatterDefault ?? local.activeMatter,
          hlb: local.hlb,
          hlbValue: local.hlb,
          density: local.physicalProperties?.density,
          inciName: local.inciName,
          casNumber: local.casNumber,
          identityType: local.identityType as FormulationIngredient['identityType'],
          casStatus: local.casStatus as FormulationIngredient['casStatus'],
          function: local.function,
          role: local.function,
          notes: 'Resolved from the built-in ingredient library; web research was not required.'
        },
        source: 'LOCAL_LIBRARY',
        requiresUserApproval: false
      };
    }

    const key = `${this.normalize(name)}|${this.normalize(options?.grade || '')}`;
    const cached = await db.researchedIngredients.get(key);
    if (cached) {
      const cachedResearch: MultiSourceResearchResult = {
        researchId: cached.id,
        query: cached.queryName,
        ingredientName: cached.queryName,
        resolvedName: cached.canonicalName,
        confidence: 'HIGH_CONFIDENCE_MATCH',
        status: cached.status === 'CONFLICTING_EVIDENCE' ? 'CONFLICTING_EVIDENCE' : 'SUCCESS',
        sourcesRetrieved: cached.sourceIds.map((sourceId, index) => ({
          sourceId,
          url: cached.sourceUrls[index] || null,
          domain: cached.sourceUrls[index] ? new URL(cached.sourceUrls[index]).hostname : '',
          title: 'Persisted research source',
          publisher: 'Persisted source',
          sourceType: 'TECHNICAL_REFERENCE' as any,
          retrievedAt: cached.researchedAt,
          extractedParameters: cached.parameters,
          rawContent: ''
        })),
        propertiesExtracted: cached.parameters,
        comparisonReport: [],
        requiresUserApproval: cached.requiresUserApproval,
        notes: 'Loaded from the local researched-ingredient cache.'
      };

      return {
        ingredient: this.toFormulaIngredient(name, cachedResearch, cached),
        source: 'RESEARCH_CACHE',
        research: cachedResearch,
        requiresUserApproval: cached.requiresUserApproval,
        warning: cached.requiresUserApproval ? 'Research exists but requires user verification before production use.' : undefined
      };
    }

    if (!options?.apiKey || options.apiKey === 'MY_GEMINI_API_KEY') {
      return {
        ingredient: null,
        source: 'UNRESOLVED',
        requiresUserApproval: true,
        warning: 'Ingredient is not in the local database and no configured Gemini research key is available.'
      };
    }

    const research = await IngredientResearchService.researchMultiSource({
      ingredientName: name,
      grade: options.grade,
      jurisdiction: options.jurisdiction
    }, options.apiKey);

    const hasUsableSources = research.sourcesRetrieved.some(source => Boolean(source.url));
    const hasProperties = Object.keys(research.propertiesExtracted || {}).length > 0;

    if (!hasUsableSources || !hasProperties || research.status === 'RESEARCH_UNAVAILABLE') {
      return {
        ingredient: null,
        source: 'UNRESOLVED',
        research,
        requiresUserApproval: true,
        warning: 'No sufficiently supported web evidence was found. Formula properties were not invented.'
      };
    }

    const id = key;
    const now = new Date().toISOString();
    const record: ResearchedIngredientRecord = {
      id,
      queryName: name,
      canonicalName: research.resolvedName || name,
      grade: options.grade,
      parameters: research.propertiesExtracted,
      provenance: research.sourcesRetrieved.map(source => ({
        sourceId: source.sourceId,
        url: source.url,
        domain: source.domain,
        title: source.title,
        publisher: source.publisher,
        sourceType: source.sourceType,
        retrievedAt: source.retrievedAt
      })),
      sourceIds: research.sourcesRetrieved.map(source => source.sourceId),
      sourceUrls: research.sourcesRetrieved.map(source => source.url).filter((url): url is string => Boolean(url)),
      status: research.status === 'CONFLICTING_EVIDENCE' ? 'CONFLICTING_EVIDENCE' : (research.requiresUserApproval ? 'NEEDS_VERIFICATION' : 'SOURCE_BACKED'),
      requiresUserApproval: research.requiresUserApproval || research.status !== 'SUCCESS',
      researchedAt: now,
      updatedAt: now
    };

    await db.researchedIngredients.put(record);

    return {
      ingredient: this.toFormulaIngredient(name, research, record),
      source: 'WEB_RESEARCH',
      research,
      requiresUserApproval: record.requiresUserApproval,
      warning: record.requiresUserApproval ? 'Web research found evidence, but the ingredient requires verification before production use.' : undefined
    };
  }
}

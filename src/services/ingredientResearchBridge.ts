import { db, ResearchedIngredientRecord } from '../db/database';
import { FormulationIngredient } from '../types';
import { IngredientResearchService, MultiSourceResearchResult } from './ingredientResearchService';
import { UNIVERSAL_INGREDIENTS } from '../data/universalIngredientLibrary';

/**
 * Runtime bridge between the local ingredient library, Gemini-grounded research,
 * and the deterministic formula engine.
 */
export class IngredientResearchBridge {
  private static normalize(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  private static readonly BLOCKED_EVIDENCE_DOMAINS = new Set([
    'reputablesupplier.com',
    'industryjournal.org'
  ]);

  private static localIngredient(name: string) {
    const normalized = this.normalize(name);
    return UNIVERSAL_INGREDIENTS.find((ingredient) => [
      ingredient.id, ingredient.name, ingredient.productName, ingredient.inciName, ingredient.casNumber
    ].filter(Boolean).some((candidate) => this.normalize(String(candidate)) === normalized)) || null;
  }

  private static isBlockedSourceDomain(url: string | null | undefined): boolean {
    if (!url) return true;
    try {
      const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
      return this.BLOCKED_EVIDENCE_DOMAINS.has(hostname);
    } catch {
      return true;
    }
  }

  private static hasCalculationGradeEvidence(research: MultiSourceResearchResult): boolean {
    const activeMatter = research.propertiesExtracted?.activeMatter;
    if (typeof activeMatter !== 'number' || !Number.isFinite(activeMatter) || activeMatter < 0 || activeMatter > 100) return false;
    const usableSources = research.sourcesRetrieved.filter(source => !this.isBlockedSourceDomain(source.url));
    if (usableSources.length === 0) return false;
    return usableSources.some(source =>
      source.sourceType === 'MANUFACTURER_TDS' ||
      source.sourceType === 'MANUFACTURER_SDS' ||
      source.sourceType === 'MANUFACTURER_SPECIFICATION' ||
      source.sourceType === 'REGULATORY_DOCUMENT'
    );
  }

  private static toFormulaIngredient(name: string, research: MultiSourceResearchResult, record?: ResearchedIngredientRecord): FormulationIngredient {
    const p = research.propertiesExtracted || record?.parameters || {};
    const ingredient: FormulationIngredient = {
      id: record?.id || `researched-${this.normalize(name)}`,
      name: research.resolvedName || record?.canonicalName || name,
      canonicalIngredientId: record?.id,
      identityType: 'COMMERCIAL_UVCB',
      casStatus: 'UNKNOWN',
      notes: research.notes || 'Properties populated from source-backed ingredient research. Verify against the supplier TDS/COA before production use.'
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
    if (typeof p.ionicNature === 'string') ingredient.category = p.ionicNature;
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

  public static async resolveForFormula(ingredientName: string, options?: { grade?: string; apiKey?: string; jurisdiction?: 'IN' | 'EU' | 'US' }): Promise<{
    ingredient: FormulationIngredient | null;
    source: 'LOCAL_LIBRARY' | 'RESEARCH_CACHE' | 'WEB_RESEARCH' | 'UNRESOLVED';
    research?: MultiSourceResearchResult;
    requiresUserApproval: boolean;
    warning?: string;
  }> {
    const name = ingredientName.trim();
    if (!name) return { ingredient: null, source: 'UNRESOLVED', requiresUserApproval: true, warning: 'Ingredient name is empty.' };

    const local = this.localIngredient(name);
    if (local) {
      const localAny = local as any;
      const localActive = localAny.activeMatterDefault ?? local.activeMatter;
      return {
        ingredient: {
          id: local.id,
          name: local.name,
          category: local.category,
          activePercent: localActive,
          activeMatterPct: localActive,
          hlb: local.hlb ?? undefined,
          hlbValue: local.hlb ?? undefined,
          density: localAny.physicalProperties?.density,
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
      const persistedProvenance = Array.isArray(cached.provenance) ? cached.provenance : [];
      const cachedResearch: MultiSourceResearchResult = {
        researchId: cached.id,
        query: cached.queryName,
        ingredientName: cached.queryName,
        resolvedName: cached.canonicalName,
        confidence: 'HIGH_CONFIDENCE_MATCH',
        status: cached.status === 'CONFLICTING_EVIDENCE' ? 'CONFLICTING_EVIDENCE' : 'SUCCESS',
        sourcesRetrieved: persistedProvenance.length > 0
          ? persistedProvenance.map((source: any, index: number) => ({
              sourceId: source.sourceId || cached.sourceIds[index] || `persisted-${index + 1}`,
              url: source.url ?? cached.sourceUrls[index] ?? null,
              domain: source.domain || (source.url ? new URL(source.url).hostname : ''),
              title: source.title || 'Persisted research source',
              publisher: source.publisher || 'Persisted source',
              sourceType: source.sourceType,
              retrievedAt: source.retrievedAt || cached.researchedAt,
              extractedParameters: cached.parameters,
              rawContent: ''
            }))
          : cached.sourceIds.map((sourceId, index) => ({
              sourceId,
              url: cached.sourceUrls[index] || null,
              domain: cached.sourceUrls[index] ? new URL(cached.sourceUrls[index]).hostname : '',
              title: 'Persisted research source',
              publisher: 'Persisted source',
              sourceType: undefined as any,
              retrievedAt: cached.researchedAt,
              extractedParameters: cached.parameters,
              rawContent: ''
            })),
        propertiesExtracted: cached.parameters,
        comparisonReport: [],
        requiresUserApproval: cached.requiresUserApproval,
        notes: 'Loaded from the local researched-ingredient cache.'
      };
      const calculationEvidence = this.hasCalculationGradeEvidence(cachedResearch);
      const requiresUserApproval = cached.requiresUserApproval || !calculationEvidence;
      return {
        ingredient: this.toFormulaIngredient(name, cachedResearch, cached),
        source: 'RESEARCH_CACHE',
        research: cachedResearch,
        requiresUserApproval,
        warning: requiresUserApproval ? 'Research exists but lacks sufficient trusted primary evidence for deterministic calculation.' : undefined
      };
    }

    if (!options?.apiKey || options.apiKey === 'MY_GEMINI_API_KEY') {
      return { ingredient: null, source: 'UNRESOLVED', requiresUserApproval: true, warning: 'Ingredient is not in the local database and no configured Gemini research key is available.' };
    }

    const research = await IngredientResearchService.researchMultiSource({
      ingredientName: name,
      grade: options.grade,
      jurisdiction: options.jurisdiction
    }, options.apiKey);
    const hasUsableSources = research.sourcesRetrieved.some(source => !this.isBlockedSourceDomain(source.url));
    const hasProperties = Object.keys(research.propertiesExtracted || {}).length > 0;
    const calculationEvidence = this.hasCalculationGradeEvidence(research);

    if (!hasUsableSources || !hasProperties || research.status === 'RESEARCH_UNAVAILABLE') {
      return { ingredient: null, source: 'UNRESOLVED', research, requiresUserApproval: true, warning: 'No sufficiently supported web evidence was found. Formula properties were not invented.' };
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
      requiresUserApproval: research.requiresUserApproval || research.status !== 'SUCCESS' || !calculationEvidence,
      researchedAt: now,
      updatedAt: now
    };
    await db.researchedIngredients.put(record);
    return {
      ingredient: this.toFormulaIngredient(name, research, record),
      source: 'WEB_RESEARCH',
      research,
      requiresUserApproval: record.requiresUserApproval,
      warning: record.requiresUserApproval ? 'Web research found evidence, but trusted primary evidence is insufficient for automatic calculation/release.' : undefined
    };
  }
}

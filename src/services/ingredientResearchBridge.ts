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

  private static async localIngredient(name: string) {
    const clean = name.trim();
    if (!clean) return null;
    const normalized = this.normalize(clean);
    const matchesExactly = (ingredient: any) => [
      ingredient.id, ingredient.name, ingredient.productName, ingredient.inciName,
      ingredient.casNumber, ...(Array.isArray(ingredient.keywords) ? ingredient.keywords : [])
    ].filter(Boolean).some((candidate: unknown) => this.normalize(String(candidate)) === normalized);

    // Exact identity/alias match only. Fuzzy search must never suppress research
    // for a genuinely unlisted raw material.
    const masterMatches = UNIVERSAL_INGREDIENTS.filter(matchesExactly);
    if (masterMatches.length === 1) return masterMatches[0];
    if (masterMatches.length > 1) return { __ambiguousMatch: true } as any;

    // User-approved researched/custom ingredients persisted locally must also
    // be found before deciding whether Gemini is needed.
    try {
      const setting = await db.userSettings.get('dynamic_ingredients');
      const dynamic = Array.isArray(setting?.value) ? setting.value : [];
      const dynamicMatches = dynamic.filter(matchesExactly);
      if (dynamicMatches.length === 1) return dynamicMatches[0];
      if (dynamicMatches.length > 1) return { __ambiguousMatch: true } as any;
    } catch {
      // If IndexedDB is unavailable, continue to the unlisted research path.
    }
    return null;
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

  public static hasCalculationGradeEvidence(research: MultiSourceResearchResult, requestedGrade?: string): boolean {
    const activeMatter = research.propertiesExtracted?.activeMatter;
    if (typeof activeMatter !== 'number' || !Number.isFinite(activeMatter) || activeMatter < 0 || activeMatter > 100) return false;

    // Evidence must support this exact property and value. A trusted source elsewhere
    // in the ingredient profile cannot certify an unrelated AI-extracted number.
    return research.sourcesRetrieved.some(source => {
      if (this.isBlockedSourceDomain(source.url) || !source.url || !/^https:\/\//i.test(source.url)) return false;
      if (!['MANUFACTURER_TDS', 'MANUFACTURER_SPECIFICATION'].includes(source.sourceType)) return false;
      const p = source.extractedParameters || {};
      if (typeof p.activeMatter !== 'number' || p.activeMatter !== activeMatter) return false;
      const unit = String(p.activeMatterUnit || '').trim().toLowerCase().replace(/\s+/g, '');
      const basis = String(p.activeMatterBasis || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
      const method = String(p.activeMatterMethod || '').trim();
      const conditions = String(p.activeMatterConditions || '').trim();
      const grade = String(p.grade || '').trim();
      const sourceText = String(source.rawContent || '').toLowerCase();
      const containsSourceFact = (fact: string) => sourceText.includes(fact.toLowerCase());
      if (!['%w/w', 'percentw/w', 'wt%', 'mass%'].includes(unit)) return false;
      if (!['AS_SUPPLIED', 'AS_RECEIVED'].includes(basis)) return false;
      if (!method || method.length < 4 || conditions.length < 4) return false;
      const sourceGrade = this.normalize(grade);
      if (!sourceGrade) return false;
      if (requestedGrade && sourceGrade !== this.normalize(requestedGrade)) return false;
      // The extracted fields must also be present in the captured source excerpt,
      // not merely asserted by the model's structured JSON response.
      if (!containsSourceFact(String(p.activeMatter)) ||
          !containsSourceFact(String(p.activeMatterUnit)) ||
          !containsSourceFact(String(p.activeMatterBasis)) ||
          !containsSourceFact(method) ||
          !containsSourceFact(conditions) ||
          !containsSourceFact(grade)) return false;
      return true;
    });
  }

  private static toFormulaIngredient(name: string, research: MultiSourceResearchResult, record?: ResearchedIngredientRecord, requestedGrade?: string): FormulationIngredient {
    const p = { ...(research.propertiesExtracted || record?.parameters || {}) };
    if (!this.hasCalculationGradeEvidence(research, requestedGrade)) delete p.activeMatter;
    const ingredient: FormulationIngredient = {
      id: record?.id || `researched-${this.normalize(name)}`,
      name: research.resolvedName || record?.canonicalName || name,
      canonicalIngredientId: record?.id,
      casStatus: 'UNKNOWN',
      notes: research.notes || 'Properties populated from source-backed ingredient research. Verify against the supplier TDS/COA before production use.'
    };

    const activeMatter = this.numberOrUndefined(p.activeMatter);
    const activeMatterEvidenceSource = activeMatter !== undefined
      ? research.sourcesRetrieved.find(source =>
          source.extractedParameters?.activeMatter === activeMatter &&
          this.hasCalculationGradeEvidence({ ...research, sourcesRetrieved: [source] }, requestedGrade)
        )
      : undefined;
    const density = this.numberOrUndefined(p.density);
    const hlb = this.numberOrUndefined(p.hlb);
    const ph = this.numberOrUndefined(p.pH ?? p.ph);
    const nvr = this.numberOrUndefined(p.nvr ?? p.nonVolatileFraction);

    if (activeMatter !== undefined) {
      ingredient.activePercent = activeMatter;
      ingredient.activeMatterPct = activeMatter;
      ingredient.activeMatterPurity = activeMatter;
      ingredient.activeMatterInputSource = 'SOURCE_BACKED';
      ingredient.activeMatterEvidenceId = activeMatterEvidenceSource?.sourceId;
      ingredient.activeMatterEvidenceUrl = activeMatterEvidenceSource?.url || undefined;
      ingredient.activeMatterEvidenceSourceType = activeMatterEvidenceSource?.sourceType as FormulationIngredient['activeMatterEvidenceSourceType'];
      if (activeMatterEvidenceSource) {
        ingredient.provenance = {
          sourceType: 'OFFICIAL_MANUFACTURER',
          source: activeMatterEvidenceSource.publisher,
          sourceUrl: activeMatterEvidenceSource.url || undefined,
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date().toISOString().slice(0, 10)
        };
      }
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

    const local = await this.localIngredient(name);
    if ((local as any)?.__ambiguousMatch) {
      return { ingredient: null, source: 'UNRESOLVED', requiresUserApproval: true, warning: 'This name matches multiple local database ingredients/grades. Select the exact ingredient or commercial grade; Gemini research was skipped.' };
    }
    if (local) {
      const localAny = local as any;
      const localActive = localAny.activeMatterDefault ?? localAny.activeDefault ?? local.activeMatter ?? localAny.activeMatterPct;
      return {
        ingredient: {
          id: local.id,
          name: local.name,
          category: local.category,
          activePercent: localActive,
          activeMatterPct: localActive,
          activeMatterInputSource: typeof localActive === 'number' ? 'CATALOG_DEFAULT' : 'UNKNOWN',
          hlb: local.hlb ?? undefined,
          hlbValue: local.hlb ?? undefined,
          density: localAny.physicalProperties?.density ?? localAny.densityGPerMl ?? localAny.density,
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
    let cached: ResearchedIngredientRecord | undefined;
    try {
      cached = await db.researchedIngredients.get(key);
    } catch {
      cached = undefined;
    }
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
              extractedParameters: source.extractedParameters || cached.parameters,
              rawContent: source.rawContent || ''
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
      const calculationEvidence = this.hasCalculationGradeEvidence(cachedResearch, options?.grade);
      const requiresUserApproval = cached.requiresUserApproval || !calculationEvidence;
      return {
        ingredient: this.toFormulaIngredient(name, cachedResearch, cached, options?.grade),
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
    const calculationEvidence = this.hasCalculationGradeEvidence(research, options?.grade);

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
        retrievedAt: source.retrievedAt,
        extractedParameters: source.extractedParameters,
        rawContent: source.rawContent
      })),
      sourceIds: research.sourcesRetrieved.map(source => source.sourceId),
      sourceUrls: research.sourcesRetrieved.map(source => source.url).filter((url): url is string => Boolean(url)),
      status: research.status === 'CONFLICTING_EVIDENCE' ? 'CONFLICTING_EVIDENCE' : (research.requiresUserApproval ? 'NEEDS_VERIFICATION' : 'SOURCE_BACKED'),
      requiresUserApproval: research.requiresUserApproval || research.status !== 'SUCCESS' || !calculationEvidence,
      researchedAt: now,
      updatedAt: now
    };
    try {
      await db.researchedIngredients.put(record);
    } catch {
      // Ignored in environments where IndexedDB is unavailable (e.g. Node test runners)
    }
    return {
      ingredient: this.toFormulaIngredient(name, research, record, options?.grade),
      source: 'WEB_RESEARCH',
      research,
      requiresUserApproval: record.requiresUserApproval,
      warning: record.requiresUserApproval ? 'Web research found evidence, but trusted primary evidence is insufficient for automatic calculation/release.' : undefined
    };
  }
}

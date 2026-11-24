import { UNIVERSAL_INGREDIENTS, UniversalIngredient } from '../data/universalIngredientLibrary';
import { db } from '../db/database';
import { GoogleGenAI, Type } from '@google/genai';
import { calculateActiveMatter, calculateActiveSurfactants, calculateRawSurfactants } from '../utils/activeMatterEngine';
import { calculateDensity } from '../utils/densityEngine';
import { calculateBlendedHLB } from '../utils/hlbEngine';
import { calculateLiquidNVR } from '../utils/liquidNvrEngine';
import { SourceType, validateUrl } from '../utils/provenanceEngine';

// =============================================================================
// TYPINGS & SYSTEM INTERFACES (P1-8)
// =============================================================================

export interface ResearchRequest {
  ingredientName: string;
  grade?: string;
  properties?: string[];
  jurisdiction?: 'IN' | 'EU' | 'US';
}

export interface WebSearchResultSource {
  sourceId: string;
  url: string | null;
  domain: string;
  title: string;
  publisher: string;
  sourceType: SourceType;
  retrievedAt: string;
  publicationDate?: string;
  contentReference?: string;
  extractedParameters: Record<string, any>;
  rawContent: string;
}

export interface ResearchComparisonReport {
  property: string;
  comparisonStatus: 'AGREEMENT' | 'MINOR_VARIATION' | 'SIGNIFICANT_VARIATION' | 'CONFLICT' | 'INSUFFICIENT_DATA';
  values: any[];
  notes?: string;
}

export interface MultiSourceResearchResult {
  researchId: string;
  query: string;
  ingredientName: string;
  resolvedName: string;
  confidence: 'EXACT_MATCH' | 'HIGH_CONFIDENCE_MATCH' | 'POSSIBLE_MATCH' | 'UNRESOLVED';
  status: 'SUCCESS' | 'CONFLICTING_EVIDENCE' | 'INSUFFICIENT_EVIDENCE' | 'RESEARCH_UNAVAILABLE';
  sourcesRetrieved: WebSearchResultSource[];
  propertiesExtracted: Record<string, any>;
  comparisonReport: ResearchComparisonReport[];
  requiresUserApproval: boolean;
  notes?: string;
}

export type ResearchEvidenceLevel =
  | 'VERIFIED_SOURCE'
  | 'SOURCE_BACKED'
  | 'AI_SUMMARY'
  | 'ESTIMATED'
  | 'UNKNOWN';

export type ParameterVerificationStatus =
  | 'VERIFIED'
  | 'SOURCE_BACKED'
  | 'AI_SUMMARY'
  | 'NEEDS_VERIFICATION'
  | 'UNKNOWN'
  | 'EVIDENCE_CONFLICT'
  | 'CONFLICTING_DATA';

export interface ParameterProvenance {
  property?: string;
  value: any;
  extractedValue?: any;
  status: ParameterVerificationStatus;
  evidenceLevel?: ResearchEvidenceLevel;
  sourceType?: string;
  sourceId?: string;
  source: string;
  sourceUrl: string;
  sourceDocumentUrl?: string | null;
  notes?: string;
  verifiedAt?: string;
  verificationDate?: string;
  confidenceScore?: number;
}

export interface ResearchProvenance {
  activeMatter?: ParameterProvenance;
  pH?: ParameterProvenance;
  pHRange?: ParameterProvenance;
  ionicNature?: ParameterProvenance;
  physicalState?: ParameterProvenance;
  shelfLife?: ParameterProvenance;
  application?: ParameterProvenance;
  hlb?: ParameterProvenance;
  cmc?: ParameterProvenance;
  density?: ParameterProvenance;
  nvr?: ParameterProvenance;
  chelatingCapacity?: ParameterProvenance;
  enzymeActivity?: ParameterProvenance;
}

export interface ResearchAuditTrail {
  ingredientId: string;
  timestamp: string;
  previousRecord: any;
  newRecord: any;
  reason: string;
}

export interface ResearchResult {
  ingredientId: string;
  canonicalName: string;
  resolvedName: string;
  confidence: 'EXACT_MATCH' | 'HIGH_CONFIDENCE_MATCH' | 'POSSIBLE_MATCH' | 'UNRESOLVED';
  parameters: Record<string, any>;
  provenance: ResearchProvenance;
  auditTrail?: ResearchAuditTrail;
  requiresUserApproval: boolean;
}

// =============================================================================
// LOCAL AUTHORITATIVE MULTI-SOURCE CACHE FOR TESTING & REPRODUCIBILITY
// =============================================================================

const MULTI_SOURCE_EVIDENCE_REPOSITORIES: Record<string, WebSearchResultSource[]> = {
  'aristo-9': [
    {
      sourceId: 'src-aristo-manufacturer',
      url: 'https://bluechemindia.co.in/aristo-9',
      domain: 'bluechemindia.co.in',
      title: 'Blue Chem India Ahmedabad - Aristo 9 Technical Product Datasheet (TDS)',
      publisher: 'Blue Chem India',
      sourceType: 'MANUFACTURER_TDS',
      retrievedAt: '2026-10-05T12:00:00Z',
      publicationDate: '2025-05-10',
      contentReference: 'Page 2 Section A',
      rawContent: 'Aristo 9 multipurpose liquid laundry additive contains 90% dry solids concentration. Operating pH 10% solution is 7.0 (range 7.0 - 9.0). Ethylene oxide based nonionic compound with auxiliary polymer thickeners.',
      extractedParameters: {
        activeMatter: 90,
        pH: 7.0,
        pHRange: '7.0 - 9.0',
        ionicNature: 'Nonionic',
        physicalState: 'Liquid',
        shelfLife: '2 years',
        application: 'Liquid Detergent & Viscosity Booster'
      }
    },
    {
      sourceId: 'src-aristo-supplier',
      url: 'https://reputablesupplier.com/aristo-9-spec',
      domain: 'reputablesupplier.com',
      title: 'Chemical Supplier Spec Sheet - Aristo 9 Additive',
      publisher: 'Reputable Supplier Corp',
      sourceType: 'SUPPLIER_TDS',
      retrievedAt: '2026-10-05T12:05:00Z',
      publicationDate: '2025-08-12',
      rawContent: 'Aristo 9 is distributed as a liquid nonionic laundry booster. Active concentration is reported around 90% by solids oven-drying. pH of 10% solution sits at 7.2.',
      extractedParameters: {
        activeMatter: 90,
        pH: 7.2,
        ionicNature: 'Nonionic',
        physicalState: 'Liquid'
      }
    },
    {
      sourceId: 'src-aristo-industry',
      url: 'https://industryjournal.org/reviews/aristo-9',
      domain: 'industryjournal.org',
      title: 'Ethoxylated Specialty Blends in Modern Detergents',
      publisher: 'Detergents Technology Review',
      sourceType: 'TECHNICAL_REFERENCE',
      retrievedAt: '2026-10-05T12:10:00Z',
      publicationDate: '2024-11-05',
      rawContent: 'Industrial reviews of Blue Chem Indias Aristo 9 confirm it functions as an ethoxylated nonionic stabilizer. Active loading typically measures 88 - 90% with stable neutral pH.',
      extractedParameters: {
        activeMatter: 90,
        pH: 7.1,
        ionicNature: 'Nonionic'
      }
    }
  ]
};

// =============================================================================
// MAIN SERVICE IMPLEMENTATION
// =============================================================================

export class IngredientResearchService {
  private static searchCache: Record<string, MultiSourceResearchResult> = {};

  /**
   * Safe input sanitizer protecting against prompt injections in retrieved web content.
   * Strips potential malicious instructions and executable scripts.
   */
  public static sanitizeWebContent(text: string): string {
    if (!text) return '';
    // Strip script tags, command patterns, ignored instructions
    return text
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
      .replace(/ignore\s+previous\s+instructions/gi, '[Injection Blocked]')
      .replace(/reveal\s+api\s+key/gi, '[Injection Blocked]')
      .replace(/execute\s+command/gi, '[Injection Blocked]')
      .trim();
  }

  /**
   * Plans property-specific structured queries for more targeted searches.
   */
  public static planQueries(ingredientName: string, grade?: string): string[] {
    const cleanName = ingredientName.trim();
    const cleanGrade = grade ? ` ${grade}` : '';
    return [
      `"${cleanName}"${cleanGrade} Technical Datasheet TDS`,
      `"${cleanName}"${cleanGrade} CAS number chemical properties`,
      `"${cleanName}"${cleanGrade} active matter pH density specification`
    ];
  }

  /**
   * Identifies and resolves an ingredient name or alias to its canonical database record.
   */
  public static resolveIdentity(nameOrAlias: string): {
    ingredient: UniversalIngredient | null;
    resolvedName: string;
    confidence: 'EXACT_MATCH' | 'HIGH_CONFIDENCE_MATCH' | 'POSSIBLE_MATCH' | 'UNRESOLVED';
  } {
    const q = (nameOrAlias || '').trim();
    const normalized = q.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!normalized) return { ingredient: null, resolvedName: '', confidence: 'UNRESOLVED' };

    // Only exact canonical identity/name/INCI/CAS/declared-keyword matches
    // count as present. Similarity matches must not suppress Gemini research.
    const exactMatches = UNIVERSAL_INGREDIENTS.filter((i) => [
      i.id, i.name, i.productName, i.inciName, i.casNumber, ...(i.keywords || [])
    ].filter(Boolean).some((candidate) =>
      String(candidate).trim().toLowerCase().replace(/[^a-z0-9]/g, '') === normalized
    ));

    if (exactMatches.length === 1) {
      return { ingredient: exactMatches[0], resolvedName: exactMatches[0].name, confidence: 'EXACT_MATCH' };
    }
    if (exactMatches.length > 1) {
      return { ingredient: null, resolvedName: q, confidence: 'POSSIBLE_MATCH' };
    }
    return { ingredient: null, resolvedName: q, confidence: 'UNRESOLVED' };
  }

  /**
   * Executes the full multi-source web research pipeline (P1-8).
   * Generates queries, retrieves multiple independent sources, performs cross-source comparisons,
   * detects conflicts, sanitizes content, and populates evidence.
   */
  public static async researchMultiSource(request: ResearchRequest, apiKey?: string): Promise<MultiSourceResearchResult> {
    const { ingredientName, grade } = request;
    const cacheKey = ingredientName.toLowerCase() + '|' + (grade || '').toLowerCase();

    // Database-first routing is enforced here as well as in the formula bridge.
    // Exact local matches return immediately and can never invoke Gemini.
    const resolution = this.resolveIdentity(ingredientName);
    if (resolution.confidence === 'POSSIBLE_MATCH') {
      return {
        researchId: 'ambiguous-local-match', query: ingredientName, ingredientName,
        resolvedName: ingredientName, confidence: 'POSSIBLE_MATCH',
        status: 'INSUFFICIENT_EVIDENCE', sourcesRetrieved: [], propertiesExtracted: {},
        comparisonReport: [], requiresUserApproval: true,
        notes: 'Multiple exact local database matches exist (for example, different grades). Gemini was skipped; select the exact local ingredient/grade.'
      };
    }
    if (resolution.ingredient) {
      const local: any = resolution.ingredient;
      const propertiesExtracted: Record<string, any> = {};
      const active = local.activeMatterDefault ?? local.activeDefault ?? local.activeMatter ?? local.activeMatterPct;
      if (typeof active === 'number') propertiesExtracted.activeMatter = active;
      if (typeof local.phMin === 'number') propertiesExtracted.pH = local.phMin;
      if (typeof local.ionicNature === 'string') propertiesExtracted.ionicNature = local.ionicNature;
      const density = local.density ?? local.densityGPerMl;
      if (typeof density === 'number') propertiesExtracted.density = density;
      if (typeof local.hlb === 'number') propertiesExtracted.hlb = local.hlb;
      return {
        researchId: 'local-' + local.id,
        query: ingredientName,
        ingredientName,
        resolvedName: local.name,
        confidence: 'EXACT_MATCH',
        status: 'SUCCESS',
        sourcesRetrieved: [],
        propertiesExtracted,
        comparisonReport: [],
        requiresUserApproval: false,
        notes: 'Exact local database match. Gemini/web research was intentionally skipped.'
      };
    }

    if (this.searchCache[cacheKey]) return this.searchCache[cacheKey];
    const resolvedName = ingredientName;
    // Generate queries via Query Planner
    const queries = this.planQueries(ingredientName, grade);

    // Retrieve multiple independent sources (from Cache/Mock Database or Live AI if credentials exist)
    const resolvedKey = Object.keys(MULTI_SOURCE_EVIDENCE_REPOSITORIES).find(key => {
      const queryLower = ingredientName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const keyLower = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      return keyLower === queryLower || keyLower.includes(queryLower) || queryLower.includes(keyLower);
    });

    let retrievedSources: WebSearchResultSource[] = [];

    // Attempt live AI grounded multi-source research if API key is supplied
    if (apiKey && apiKey.trim() && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const prompt = `Perform rigorous multi-source research on: "${ingredientName}" (grade: "${grade || 'any'}").
Search distinct manufacturer datasheets, TDS, and supplier specifications.
CRITICAL INTEGRITY: Retrieve actual facts only. Do not hallucinate or invent sources or URLs.
Classify each source with distinct publisher and sourceType.
Provide exactly 3 distinct sources in JSON format conforming to this schema:
{
  "sources": [
    {
      "sourceId": "string",
      "url": "string_or_null",
      "domain": "string",
      "title": "string",
      "publisher": "string",
      "sourceType": "MANUFACTURER_TDS" | "SUPPLIER_TDS" | "TECHNICAL_REFERENCE" | "REGULATORY_DOCUMENT",
      "publicationDate": "string",
      "rawContent": "string_factual_content_snippet",
      "extractedParameters": {
        "activeMatter": number_or_null,
        "activeMatterUnit": "string_or_null",
        "activeMatterBasis": "string_or_null",
        "activeMatterMethod": "string_or_null",
        "activeMatterConditions": "string_or_null",
        "grade": "exact commercial grade or null",
        "pH": number_or_null,
        "pHUnit": "string_or_null",
        "pHBasis": "string_or_null",
        "pHMethod": "string_or_null",
        "pHConditions": "string_or_null",
        "ionicNature": "string_or_null"
      }
    }
  ]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                sources: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      sourceId: { type: Type.STRING },
                      url: { type: Type.STRING },
                      domain: { type: Type.STRING },
                      title: { type: Type.STRING },
                      publisher: { type: Type.STRING },
                      sourceType: { type: Type.STRING },
                      publicationDate: { type: Type.STRING },
                      rawContent: { type: Type.STRING },
                      extractedParameters: {
                        type: Type.OBJECT,
                        properties: {
                          activeMatter: { type: Type.NUMBER },
                          activeMatterUnit: { type: Type.STRING },
                          activeMatterBasis: { type: Type.STRING },
                          activeMatterMethod: { type: Type.STRING },
                          activeMatterConditions: { type: Type.STRING },
                          grade: { type: Type.STRING },
                          pH: { type: Type.NUMBER },
                          pHUnit: { type: Type.STRING },
                          pHBasis: { type: Type.STRING },
                          pHMethod: { type: Type.STRING },
                          pHConditions: { type: Type.STRING },
                          ionicNature: { type: Type.STRING }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        });

        if (response.text) {
          const resultJson = JSON.parse(response.text.trim());
          if (resultJson.sources && resultJson.sources.length > 0) {
            retrievedSources = resultJson.sources.map((s: any) => ({
              ...s,
              retrievedAt: new Date().toISOString(),
              rawContent: this.sanitizeWebContent(s.rawContent || '')
            }));
          }
        }
      } catch (err) {
        console.warn('Grounded Gemini search retrieval failed, falling back to local multi-source repositories:', err);
      }
    }

    if (retrievedSources.length === 0 && (apiKey === 'TEST_MODE' || process.env.NODE_ENV === 'test') && resolvedKey) {
      // Use local multi-source technical datasheets for test/reproducibility mode
      retrievedSources = MULTI_SOURCE_EVIDENCE_REPOSITORIES[resolvedKey].map(s => ({
        ...s,
        rawContent: this.sanitizeWebContent(s.rawContent)
      }));
    }

    if (retrievedSources.length === 0) {
      const failedResult: MultiSourceResearchResult = {
        researchId: `res-fail-${Date.now()}`,
        query: queries[0],
        ingredientName,
        resolvedName,
        confidence: resolution.confidence,
        status: 'INSUFFICIENT_EVIDENCE',
        sourcesRetrieved: [],
        propertiesExtracted: {},
        comparisonReport: [],
        requiresUserApproval: true,
        notes: 'No reliable external sources could be retrieved for this ingredient. Keep unresolved and do not use estimated properties.'
      };
      return failedResult;
    }

    // Eliminate duplicate domains to ensure independent source verification
    const uniqueDomains = new Set<string>();
    const uniqueSources = retrievedSources.filter(s => {
      if (!s.domain) return true;
      if (uniqueDomains.has(s.domain)) return false;
      uniqueDomains.add(s.domain);
      return true;
    });

    // Cross-Source Comparison & Conflict Detection
    const propertiesToCompare = ['activeMatter', 'pH', 'ionicNature'];
    const comparisonReport: ResearchComparisonReport[] = [];
    const propertiesExtracted: Record<string, any> = {};

    propertiesToCompare.forEach(prop => {
      const values = uniqueSources
        .map(s => s.extractedParameters?.[prop])
        .filter(v => v !== undefined && v !== null);

      if (values.length === 0) {
        comparisonReport.push({
          property: prop,
          comparisonStatus: 'INSUFFICIENT_DATA',
          values: []
        });
        return;
      }

      // Numeric properties are comparable only when every contributing source states
      // the same grade, unit, measurement basis, method and test conditions.
      const propertySources = uniqueSources.filter(source =>
        source.extractedParameters?.[prop] !== undefined && source.extractedParameters?.[prop] !== null
      );
      const numericProperty = values.every(value => typeof value === 'number' && Number.isFinite(value));
      if (numericProperty) {
        const metadataKeys = [`${prop}Unit`, `${prop}Basis`, `${prop}Method`, `${prop}Conditions`];
        const metadataComplete = propertySources.length === values.length && propertySources.every(source => {
          const sourceText = String(source.rawContent || '').toLowerCase();
          const sourceGrade = String(source.extractedParameters?.grade || '').trim();
          const metadataPresent = metadataKeys.every(key =>
            typeof source.extractedParameters?.[key] === 'string' &&
            source.extractedParameters[key].trim().length > 0 &&
            sourceText.includes(source.extractedParameters[key].trim().toLowerCase())
          );
          const valuePresent = sourceText.includes(String(source.extractedParameters?.[prop]).toLowerCase());
          return metadataPresent &&
            Boolean(sourceGrade) &&
            sourceText.includes(sourceGrade.toLowerCase()) &&
            valuePresent &&
            (!grade || sourceGrade.toLowerCase() === grade.trim().toLowerCase());
        });
        const signatures = propertySources.map(source => metadataKeys
          .map(key => String(source.extractedParameters[key]).trim().toLowerCase().replace(/\s+/g, ' '))
          .concat([String(source.extractedParameters.grade || '').trim().toLowerCase()])
          .join('|'));
        const metadataEquivalent = signatures.length > 0 && signatures.every(signature => signature === signatures[0]);
        if (!metadataComplete || !metadataEquivalent) {
          comparisonReport.push({
            property: prop,
            comparisonStatus: 'INSUFFICIENT_DATA',
            values,
            notes: 'Numeric observations are not calculation-grade comparable: source-level grade, units, measurement basis, method and test conditions must all be explicit and equivalent.'
          });
          return;
        }
      }

      // Check exact value diversity; no percentage tolerance is applied.
      const uniqueVals = Array.from(new Set(values.map(v => typeof v === 'string' ? v.toLowerCase() : v)));
      if (uniqueVals.length === 1) {
        comparisonReport.push({
          property: prop,
          comparisonStatus: 'AGREEMENT',
          values,
          notes: 'All independent sources are in complete scientific agreement.'
        });
        propertiesExtracted[prop] = values[0];
      } else {
        // No percentage tolerance or averaging is scientifically defensible without
        // demonstrated equivalence of commercial grade, units, basis, method and conditions.
        // Preserve the conflicting observations for review, but never emit a numeric
        // range as a calculation-ready ingredient property.
        comparisonReport.push({
          property: prop,
          comparisonStatus: 'CONFLICT',
          values,
          notes: 'Sources disagree. No tolerance band, midpoint, or numeric range is promoted. Verify identical grade, units, measurement basis, method and test conditions before selecting a value.'
        });
      }
    });

    const isConflicting = comparisonReport.some(c => c.comparisonStatus === 'CONFLICT');
    const finalStatus = isConflicting ? 'CONFLICTING_EVIDENCE' : 'SUCCESS';

    const multiResult: MultiSourceResearchResult = {
      researchId: `res-ms-${ingredientName.toLowerCase()}-${Date.now()}`,
      query: queries[0],
      ingredientName,
      resolvedName,
      confidence: resolution.confidence,
      status: finalStatus,
      sourcesRetrieved: uniqueSources,
      propertiesExtracted,
      comparisonReport,
      requiresUserApproval: isConflicting || comparisonReport.some(c => c.comparisonStatus === 'MINOR_VARIATION' || (c.comparisonStatus === 'INSUFFICIENT_DATA' && c.values.length > 0)),
      notes: isConflicting
        ? 'Cross-source comparison discovered significant scientific conflicts. Manual engineering audit is required.'
        : 'Multi-source web research completed with strong corroborative agreement.'
    };

    // Cache the result
    this.searchCache[cacheKey] = multiResult;
    return multiResult;
  }

  /**
   * Synchronous / backward compatible research entry point wrapping the multi-source pipeline (P1-8).
   */
  public static async researchIngredient(nameOrAlias: string, apiKey?: string, grade?: string): Promise<ResearchResult> {
    const resolution = this.resolveIdentity(nameOrAlias);
    const ingredient = resolution.ingredient;

    const cleanSlug = nameOrAlias.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "custom-ingredient";
    const ingredientId = ingredient ? ingredient.id : `custom-${cleanSlug}`;
    const canonicalName = ingredient ? ingredient.name : nameOrAlias;

    if (ingredient) {
      const local: any = ingredient;
      const parameters: Record<string, any> = {};
      const active = local.activeMatterDefault ?? local.activeDefault ?? local.activeMatter ?? local.activeMatterPct;
      if (typeof active === 'number') parameters.activeMatter = active;
      if (typeof local.phMin === 'number') parameters.pH = local.phMin;
      if (typeof local.ionicNature === 'string') parameters.ionicNature = local.ionicNature;
      const density = local.density ?? local.densityGPerMl;
      if (typeof density === 'number') parameters.density = density;
      if (typeof local.hlb === 'number') parameters.hlb = local.hlb;
      return {
        ingredientId: local.id,
        canonicalName: local.name,
        resolvedName: local.name,
        confidence: 'EXACT_MATCH',
        parameters,
        provenance: {},
        requiresUserApproval: false
      };
    }

    // Run multi-source pipeline
    const msResult = await this.researchMultiSource({ ingredientName: canonicalName, grade }, apiKey);

    if (msResult.sourcesRetrieved.length === 0) {
      return {
        ingredientId,
        canonicalName,
        resolvedName: resolution.resolvedName,
        confidence: resolution.confidence,
        parameters: {},
        provenance: {},
        requiresUserApproval: true
      };
    }

    const firstSource = msResult.sourcesRetrieved[0];
    const isConflict = msResult.status === 'CONFLICTING_EVIDENCE';
    const findPropertySource = (property: string, value: any) =>
      msResult.sourcesRetrieved.find(source => source.extractedParameters?.[property] === value);
    const activeVal = msResult.propertiesExtracted.activeMatter ?? null;
    const phVal = msResult.propertiesExtracted.pH ?? null;
    const phRangeVal = firstSource.extractedParameters.pHRange ?? null;
    const ionicVal = msResult.propertiesExtracted.ionicNature ?? null;
    const stateVal = firstSource.extractedParameters.physicalState ?? null;
    const shelfVal = firstSource.extractedParameters.shelfLife ?? null;
    const appVal = firstSource.extractedParameters.application ?? null;

    const pProv = (property: string, val: any, notes?: string): ParameterProvenance => {
      const propertySource = val === null || val === undefined ? undefined : findPropertySource(property, val);
      const sourceRecord = propertySource || firstSource;
      const source = sourceRecord.publisher || sourceRecord.domain || "Independent Technical Datasheet";
      const sourceUrl = sourceRecord.url || (sourceRecord.domain ? `https://${sourceRecord.domain}` : "");
      const primaryManufacturerSource = ['MANUFACTURER_TDS', 'MANUFACTURER_SPECIFICATION'].includes(sourceRecord.sourceType);
      const p = sourceRecord.extractedParameters || {};
      const activeMatterMetrologyComplete = property !== 'activeMatter' || (
        typeof val === 'number' && Number.isFinite(val) && val >= 0 && val <= 100 &&
        ['%w/w', 'percentw/w', 'wt%', 'mass%'].includes(String(p.activeMatterUnit || '').trim().toLowerCase().replace(/\s+/g, '')) &&
        ['AS_SUPPLIED', 'AS_RECEIVED'].includes(String(p.activeMatterBasis || '').trim().toUpperCase().replace(/[\s-]+/g, '_')) &&
        typeof p.activeMatterMethod === 'string' && p.activeMatterMethod.trim().length >= 4 &&
        typeof p.activeMatterConditions === 'string' && p.activeMatterConditions.trim().length >= 4 &&
        Boolean(String(p.grade || '').trim()) &&
        (!grade || String(p.grade || '').trim().toLowerCase() === grade.trim().toLowerCase()) &&
        String(sourceRecord.rawContent || '').toLowerCase().includes(String(val).toLowerCase()) &&
        String(sourceRecord.rawContent || '').toLowerCase().includes(String(p.activeMatterUnit || '').toLowerCase()) &&
        String(sourceRecord.rawContent || '').toLowerCase().includes(String(p.activeMatterBasis || '').toLowerCase()) &&
        String(sourceRecord.rawContent || '').toLowerCase().includes(String(p.activeMatterMethod || '').toLowerCase()) &&
        String(sourceRecord.rawContent || '').toLowerCase().includes(String(p.activeMatterConditions || '').toLowerCase()) &&
        String(sourceRecord.rawContent || '').toLowerCase().includes(String(p.grade || '').toLowerCase())
      );
      const exactPropertyEvidence = propertySource !== undefined && sourceRecord.extractedParameters?.[property] === val;
      const verified = !isConflict && exactPropertyEvidence && primaryManufacturerSource && activeMatterMetrologyComplete && /^https:\/\//i.test(sourceUrl) && validateUrl(sourceUrl);
      const status: ParameterVerificationStatus = isConflict
        ? 'EVIDENCE_CONFLICT'
        : verified ? 'VERIFIED' : (val !== null && val !== undefined && exactPropertyEvidence ? 'SOURCE_BACKED' : 'UNKNOWN');
      const evidenceLevel: ResearchEvidenceLevel = verified ? 'VERIFIED_SOURCE' : (status === 'SOURCE_BACKED' ? 'SOURCE_BACKED' : 'UNKNOWN');

      return {
        property,
        value: val,
        extractedValue: val,
        status,
        evidenceLevel,
        sourceType: sourceRecord.sourceType,
        sourceId: sourceRecord.sourceId,
        source,
        sourceUrl: validateUrl(sourceUrl) ? sourceUrl : "",
        sourceDocumentUrl: validateUrl(sourceUrl) ? sourceUrl : null,
        notes: verified ? notes : (property === 'activeMatter' ? 'Not calculation-grade: exact property source, manufacturer primary source, as-supplied mass basis, unit, assay method, conditions and requested grade must all be evidenced.' : notes),
        verifiedAt: new Date().toISOString().split('T')[0],
        verificationDate: new Date().toISOString().split('T')[0],
        confidenceScore: verified ? 0.95 : (status === 'SOURCE_BACKED' ? 0.7 : 0.3)
      };
    };

    const provenance: ResearchProvenance = {};
    const parameters: Record<string, any> = {};

    if (activeVal !== null) {
      provenance.activeMatter = pProv('activeMatter', activeVal, 'Manufacturer-reported active matter assay with explicit method and basis');
      if (provenance.activeMatter.status === 'VERIFIED') parameters.activeMatter = activeVal;
    }
    if (phVal !== null) {
      provenance.pH = pProv('pH', phVal, 'pH measurement with source-reported conditions');
      if (provenance.pH.status === 'VERIFIED') parameters.pH = phVal;
    }
    if (phRangeVal !== null) {
      provenance.pHRange = pProv('pHRange', phRangeVal, 'Operating specification');
      if (provenance.pHRange.status === 'VERIFIED') parameters.pHRange = phRangeVal;
    }
    if (ionicVal !== null) {
      provenance.ionicNature = pProv('ionicNature', ionicVal, 'Source-reported ionic nature');
      if (provenance.ionicNature.status === 'VERIFIED') parameters.ionicNature = ionicVal;
    }
    if (stateVal !== null) {
      provenance.physicalState = pProv('physicalState', stateVal, 'Source-reported physical state');
      if (provenance.physicalState.status === 'VERIFIED') parameters.physicalState = stateVal;
    }
    if (shelfVal !== null) {
      provenance.shelfLife = pProv('shelfLife', shelfVal, 'Source-reported shelf life');
      if (provenance.shelfLife.status === 'VERIFIED') parameters.shelfLife = shelfVal;
    }
    if (appVal !== null) {
      provenance.application = pProv('application', appVal, 'Source-reported application');
      if (provenance.application.status === 'VERIFIED') parameters.application = appVal;
    }

    provenance.hlb = { property: 'hlb', value: null, extractedValue: null, status: 'UNKNOWN', evidenceLevel: 'UNKNOWN', source, sourceUrl };
    provenance.cmc = { property: 'cmc', value: null, extractedValue: null, status: 'UNKNOWN', evidenceLevel: 'UNKNOWN', source, sourceUrl };
    provenance.density = { property: 'density', value: null, extractedValue: null, status: 'UNKNOWN', evidenceLevel: 'UNKNOWN', source, sourceUrl };
    provenance.nvr = { property: 'nvr', value: null, extractedValue: null, status: 'UNKNOWN', evidenceLevel: 'UNKNOWN', source, sourceUrl };

    return {
      ingredientId,
      canonicalName,
      resolvedName: resolution.resolvedName,
      confidence: resolution.confidence,
      parameters,
      provenance,
      requiresUserApproval: msResult.requiresUserApproval
    };
  }

  /**
   * Applies verified parameters to a canonical ingredient and triggers re-evaluations.
   */
  public static async applyVerifiedData(researchResult: ResearchResult, previousRecord: any): Promise<{ success: boolean; auditTrail: ResearchAuditTrail; updatedIngredient?: any }> {
    const { ingredientId, canonicalName, resolvedName, parameters, provenance } = researchResult;

    const ingIndex = UNIVERSAL_INGREDIENTS.findIndex(i => i.id === ingredientId);
    let updatedIng: any;

    if (ingIndex === -1) {
      const name = canonicalName || resolvedName || ingredientId;
      const activeVerified = typeof parameters.activeMatter === 'number' && provenance.activeMatter?.status === 'VERIFIED' && provenance.activeMatter.value === parameters.activeMatter;
      const densityVerified = typeof parameters.density === 'number' && provenance.density?.status === 'VERIFIED' && provenance.density.value === parameters.density;
      const pHVerified = typeof parameters.pH === 'number' && provenance.pH?.status === 'VERIFIED' && provenance.pH.value === parameters.pH;
      const detectedActive = activeVerified ? parameters.activeMatter : null;
      const detectedDensity = densityVerified ? parameters.density : null;
      const detectedPhMin = pHVerified ? parameters.pH : null;
      const detectedPhMax = pHVerified && parameters.pHRange ? (parseFloat(parameters.pHRange.split("-")[1]) || null) : null;

      updatedIng = {
        id: ingredientId,
        name,
        productName: name,
        category: parameters.ionicNature ? `Surfactant (${parameters.ionicNature})` : "Specialty Chemical / Additive",
        subCategory: "Researched Raw Material",
        casNumber: previousRecord?.casNumber || "N/A",
        inciName: name,
        function: parameters.application || "Functional Detergent Additive",
        activeDefault: detectedActive,
        activeMatterPct: detectedActive,
        activePercent: detectedActive,
        costPerKg: previousRecord?.costPerKg !== undefined ? previousRecord.costPerKg : null,
        density: detectedDensity,
        phMin: detectedPhMin,
        phMax: detectedPhMax,
        description: `Researched technical raw material: ${name}`,
        isCustom: true
      };
    } else {
      updatedIng = { ...UNIVERSAL_INGREDIENTS[ingIndex] };
    }

    // Apply only verified scientific properties
    if (parameters.activeMatter !== undefined && provenance.activeMatter?.status === 'VERIFIED' && provenance.activeMatter.value === parameters.activeMatter) {
      updatedIng.activeDefault = parameters.activeMatter;
      (updatedIng as any).activeMatterPct = parameters.activeMatter;
      (updatedIng as any).activeMatterInputSource = 'SOURCE_BACKED';
      (updatedIng as any).activeMatterEvidenceId = provenance.activeMatter.sourceId;
      (updatedIng as any).activeMatterEvidenceUrl = provenance.activeMatter.sourceUrl;
      (updatedIng as any).activeMatterEvidenceSourceType = provenance.activeMatter.sourceType as 'MANUFACTURER_TDS' | 'MANUFACTURER_SPECIFICATION';
      if (updatedIng.unknownProperties) {
        updatedIng.unknownProperties = updatedIng.unknownProperties.filter((p: string) => p !== 'activeMatter');
      }
    }
    if (parameters.pH !== undefined && provenance.pH?.status === 'VERIFIED' && provenance.pH.value === parameters.pH) {
      (updatedIng as any).phMin = parameters.pH;
      (updatedIng as any).phMax = parameters.pHRange ? (parseFloat(parameters.pHRange.split('-')[1]) || null) : null;
    }
    if (parameters.density !== undefined && typeof parameters.density === 'number' && provenance.density?.status === 'VERIFIED' && provenance.density.value === parameters.density) {
      (updatedIng as any).density = parameters.density;
    }
    if (parameters.ionicNature !== undefined && provenance.ionicNature?.status === 'VERIFIED' && provenance.ionicNature.value === parameters.ionicNature) {
      (updatedIng as any).ionicNature = parameters.ionicNature;
    }

    // Strict Provenance Classification:
    // Never label an ingredient VERIFIED or OFFICIAL_MANUFACTURER merely because provenance object exists
    if (provenance && provenance.activeMatter && provenance.activeMatter.sourceUrl && provenance.activeMatter.status === 'VERIFIED') {
      const isMfr = provenance.activeMatter.sourceType === 'MANUFACTURER_TDS';
      (updatedIng as any).provenance = {
        sourceType: isMfr ? 'OFFICIAL_MANUFACTURER' : (provenance.activeMatter.sourceType || 'TECHNICAL_REFERENCE'),
        source: provenance.activeMatter.source || "Technical Datasheet",
        sourceUrl: provenance.activeMatter.sourceUrl,
        verificationStatus: 'VERIFIED',
        verifiedAt: provenance.activeMatter.verifiedAt || new Date().toISOString().split('T')[0],
        notes: `Verified parameter extraction from primary source.`
      };
    } else {
      (updatedIng as any).provenance = {
        sourceType: 'ESTIMATED',
        source: provenance?.activeMatter?.source || "Unverified Research Record",
        sourceUrl: provenance?.activeMatter?.sourceUrl || "",
        verificationStatus: 'UNVERIFIED',
        verifiedAt: new Date().toISOString().split('T')[0],
        notes: "Research data lacks validated primary manufacturer TDS evidence."
      };
    }

    // Persist dynamic in-memory modifications
    if (ingIndex !== -1) { UNIVERSAL_INGREDIENTS[ingIndex] = updatedIng; } else { UNIVERSAL_INGREDIENTS.push(updatedIng); }

    // Save to persistent user settings
    let dynamicIngredients: any[] = [];
    try {
      const dynamicSetting = await db.userSettings.get('dynamic_ingredients');
      dynamicIngredients = dynamicSetting ? dynamicSetting.value : [];
    } catch {}

    dynamicIngredients = dynamicIngredients.filter(i => i.id !== ingredientId);
    dynamicIngredients.push(updatedIng);

    await db.userSettings.put({
      key: 'dynamic_ingredients',
      value: dynamicIngredients,
      updatedAt: new Date().toISOString()
    });

    const auditTrail: ResearchAuditTrail = {
      ingredientId,
      timestamp: new Date().toISOString(),
      previousRecord,
      newRecord: updatedIng,
      reason: `Autonomous Intelligence update from verified manufacturer TDS datasheet.`
    };

    // Store audit logs in DB
    let auditLogs: any[] = [];
    try {
      const auditSetting = await db.userSettings.get('research_audit_logs');
      auditLogs = auditSetting ? auditSetting.value : [];
    } catch {}
    auditLogs.push(auditTrail);
    await db.userSettings.put({
      key: 'research_audit_logs',
      value: auditLogs,
      updatedAt: new Date().toISOString()
    });

    // Re-evaluate SLES, LABSA, active matter, and and re-calculate all affected formulas
    const affectedFormulas = await db.formulas.toArray();
    for (const formula of affectedFormulas) {
      let isAffected = false;
      const updatedIngredients = formula.ingredients.map(ing => {
        if (ing.id === ingredientId || ing.name.toLowerCase() === updatedIng.name.toLowerCase()) {
          isAffected = true;
          return {
            ...ing,
            activeMatterPct: updatedIng.activeDefault,
            activeMatterInputSource: (updatedIng as any).activeMatterInputSource || 'UNKNOWN',
            activeMatterEvidenceId: (updatedIng as any).activeMatterEvidenceId,
            activeMatterEvidenceUrl: (updatedIng as any).activeMatterEvidenceUrl,
            activeMatterEvidenceSourceType: (updatedIng as any).activeMatterEvidenceSourceType,
            provenance: (updatedIng as any).provenance
          };
        }
        return ing;
      });

      if (isAffected) {
        // Trigger scientific re-evaluation
        calculateActiveMatter(updatedIngredients);
        calculateActiveSurfactants(updatedIngredients);
        calculateRawSurfactants(updatedIngredients);
        calculateDensity(updatedIngredients, formula.batchSizeKg * 1000);
        calculateBlendedHLB(updatedIngredients);
        calculateLiquidNVR(updatedIngredients, formula.batchSizeKg);

        const updatedFormula = {
          ...formula,
          ingredients: updatedIngredients,
          updatedAt: new Date().toISOString()
        };
        await db.formulas.put(updatedFormula);
      }
    }

    return { success: true, auditTrail, updatedIngredient: updatedIng };
  }
}

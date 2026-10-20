import { IngredientResearchService, ResearchRequest } from './ingredientResearchService';
import { getAllUniversalIngredients, UniversalIngredient } from '../data/universalIngredientLibrary';

export type IngredientResolutionStatus = 'LOCAL' | 'RESEARCHED' | 'NEEDS_VERIFICATION';

export interface ResolvedIngredient {
  ingredient: UniversalIngredient;
  status: IngredientResolutionStatus;
  reason: string;
}

/**
 * Resolves an ingredient without inventing scientific constants.
 * Local canonical data always wins. Unknown ingredients are handed to the
 * existing grounded research service; incomplete/conflicting evidence is
 * explicitly marked instead of being silently converted into numeric values.
 */
export class ResearchedIngredientResolver {
  resolveLocal(name: string): UniversalIngredient | null {
    const normalized = name.trim().toLowerCase();
    if (!normalized) return null;

    return getAllUniversalIngredients().find((item) =>
      item.name.trim().toLowerCase() === normalized ||
      item.id.trim().toLowerCase() === normalized ||
      item.inciName?.trim().toLowerCase() === normalized ||
      item.casNumber?.trim().toLowerCase() === normalized
    ) ?? null;
  }

  async resolve(name: string, grade?: string, apiKey?: string): Promise<ResolvedIngredient> {
    const cleanName = name.trim();
    const local = this.resolveLocal(cleanName);
    if (local) {
      return {
        ingredient: local,
        status: 'LOCAL',
        reason: 'Matched canonical local ingredient library.'
      };
    }

    const request: ResearchRequest = {
      ingredientName: cleanName,
      ...(grade ? { grade } : {})
    };

    const researched = await IngredientResearchService.researchMultiSource(request, apiKey);

    if (!researched || researched.status === 'RESEARCH_UNAVAILABLE' || researched.sourcesRetrieved.length === 0) {
      return this.buildNeedsVerification(cleanName, 'No sufficiently reliable source-backed research result was returned.');
    }

    if (researched.status === 'CONFLICTING_EVIDENCE') {
      const ingredient = this.buildResearchedProfile(researched, cleanName);
      return {
        ingredient: {
          ...ingredient,
          provenance: {
            ...ingredient.provenance,
            verificationStatus: 'EVIDENCE_CONFLICT',
            notes: 'Multiple sources conflict. Do not treat conflicting quantitative properties as verified.'
          }
        },
        status: 'NEEDS_VERIFICATION',
        reason: researched.notes || 'Research sources contain conflicting evidence.'
      };
    }

    const profile = this.buildResearchedProfile(researched, cleanName);
    const hasUnknownQuantities = Boolean(
      profile.activeMatter == null ||
      profile.hlb == null ||
      (profile.unknownProperties && profile.unknownProperties.length > 0)
    );

    return {
      ingredient: profile,
      status: hasUnknownQuantities ? 'NEEDS_VERIFICATION' : 'RESEARCHED',
      reason: hasUnknownQuantities
        ? 'Research returned an incomplete profile; unresolved properties remain explicit.'
        : 'Ingredient profile was populated from the grounded research service.'
    };
  }

  private buildResearchedProfile(result: Awaited<ReturnType<typeof IngredientResearchService.researchMultiSource>>, name: string): UniversalIngredient {
    const parameters = result.propertiesExtracted || {};
    const localResolved = result.resolvedName || name;
    const activeMatter = typeof parameters.activeMatter === 'number' ? parameters.activeMatter : undefined;
    const hlb = typeof parameters.hlb === 'number' ? parameters.hlb : null;
    const unknownProperties = Object.entries(parameters)
      .filter(([, value]) => value === null || value === undefined || value === '')
      .map(([key]) => key);

    return {
      id: `researched-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
      name: localResolved,
      category: 'Additive',
      casNumber: typeof parameters.casNumber === 'string' ? parameters.casNumber : '',
      inciName: typeof parameters.inciName === 'string' ? parameters.inciName : localResolved,
      function: typeof parameters.function === 'string' ? parameters.function : 'Research-derived ingredient',
      activeDefault: activeMatter ?? 0,
      activeMatter,
      costPerKg: typeof parameters.costPerKg === 'number' ? parameters.costPerKg : null,
      hlb,
      description: typeof parameters.description === 'string'
        ? parameters.description
        : 'Ingredient profile derived from source-backed research.',
      provenance: {
        sourceType: 'AI_RESEARCH',
        source: 'Gemini grounded multi-source research',
        verificationStatus: result.status === 'SUCCESS' ? 'SOURCE_BACKED' : 'NEEDS_VERIFICATION',
        notes: `Research ID: ${result.researchId}; ${result.sourcesRetrieved.length} source(s) retrieved.`
      },
      unknownProperties: Array.from(new Set([
        ...unknownProperties,
        ...(activeMatter == null ? ['activeMatter'] : []),
        ...(hlb == null ? ['hlb'] : [])
      ]))
    };
  }

  private buildNeedsVerification(name: string, reason: string): ResolvedIngredient {
    return {
      ingredient: {
        id: `researched-${Date.now()}`,
        name,
        category: 'Additive',
        casNumber: '',
        inciName: name,
        function: 'Unknown / Research Required',
        activeDefault: 0,
        activeMatter: undefined,
        costPerKg: null,
        hlb: null,
        description: reason,
        provenance: {
          sourceType: 'AI_RESEARCH',
          source: 'Gemini grounded research',
          verificationStatus: 'NEEDS_VERIFICATION',
          notes: 'Do not use unknown quantitative properties for release calculations.'
        },
        unknownProperties: ['activeMatter', 'hlb', 'cmc', 'density', 'nvr', 'pKa']
      },
      status: 'NEEDS_VERIFICATION',
      reason
    };
  }
}

export const researchedIngredientResolver = new ResearchedIngredientResolver();

import { IngredientResearchService } from './ingredientResearchService';
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
  private readonly research = new IngredientResearchService();

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

  async resolve(name: string): Promise<ResolvedIngredient> {
    const local = this.resolveLocal(name);
    if (local) {
      return {
        ingredient: local,
        status: 'LOCAL',
        reason: 'Matched canonical local ingredient library.'
      };
    }

    const researched = await this.research.researchMultiSource(name.trim());

    if (!researched) {
      return {
        ingredient: {
          id: `researched-${Date.now()}`,
          name: name.trim(),
          category: 'Additive',
          casNumber: '',
          inciName: name.trim(),
          function: 'Unknown / Research Required',
          activeDefault: 0,
          activeMatter: undefined,
          costPerKg: null,
          hlb: null,
          description: 'No sufficiently reliable source-backed profile was found.',
          provenance: {
            sourceType: 'AI_RESEARCH',
            source: 'Gemini grounded research',
            verificationStatus: 'NEEDS_VERIFICATION',
            notes: 'Do not use unknown quantitative properties for release calculations.'
          },
          unknownProperties: ['activeMatter', 'hlb', 'cmc', 'density', 'nvr', 'pKa']
        },
        status: 'NEEDS_VERIFICATION',
        reason: 'No sufficiently reliable source-backed research result was returned.'
      };
    }

    const profile = researched.ingredient;
    const hasUnknownQuantities = !profile.activeMatter && profile.activeMatter !== 0 ||
      profile.hlb == null ||
      profile.unknownProperties?.length;

    return {
      ingredient: profile,
      status: hasUnknownQuantities ? 'NEEDS_VERIFICATION' : 'RESEARCHED',
      reason: hasUnknownQuantities
        ? 'Research returned an incomplete profile; unresolved properties remain explicit.'
        : 'Ingredient profile was populated from the grounded research service.'
    };
  }
}

export const researchedIngredientResolver = new ResearchedIngredientResolver();

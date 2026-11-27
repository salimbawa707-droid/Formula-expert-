import { FormulationIngredient } from '../types';
import { ProductCategoryId, normalizeProductCategory } from '../domain/productTaxonomy';
import { DetailedLabEvidenceRecord } from './labEvidenceEngine';
import { validateIngredientCompositionEvidence } from './ingredientCompositionEvidence';
import { canPromoteToLabValidated } from './lims/limsEvidencePromotionEngine';

export interface RefinementProposal {
  id: string;
  categoryId: ProductCategoryId;
  originalIngredient: string;
  originalPercentage: number;
  proposedPercentage: number;
  evidenceFormulaCount: number;
  evidenceVersionCount: number;
  evidenceReplicateCount: number;
  rationale: string;
  confidenceScore?: number; // omitted unless a calibrated confidence method exists
}

interface VersionEvidence {
  formulaId: string;
  formulaVersion: string;
  replicates: Map<string, number>;
  conflictingReplicateIds: Set<string>;
}

/**
 * RefinementEngine
 *
 * Produces descriptive, category-scoped formulation summaries from explicitly
 * measured ingredient-percentage records. It does not optimize performance,
 * infer a global optimum, or mutate the active formula.
 *
 * Independence hierarchy:
 *   replicate observations -> equal-weight formula-version means
 *   formula versions -> equal-weight formula-level means
 *   distinct formula IDs -> equal-weight final mean
 *
 * A formula with more replicates or more versions therefore cannot dominate
 * the aggregate. At least three distinct formula IDs are required.
 */
export class RefinementEngine {
  public static proposeAdjustments(
    activeIngredients: FormulationIngredient[],
    labEvidence: DetailedLabEvidenceRecord[],
    targetCategory: string
  ): RefinementProposal[] {
    const canonicalTarget = normalizeProductCategory(targetCategory);
    if (canonicalTarget === 'UNKNOWN_PRODUCT_CATEGORY' || !Array.isArray(activeIngredients) || !Array.isArray(labEvidence)) {
      return [];
    }

    const proposals: RefinementProposal[] = [];
    const categoryRecords = labEvidence.filter(record => {
      if (!record.categoryId) return false;
      return normalizeProductCategory(record.categoryId) === canonicalTarget;
    });

    if (categoryRecords.length === 0) return [];

    for (const ingredient of activeIngredients) {
      const ingredientName = typeof ingredient?.name === 'string' ? ingredient.name.trim() : '';
      const currentPercentage = Number(
        ingredient?.percentage ?? ingredient?.percent ?? ingredient?.percentageInFormula
      );
      if (!ingredientName || !Number.isFinite(currentPercentage) || currentPercentage < 0 || currentPercentage > 100) {
        continue;
      }

      // Prefer the authoritative canonical ingredient identity over a UI/database row ID.
      // Canonical IDs may intentionally contain underscores (for example, sodium_hydroxide),
      // so preserve their identity token rather than converting it to a display-name slug.
      const ingredientCanonicalId = String(
        ingredient.canonicalIngredientId || ingredient.id || ingredientName
      ).trim().toLowerCase();
      const aggregate = this.getValidatedAverage(ingredientName, ingredientCanonicalId, categoryRecords, canonicalTarget);
      if (!aggregate || Math.abs(aggregate.mean - currentPercentage) <= 0.5) continue;

      const slug = ingredientName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      proposals.push({
        id: `refine-${canonicalTarget}-${slug}-${aggregate.formulaCount}-${aggregate.versionCount}`,
        categoryId: canonicalTarget,
        originalIngredient: ingredientName,
        originalPercentage: currentPercentage,
        proposedPercentage: Number(aggregate.mean.toFixed(2)),
        evidenceFormulaCount: aggregate.formulaCount,
        evidenceVersionCount: aggregate.versionCount,
        evidenceReplicateCount: aggregate.replicateCount,
        rationale:
          `Category-scoped descriptive mean: ${aggregate.mean.toFixed(2)} wt% from ${aggregate.formulaCount} distinct formula IDs, ${aggregate.versionCount} versions and ${aggregate.replicateCount} unique replicate observations. Replicates are averaged within version, versions within formula, and formulas receive equal weight. This is not an optimum or performance recommendation; confirm through a controlled formulation experiment.`
      });
    }

    return proposals;
  }

  private static getValidatedAverage(
    ingredientName: string,
    ingredientCanonicalId: string,
    records: DetailedLabEvidenceRecord[],
    targetCategory: ProductCategoryId
  ): { mean: number; formulaCount: number; versionCount: number; replicateCount: number } | null {
    const normalizedName = ingredientName.toLowerCase().trim();
    const slug = normalizedName.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const acceptedKeys = new Set([
      `ingredient:${normalizedName}:percentage`,
      `ingredient:${slug}:percentage`,
      `ingredient_${slug}_percentage`,
      `${slug}_percentage`
    ]);

    const eligible = records.filter(record => {
      const key = (record.parameterKey || '').toLowerCase().trim();
      const unit = String(record.unit || '').toLowerCase().trim();
      const compositionGate = validateIngredientCompositionEvidence({
        ...(record as any),
        categoryId: record.categoryId,
        formulaId: record.formulaId,
        formulaVersion: record.formulaVersion,
        sampleId: record.sampleId,
        value: record.value,
        unit: record.unit
      });
      return record.qualityStatus === 'ACCEPTED' &&
        record.sourceType === 'LAB_MEASURED' &&
        record.provenance === 'MEASURED' &&
        record.categoryId !== undefined &&
        normalizeProductCategory(record.categoryId) === targetCategory &&
        acceptedKeys.has(key) &&
        record.evidenceKind === 'INGREDIENT_COMPOSITION' &&
        String(record.ingredientCanonicalId || '').trim().toLowerCase() === ingredientCanonicalId &&
        record.ingredientName?.trim().toLowerCase() === normalizedName &&
        compositionGate.isValid &&
        canPromoteToLabValidated(record).allowed &&
        (unit === '%' || unit === 'percent' || unit === 'wt%') &&
        Number.isFinite(record.value) &&
        record.value >= 0 &&
        record.value <= 100 &&
        Boolean(record.formulaId?.trim()) &&
        Boolean(record.formulaVersion?.trim()) &&
        Boolean(record.measurementId?.trim());
    });;

    // Build unique replicate observations per formula/version. A repeated
    // measurement ID or repeated sample/replicate pair is counted once.
    const versions = new Map<string, VersionEvidence>();
    for (const record of eligible) {
      const formulaId = record.formulaId!.trim();
      const formulaVersion = record.formulaVersion.trim();
      const versionKey = `${formulaId}::${formulaVersion}`;
      let version = versions.get(versionKey);
      if (!version) {
        version = { formulaId, formulaVersion, replicates: new Map(), conflictingReplicateIds: new Set() };
        versions.set(versionKey, version);
      }

      const replicateKey = record.sampleId
        ? record.replicateNumber !== undefined
          ? `sample:${record.sampleId.trim()}::replicate:${record.replicateNumber}`
          : `sample:${record.sampleId.trim()}::replicate:UNSPECIFIED`
        : `measurement:${record.measurementId.trim()}`;
      const previous = version.replicates.get(replicateKey);
      if (previous === undefined) {
        version.replicates.set(replicateKey, record.value);
      } else if (Math.abs(previous - record.value) > 1e-9) {
        // Conflicting duplicate identity is ambiguous: exclude the whole version.
        version.conflictingReplicateIds.add(replicateKey);
      }
    }

    // First average replicates within each formula version.
    const formulaVersions = new Map<string, { means: number[]; replicateCount: number; versionCount: number }>();
    for (const version of versions.values()) {
      if (version.conflictingReplicateIds.size > 0 || version.replicates.size === 0) continue;
      const values = [...version.replicates.values()];
      const versionMean = values.reduce((sum, value) => sum + value, 0) / values.length;
      const formula = formulaVersions.get(version.formulaId) || { means: [], replicateCount: 0, versionCount: 0 };
      formula.means.push(versionMean);
      formula.replicateCount += values.length;
      formula.versionCount += 1;
      formulaVersions.set(version.formulaId, formula);
    }

    // Then average versions within each formula, so a formula with many saved
    // versions does not get more weight than another independent formula.
    const formulaMeans: number[] = [];
    let versionCount = 0;
    let replicateCount = 0;
    for (const formula of formulaVersions.values()) {
      if (formula.means.length === 0) continue;
      formulaMeans.push(formula.means.reduce((sum, value) => sum + value, 0) / formula.means.length);
      versionCount += formula.versionCount;
      replicateCount += formula.replicateCount;
    }

    // Require three distinct formula IDs, not merely three rows or versions.
    if (formulaMeans.length < 3) return null;

    // Finally give each distinct formula equal weight.
    const mean = formulaMeans.reduce((sum, value) => sum + value, 0) / formulaMeans.length;
    return { mean, formulaCount: formulaMeans.length, versionCount, replicateCount };
  }
}

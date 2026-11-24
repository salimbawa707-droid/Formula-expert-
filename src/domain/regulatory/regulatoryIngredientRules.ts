import { FormulaIngredientInput } from './types';

const SURFACTANT_TERMS = ['sles', 'sls', 'labsa', 'sulfonic', 'ethoxylate', 'surfactant', 'laureth', 'alkylbenzene sulfonate', 'alkyl sulfate'];
const ETHOXYLATED_TERMS = ['sles', 'laureth', 'ethoxylate', 'peg-'];

export interface EvaluatedChemicalIngredient {
  rawName: string;
  normalizedName: string;
  casNumber?: string;
  ecNumber?: string;
  inciName?: string;
  asSuppliedPct: number;
  activeMatterPct?: number;
  grade?: string;
  isUnknownIdentity: boolean;
  missingDataPoints: string[];
  impuritiesPpm: { dioxane_1_4?: number; freeEthyleneOxide?: number; heavyMetalsPpm?: number };
}

function isValidCasChecksum(value: string): boolean {
  const match = value.match(/^(\d{2,7})-(\d{2})-(\d)$/);
  if (!match) return false;
  const digits = `${match[1]}${match[2]}`;
  const calculated = digits.split('').reverse().reduce((sum, digit, index) => sum + Number(digit) * (index + 1), 0) % 10;
  return calculated === Number(match[3]);
}

function isValidEcNumber(value: string): boolean {
  return /^\d{3}-\d{3}-\d$/.test(value);
}

export class RegulatoryIngredientEngine {
  public static processIngredient(ing: FormulaIngredientInput): EvaluatedChemicalIngredient {
    const rawName = ing.name?.trim() || 'Unknown Ingredient';
    const normalizedName = rawName.toLowerCase();
    const missingDataPoints: string[] = [];
    const asSuppliedPct = Number(ing.percentage);
    const validAsSuppliedPct = Number.isFinite(asSuppliedPct) && asSuppliedPct >= 0 && asSuppliedPct <= 100;
    if (!validAsSuppliedPct) missingDataPoints.push(`As-supplied percentage for '${rawName}' must be a finite value from 0 to 100.`);
    const isSurfactant = SURFACTANT_TERMS.some(term => normalizedName.includes(term));
    let activeMatterPct: number | undefined;
    const validActivePercentage = ing.activePercentage !== undefined &&
      Number.isFinite(ing.activePercentage) && ing.activePercentage >= 0 && ing.activePercentage <= 100;
    if (ing.activePercentage !== undefined && !validActivePercentage) {
      missingDataPoints.push(`Active-matter assay for '${rawName}' must be a finite percentage from 0 to 100.`);
    }
    if (validAsSuppliedPct && validActivePercentage) {
      activeMatterPct = asSuppliedPct * (ing.activePercentage as number) / 100;
    } else if (isSurfactant && ing.activePercentage === undefined) {
      missingDataPoints.push(`Active-matter assay missing for '${rawName}'; provide supplier COA or measured assay.`);
    }

    const suppliedCas = ing.casNumber?.trim() || undefined;
    const suppliedEc = ing.ecNumber?.trim() || undefined;
    const casNumber = suppliedCas && isValidCasChecksum(suppliedCas) ? suppliedCas : undefined;
    const ecNumber = suppliedEc && isValidEcNumber(suppliedEc) ? suppliedEc : undefined;
    const inciName = ing.inciName?.trim() || undefined;
    if (suppliedCas && !casNumber) missingDataPoints.push(`CAS number '${suppliedCas}' for '${rawName}' has invalid format or checksum; verify it against an authoritative chemical registry.`);
    if (suppliedEc && !ecNumber) missingDataPoints.push(`EC number '${suppliedEc}' for '${rawName}' has invalid format; verify it against an authoritative chemical registry.`);
    const isUnknownIdentity = !casNumber && !ecNumber && !inciName;
    if (isUnknownIdentity) missingDataPoints.push(`Chemical identity for '${rawName}' is unresolved; provide a valid CAS/EC identifier or INCI identity.`);

    const isEthoxylated = ETHOXYLATED_TERMS.some(term => normalizedName.includes(term));
    const dioxane = ing.impuritiesPpm?.dioxane_1_4;
    const validDioxane = dioxane !== undefined && Number.isFinite(dioxane) && dioxane >= 0 ? dioxane : undefined;
    if (dioxane !== undefined && validDioxane === undefined) missingDataPoints.push(`1,4-dioxane assay for '${rawName}' must be a finite non-negative ppm value.`);
    if (isEthoxylated && validDioxane === undefined) {
      missingDataPoints.push(`1,4-dioxane assay missing for '${rawName}'; no typical or default impurity value is assumed.`);
    }

    const freeEO = ing.impuritiesPpm?.freeEthyleneOxide;
    const metals = ing.impuritiesPpm?.heavyMetalsPpm;
    if (freeEO !== undefined && (!Number.isFinite(freeEO) || freeEO < 0)) missingDataPoints.push(`Free ethylene oxide assay for '${rawName}' must be a finite non-negative ppm value.`);
    if (metals !== undefined && (!Number.isFinite(metals) || metals < 0)) missingDataPoints.push(`Heavy-metals assay for '${rawName}' must be a finite non-negative ppm value.`);
    return {
      rawName, normalizedName, casNumber, ecNumber, inciName, asSuppliedPct,
      activeMatterPct, grade: ing.grade, isUnknownIdentity, missingDataPoints,
      impuritiesPpm: {
        dioxane_1_4: validDioxane,
        freeEthyleneOxide: freeEO !== undefined && Number.isFinite(freeEO) && freeEO >= 0 ? freeEO : undefined,
        heavyMetalsPpm: metals !== undefined && Number.isFinite(metals) && metals >= 0 ? metals : undefined
      }
    };
  }

  /** null means at least one ethoxylated ingredient has no explicit assay. */
  public static calculateFormulaDioxanePpm(ingredients: EvaluatedChemicalIngredient[]): number | null {
    const ethoxylated = ingredients.filter(ing => ETHOXYLATED_TERMS.some(term => ing.normalizedName.includes(term)));
    if (ingredients.some(ing => !Number.isFinite(ing.asSuppliedPct) || ing.asSuppliedPct < 0 || ing.asSuppliedPct > 100)) return null;
    const formulaTotalPct = ingredients.reduce((sum, ing) => sum + ing.asSuppliedPct, 0);
    if (Math.abs(formulaTotalPct - 100) > 0.01) return null;
    if (ethoxylated.some(ing => ing.impuritiesPpm.dioxane_1_4 === undefined)) return null;
    const total = ethoxylated.reduce((sum, ing) => sum + ing.asSuppliedPct / 100 * (ing.impuritiesPpm.dioxane_1_4 as number), 0);
    return Number(total.toFixed(3));
  }
}
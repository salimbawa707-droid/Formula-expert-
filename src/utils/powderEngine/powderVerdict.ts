import {
  PowderActiveMatterReport,
  PowderAlkalinityReport,
  PowderBuilderReport,
  PowderCakingReport,
  PowderMassBalanceReport,
  PowderPHReport,
  PowderSafetyReport,
  PowderStabilityReport,
  PowderVerdictIssue,
  PowderVerdictReport,
  PowderVerdictStrength
} from './types';

export interface PowderVerdictEvaluatorInput {
  massBalance: PowderMassBalanceReport;
  activeMatter: PowderActiveMatterReport;
  builderSystem: PowderBuilderReport;
  alkalinity: PowderAlkalinityReport;
  caking: PowderCakingReport;
  powderPH: PowderPHReport;
  stability: PowderStabilityReport;
  safety: PowderSafetyReport;
  productCategory?: string;
}

export function evaluatePowderVerdict(input: PowderVerdictEvaluatorInput): PowderVerdictReport {
  const { massBalance, activeMatter, builderSystem, alkalinity, caking, powderPH, stability } = input;

  const strengths: PowderVerdictStrength[] = [];
  const issues: PowderVerdictIssue[] = [];
  const chemistAdvisories: string[] = [];

  // 1. Mass Balance Analysis
  if (massBalance.status === 'INCOMPLETE') {
    issues.push({
      title: 'Incomplete Powder Mass Balance',
      severity: 'Critical',
      message: `Formula sums to ${massBalance.assignedPercentage.toFixed(2)}% (Unassigned formulation = ${massBalance.unassignedPercentage.toFixed(2)}%, Missing ${massBalance.missingPercentage.toFixed(2)} percentage points).`,
      actionableGuidance: `Do NOT add water. The unassigned ${massBalance.unassignedPercentage.toFixed(2)}% must be explicitly assigned with solid raw materials by the formulator.`
    });
    chemistAdvisories.push(`Mass balance unassigned amount of ${massBalance.unassignedPercentage.toFixed(2)}%. In powder technology, batch mass balance is maintained strictly with solid raw materials.`);
  } else if (massBalance.status === 'EXCESS') {
    issues.push({
      title: 'Excess Formula Sum (>100%)',
      severity: 'Critical',
      message: `Formula sums to ${massBalance.assignedPercentage.toFixed(2)}% (exceeds 100% by ${massBalance.excessPercentage.toFixed(2)}%).`,
      actionableGuidance: 'Re-normalize ingredient percentages to achieve exactly 100.00% batch total.'
    });
    chemistAdvisories.push('Formula total exceeds 100%. Re-scale percentages proportionally.');
  } else {
    strengths.push({
      title: '100.00% Formula Mass Balance',
      description: 'Assigned ingredient mass fractions sum to 100.00%. This verifies arithmetic balance only, not chemical performance or product compliance.'
    });
  }

  // 2. Active Surfactants Analysis
  if (activeMatter.hasInsufficientData) {
    issues.push({
      title: 'Unresolved Surfactant Grade Data',
      severity: 'High',
      message: `Commercial concentration unknown for: ${activeMatter.unresolvedIngredients.join(', ')}.`,
      actionableGuidance: 'Specify active purity % (e.g. LABSA 90% or 96%, SLES 70%) for exact 100%-active surfactant calculation.'
    });
  } else if (activeMatter.totalSurfactantActivePct < 8.0) {
    issues.push({
      title: 'Low Active Surfactant Matter',
      severity: 'Medium',
      message: `Total surfactant active matter is ${activeMatter.totalSurfactantActivePct.toFixed(2)}% (Commercial detergent powders typically target 10–18% actives).`,
      actionableGuidance: 'Increase primary anionic surfactant (LABSA / LAS-Na) or add nonionic alcohol ethoxylate (LAE) to boost detergency.'
    });
    chemistAdvisories.push('Active surfactant content is on the economy side (<8%). Suitable for entry-tier or high-builder formulations.');
  } else {
    strengths.push({
      title: `Surfactant Active System (${activeMatter.totalSurfactantActivePct.toFixed(1)}% 100%-Active)`,
      description: `Robust surfactant active concentration providing balanced primary detergency and wetting.`
    });
  }

  // 3. Builder & Alkalinity
  if (builderSystem.totalBuilderPct < 15) {
    chemistAdvisories.push(
      `Builder loading is ${builderSystem.totalBuilderPct.toFixed(1)}%. No universal minimum builder percentage establishes hard-water performance; evaluate measured wash-water hardness, dose, pH, and grade-specific sequestration capacity.`
    );
  } else {
    strengths.push({
      title: `Builder Ingredients Identified (${builderSystem.totalBuilderPct.toFixed(1)}% by mass)`,
      description: 'Builder mass fraction is reported as a composition fact only; it does not prove calcium/magnesium sequestration or wash performance.'
    });
  }

  if (alkalinity.totalAlkalineContributorsPct > 20) {
    strengths.push({
      title: 'Strong Alkaline Reserve',
      description: 'High alkaline-contributor mass fraction detected. This does not determine aqueous pH or reserve alkalinity; use the validated pH engine and/or a measured alkalinity titration.'
    });
  }

  // 4. Powder pH Specification (Normal Alkaline Target)
  const isCalcPHFinite = powderPH.calculatedAqueousPH !== undefined && Number.isFinite(powderPH.calculatedAqueousPH) && !isNaN(powderPH.calculatedAqueousPH);
  if (!powderPH.isWithinTarget && powderPH.targetRange.isSpecified && powderPH.targetRange.min !== undefined && powderPH.targetRange.max !== undefined) {
    if (isCalcPHFinite && powderPH.calculatedAqueousPH! < powderPH.targetRange.min) {
      issues.push({
        title: 'Aqueous pH Below Target Window',
        severity: 'Medium',
        message: `1% aqueous pH is ${powderPH.calculatedAqueousPH!.toFixed(2)} (Target: ${powderPH.targetRange.min}–${powderPH.targetRange.max}).`,
        actionableGuidance: 'Ensure acid slurry (LABSA) is fully neutralized with sufficient stoichiometric alkaline builder (Soda Ash / Caustic).'
      });
    } else if (isCalcPHFinite) {
      issues.push({
        title: 'Aqueous pH Above Specification',
        severity: 'Low',
        message: `1% aqueous pH is ${powderPH.calculatedAqueousPH!.toFixed(2)} (Target: ${powderPH.targetRange.min}–${powderPH.targetRange.max}).`,
        actionableGuidance: 'Reduce excess caustic or metasilicate if formulation is intended for delicate fabric care.'
      });
    } else {
      issues.push({
        title: 'Aqueous pH Unavailable / Non-Converged',
        severity: 'High',
        message: `1% aqueous pH calculation failed to converge. Cannot verify compliance against target window (${powderPH.targetRange.min}–${powderPH.targetRange.max}).`,
        actionableGuidance: 'Verify formulation composition and species definitions or measure pH experimentally in laboratory.'
      });
    }
  } else if (powderPH.targetRange.isSpecified && isCalcPHFinite) {
    strengths.push({
      title: `Optimal Alkaline Wash Liquor (1% pH ${powderPH.calculatedAqueousPH!.toFixed(2)})`,
      description: `Complies with detergent powder performance window (${powderPH.targetRange.label}).`
    });
  }

  // 5. Caking Risk & Packaging Advisory
  if (caking.cakingRisk === 'High Caking Risk') {
    issues.push({
      title: 'High Powder Caking Tendency',
      severity: 'High',
      message: caking.packagingRecommendation,
      actionableGuidance: 'Evaluate a compatible anti-caking/flow aid using its supplier-recommended grade and dosage range. Confirm flow, moisture uptake, and caking with controlled humidity/storage testing; no fixed dosage is inferred here.'
    });
    chemistAdvisories.push('Elevated liquid addition without adequate dry flow aid carrier increases lump formation in humid storage.');
  } else if (caking.cakingRisk === 'Moderate Risk') {
    chemistAdvisories.push(caking.packagingRecommendation);
  }

  // 6. Stability Check (Bleach + Enzyme)
  if (stability.enzymeBleachCompatibility === 'Bleach Deactivates Enzymes' || stability.enzymeBleachCompatibility === 'Bleach Activated (High Enzyme Deactivation Risk)') {
    issues.push({
      title: 'Bleach & Enzyme Co-presence',
      severity: 'Medium',
      message: 'Uncoated Sodium Percarbonate can rapidly oxidize and deactivate unprotected enzyme granules.',
      actionableGuidance: 'Use an enzyme grade explicitly documented as bleach-compatible and a compatible coated bleach grade. Verify retained enzyme activity after accelerated storage; brand name alone does not establish compatibility.'
    });
    chemistAdvisories.push('Ensure enzyme raw materials are encapsulated/granulated grades designed for percarbonate powder compatibility.');
  }

  // Overall Status Determination
  const hasCriticalEvidenceGap =
    activeMatter.hasInsufficientData ||
    powderPH.source === 'INSUFFICIENT_DATA' ||
    caking.cakingRisk === 'Insufficient Data' ||
    stability.source === 'INSUFFICIENT_DATA' ||
    input.safety.hasInsufficientFormalGHSData;

  let overallStatus: PowderVerdictReport['overallStatus'] = 'SCREENING_ONLY';

  if (massBalance.status === 'INCOMPLETE') {
    overallStatus = 'INCOMPLETE FORMULA';
  } else if (massBalance.status === 'EXCESS') {
    overallStatus = 'EXCESS FORMULA';
  } else if (issues.some((i) => i.severity === 'Critical')) {
    overallStatus = 'OUT OF SPEC';
  } else if (hasCriticalEvidenceGap) {
    overallStatus = 'INSUFFICIENT_DATA';
  } else if (issues.length > 0) {
    overallStatus = 'NEEDS ADJUSTMENT';
  }

  const summary = massBalance.status === 'INCOMPLETE'
    ? `INCOMPLETE POWDER FORMULA — Unassigned formulation = ${massBalance.unassignedPercentage.toFixed(2)}% (Assigned: ${massBalance.assignedPercentage.toFixed(2)}%). Do not add water.`
    : massBalance.status === 'EXCESS'
    ? `EXCESS FORMULA — Exceeds 100.00% batch total by ${massBalance.excessPercentage.toFixed(2)} percentage points.`
    : overallStatus === 'INSUFFICIENT_DATA'
    ? 'INSUFFICIENT DATA — One or more required grade, pH, stability, or supplier safety inputs are unavailable. No compliance verdict is issued.'
    : issues.length > 0
    ? `Powder formulation screening identified ${issues.length} issue(s) requiring review. This is not a laboratory compliance verdict.`
    : 'SCREENING ONLY — Mass balance and available engineering checks were reviewed. Chemical performance, storage stability, safety classification, and product compliance are not certified by this calculation.';

  return {
    overallStatus,
    summary,
    strengths,
    issues,
    chemistAdvisories,
    source: 'SCREENING'
  };
}

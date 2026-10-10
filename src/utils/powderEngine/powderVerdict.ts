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
      title: '100.00% Stoichiometric Mass Balance',
      description: 'All solid builders, active surfactants, alkalinity contributors, and specialty additives sum to exact 100.00% batch.'
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
    issues.push({
      title: 'Low Inorganic Builder Reserve',
      severity: 'Medium',
      message: `Total builder content is ${builderSystem.totalBuilderPct.toFixed(1)}%.`,
      actionableGuidance: 'Increase inorganic builders (Sodium Carbonate or Zeolite 4A) to minimum 20–35% for sufficient water hardness precipitation and soil dispersion.'
    });
  } else {
    strengths.push({
      title: `Inorganic Builder System (${builderSystem.totalBuilderPct.toFixed(1)}% Builder)`,
      description: `Solid-state inorganic builders provide alkaline saponification of oily soils and precipitation/exchange of hard water cations.`
    });
  }

  if (alkalinity.totalAlkalineContributorsPct > 20) {
    strengths.push({
      title: 'Strong Alkaline Reserve',
      description: `Provides robust pH buffering (~10.5) against acidic body soils and food stains during wash cycle.`
    });
  }

  // 4. Powder pH Specification (Normal Alkaline Target)
  if (!powderPH.isWithinTarget && powderPH.targetRange.isSpecified && powderPH.targetRange.min !== undefined && powderPH.targetRange.max !== undefined) {
    if (powderPH.calculatedAqueousPH < powderPH.targetRange.min) {
      issues.push({
        title: 'Aqueous pH Below Target Window',
        severity: 'Medium',
        message: `1% aqueous pH is ${powderPH.calculatedAqueousPH.toFixed(2)} (Target: ${powderPH.targetRange.min}–${powderPH.targetRange.max}).`,
        actionableGuidance: 'Ensure acid slurry (LABSA) is fully neutralized with sufficient stoichiometric alkaline builder (Soda Ash / Caustic).'
      });
    } else {
      issues.push({
        title: 'Aqueous pH Above Specification',
        severity: 'Low',
        message: `1% aqueous pH is ${powderPH.calculatedAqueousPH.toFixed(2)} (Target: ${powderPH.targetRange.min}–${powderPH.targetRange.max}).`,
        actionableGuidance: 'Reduce excess caustic or metasilicate if formulation is intended for delicate fabric care.'
      });
    }
  } else if (powderPH.targetRange.isSpecified) {
    strengths.push({
      title: `Optimal Alkaline Wash Liquor (1% pH ${powderPH.calculatedAqueousPH.toFixed(2)})`,
      description: `Complies with detergent powder performance window (${powderPH.targetRange.label}).`
    });
  }

  // 5. Caking Risk & Packaging Advisory
  if (caking.cakingRisk === 'High Caking Risk') {
    issues.push({
      title: 'High Powder Caking Tendency',
      severity: 'High',
      message: caking.packagingRecommendation,
      actionableGuidance: 'Add 1.0–2.0% Fumed Silica / Zeolite 4A flow aid and package in hermetic moisture-barrier pouches.'
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
      actionableGuidance: 'Use coated/stabilized enzyme granulates (e.g. Savinase / Stainzyme) and coated percarbonate particles.'
    });
    chemistAdvisories.push('Ensure enzyme raw materials are encapsulated/granulated grades designed for percarbonate powder compatibility.');
  }

  // Overall Status Determination
  let overallStatus: PowderVerdictReport['overallStatus'] = 'BALANCED & COMPLIANT';

  if (massBalance.status === 'INCOMPLETE') {
    overallStatus = 'INCOMPLETE FORMULA';
  } else if (massBalance.status === 'EXCESS') {
    overallStatus = 'EXCESS FORMULA';
  } else if (issues.some((i) => i.severity === 'Critical')) {
    overallStatus = 'OUT OF SPEC';
  } else if (issues.length > 0) {
    overallStatus = 'NEEDS ADJUSTMENT';
  }

  const summary = massBalance.status === 'INCOMPLETE'
    ? `INCOMPLETE POWDER FORMULA — Unassigned formulation = ${massBalance.unassignedPercentage.toFixed(2)}% (Assigned: ${massBalance.assignedPercentage.toFixed(2)}%). Do not add water.`
    : massBalance.status === 'EXCESS'
    ? `EXCESS FORMULA — Exceeds 100.00% batch total by ${massBalance.excessPercentage.toFixed(2)} percentage points.`
    : issues.length > 0
    ? `Powder formulation evaluated. ${issues.length} chemical/physical advisory items require review.`
    : `100% Balanced Powder Formulation — Complies with surfactant active targets, alkaline builder equilibria, and physical stability specifications.`;

  return {
    overallStatus,
    summary,
    strengths,
    issues,
    chemistAdvisories,
    source: 'CALCULATED'
  };
}

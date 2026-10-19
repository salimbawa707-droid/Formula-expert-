import { FORMULAS } from '../src/data/formulas';
import { CANONICAL_PRODUCT_CATEGORY_IDS, normalizeProductCategory, ProductCategoryId } from '../src/domain/productTaxonomy';
import { getScientificProductProfile } from '../src/domain/scientificProductProfiles';
import { evaluateScientificQualityGate } from '../src/utils/scientificQualityGateEngine';
import { PHEngineV2 } from '../src/domain/ph/pHEngineV2';
import { mapFormulationIngredientsToPHEngineInput } from '../src/utils/pHEngineAdapter';
import { ActiveMatterEngine } from '../src/utils/activeMatterEngine';
import { calculateFormulationCompatibility } from '../src/utils/compatibilityEngine';
import * as fs from 'fs';

export interface FormulaAuditRecord {
  index: number;
  id: string;
  name: string;
  category: string;
  canonicalCategory: ProductCategoryId;
  profileId: string;
  massSum: number;
  ph: number;
  phTarget: string;
  phPass: boolean;
  activePct: number;
  activeTarget: string;
  activePass: boolean;
  compatible: boolean;
  qgStatus: string;
  blockingIssues: string[];
  majorWarnings: string[];
  issuesSummary: string;
}

export interface CurrentScientificReport {
  metadata: {
    reportType: string;
    generationTimestamp: string;
    formulaSource: string;
    taxonomySource: string;
    scientificEngines: string[];
    isLaboratoryMeasured: boolean;
    provenance: string;
    totalFormulas: number;
    totalCanonicalCategories: number;
    canonicalCategories: string[];
    statusDistribution: Record<string, number>;
  };
  formulas: FormulaAuditRecord[];
}

export function generateCurrentScientificReport(): CurrentScientificReport {
  const formulaRecords: FormulaAuditRecord[] = [];
  const statusDistribution: Record<string, number> = {};

  for (let i = 0; i < FORMULAS.length; i++) {
    const f = FORMULAS[i];
    const catId = normalizeProductCategory(f.category) as ProductCategoryId;
    const profile = getScientificProductProfile(catId, f.name || f.id);
    const policy = profile.calculationPolicy;
    const rawIngs = f.ingredients || [];

    const isPowder = profile.physicalForm === 'POWDER';
    const phInput = mapFormulationIngredientsToPHEngineInput(rawIngs as any);
    const phRes = PHEngineV2.calculatePH(phInput, f.batchSizeKg || 100, {
      productCategory: catId,
      temperatureC: 25,
      assumeSlurryBasisIfPowder: isPowder,
      slurryConcentrationPct: isPowder ? 1.0 : undefined
    });
    const ph = Number(phRes.pH.toFixed(2));
    const phPass = ph >= policy.targetPHRange.min && ph <= policy.targetPHRange.max;

    const activeRep = ActiveMatterEngine.calculateActiveMatterReport(rawIngs as any, f.batchSizeKg || 100);
    const activePct = Number(activeRep.surfactants.totalActiveSurfactants.toFixed(2));
    const activePass = activePct >= policy.activeSurfactantRange.min && activePct <= policy.activeSurfactantRange.max;

    const compRes = calculateFormulationCompatibility(rawIngs as any, ph, catId);

    const qg = evaluateScientificQualityGate({
      formulaName: f.name,
      formulaVersion: '1.0.0',
      ingredients: rawIngs as any,
      productCategory: catId,
      waterHardnessPpm: 150
    });

    const massSum = Number(rawIngs.reduce((s: number, ing: any) => s + (ing.percent ?? ing.percentage ?? 0), 0).toFixed(2));

    const issues: string[] = [];
    if (Math.abs(massSum - 100) > 0.05) issues.push(`MassSum=${massSum}%`);
    if (!phPass) issues.push(`pH=${ph} (tgt ${policy.targetPHRange.min}-${policy.targetPHRange.max})`);
    if (!activePass) issues.push(`Active=${activePct}% (tgt ${policy.activeSurfactantRange.min}-${policy.activeSurfactantRange.max}%)`);
    if (!compRes.compatible) issues.push(`Incompat=[${compRes.alerts.map(a => a.title).join('; ')}]`);

    const qgStatus = qg.finalFormulaStatus;
    const calculatedChecks = issues.join(' | ') || 'CALCULATED_CHECKS_PASS';
    const validationState = qgStatus === 'LAB_VALIDATION_REQUIRED'
      ? 'LAB_VALIDATION_REQUIRED'
      : 'NOT_LAB_VALIDATED';
    statusDistribution[qgStatus] = (statusDistribution[qgStatus] || 0) + 1;

    formulaRecords.push({
      index: i + 1,
      id: f.id,
      name: f.name,
      category: f.category,
      canonicalCategory: catId,
      profileId: profile.subProfileId || profile.specificationProfileId,
      massSum,
      ph,
      phTarget: `${policy.targetPHRange.min}-${policy.targetPHRange.max}`,
      phPass,
      activePct,
      activeTarget: `${policy.activeSurfactantRange.min}-${policy.activeSurfactantRange.max}`,
      activePass,
      compatible: compRes.compatible,
      qgStatus,
      blockingIssues: qg.blockingIssues.map(b => b.title),
      majorWarnings: qg.majorWarnings.map(w => w.title),
      issuesSummary: `${calculatedChecks}; ${validationState}`
    });
  }

  return {
    metadata: {
      reportType: 'CURRENT_FORMULAS_STATUS_AUDIT',
      generationTimestamp: new Date().toISOString(),
      formulaSource: 'src/data/formulas.ts',
      taxonomySource: 'src/domain/productTaxonomy.ts',
      scientificEngines: [
        'pHEngineV2 (Thermodynamic & Multi-Species Equilibrium)',
        'ActiveMatterEngine (Normalized Surfactant Classification)',
        'compatibilityEngine (Matrix & Surfactant Pair Analysis)',
        'scientificQualityGateEngine (Master Quality Gate & Decision Rules)'
      ],
      isLaboratoryMeasured: false,
      provenance: 'CALCULATED_AND_PREDICTED',
      totalFormulas: FORMULAS.length,
      totalCanonicalCategories: CANONICAL_PRODUCT_CATEGORY_IDS.length,
      canonicalCategories: [...CANONICAL_PRODUCT_CATEGORY_IDS],
      statusDistribution
    },
    formulas: formulaRecords
  };
}

// If run as CLI script:
if (typeof process !== 'undefined' && process.argv[1]?.includes('audit_39_current_status')) {
  console.log('AUDITING ALL MASTER FORMULAS DYNAMICALLY...\n');
  const report = generateCurrentScientificReport();
  
  report.formulas.forEach(f => {
    console.log(`[${f.index}] ${f.id} (${f.canonicalCategory}): QG=${f.qgStatus} | ${f.issuesSummary}`);
  });

  console.log(`\nSummary: ${report.metadata.totalFormulas} formulas across ${report.metadata.totalCanonicalCategories} categories.`);
  console.log('Status distribution:', report.metadata.statusDistribution);

  fs.writeFileSync('test_reports/current_39_status.json', JSON.stringify(report, null, 2));
  console.log('\nReport written to test_reports/current_39_status.json');
}

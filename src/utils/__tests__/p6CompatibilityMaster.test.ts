import { calculateFormulationCompatibility, evaluateFormulationStability } from '../compatibilityEngine';
import { evaluateScientificQualityGate } from '../scientificQualityGateEngine';
import { CANONICAL_PRODUCT_CATEGORY_IDS } from '../../domain/productTaxonomy';

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
  error?: string;
}

export function runPhase6CompatibilityTestSuite(): { passed: number; failed: number; results: TestResult[] } {
  const results: TestResult[] = [];

  function assertEqual(suite: string, name: string, actual: any, expected: any) {
    const passed = actual === expected;
    results.push({
      suite,
      name,
      passed,
      actual,
      expected,
      error: passed ? undefined : `Expected ${expected}, got ${actual}`
    });
  }

  function assert(suite: string, name: string, condition: boolean) {
    results.push({
      suite,
      name,
      passed: Boolean(condition),
      actual: condition,
      expected: true,
      error: condition ? undefined : `Assertion failed`
    });
  }

  console.log('\n================================================================================');
  console.log('  PHASE 6 — COMPATIBILITY & FORMULATION STABILITY MASTER TEST SUITE             ');
  console.log('================================================================================\n');

  // --------------------------------------------------------------------------
  // TEST GROUP 1: ACID / BASE & TOXIC GAS GENERATION HAZARDS
  // --------------------------------------------------------------------------
  const bleachAndAcidFormula = [
    { name: 'Sodium Hypochlorite 12%', percentage: 10, category: 'Bleach' },
    { name: 'Hydrochloric Acid 37%', percentage: 5, category: 'pH Adjuster' },
    { name: 'Water', percentage: 85, category: 'Solvent' }
  ];
  const chlorineRes = calculateFormulationCompatibility(bleachAndAcidFormula as any, 2.0, 'TOILET_CLEANER');
  assert('Acid/Base Hazard', 'Bleach + Acid triggers Chlorine gas hazard alert', chlorineRes.alerts.some(a => a.id === 'chlorine-gas-hazard'));
  assertEqual('Acid/Base Hazard', 'Chlorine gas hazard severity is Critical', chlorineRes.alerts.find(a => a.id === 'chlorine-gas-hazard')?.severity, 'Critical');
  assertEqual('Acid/Base Hazard', 'Bleach + Acid formula is NOT compatible', chlorineRes.compatible, false);

  const bleachAndAmmoniaFormula = [
    { name: 'Sodium Hypochlorite 12%', percentage: 10, category: 'Bleach' },
    { name: 'Benzalkonium Chloride (BKC)', percentage: 2, category: 'Disinfectant' },
    { name: 'Water', percentage: 88, category: 'Solvent' }
  ];
  const chloramineRes = calculateFormulationCompatibility(bleachAndAmmoniaFormula as any, 10.0, 'MULTIPURPOSE_CLEANER');
  assert('Acid/Base Hazard', 'Bleach + Ammonia triggers Chloramine gas hazard alert', chloramineRes.alerts.some(a => a.id === 'chloramine-gas-hazard'));

  const liquidCarbonateAcidFormula = [
    { name: 'Sodium Carbonate', percentage: 5, category: 'Builder' },
    { name: 'Citric Acid', percentage: 8, category: 'pH Adjuster' },
    { name: 'Water', percentage: 87, category: 'Solvent' }
  ];
  const gassingRes = calculateFormulationCompatibility(liquidCarbonateAcidFormula as any, 5.0, 'LAUNDRY_LIQUID');
  assert('Acid/Base Hazard', 'Liquid Carbonate + Acid triggers CO2 gas generation alert', gassingRes.alerts.some(a => a.id === 'carbonate-acid-gas-generation'));

  // --------------------------------------------------------------------------
  // TEST GROUP 2: IONIC INCOMPATIBILITIES & CATEGORY-SPECIFIC CLASHES
  // --------------------------------------------------------------------------
  const anionicCationicFormula = [
    { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96, category: 'Anionic Surfactant' },
    { name: 'Cetrimonium Chloride', percentage: 2, activeMatterPct: 25, category: 'Cationic Surfactant' },
    { name: 'Water', percentage: 88, category: 'Solvent' }
  ];
  const ionicRes = calculateFormulationCompatibility(anionicCationicFormula as any, 7.0, 'LAUNDRY_LIQUID');
  assert('Ionic Hazard', 'Anionic + Cationic triggers ionic interaction hazard', ionicRes.alerts.some(a => a.id === 'anionic-cationic-incompatibility'));
  assertEqual('Ionic Hazard', 'Mechanism is classified as IONIC', ionicRes.alerts.find(a => a.id === 'anionic-cationic-incompatibility')?.mechanism, 'IONIC');

  const contaminatedSoftenerFormula = [
    { name: 'Esterquat 90%', percentage: 8, activeMatterPct: 90, category: 'Cationic Surfactant' },
    { name: 'SLES 70%', percentage: 0.5, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Water', percentage: 91.5, category: 'Solvent' }
  ];
  const softenerRes = calculateFormulationCompatibility(contaminatedSoftenerFormula as any, 3.0, 'FABRIC_SOFTENER');
  assert('Ionic Hazard', 'Fabric Softener anionic contamination triggers critical failure', softenerRes.alerts.some(a => a.id === 'softener-anionic-contamination'));

  const quatDisinfectantAnionicFormula = [
    { name: 'Benzalkonium Chloride (BKC 80%)', percentage: 3, activeMatterPct: 80, category: 'Disinfectant' },
    { name: 'SLES 70%', percentage: 2, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Water', percentage: 95, category: 'Solvent' }
  ];
  const quatRes = calculateFormulationCompatibility(quatDisinfectantAnionicFormula as any, 7.0, 'DISINFECTANT');
  assert('Ionic Hazard', 'Quat Disinfectant + Anionic triggers biocide inactivation alert', quatRes.alerts.some(a => a.id === 'quat-biocide-anionic-inactivation'));

  // --------------------------------------------------------------------------
  // TEST GROUP 3: REDOX & ENZYME COMPATIBILITY
  // --------------------------------------------------------------------------
  const oxidizerEnzymeFormula = [
    { name: 'Sodium Percarbonate', percentage: 5, category: 'Bleach' },
    { name: 'Protease Enzyme', percentage: 1, category: 'Enzyme' },
    { name: 'Water', percentage: 94, category: 'Solvent' }
  ];
  const redoxRes = calculateFormulationCompatibility(oxidizerEnzymeFormula as any, 8.5, 'LAUNDRY_LIQUID');
  assert('Redox/Enzyme Hazard', 'Oxidizer + Enzyme triggers inactivation alert', redoxRes.alerts.some(a => a.id === 'oxidizer-enzyme-inactivation'));

  const denaturedEnzymeFormula = [
    { name: 'Protease Enzyme', percentage: 1, category: 'Enzyme' },
    { name: 'Water', percentage: 99, category: 'Solvent' }
  ];
  const denaturedRes = calculateFormulationCompatibility(denaturedEnzymeFormula as any, 4.0, 'LAUNDRY_LIQUID');
  assert('Enzyme Hazard', 'Enzyme at pH 4.0 triggers denaturation alert', denaturedRes.alerts.some(a => a.id === 'enzyme-ph-denaturation'));

  // --------------------------------------------------------------------------
  // TEST GROUP 4: PRESERVATIVE & ORGANIC ACID DEACTIVATION
  // --------------------------------------------------------------------------
  const highPHOrganicAcidFormula = [
    { name: 'Sodium Benzoate', percentage: 0.5, category: 'Preservative' },
    { name: 'SLES 70%', percentage: 10, category: 'Anionic Surfactant' },
    { name: 'Water', percentage: 89.5, category: 'Solvent' }
  ];
  const orgAcidRes = calculateFormulationCompatibility(highPHOrganicAcidFormula as any, 6.8, 'HAND_WASH');
  assert('Preservative Hazard', 'Sodium Benzoate at pH 6.8 triggers deactivation alert', orgAcidRes.alerts.some(a => a.id === 'organic-acid-preservative-deactivation'));

  // --------------------------------------------------------------------------
  // TEST GROUP 5: POLYMER & RHEOLOGY ELECTROLYTE COLLAPSE
  // --------------------------------------------------------------------------
  const polymerHighSaltFormula = [
    { name: 'Carbomer 940', percentage: 0.8, category: 'Thickener' },
    { name: 'Sodium Chloride', percentage: 4.0, category: 'Viscosity Modifier' },
    { name: 'SLES 70%', percentage: 10, category: 'Anionic Surfactant' },
    { name: 'Water', percentage: 85.2, category: 'Solvent' }
  ];
  const polyRes = calculateFormulationCompatibility(polymerHighSaltFormula as any, 7.0, 'HAND_WASH');
  assert('Polymer/Rheology Hazard', 'Polymer thickener in 4% salt triggers viscosity collapse alert', polyRes.alerts.some(a => a.id === 'polymer-electrolyte-viscosity-collapse'));

  // --------------------------------------------------------------------------
  // TEST GROUP 6: PRODUCT-SPECIFIC SAFETY RULES
  // --------------------------------------------------------------------------
  const highFoamAutoDishFormula = [
    { name: 'SLES 70%', percentage: 3, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Sodium Metasilicate', percentage: 5, category: 'Builder' },
    { name: 'Water', percentage: 92, category: 'Solvent' }
  ];
  const autoDishRes = calculateFormulationCompatibility(highFoamAutoDishFormula as any, 10.5, 'DISHWASH_AUTOMATIC');
  assert('Product Specific', 'Auto Dish with high foaming SLES triggers machine foam hazard', autoDishRes.alerts.some(a => a.id === 'autodish-foam-overflow-hazard'));

  const highSurfactantGlassFormula = [
    { name: 'SLES 70%', percentage: 4, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Isopropanol', percentage: 5, category: 'Solvent' },
    { name: 'Water', percentage: 91, category: 'Solvent' }
  ];
  const glassRes = calculateFormulationCompatibility(highSurfactantGlassFormula as any, 7.5, 'GLASS_CLEANER');
  assert('Product Specific', 'Glass Cleaner with >1.5% active surfactant triggers streaking risk', glassRes.alerts.some(a => a.id === 'glass-cleaner-surfactant-streaking'));

  // --------------------------------------------------------------------------
  // TEST GROUP 7: FORMULATION STABILITY EVALUATION
  // --------------------------------------------------------------------------
  const cleanStableFormula = [
    { name: 'SLES 70%', percentage: 12, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'CAPB 30%', percentage: 4, activeMatterPct: 30, category: 'Amphoteric Surfactant' },
    { name: 'Phenoxyethanol', percentage: 0.8, category: 'Preservative' },
    { name: 'Water', percentage: 83.2, category: 'Solvent' }
  ];
  const cleanCompat = calculateFormulationCompatibility(cleanStableFormula as any, 7.0, 'HAND_WASH');
  const stabilitySummary = evaluateFormulationStability(cleanStableFormula as any, 7.0, 'HAND_WASH', cleanCompat.alerts as any);
  assertEqual('Formulation Stability', 'Clean formula physical stability status is STABLE', stabilitySummary.physicalStability.status, 'STABLE');
  assertEqual('Formulation Stability', 'Clean formula chemical stability status is STABLE', stabilitySummary.chemicalStability.status, 'STABLE');
  assertEqual('Formulation Stability', 'Clean formula overallStorageStatus is LAB_STABILITY_REQUIRED', stabilitySummary.overallStorageStatus, 'LAB_STABILITY_REQUIRED');

  // --------------------------------------------------------------------------
  // TEST GROUP 8: QUALITY GATE INTEGRATION & NO FALSE PASS
  // --------------------------------------------------------------------------
  const gateReport = evaluateScientificQualityGate({
    formulaName: 'Incompatible Bleach Clean',
    productCategory: 'TOILET_CLEANER',
    ingredients: bleachAndAcidFormula as any,
    estimatedPH: 2.0
  });

  assert('Quality Gate Integration', 'Incompatible formula compatibilityStatus is INCOMPATIBLE or CRITICAL_HAZARD', gateReport.compatibilityStatus === 'INCOMPATIBLE' || gateReport.compatibilityStatus === 'CRITICAL_HAZARD');
  assert('Quality Gate Integration', 'Incompatible formula has blocking issues in Quality Gate', gateReport.blockingIssues.length > 0);
  assert('Quality Gate Integration', 'Incompatible formula finalFormulaStatus is NOT VALID', gateReport.finalFormulaStatus !== 'VALID');

  // --------------------------------------------------------------------------
  // TEST GROUP 9: TAXONOMY COVERAGE (All 13 Canonical Categories)
  // --------------------------------------------------------------------------
  CANONICAL_PRODUCT_CATEGORY_IDS.forEach((cat: any) => {
    const evalRes = calculateFormulationCompatibility(cleanStableFormula as any, 7.0, cat);
    assert('Taxonomy Coverage', `Category ${cat} evaluated without throwing error`, typeof evalRes.compatibilityScore === 'number');
  });

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`--------------------------------------------------------------------------------`);
  console.log(`TOTAL PHASE 6 COMPATIBILITY TESTS : ${results.length}`);
  console.log(`PASSED                            : ${passed}`);
  console.log(`FAILED                            : ${failed}`);
  console.log(`--------------------------------------------------------------------------------\n`);

  return { passed, failed, results };
}

import { ViscosityEngine, calculateDetailedViscosity } from '../viscosityEngine';
import { FormulationIngredient } from '../../types';

export interface TestResult {
  name: string;
  passed: boolean;
  actual: any;
  expected: any;
  details?: string;
}

export function runViscosityEngineTestSuite(): { passed: number; failed: number; results: TestResult[] } {
  const results: TestResult[] = [];

  function assert(name: string, condition: boolean, actual: any, expected: any, details?: string) {
    results.push({
      name,
      passed: Boolean(condition),
      actual,
      expected,
      details
    });
  }

  // --------------------------------------------------------------------------
  // TEST 1: Pure Water Baseline
  // --------------------------------------------------------------------------
  const waterReport = ViscosityEngine.evaluateViscosity([]);
  assert(
    'Empty-ingredient water reference is not a measured formula result',
    waterReport.viscosityCp === 1 && waterReport.behavior === 'Newtonian' && waterReport.rating === 'Water-Thin' && waterReport.dataSource === 'reference_baseline' && waterReport.modelMaturity === 'REFERENCE_BASELINE',
    { cp: waterReport.viscosityCp, behavior: waterReport.behavior, rating: waterReport.rating, dataSource: waterReport.dataSource, modelMaturity: waterReport.modelMaturity },
    { cp: 1, behavior: 'Newtonian', rating: 'Water-Thin', dataSource: 'reference_baseline' }
  );

  // --------------------------------------------------------------------------
  // TEST 2: Authoritative Benchmark - Standard Hand Dishwashing Liquid (14% Active)
  // --------------------------------------------------------------------------
  const dishwashIngredients: FormulationIngredient[] = [
    { id: '1', name: 'SLES 70%', percentage: 10, category: 'Anionic Surfactant' },   // 7.0% active
    { id: '2', name: 'LABSA 90%', percentage: 6, category: 'Anionic Surfactant' },    // 5.4% active
    { id: '3', name: 'CAPB 30%', percentage: 4, category: 'Amphoteric Surfactant' }, // 1.2% active
    { id: '4', name: 'Sodium Chloride (Salt)', percentage: 1.8, category: 'Electrolyte' },
    { id: '5', name: 'Water', percentage: 78.2, category: 'Solvent' }
  ];

  const dishwashReport = ViscosityEngine.evaluateViscosity(dishwashIngredients, {
    productCategory: 'Hand Dishwashing Liquid',
    targetPH: 7.0
  });

  assert(
    'Standard hand dishwash uses a reference benchmark, not measured formula data (2000 - 3200 cPs)',
    dishwashReport.dataSource === 'reference_baseline' &&
    dishwashReport.viscosityCp >= 2000 &&
    dishwashReport.viscosityCp <= 3200 &&
    dishwashReport.behavior === 'Pseudoplastic (Shear-Thinning)',
    {
      dataSource: dishwashReport.dataSource,
      modelMaturity: dishwashReport.modelMaturity,
      viscosityCp: dishwashReport.viscosityCp,
      behavior: dishwashReport.behavior,
      benchmark: dishwashReport.authoritativeMatch?.benchmarkName
    },
    {
      dataSource: 'reference_baseline',
      modelMaturity: 'REFERENCE_BASELINE',
      viscosityCp: '>= 2000 and <= 3200',
      behavior: 'Pseudoplastic (Shear-Thinning)'
    }
  );

  // --------------------------------------------------------------------------
  // TEST 3: Authoritative Benchmark - Water-Thin Glass Cleaner
  // --------------------------------------------------------------------------
  const glassCleanerIngredients: FormulationIngredient[] = [
    { id: '1', name: 'Lauryl Alcohol Ethoxylate (LAE-9)', percentage: 0.5, category: 'Nonionic Surfactant' },
    { id: '2', name: 'Isopropanol (IPA)', percentage: 3.0, category: 'Solvent' },
    { id: '3', name: 'Water', percentage: 96.5, category: 'Solvent' }
  ];

  const glassReport = ViscosityEngine.evaluateViscosity(glassCleanerIngredients, {
    productCategory: 'Glass Cleaner'
  });

  assert(
    'Glass cleaner uses a reference benchmark, not measured formula data (1 - 10 cPs)',
    glassReport.dataSource === 'reference_baseline' &&
    glassReport.modelMaturity === 'REFERENCE_BASELINE' &&
    glassReport.viscosityCp <= 10 &&
    glassReport.rating === 'Water-Thin' &&
    glassReport.behavior === 'Newtonian',
    { cp: glassReport.viscosityCp, rating: glassReport.rating, behavior: glassReport.behavior },
    { cp: '<= 10', rating: 'Water-Thin', behavior: 'Newtonian' }
  );

  // --------------------------------------------------------------------------
  // TEST 4: Polymeric Thickener - Xanthan Gum Rheology
  // --------------------------------------------------------------------------
  const xanthanIngredients: FormulationIngredient[] = [
    { id: '1', name: 'Xanthan Gum', percentage: 0.5, category: 'Thickener' },
    { id: '2', name: 'SLES 70%', percentage: 5.0, category: 'Anionic Surfactant' },
    { id: '3', name: 'Water', percentage: 94.5, category: 'Solvent' }
  ];

  const xanthanReport = ViscosityEngine.evaluateViscosity(xanthanIngredients);

  assert(
    'Xanthan gum imparts high yield stress and strong pseudoplasticity (n < 0.35)',
    xanthanReport.dataSource === 'model_derived' &&
    xanthanReport.modelMaturity === 'SEMI_EMPIRICAL_SCREENING' &&
    xanthanReport.shearProfile.flowIndexN <= 0.35,
    xanthanReport.shearProfile.yieldStressPa >= 1.0 &&
    xanthanReport.viscosityCp >= 2000,
    {
      viscosityCp: xanthanReport.viscosityCp,
      flowIndexN: xanthanReport.shearProfile.flowIndexN,
      yieldStressPa: xanthanReport.shearProfile.yieldStressPa
    },
    {
      viscosityCp: '>= 2000',
      flowIndexN: '<= 0.35',
      yieldStressPa: '>= 1.0'
    }
  );

  // --------------------------------------------------------------------------
  // TEST 5: Carbomer 940 pH-Dependent Neutralization Swelling
  // --------------------------------------------------------------------------
  const carbomerAcidIngredients: FormulationIngredient[] = [
    { id: '1', name: 'Carbomer 940', percentage: 0.35, category: 'Thickener' },
    { id: '2', name: 'Water', percentage: 99.65, category: 'Solvent' }
  ];

  // At acid pH (pH 4.0), Carbomer is unneutralized and collapsed
  const carbomerAcidReport = ViscosityEngine.evaluateViscosity(carbomerAcidIngredients, {
    targetPH: 4.0
  });

  // At neutral pH (pH 7.0), Carbomer is fully swollen into a rich gel
  const carbomerNeutralReport = ViscosityEngine.evaluateViscosity(carbomerAcidIngredients, {
    targetPH: 7.0
  });

  assert(
    'Carbomer swells dramatically from unneutralized acid (pH 4) to neutralized gel (pH 7)',
    carbomerAcidReport.viscosityCp < 2000 &&
    carbomerNeutralReport.viscosityCp > 10000 &&
    carbomerAcidReport.warnings.some(w => w.includes('Carbomer Inefficient Swelling')),
    {
      acidCp: carbomerAcidReport.viscosityCp,
      neutralCp: carbomerNeutralReport.viscosityCp,
      hasWarning: carbomerAcidReport.warnings.some(w => w.includes('Carbomer Inefficient Swelling'))
    },
    {
      acidCp: '< 2000',
      neutralCp: '> 10000',
      hasWarning: true
    }
  );

  // --------------------------------------------------------------------------
  // TEST 6: Salt-Curve Mechanics - Sub-critical vs Peak vs Over-salted Collapse
  // --------------------------------------------------------------------------
  const baseSurfactant = [
    { id: '1', name: 'SLES 70%', percentage: 10, category: 'Anionic Surfactant' },
    { id: '2', name: 'CAPB 30%', percentage: 4, category: 'Amphoteric Surfactant' }
  ];

  const subCriticalReport = ViscosityEngine.evaluateViscosity([
    ...baseSurfactant,
    { id: '3', name: 'Sodium Chloride', percentage: 0.3, category: 'Electrolyte' },
    { id: '4', name: 'Water', percentage: 85.7, category: 'Solvent' }
  ]);

  const peakReport = ViscosityEngine.evaluateViscosity([
    ...baseSurfactant,
    { id: '3', name: 'Sodium Chloride', percentage: 1.6, category: 'Electrolyte' },
    { id: '4', name: 'Water', percentage: 84.4, category: 'Solvent' }
  ]);

  const overSaltedReport = ViscosityEngine.evaluateViscosity([
    ...baseSurfactant,
    { id: '3', name: 'Sodium Chloride', percentage: 3.8, category: 'Electrolyte' },
    { id: '4', name: 'Water', percentage: 82.2, category: 'Solvent' }
  ]);

  assert(
    'Salt curve identifies sub-critical, peak, and over-salted collapse with phase separation risk',
    subCriticalReport.saltCurve.curveRegion === 'sub_critical' &&
    peakReport.saltCurve.curveRegion === 'peak_plateau' &&
    overSaltedReport.saltCurve.curveRegion === 'over_salted' &&
    overSaltedReport.saltCurve.saltingOutRisk === true &&
    overSaltedReport.rating === 'Over-Salted / Phase Separation Risk' &&
    overSaltedReport.viscosityCp < peakReport.viscosityCp,
    {
      subCurve: subCriticalReport.saltCurve.curveRegion,
      peakCurve: peakReport.saltCurve.curveRegion,
      peakCp: peakReport.viscosityCp,
      overCurve: overSaltedReport.saltCurve.curveRegion,
      overCp: overSaltedReport.viscosityCp,
      saltingOutRisk: overSaltedReport.saltCurve.saltingOutRisk,
      rating: overSaltedReport.rating
    },
    {
      subCurve: 'sub_critical',
      peakCurve: 'peak_plateau',
      overCurve: 'over_salted',
      saltingOutRisk: true,
      rating: 'Over-Salted / Phase Separation Risk'
    }
  );

  // --------------------------------------------------------------------------
  // TEST 7: Hydrotrope Viscosity Suppression
  // --------------------------------------------------------------------------
  const thickenedWithoutHydrotrope = ViscosityEngine.evaluateViscosity([
    ...baseSurfactant,
    { id: '3', name: 'Sodium Chloride', percentage: 1.5, category: 'Electrolyte' },
    { id: '4', name: 'Water', percentage: 84.5, category: 'Solvent' }
  ]);

  const thinnedWithHydrotrope = ViscosityEngine.evaluateViscosity([
    ...baseSurfactant,
    { id: '3', name: 'Sodium Chloride', percentage: 1.5, category: 'Electrolyte' },
    { id: '4', name: 'Sodium Xylene Sulfonate (SXS 40%)', percentage: 5.0, category: 'Hydrotrope' },
    { id: '5', name: 'Water', percentage: 79.5, category: 'Solvent' }
  ]);

  assert(
    'Hydrotrope (SXS) depresses micellar viscosity entanglement',
    thinnedWithHydrotrope.viscosityCp < thickenedWithoutHydrotrope.viscosityCp * 0.7,
    {
      withoutHydrotropeCp: thickenedWithoutHydrotrope.viscosityCp,
      withHydrotropeCp: thinnedWithHydrotrope.viscosityCp
    },
    {
      thinningFactor: '< 70% of without hydrotrope'
    }
  );

  // --------------------------------------------------------------------------
  // TEST 8: Arrhenius Temperature Scaling Profile
  // --------------------------------------------------------------------------
  const tempProfile = dishwashReport.temperatureProfile;
  assert(
    'Temperature profile follows Arrhenius scaling (4°C > 25°C > 40°C)',
    tempProfile.temp4C_Cp > tempProfile.temp25C_Cp &&
    tempProfile.temp25C_Cp > tempProfile.temp40C_Cp,
    {
      temp4C: tempProfile.temp4C_Cp,
      temp25C: tempProfile.temp25C_Cp,
      temp40C: tempProfile.temp40C_Cp
    },
    {
      scaling: 'temp4C > temp25C > temp40C'
    }
  );

  // --------------------------------------------------------------------------
  // TEST 9: Unsupported Solid / Powder Formulation
  // --------------------------------------------------------------------------
  const powderIngredients: FormulationIngredient[] = [
    { id: '1', name: 'Sodium Carbonate (Soda Ash)', percentage: 40, category: 'Builder' },
    { id: '2', name: 'Sodium Sulfate', percentage: 35, category: 'Filler' },
    { id: '3', name: 'LABSA 90%', percentage: 15, category: 'Anionic Surfactant' },
    { id: '4', name: 'Sodium Metasilicate', percentage: 10, category: 'Builder' }
  ];

  const powderReport = ViscosityEngine.evaluateViscosity(powderIngredients, {
    productCategory: 'Washing Powder'
  });

  assert(
    'Detergent powder returns unsupported non-fluid viscosity (0 cPs, isFluid = false)',
    powderReport.isFluid === false &&
    powderReport.viscosityCp === 0 &&
    powderReport.confidence === 'Unsupported' &&
    powderReport.dataSource === 'unsupported',
    {
      isFluid: powderReport.isFluid,
      viscosityCp: powderReport.viscosityCp,
      confidence: powderReport.confidence,
      dataSource: powderReport.dataSource
    },
    {
      isFluid: false,
      viscosityCp: 0,
      confidence: 'Unsupported',
      dataSource: 'unsupported'
    }
  );

  // --------------------------------------------------------------------------
  // TEST 10: Functional Wrapper Backward Compatibility
  // --------------------------------------------------------------------------
  const wrapperResult = calculateDetailedViscosity(dishwashIngredients, {
    productCategory: 'Hand Dishwashing Liquid'
  });

  assert(
    'calculateDetailedViscosity export returns full ViscosityReport with estViscosityCps',
    wrapperResult.estViscosityCps !== undefined &&
    wrapperResult.estViscosityCps > 0 &&
    typeof wrapperResult.behavior === 'string',
    { estViscosityCps: wrapperResult.estViscosityCps, behavior: wrapperResult.behavior },
    { estViscosityCps: '> 0', behavior: 'string' }
  );

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(r => {
    if (!r.passed) {
      console.error(`FAILED: ${r.name}`, 'Actual:', r.actual, 'Expected:', r.expected);
    }
  });

  return { passed, failed, results };
}

if (process.argv[1]?.includes('viscosityEngine.regression.test')) {
  const summary = runViscosityEngineTestSuite();
  console.log(`Viscosity Engine Tests: ${summary.passed}/${summary.passed + summary.failed} passed`);
  summary.results.forEach(r => {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.name}`);
    if (!r.passed) {
      console.log('   Actual:  ', JSON.stringify(r.actual));
      console.log('   Expected:', JSON.stringify(r.expected));
    }
  });
}

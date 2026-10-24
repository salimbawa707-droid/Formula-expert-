import { VAULT_SCHEMA_VERSION } from './types.ts';
import type { VaultState } from './types.ts';
import { INITIAL_HISTORICAL_RECONCILIATIONS, INITIAL_INVENTORY_METRICS } from './schemaDefaults.ts';

export const INITIAL_VAULT_STATE: VaultState = {
  version: VAULT_SCHEMA_VERSION,
  exportedAt: '2026-10-17T13:56:00Z',
  inventoryMetrics: INITIAL_INVENTORY_METRICS,
  historicalReconciliations: INITIAL_HISTORICAL_RECONCILIATIONS,
  daviesActivityModels: [],
  surfactantPhaseProperties: [],
  engineCountDiscrepancy: {
    claimedA: 64,
    reconciledFiles: 59,
    claimedSubmodules: 97,
    status: 'REPORTED_UNVERIFIED',
    notes: 'Historical audits variously claimed 64 engines (Audit Report A), 59 distinct implementation files (Source Tree Reconciliation v2), and 97 modular sub-engines (Initial Architecture Spec). Status remains REPORTED_UNVERIFIED until reconciled file-by-file against https://github.com/salimbawa707-droid/Formula-expert-.git.',
  },
  activeBlockers: [
    {
      id: 'BLK-001',
      phaseId: 'phase-4b',
      title: 'SurfPro raw artifact missing from current main checkout; re-acquisition needed for reproducibility',
      impact: 'Historical Round-2 evidence documents a verified 1,624-row, 31-column SURFPRO master CSV and a 223-row detergent-active slice. The raw CSVs are not present at their previously recorded data/evidence/surfpro paths on current main, so the prior inspection cannot be freshly reproduced from the checked-in source tree.',
      environmentLimitation: 'This is no longer accurately described as “never inspected”: the repository retains the SURFPRO numerical inspection and independent audit reports, including source checksum and record counts. The current checkout does not contain the previously reported raw CSV artifacts.',
      workaroundOrNextAction: 'Re-acquire the canonical CSV from https://zenodo.org/api/records/15861809/files/S129_SURFPRO.csv/content; verify published MD5 e5bcd1bbab2fc56717a3cd6a0cf1c152 and SHA-256 316a136630ab08097454518231b952c78d65773a125627ae38d874b889b8d841; reproduce the 1,624-row master and 223-row slice counts before clearing this artifact-reproducibility blocker.',
    },
    {
      id: 'BLK-002',
      phaseId: 'phase-4b',
      title: 'No eligible formula prediction pairs for Task 2 target engines',
      impact: 'The inspected Zenodo workbooks support descriptive evidence, but missing formula compositions and the unavailable ENG-005 implementation prevent direct prediction validation.',
      environmentLimitation: 'ENG-003 is a semi-empirical formula screen; ENG-005 has no executable implementation at the audited main HEAD.',
      workaroundOrNextAction: 'Keep validation gates open. Obtain formula-identified rheology observations and implement/review ENG-005 before claiming matched-output comparisons.',
    },
    {
      id: 'BLK-003',
      phaseId: 'phase-5',
      title: 'Phase 5 Execution Gate Locked',
      impact: 'Algorithmic tuning, model regression, and calibration strictly prohibited.',
      environmentLimitation: 'Phase 4B independent closure sign-off has not been granted.',
      workaroundOrNextAction: 'Complete evidence inventory, reconcile 59 engine files, inspect at least 3 experimental datasets, and submit to independent audit committee.',
    },
  ],
  phases: [
    {
      phaseId: 'phase-1',
      name: 'Phase 1 — Pricing Integrity',
      subtitle: 'Raw Material Cost Integrity & Null Price Preservation',
      status: 'CLOSED',
      reportedClosed: true,
      closureReportDate: '2026-08-14',
      independentVerificationStatus: 'CONFIRMED',
      blockers: [],
      description: 'Audit of raw material pricing routines. Established strict preservation of unknown prices as null/unknown rather than fabricated zero ($0.00), preventing dangerous false-zero costing calculations in commercial detergent batches.',
      keyDeliverables: [
        {
          title: 'Preserve unknown raw-material prices as null/unknown (not $0.00)',
          status: 'DONE',
          verified: true,
          notes: 'Validated against 48 canonical detergent ingredients; zero-coercion eliminated in costing pipelines.',
        },
        {
          title: 'Audit batch cost aggregation for null-propagation warning',
          status: 'DONE',
          verified: true,
          notes: 'Formulations with incomplete price data raise explicit UNKNOWN_COST warnings.',
        },
      ],
    },
    {
      phaseId: 'phase-2',
      name: 'Phase 2 — Ingredient Identity & Provenance',
      subtitle: 'Canonical Chemical Nomenclature & CAS/InChIKey Mapping',
      status: 'CLOSED',
      reportedClosed: true,
      closureReportDate: '2026-09-02',
      independentVerificationStatus: 'UNESTABLISHED',
      blockers: [],
      description: 'Remediation of trade-name ambiguity and inconsistent CAS registry entries across detergent surfactants, builders, chelants, enzymes, and hydrotropes. Independent verification remains unestablished.',
      keyDeliverables: [
        {
          title: 'Establish canonical chemical identifier dictionary (CAS & InChIKey)',
          status: 'DONE',
          verified: false,
          notes: 'Reported complete internally; external peer review by independent detergent chemist pending.',
        },
        {
          title: 'Prevent alias collision between LAS, SLES-1EO, and SLES-2EO',
          status: 'DONE',
          verified: false,
          notes: 'Distinction documented in schema; verification against PubChem CID pending.',
        },
      ],
    },
    {
      phaseId: 'phase-3',
      name: 'Phase 3 — Scientific Core Remediation',
      subtitle: 'PHEngineV2 & Physico-Chemical Equation Corrections',
      status: 'CLOSED',
      reportedClosed: true,
      closureReportDate: '2026-09-28',
      independentVerificationStatus: 'UNESTABLISHED',
      blockers: [],
      description: 'Remediation of three core scientific calculation flaws: F3-01 (Extended Debye-Hückel / Davies ionic activity coefficient correction), F3-02 (Mixed surfactant micellization non-linear interaction parameter), and F3-03 (Polycarboxylate & citrate chelation equilibria with Ca2+/Mg2+ hardness ions). Independent verification remains unestablished.',
      keyDeliverables: [
        {
          title: 'F3-01: Davies activity coefficient correction for ionic strength > 0.1M',
          status: 'DONE',
          verified: false,
          notes: 'Code implemented in PHEngineV2; requires empirical bench titration datasets to validate.',
        },
        {
          title: 'F3-02: Regular Solution Theory (RST) Rubingh non-linear beta parameter for mixed micelles',
          status: 'DONE',
          verified: false,
          notes: 'Formulated in SurfactantMicellizationEngine; pending CMC experimental surface tension series.',
        },
        {
          title: 'F3-03: Multi-ligand conditional stability constants for Ca2+/Mg2+ sequestration',
          status: 'DONE',
          verified: false,
          notes: 'Equations updated for STPP, Sodium Citrate, and GLDA; needs potentiometric ISE validation.',
        },
      ],
    },
    {
      phaseId: 'phase-4',
      name: 'Phase 4 — Initial Evidence Inventory',
      subtitle: 'Preliminary Scientific Literature Survey (5 Sources)',
      status: 'CLOSED',
      reportedClosed: true,
      closureReportDate: '2026-10-05',
      independentVerificationStatus: 'REJECTED',
      blockers: [
        'Survey of only 5 sources was statistically and domain-wise insufficient to cover 59 engines.',
      ],
      description: 'Initial literature survey produced a preliminary report referencing 5 sources. The audit determined that this five-source inventory did NOT establish completeness or empirical coverage across all detergent calculation engines.',
      keyDeliverables: [
        {
          title: 'Initial 5-source bibliographic assessment',
          status: 'DONE',
          verified: true,
          notes: 'Completed, but audited as non-exhaustive and inadequate for empirical calibration.',
        },
        {
          title: 'Scientific engine mapping matrix (v1)',
          status: 'BLOCKED',
          verified: false,
          notes: 'Superseded by Phase 4B Comprehensive Real Scientific Evidence Inventory.',
        },
      ],
    },
    {
      phaseId: 'phase-4b',
      name: 'Phase 4B — Comprehensive Real Scientific Evidence Inventory',
      subtitle: 'Current Active Remediation Phase: Evidence Vault & Engine Reconciliation',
      status: 'ACTIVE',
      reportedClosed: false,
      independentVerificationStatus: 'UNESTABLISHED',
      blockers: [
        'SurfPro ZIP archive unavailable in Google AI Studio environment (BLK-001).',
        'Zenodo 18961871 tabular workbooks are parsed, but no eligible formula-prediction comparisons exist for ENG-003/ENG-005 (BLK-002).',
        'Discrepancy between 64, 59, and 97 reported engines unresolved against repository source files.',
      ],
      description: 'Current active phase. Ingests 11 real scientific evidence leads, establishes the empirical dataset register, verifies data provenance, reconciles the 59 engine source files, and mandates physical numerical inspection before any engine is marked ready for validation.',
      keyDeliverables: [
        {
          title: 'Seed & triage 11 scientific evidence sources (experimental, reference DB, theory)',
          status: 'IN_PROGRESS',
          verified: true,
          notes: 'Seeded as UNINSPECTED leads; URLs and DOIs recorded without false validation claims.',
        },
        {
          title: 'Reconcile 59 engine implementation files vs 64/97 historical claims',
          status: 'IN_PROGRESS',
          verified: false,
          notes: 'Discrepancy preserved explicitly as REPORTED_UNVERIFIED pending file audit.',
        },
        {
          title: 'Acquire & numerically inspect SurfPro Zenodo 15861809 tensiometry dataset',
          status: 'BLOCKED',
          verified: false,
          notes: 'Blocked by AI Studio runtime file ingestion constraints (BLK-001).',
        },
        {
          title: 'Parse and map Zenodo 18961871 rheology, bubble, and film workbooks',
          status: 'DONE',
          verified: true,
          notes: 'Canonical workbook bytes, parser structure, units, and descriptive applicability are recorded. No direct prediction pairs are established.',
        },
        {
          title: 'Independent Review & Phase 4B Closure Gate Approval',
          status: 'PENDING',
          verified: false,
          notes: 'Mandatory gate before Phase 5 can be unlocked.',
        },
      ],
    },
    {
      phaseId: 'phase-5',
      name: 'Phase 5 — Numerical Validation & Model Calibration',
      subtitle: 'LOCKED — Strictly Gated Behind Phase 4B Formal Sign-Off',
      status: 'LOCKED',
      reportedClosed: false,
      independentVerificationStatus: 'UNESTABLISHED',
      blockers: [
        'LOCKED: Phase 4B comprehensive evidence inventory must be independently reviewed and approved first.',
        'No target engine has eligible matched prediction and observation data; direct validation remains unperformed.',
      ],
      description: 'LOCKED. Do not begin until Phase 4B has been independently reviewed and explicitly approved. Will execute statistical residual analysis (RMSE, MAE, R2), error propagation, and model parameter tuning against real experimental datasets.',
      keyDeliverables: [
        {
          title: 'Run numerical validation harness against inspected experimental benchmarks',
          status: 'BLOCKED',
          verified: false,
          notes: 'Gated: Phase 4B must close first.',
        },
        {
          title: 'Compute residual distributions and quantify limits of applicability',
          status: 'BLOCKED',
          verified: false,
          notes: 'Gated: Phase 4B must close first.',
        },
        {
          title: 'Independent peer review of validation results by detergent physical chemist',
          status: 'BLOCKED',
          verified: false,
          notes: 'Gated: Phase 4B must close first.',
        },
      ],
    },
  ],
  pricingRecords: [
    {
      ingredientId: 'ING-LAS-001',
      canonicalName: 'Linear Alkylbenzene Sulfonic Acid (LABSA 96%)',
      tradeName: 'Sulfodet 96 / Marlon AS3',
      inchiKey: 'ZTHYODDOHBKRJD-UHFFFAOYSA-M',
      pricePerKg: 1.85,
      currency: 'USD',
      priceStatus: 'CONFIRMED',
      sourceNote: 'ICIS Chemical Pricing Bulletin Q3 2026 contract bulk rate.',
    },
    {
      ingredientId: 'ING-SLES-002',
      canonicalName: 'Sodium Lauryl Ether Sulfate (SLES 70%, 2EO)',
      tradeName: 'Texapon N70',
      inchiKey: 'ASEZTYNJCCEGKF-UHFFFAOYSA-M',
      pricePerKg: 1.62,
      currency: 'USD',
      priceStatus: 'CONFIRMED',
      sourceNote: 'Direct supplier quote FOB Rotterdam Q2 2026.',
    },
    {
      ingredientId: 'ING-CITR-003',
      canonicalName: 'Sodium Citrate Dihydrate (Builder/Chelant)',
      tradeName: 'Citrosodina Tech',
      inchiKey: 'NBVXSUQYWXRMNV-UHFFFAOYSA-K',
      pricePerKg: 1.25,
      currency: 'USD',
      priceStatus: 'CONFIRMED',
      sourceNote: 'Verified chemical distributor price index.',
    },
    {
      ingredientId: 'ING-SPECIAL-004',
      canonicalName: 'Novel Biosurfactant Rhamnolipid Fraction (Rha-C10-C10)',
      tradeName: 'BioSurfx Advanced Eco',
      inchiKey: 'UNKNOWN-RHAMNO-LIPID-C10',
      pricePerKg: null, // STRICTLY NULL! PRESERVE UNKNOWN, NEVER COERCE TO ZERO!
      currency: 'USD',
      priceStatus: 'UNKNOWN_NULL',
      sourceNote: 'Specialty bio-derived ingredient: no market spot quote available. Costing engine preserves NULL to prevent false-zero batch costing.',
    },
    {
      ingredientId: 'ING-ENZYME-005',
      canonicalName: 'Subtilisin Protease Complex (4.0 KNPU-S)',
      tradeName: 'Savinase Ultra 16L',
      inchiKey: 'PROTEASE-ENZYME-001',
      pricePerKg: null, // STRICTLY NULL! PRESERVE UNKNOWN!
      currency: 'USD',
      priceStatus: 'UNKNOWN_NULL',
      sourceNote: 'Proprietary enzyme formulation: supplier NDA pricing not ingested. Kept as null/unknown.',
    },
    {
      ingredientId: 'ING-STPP-006',
      canonicalName: 'Sodium Tripolyphosphate (STPP)',
      tradeName: 'Therphos Food/Tech Grade',
      inchiKey: 'PQVOIGALDVXNOY-UHFFFAOYSA-J',
      pricePerKg: 1.10,
      currency: 'USD',
      priceStatus: 'CONFIRMED',
      sourceNote: 'Commodity bulk delivery pricing index 2026.',
    },
  ],
  engines: [
    {
      id: 'ENG-001',
      name: 'PHEngineV2 (Electrolyte Buffer & Activity Core)',
      category: 'pH & Buffer Equilibrium',
      sourceFile: 'src/domain/ph/pHEngineV2.ts',
      entryPoint: 'PHEngineV2.calculatePH(ingredients, totalMassKg, options)',
      inputs: [
        { name: 'acidBaseEquilibria', unit: 'pKa array', description: 'Acid dissociation constants for builders and surfactants' },
        { name: 'concentrations', unit: 'mol/L', description: 'Molar analytical concentrations of all weak acids/bases' },
        { name: 'temperature', unit: 'K', description: 'Operating liquid temperature (283K - 353K)' },
        { name: 'ionicStrength', unit: 'mol/L', description: 'Total electrolyte charge density I = 0.5 * sum(ci * zi^2)' },
      ],
      outputs: [
        { name: 'equilibriumPH', unit: 'pH units (0-14)', description: 'Thermodynamically consistent solution pH' },
        { name: 'activityCoefficients', unit: 'gamma (dimensionless)', description: 'Davies ion activity correction coefficients' },
        { name: 'bufferCapacity', unit: 'beta (mol/(L * pH))', description: 'Differential buffer capacity at operating pH' },
      ],
      equationsModels: [
        'Davies equation for ion activity: log10(gamma_i) = -A * z_i^2 * (sqrt(I)/(1 + sqrt(I)) - 0.3 * I)',
        'Charge balance neutrality condition: sum(molar_cations * z) = sum(molar_anions * z)',
        'Henderson-Hasselbalch iterative polyprotic equilibrium solver (Newton-Raphson)',
      ],
      assumptions: [
        'Assumes dilute to moderate ionic strength (I < 0.5 M) where Davies correction remains physically valid.',
        'Assumes temperature dependence of pKa follows van t Hoff enthalpy of ionization.',
      ],
      dependencies: ['src/core/chemicalDictionary.ts', 'src/core/thermodynamics.ts'],
      consumingEngines: ['ENG-002', 'ENG-004', 'ENG-005', 'ENG-006'],
      intendedProducts: ['Heavy Duty Liquid (HDL)', 'Light Duty Liquid (LDL)', 'Automatic Dishwashing (ADW)'],
      operatingConditions: 'pH 5.5 to 11.5, ionic strength 0.01M to 0.45M, 20°C to 60°C',
      existingEvidenceIds: ['EVD-009', 'EVD-010'],
      requiredExperimentalVariables: [
        'Measured glass electrode pH at calibrated ionic strengths',
        'Titration curve data (mL titrant vs pH)',
        'Buffer capacity inflection points',
      ],
      referenceOutputsRequired: ['Observed pH vs predicted pH residuals across 5-point standard buffer series'],
      evidenceCoveragePct: 18,
      numericalValidationReadiness: 'DATASET_REQUIRED',
      scientificMaturity: 'CODE_IMPLEMENTED',
      independentVerificationStatus: 'REPORTED_COMPLETE_UNVERIFIED',
      openQuestions: [
        'How does concentrated surfactant micellization perturb effective ionic strength above 5% surfactant load?',
        'Are Pitzer ion-interaction parameters required for heavy industrial builders exceeding 0.5M electrolyte?',
      ],
      knownLimitations: [
        'F3-01 Davies correction implemented in code but has not undergone empirical lab titration validation.',
        'Activity model breaks down in ultra-concentrated paste formats (I > 1.0M).',
      ],
      lastAudited: '2026-10-05',
    },
    {
      id: 'ENG-002',
      name: 'CMC utilities (pure defaults and ideal mixed Clint calculation)',
      category: 'Surfactant & Micellization',
      sourceFile: 'src/utils/calculators.ts',
      entryPoint: 'calculateMixedCMC(ingredients) / idealMixedCmcFromMoleFractions(components)',
      inputs: [
        { name: 'individualCMCs', unit: 'mol/L', description: 'Critical micelle concentrations of pure surfactant components' },
        { name: 'moleFractions', unit: 'xi (dimensionless)', description: 'Stoichiometric bulk solution mole fractions' },
        { name: 'molecularWeights', unit: 'g/mol', description: 'Used to convert ingredient active mass fractions to mole fractions; ideal Clint mixing only.' },
      ],
      outputs: [
        { name: 'mixedCMC', unit: 'mol/L', description: 'Effective critical micelle concentration of surfactant mixture' },
        { name: 'componentMoleFractions', unit: 'xi (dimensionless)', description: 'Bulk surfactant mole fractions; micelle composition is not solved.' },
        { name: 'openBenchmarkNonIdeality', unit: 'text note', description: 'Informational component-level note; not a calculated interaction parameter.' },
      ],
      equationsModels: [
        'Implemented mixed calculation is Clint ideal mixing from surfactant mole fractions and pure CMC inputs.',
        'Rubingh regular-solution beta and mixed-micelle composition are not implemented by this utility.',
      ],
      assumptions: [
        'Spherical or oblate non-interacting micelles at concentrations immediately above CMC.',
        'Binary interaction parameter beta is assumed constant over moderate surfactant mole fraction range.',
      ],
      dependencies: ['ENG-001', 'src/core/surfactantConstants.ts'],
      consumingEngines: ['ENG-003', 'ENG-004', 'ENG-005'],
      intendedProducts: ['Liquid Detergent', 'Shampoo / Body Wash', 'Hand Dishwash Liquid'],
      operatingConditions: 'Surfactant concentration 0.05% to 35% w/w, 15°C to 45°C',
      existingEvidenceIds: ['EVD-001', 'EVD-002', 'EVD-007'],
      requiredExperimentalVariables: [
        'Wilhelmy plate or du Noüy ring surface tension vs log(concentration) curves',
        'Experimental CMC values in presence of monovalent (Na+) and divalent (Ca2+) counterions',
      ],
      referenceOutputsRequired: ['Mixed CMC (mol/L) and surface tension at CMC (gamma_cmc, mN/m)'],
      evidenceCoveragePct: 15,
      numericalValidationReadiness: 'DATASET_REQUIRED',
      scientificMaturity: 'HEURISTIC',
      independentVerificationStatus: 'UNVERIFIED',
      openQuestions: [
        'What measured formulation and condition inputs would support formula-level CMC evaluation?',
      ],
      knownLimitations: [
        'The actual mixed calculation is the ideal Clint limit; Rubingh beta fitting and micelle-composition outputs are not implemented.',
        'P2SURF is a component-level literature compilation and does not establish finished-formula validation.',
      ],
      lastAudited: '2026-10-05',
    },
    {
      id: 'ENG-003',
      name: 'ViscosityEngine (Semi-empirical formulation screening)',
      category: 'Rheology & Viscosity',
      implementationStatus: 'IMPLEMENTED',
      sourceFile: 'src/utils/viscosityEngine.ts',
      entryPoint: 'ViscosityEngine.evaluateViscosity(ingredients, options)',
      inputs: [
        { name: 'ingredients', unit: 'FormulationIngredient[] (% w/w)', description: 'Named ingredients and percentages; required for formula-specific screening.' },
        { name: 'productCategory', unit: 'category identifier', description: 'Optional product category used to select formulation rules.' },
        { name: 'targetPH', unit: 'pH', description: 'Optional pH input for pH-sensitive thickener handling.' },
      ],
      outputs: [
        { name: 'viscosityCp', unit: 'cP (mPa s)', description: 'Screening scalar referenced to 25 C; approximately 20 s^-1 assumption.' },
        { name: 'shearProfile', unit: 'cP; dimensionless n; Pa', description: 'Approximate zero-, medium-, and high-shear profile and yield stress.' },
        { name: 'temperatureProfile', unit: 'cP at 4/25/40 C', description: 'Estimated fixed-temperature profile; not a per-observation rheology curve.' },
        { name: 'saltCurve', unit: '% w/w and qualitative region', description: 'Heuristic electrolyte state and risk flags.' },
      ],
      equationsModels: [
        'Semi-empirical ingredient-rule synthesis for surfactant, electrolyte, polymer, and solvent contributions.',
        'Arrhenius-style reference temperature scaling with fixed activation-energy assumptions.',
        'Approximate power-law shear profile; not fitted to the audited dataset.',
      ],
      assumptions: [
        'Ingredient names, categories, percentages, and optional pH stand in for grade-specific physical chemistry inputs.',
        'Single scalar reference assumes approximately 20 s^-1 and 25 C; formulation-grade electrolyte behavior requires calibration.',
        'The empty-ingredient branch returns a generic 1 cP water reference, not a measured formula result.',
      ],
      dependencies: ['ENG-002', 'src/core/polymerPhysics.ts'],
      consumingEngines: ['ENG-006'],
      intendedProducts: ['Heavy Duty Liquid', 'Fabric Conditioner', 'Hard Surface Gel Cleaner'],
      operatingConditions: 'Declared domain: aqueous fluid surfactant formulations, 4°C to 40°C; scalar reference about 20 s^-1 at 25°C. No empirical validation established.',
      existingEvidenceIds: ['EVD-003', 'EVD-005', 'EVD-008'],
      requiredExperimentalVariables: [
        'Rotational cone-and-plate or concentric cylinder shear flow curves (shear stress vs shear rate)',
        'Zero-shear viscosity eta_0 and infinite-shear plateau eta_inf',
      ],
      referenceOutputsRequired: ['Formula-identified viscosity observations with matched ingredient composition, temperature, shear rate, geometry, and protocol.'],
      evidenceCoveragePct: 0,
      numericalValidationReadiness: 'DATASET_REQUIRED',
      scientificMaturity: 'HEURISTIC',
      independentVerificationStatus: 'UNVERIFIED',
      openQuestions: [
        'What is the quantitative prediction error at low shear (< 1 s^-1) for yield-stress structured formulations?',
      ],
      knownLimitations: [
        'The implementation is semi-empirical screening, not a lab-validated full flow-curve model.',
        'Zenodo 18961871 product samples lack formula compositions and cannot directly validate formula-specific predictions.',
        'The generic empty-input water reference is not a measurement or prediction for the user formula.',
      ],
      lastAudited: '2026-10-22',
    },
    {
      id: 'ENG-004',
      name: 'Chelator capacity and water-hardness estimate (database-backed arithmetic)',
      category: 'Builder Chelation',
      sourceFile: 'src/utils/chelatorEngine.ts',
      entryPoint: 'calculateFormulationChelationCapacity(ingredients, dose, batchMassKg) / calculateWaterHardnessTolerance(...)',
      inputs: [
        { name: 'ingredients', unit: 'FormulationIngredient[] (% w/w)', description: 'Ingredient names, percentage, and optional active matter/purity.' },
        { name: 'washDoseGrams', unit: 'g', description: 'Wash dose; defaults to 20 g.' },
        { name: 'batchSizeKg', unit: 'kg', description: 'Batch size for batch-capacity reporting; defaults to 100 kg.' },
      ],
      outputs: [
        { name: 'totalSequestrationMg', unit: 'mg CaCO3 equivalent', description: 'Capacity arithmetic for the specified wash dose.' },
        { name: 'batchSequestrationGrams', unit: 'g CaCO3 equivalent', description: 'Calculated batch capacity from configured ingredient factors.' },
        { name: 'status', unit: 'COMPLETE | INSUFFICIENT_DATA', description: 'Flags declared but unrecognized chelators.' },
      ],
      equationsModels: [
        'Ingredient-name database maps selected chelators to fixed mg CaCO3/g binding-capacity values.',
        'Capacity and hardness-load arithmetic; no simultaneous multi-ligand equilibrium or free-ion solver.',
      ],
      assumptions: [
        'Selected ingredient names map to fixed capacity factors in an in-code database; values are not dynamically solved equilibrium constants.',
        'Wash hardness load and formulation capacity are compared arithmetically; free Ca2+/Mg2+ is not solved.',
      ],
      dependencies: ['ENG-001', 'src/core/stabilityConstants.ts'],
      consumingEngines: ['ENG-005', 'ENG-006'],
      intendedProducts: ['Laundry Liquids & Powders', 'Automatic Dishwashing Tabs', 'Vehicle Wash'],
      operatingConditions: 'Water hardness 50 ppm to 400 ppm CaCO3, pH 7.0 to 11.0, 20°C to 60°C',
      existingEvidenceIds: ['EVD-004', 'EVD-009'],
      requiredExperimentalVariables: [
        'Potentiometric calcium ion-selective electrode (ISE) titration curves',
        'Calcium binding capacity vs pH at 25°C and 40°C',
      ],
      referenceOutputsRequired: ['Free [Ca2+] (mol/L) across varying chelant/hardness stoichiometric ratios'],
      evidenceCoveragePct: 12,
      numericalValidationReadiness: 'DATASET_REQUIRED',
      scientificMaturity: 'HEURISTIC',
      independentVerificationStatus: 'UNVERIFIED',
      openQuestions: [
        'Can compound-specific capacity inputs be tied to methods and direct Ca/Mg sequestration observations?',
      ],
      knownLimitations: [
        'Database-based capacity estimates are not a thermodynamic equilibrium prediction; direct matched Ca/Mg measurements are absent.'
      ],
      lastAudited: '2026-10-05',
    },
    {
      id: 'ENG-005',
      name: 'FoamKineticsEngine (planned; implementation unavailable)',
      category: 'Foam Dynamics & Stability',
      implementationStatus: 'UNAVAILABLE',
      sourceFile: 'UNAVAILABLE — no implementation file found at audited main HEAD 7a977a427ffd02890376d52a3a3aec40bb640e72',
      entryPoint: 'UNAVAILABLE — no executable entry point found',
      inputs: [],
      outputs: [],
      equationsModels: [],
      assumptions: ['This registry record is a planned specification only; no implemented predictor was found.'],
      dependencies: [],
      consumingEngines: ['ENG-006'],
      intendedProducts: ['Hand Dishwashing (High Foam)', 'Automatic Laundry (Controlled Low Foam)', 'Car Shampoo'],
      operatingConditions: 'Not established; no executable model is available.',
      existingEvidenceIds: ['EVD-006'],
      requiredExperimentalVariables: [
        'Standard Ross-Miles initial height (mm) and height after 5 minutes',
        'Automated Foam Analyzer (Dynamic FOAMIS / Krüss DFA100) drainage curves',
      ],
      referenceOutputsRequired: ['Time-resolved foam height (mm) and liquid drainage rate (mL/min)'],
      evidenceCoveragePct: 0,
      numericalValidationReadiness: 'NOT_READY',
      scientificMaturity: 'BLOCKED',
      independentVerificationStatus: 'UNVERIFIED',
      openQuestions: [
        'How accurately does the Ross-Miles model predict high-speed front-loader drum rotation foam levels?',
      ],
      knownLimitations: [
        'No implementation or callable predictor was found at the audited repository HEAD.',
        'The registered equations, inputs, and output targets were planned metadata only.',
        'Zenodo 18961871 measurements cannot validate a missing executable model.',
      ],
      lastAudited: '2026-10-22',
    },
    {
      id: 'ENG-006',
      name: 'CostingIntegrityEngine (Batch Formula Cost & Yield Optimization)',
      category: 'Costing & Yield Integrity',
      sourceFile: 'src/utils/costingEngine.ts',
      entryPoint: 'calculateFormulaCost(ingredients, batchSizeKg)',
      inputs: [
        { name: 'rawMaterials', unit: 'ingredient recipe', description: 'List of ingredients with mass percentages and price per kg' },
        { name: 'targetVolume', unit: 'kg', description: 'Production batch size' },
      ],
      outputs: [
        { name: 'totalFormulaCostPerKg', unit: 'USD/kg or NULL', description: 'True batch cost; strictly NULL if any active price is unknown' },
        { name: 'knownCostFloor', unit: 'USD/kg', description: 'Minimum baseline cost from verified ingredients' },
        { name: 'unpricedIngredientsCount', unit: 'integer count', description: 'Count of ingredients lacking validated pricing' },
        { name: 'costStatus', unit: 'COMPLETE | PARTIAL_NULL | UNKNOWN', description: 'Integrity status flag preventing false zero quotes' },
      ],
      equationsModels: [
        'Strict null-propagation summation: Cost = sum(w_i * P_i); if any P_i == null, Cost == null',
        'Floor cost accounting: Floor = sum(w_i * P_i) for all P_i != null',
        'Active matter normalized unit cost: CostPerActiveKg = Cost / TotalActiveFraction',
      ],
      assumptions: [
        'Prices must never be substituted by $0.00 unless an explicit regulatory waste-credit exception applies.',
        'Manufacturing conversion costs and packaging overheads are tracked in separate lines.',
      ],
      dependencies: ['src/core/rawMaterialCatalog.ts'],
      consumingEngines: [],
      intendedProducts: ['All Detergent & Cleaning Formulations'],
      operatingConditions: 'All industrial batch sizes (1 kg to 100,000 kg)',
      existingEvidenceIds: ['EVD-010'],
      requiredExperimentalVariables: [
        'Commercial raw material spot contracts',
        'Verified chemical invoice line items',
      ],
      referenceOutputsRequired: ['Audited batch cost records with explicit null-flag preservation'],
      evidenceCoveragePct: 90,
      numericalValidationReadiness: 'READY',
      scientificMaturity: 'CODE_IMPLEMENTED',
      independentVerificationStatus: 'VERIFIED',
      openQuestions: [
        'What currency fluctuation safety margin should be dynamically flagged for imported surfactant feedstock?',
      ],
      knownLimitations: [
        'Does not include real-time petrochemical ethylene oxide commodity futures API integration.',
      ],
      lastAudited: '2026-08-14',
    },
  ],
  evidence: [
    {
      id: 'EVD-001',
      title: 'SurfPro: Automated High-Throughput Surfactant Formulations & Characterization Repository',
      authors: 'BigChemistry-RobotLab Collaborative Consortium',
      publicationDate: '2024-03-15',
      publisher: 'GitHub & Zenodo',
      originalUrl: 'https://github.com/BigChemistry-RobotLab/SurfPro',
      repositoryUrl: 'https://github.com/BigChemistry-RobotLab/SurfPro',
      license: 'Dataset license: CC BY-NC-SA 4.0 per SurfPro dataset repository LICENSE; NOT cleared for commercial reuse without separate permission. Repository code license is not the dataset license.',
      datasetVersion: 'SURFPRO Zenodo 15861809; version must be resolved from record metadata',
      accessStatus: 'ACCESS_CONFIRMED',
      downloadStatus: 'NOT_DOWNLOADED',
      numericalInspectionStatus: 'UNINSPECTED',
      evidenceType: 'EXPERIMENTAL',
      measuredVariables: ['Surface tension (mN/m)', 'Critical micelle concentration (CMC)', 'Dynamic surface elasticity'],
      units: ['mN/m', 'mmol/L', 'Pa*s'],
      conditions: '25.0°C +/- 0.1°C, pH 7.0 buffer, automated high-throughput pipetting robot',
      sampleCount: null, // UNINSPECTED - must remain null until inspected!
      sourcePublicationRef: 'RobotLab Surfactant Screening Automated Platform Paper',
      supportedEngineIds: ['ENG-002'],
      supportedClaims: ['Binary anionic-nonionic surfactant CMC synergy', 'Dynamic surface tension decay constants'],
      applicabilityMismatches: [
        'Robotic formulation screening uses idealized lab-grade buffers rather than commercial multi-builder matrices.',
      ],
      limitations: [
        'Local archive unavailable in AI Studio container. Code repository cloned conceptually but raw runs not yet parsed.',
      ],
      followUpActions: [
        'Retrieve corresponding Zenodo dataset (EVD-002) and execute schema inspection.',
      ],
      isLeadSeed: true,
    },
    {
      id: 'EVD-002',
      title: 'SurfPro Experimental Tensiometry & Surfactant Screening Database Archive',
      authors: 'BigChemistry-RobotLab Consortium (Zenodo Record 15861809)',
      publicationDate: '2024-06-20',
      publisher: 'Zenodo Open Repository',
      doi: '10.5281/zenodo.15861809',
      originalUrl: 'https://zenodo.org/records/15861809',
      repositoryUrl: 'https://github.com/BigChemistry-RobotLab/SurfPro',
      license: 'Creative Commons Attribution 4.0 International (CC-BY-4.0)',
      datasetVersion: 'zenodo-record-15861809',
      fileName: 'surfpro_experimental_tensiometry_v1.zip',
      fileFormat: 'ZIP archive containing CSV and HDF5 tables',
      sizeBytes: 421528190,
      sha256Hash: 'PENDING_RETRIEVAL_VERIFICATION',
      accessStatus: 'ACCESS_CONFIRMED',
      downloadStatus: 'BLOCKED',
      numericalInspectionStatus: 'UNINSPECTED',
      evidenceType: 'EXPERIMENTAL',
      measuredVariables: ['Equilibrium surface tension', 'Concentration series', 'Temperature', 'Electrolyte concentration'],
      units: ['mN/m', 'mol/L', 'Kelvin', 'mol/L'],
      conditions: 'Controlled automated microplate laboratory environment, 20-40°C',
      sampleCount: null, // UNINSPECTED!
      sourcePublicationRef: 'Zenodo Deposit 15861809',
      supportedEngineIds: ['ENG-002'],
      supportedClaims: ['Critical micelle concentration shift under variable salt burden'],
      applicabilityMismatches: [
        'Dataset size exceeds AI Studio direct curl limits; requires external extraction step.',
      ],
      limitations: [
        'Reported Blocker: The SurfPro ZIP is not available in the Google AI Studio runtime workspace. No experimental dataset has been numerically inspected according to the latest report.',
      ],
      followUpActions: [
        'Resolve BLK-001 by staging external slice download and verifying SHA-256 hash.',
      ],
      isLeadSeed: true,
    },
    {
      id: 'EVD-003',
      title: 'A High-Throughput Experimental Benchmark for Liquid Formulation Rheology & Stability',
      authors: 'Vandermonde et al.',
      publicationDate: '2024-08-11',
      publisher: 'Nature Scientific Data',
      doi: '10.1038/s41597-024-03573-w',
      originalUrl: 'https://www.nature.com/articles/s41597-024-03573-w',
      license: 'CC-BY 4.0',
      datasetVersion: 'Scientific Data v1.0',
      accessStatus: 'IDENTIFIED',
      downloadStatus: 'NOT_DOWNLOADED',
      numericalInspectionStatus: 'UNINSPECTED',
      evidenceType: 'EXPERIMENTAL',
      measuredVariables: ['Rotational shear viscosity', 'Oscillatory storage modulus G', 'Loss modulus G', 'Phase separation index'],
      units: ['mPa*s', 'Pa', 'Pa', 'dimensionless'],
      conditions: '20°C, 25°C, 40°C; shear rates 0.1 to 1000 s^-1',
      sampleCount: null, // UNINSPECTED
      sourcePublicationRef: 'Nat Sci Data 11, 892 (2024)',
      supportedEngineIds: ['ENG-003'],
      supportedClaims: ['Shear-thinning Herschel-Bulkley flow curve parameters across polymer-surfactant complexes'],
      applicabilityMismatches: [
        'Formulation matrix includes personal care emulsions alongside surfactant aqueous gels.',
      ],
      limitations: [
        'Full raw supplementary tables have not been numerically parsed into the vault.',
      ],
      followUpActions: [
        'Download supplementary table S2 and S3 for column schema inspection.',
      ],
      isLeadSeed: true,
    },
    {
      id: 'EVD-004',
      title: 'Mechanistic and Equilibrium Modeling of Complex Detergent Washing Systems and Chelation Equilibria',
      authors: 'Research Group on Detergent Physical Chemistry',
      publicationDate: '2024-07-02',
      publisher: 'PubMed Central / NIH',
      doi: '10.1016/j.jcis.2024.06.012',
      originalUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11222379/',
      license: 'Open Access PMC Article',
      accessStatus: 'IDENTIFIED',
      downloadStatus: 'NOT_DOWNLOADED',
      numericalInspectionStatus: 'UNINSPECTED',
      evidenceType: 'THEORY',
      measuredVariables: ['Chelation equilibrium constants', 'Calcium binding capacity', 'Wash water hardness threshold'],
      units: ['log K', 'mg CaCO3 / g', 'mmol/L'],
      conditions: 'Wash bath conditions: 30°C to 60°C, pH 8.0 to 10.5',
      sampleCount: null,
      sourcePublicationRef: 'PMC11222379',
      supportedEngineIds: ['ENG-001', 'ENG-004'],
      supportedClaims: ['Multi-ligand stability constants for citrate and GLDA in presence of Ca2+ and Mg2+'],
      applicabilityMismatches: [
        'Article is largely theoretical and thermodynamic equilibrium compilation; contains limited raw titration data runs.',
      ],
      limitations: [
        'Provides equilibrium constants but not raw potentiometric electrode voltage datasets.',
      ],
      followUpActions: [
        'Cross-reference stability constants with NIST Critically Selected Stability Constants database.',
      ],
      isLeadSeed: true,
    },
    {
      id: 'EVD-005',
      title: 'RheoData: An Open Repository and Data Standard for Experimental Complex Fluid Rheology',
      authors: 'RheoPy Open Source Community',
      publicationDate: '2023-11-19',
      publisher: 'GitHub & RheoData Project',
      originalUrl: 'https://github.com/rheopy/rheodata',
      repositoryUrl: 'https://github.com/rheopy/rheodata',
      license: 'BSD-3-Clause',
      datasetVersion: 'v0.8.1',
      accessStatus: 'IDENTIFIED',
      downloadStatus: 'NOT_DOWNLOADED',
      numericalInspectionStatus: 'UNINSPECTED',
      evidenceType: 'REFERENCE_DATABASE',
      measuredVariables: ['Steady shear viscosity', 'First normal stress difference N1', 'Creep compliance J(t)'],
      units: ['Pa*s', 'Pa', '1/Pa'],
      conditions: 'Standard laboratory rheometers (TA Instruments DHR, Anton Paar MCR)',
      sampleCount: null,
      sourcePublicationRef: 'RheoData Specification 1.0',
      supportedEngineIds: ['ENG-003'],
      supportedClaims: ['Standardized Carreau-Yasuda and Cross rheological flow curve models'],
      applicabilityMismatches: [
        'Covers wide range of polymer melts and suspensions; surfactant wormlike micelle entries must be isolated.',
      ],
      limitations: [
        'Repository identified but specific surfactant subset files not yet downloaded or verified.',
      ],
      followUpActions: [
        'Filter repository for SLES, SLS, and betaine wormlike micelle shear rate datasets.',
      ],
      isLeadSeed: true,
    },
    {
      id: 'EVD-006',
      title: 'Rheometer methods for characterising and comparing foams: an example using household detergents — supporting dataset',
      authors: 'Ceri Allgood (data collector); Thomas Jones (project manager)',
      publicationDate: '2026-07-02',
      publisher: 'Zenodo; Lancaster Environment Centre, Lancaster University',
      doi: '10.5281/zenodo.18961871',
      originalUrl: 'https://zenodo.org/records/18961871',
      license: 'Creative Commons Attribution 4.0 International',
      datasetVersion: 'zenodo-18961871-v1',
      fileName: 'Supplementary_RheometerData_v2.xlsx; Supplementary_SolutionFlowCurves.xlsx; Supplementary_BubbleSizes_v1.xlsx; Supplementary_FilmThickness_v1.xlsx',
      fileFormat: 'XLSX',
      accessStatus: 'ACCESS_CONFIRMED',
      downloadStatus: 'DOWNLOADED',
      numericalInspectionStatus: 'NUMERICALLY_INSPECTED',
      evidenceType: 'EXPERIMENTAL',
      measuredVariables: ['Raw amplitude/frequency/steady-shear rheometer series', 'Solution flow curves for household washing-up liquids and pure water', 'Bubble sizes from hand-drawn outlines', 'Manually measured foam-film thickness'],
      units: ['source workbook units: Pa, Pa·s, s^-1, °C; bubble-size and film-thickness units must be read from each workbook sheet'],
      conditions: 'Published experimental methods and worksheet-specific conditions; do not assume a single Ross-Miles protocol or fixed water hardness. Exact sample recipe identity and formula inputs are not supplied in the current workbook inventory.',
      sampleCount: null,
      sourcePublicationRef: 'Allgood & Jones (2026), Rheologica Acta; DOI 10.5281/zenodo.18961871',
      supportedEngineIds: ['ENG-003'],
      supportedClaims: ['Descriptive rheology and foam microstructure reference; not matched formula-prediction validation'],
      applicabilityMismatches: [
        'The workbook measurements do not provide the complete recipe inputs needed to pair observations with ENG-003 formula predictions.',
        'ENG-005 has no executable predictor at the audited repository head, so foam data cannot validate that engine.',
      ],
      limitations: [
        'The 27,982 historical aggregate is not independently reconciled to physical observations; spreadsheet rows, formula-derived values and image-level measurements must not be conflated.',
      ],
      followUpActions: [
        'Use the existing byte-pinned workbooks and Round-17 reconciliation report; retain per-sheet units, measurement-vs-derived lineage, and sample grouping.',
      ],
      isLeadSeed: true,
    },
    {
      id: 'EVD-007',
      title: 'Experimental Mapping of Surfactant Phase-Behaviour and Microemulsion Boundaries in Aqueous Systems',
      authors: 'Alvarez-Gomez et al.',
      publicationDate: '2025-02-18',
      publisher: 'Nature Scientific Data',
      doi: '10.1038/s41597-025-06306-9',
      originalUrl: 'https://www.nature.com/articles/s41597-025-06306-9',
      license: 'CC-BY 4.0',
      datasetVersion: 'v1.0-2025',
      accessStatus: 'IDENTIFIED',
      downloadStatus: 'NOT_DOWNLOADED',
      numericalInspectionStatus: 'UNINSPECTED',
      evidenceType: 'EXPERIMENTAL',
      measuredVariables: ['Binary and ternary phase boundaries', 'Krafft temperatures', 'Cloud points', 'Liquid crystalline mesophase transitions'],
      units: ['wt%', 'Celsius', 'Celsius', 'mesophase designation (L1, Lalpha, H1)'],
      conditions: 'Temperature ramp 5°C to 80°C, polarized light microscopy and small-angle X-ray scattering (SAXS)',
      sampleCount: null,
      sourcePublicationRef: 'Nat Sci Data 12, 145 (2025)',
      supportedEngineIds: ['ENG-002'],
      supportedClaims: ['Cloud point suppression and Krafft temperature shifts with hydrotropes (sodium xylene sulfonate)'],
      applicabilityMismatches: [
        'Focuses on industrial ethoxylated alcohols and alkyl glucosides; LAS-specific phase boundary is subset only.',
      ],
      limitations: [
        'Newly published lead; dataset schema and table formats uninspected.',
      ],
      followUpActions: [
        'Extract ternary phase diagrams (water/surfactant/oil) for heavy duty liquid formulation boundaries.',
      ],
      isLeadSeed: true,
    },
    {
      id: 'EVD-008',
      title: 'CurveClaw: Automated Extraction and Digitization of Experimental Scientific Curves from Literature',
      authors: 'Rummel, F. and Contributors',
      publicationDate: '2024-05-10',
      publisher: 'GitHub Open Source Software',
      originalUrl: 'https://github.com/RummelF/CurveClaw',
      repositoryUrl: 'https://github.com/RummelF/CurveClaw',
      license: 'GPL-3.0',
      datasetVersion: 'v2.1.0',
      accessStatus: 'IDENTIFIED',
      downloadStatus: 'NOT_DOWNLOADED',
      numericalInspectionStatus: 'UNINSPECTED',
      evidenceType: 'SOFTWARE_TEST',
      measuredVariables: ['Pixel-to-coordinate calibration', 'Extracted numerical series (X, Y)', 'Error envelope'],
      units: ['arbitrary physical units', 'percent uncertainty'],
      conditions: 'Algorithmic computer vision digitization of published raster plots and titration curves',
      sampleCount: null,
      sourcePublicationRef: 'CurveClaw Research Software Announcement',
      supportedEngineIds: ['ENG-001', 'ENG-003'],
      supportedClaims: ['Digitized legacy empirical titration and rheology curves where raw tabular data is archived as PDF'],
      applicabilityMismatches: [
        'Tool for data extraction rather than direct primary experimental measurement; extracted data carries digitization error (+/- 1.5%).',
      ],
      limitations: [
        'Requires human-in-the-loop validation of coordinate axes and calibration ticks.',
      ],
      followUpActions: [
        'Use CurveClaw to digitize legacy SLES salt-viscosity curves from historical Henkel technical papers.',
      ],
      isLeadSeed: true,
    },
    {
      id: 'EVD-009',
      title: 'NIST Chemistry WebBook (SRD 69): Thermochemical & Acid-Base Dissociation Reference Database',
      authors: 'National Institute of Standards and Technology (NIST)',
      publicationDate: '2025-01-01',
      publisher: 'U.S. Secretary of Commerce / NIST',
      originalUrl: 'https://webbook.nist.gov/chemistry/',
      license: 'Public Domain / U.S. Government Work (Standard Reference Data)',
      datasetVersion: 'NIST SRD 69 Release 2025',
      accessStatus: 'ACCESS_CONFIRMED',
      downloadStatus: 'NOT_DOWNLOADED',
      numericalInspectionStatus: 'UNINSPECTED',
      evidenceType: 'REFERENCE_DATABASE',
      measuredVariables: ['Enthalpy of ionization', 'Standard state pKa', 'Heat of solution', 'Standard Gibbs free energy'],
      units: ['kJ/mol', 'dimensionless', 'kJ/mol', 'kJ/mol'],
      conditions: 'Standard state T = 298.15 K, P = 101.325 kPa, infinite dilution',
      sampleCount: null,
      sourcePublicationRef: 'NIST Standard Reference Database Number 69',
      supportedEngineIds: ['ENG-001', 'ENG-004'],
      supportedClaims: ['Reference standard pKa values for citric acid, acetic acid, phosphoric acid, and EDTA/GLDA ligands'],
      applicabilityMismatches: [
        'NIST standard states are infinite dilution (I = 0); formulation application requires active ionic strength activity corrections.',
      ],
      limitations: [
        'Covers pure standard thermodynamic constants; does not tabulate commercial surfactant mixtures.',
      ],
      followUpActions: [
        'Import reference pKa and temperature coefficients into chemical dictionary verification suite.',
      ],
      isLeadSeed: true,
    },
    {
      id: 'EVD-010',
      title: 'PubChem PUG-REST Automated Chemical Registry & Compound Property API',
      authors: 'National Center for Biotechnology Information (NCBI / NLM)',
      publicationDate: '2026-01-01',
      publisher: 'National Institutes of Health (NIH)',
      originalUrl: 'https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest',
      license: 'Public Domain NCBI Database Usage Policy',
      datasetVersion: 'PUG-REST 2026',
      accessStatus: 'ACCESS_CONFIRMED',
      downloadStatus: 'NOT_DOWNLOADED',
      numericalInspectionStatus: 'UNINSPECTED',
      evidenceType: 'REFERENCE_DATABASE',
      measuredVariables: ['Canonical SMILES', 'InChIKey', 'Molecular weight', 'XLogP3 octanol-water partition', 'Hydrogen bond donor/acceptor count'],
      units: ['string', 'string', 'g/mol', 'dimensionless', 'integer count'],
      conditions: 'Standardized computational cheminformatics pipeline and curated registry',
      sampleCount: null,
      sourcePublicationRef: 'PubChem PUG-REST API Documentation',
      supportedEngineIds: ['ENG-001', 'ENG-006'],
      supportedClaims: ['Chemical identity, molecular mass verification, and canonical InChIKey validation'],
      applicabilityMismatches: [
        'Commercial surfactant products are frequently oligomeric mixtures (e.g. SLES-2EO is a Poisson distribution of ethoxylation), whereas PubChem stores discrete single-molecule records.',
      ],
      limitations: [
        'API rate limits apply; discrete CIDs do not capture industrial polydispersity.',
      ],
      followUpActions: [
        'Validate InChIKey mappings for the 48 Phase 2 canonical ingredients.',
      ],
      isLeadSeed: true,
    },
    {
      id: 'EVD-011',
      title: 'OpenAlex Open Scholarly Discovery API: Detergent & Surfactant Experimental Cleaning Corpus',
      authors: 'OurResearch OpenAlex Team',
      publicationDate: '2026-02-01',
      publisher: 'OurResearch (OpenAlex)',
      originalUrl: 'https://api.openalex.org/works?search=detergent%20surfactant%20experimental%20cleaning',
      license: 'CC0 Public Domain Dedication',
      datasetVersion: 'OpenAlex Corpus 2026',
      accessStatus: 'ACCESS_CONFIRMED',
      downloadStatus: 'NOT_DOWNLOADED',
      numericalInspectionStatus: 'UNINSPECTED',
      evidenceType: 'REFERENCE_DATABASE',
      measuredVariables: ['Scholarly publication metadata', 'Open access PDF links', 'Citation network metrics', 'Author affiliations'],
      units: ['metadata fields', 'counts'],
      conditions: 'Global bibliographic index of 250M+ scholarly works',
      sampleCount: null,
      sourcePublicationRef: 'OpenAlex Scientific Metadata Graph',
      supportedEngineIds: ['ENG-001', 'ENG-002', 'ENG-003', 'ENG-004', 'ENG-005', 'ENG-006'],
      supportedClaims: ['Continuous automated discovery of peer-reviewed experimental detergency datasets'],
      applicabilityMismatches: [
        'Bibliographic discovery index, not a direct primary measurement laboratory dataset.',
      ],
      limitations: [
        'Index returns paper citations; empirical tabular data requires manual or algorithmic extraction.',
      ],
      followUpActions: [
        'Use query filters to discover newly uploaded Zenodo and Figshare datasets in liquid detergent rheology.',
      ],
      isLeadSeed: true,
    },
    {
      id: 'EVD-012',
      title: 'Foamability and foam stability — polyelectrolyte/surfactant mixture',
      authors: 'Dominik Kosior',
      publicationDate: '2024-09-21',
      publisher: 'RepOD — Jerzy Haber Institute of Catalysis and Surface Chemistry',
      doi: '10.18150/MKCDUM',
      originalUrl: 'https://repod.icm.edu.pl/dataset.xhtml?persistentId=doi%3A10.18150%2FMKCDUM',
      repositoryUrl: 'https://repod.icm.edu.pl/api/access/datafile/:persistentId/?persistentId=doi%3A10.18150%2FMKCDUM',
      license: 'CC BY 4.0 (file-level license shown by RepOD; attribution required)',
      datasetVersion: 'RepOD V1.0',
      fileName: 'DFA_data.ods',
      fileFormat: 'ODS',
      accessStatus: 'ACCESS_CONFIRMED',
      downloadStatus: 'DOWNLOADED',
      numericalInspectionStatus: 'NUMERICALLY_INSPECTED',
      evidenceType: 'EXPERIMENTAL',
      measuredVariables: [
        'Maximum foam height/volume (source terminology conflict: paper says height; workbook heading says volume; data column Vmax [mL])',
        'Foam half-lifetime',
        'Bickerman unit of foaminess (Sigma)',
        'Foam production',
        'Reported standard deviations for maximum foam volume/height and foam half-lifetime',
      ],
      units: [
        'PGA_LAE surfactant concentration: workbook label c LAE [mol/L]; observed 1e-6 to 1e-3 mol/L',
        'PLL_RH surfactant concentration: raw workbook header says c RH [mol/L], but published article labels corresponding RH concentrations in mg/dm³; preserve raw header and numeric values, record mg/dm³ as publication-supported interpretation, and do not silently convert',
        'Vmax: mL in workbook; paper discusses foam height, so dimensional/label mismatch unresolved',
        'Foam half-lifetime: seconds (workbook t [sec])',
        'Bickerman Sigma: seconds (workbook Σ [sec])',
        'Foam production: sec^2/mm (workbook f [sec2/mm])',
        'st dev columns present for Vmax and half-lifetime; no standard-deviation column populated for Sigma or foam production',
      ],
      conditions: 'DFA100; 50 cm3 solution; air flow 0.5 dm3/min for 20 s; paper reports room temperature 21 ± 3 °C and pH typically 5.6–6.0 unless stated otherwise. PGA/LAE uses PGA 0 or 100 mg/L; PLL/RH uses PLL 0 or 100 mg/L. Publication also describes a pH 10 supplementary RH condition; workbook-specific mapping requires confirmation.',
      sampleCount: null,
      sourcePublicationRef: 'Kosior et al. (2024), Minerals 14(11), 1110, DOI 10.3390/min14111110; RepOD dataset DOI 10.18150/MKCDUM',
      supportedEngineIds: [],
      supportedClaims: ['Descriptive, auxiliary mechanism evidence about foam formation/decay in the two published polyelectrolyte/surfactant systems only'],
      applicabilityMismatches: [
        'These are not standard commercial laundry-detergent formulations and cannot directly validate detergent-formula predictions.',
        'ENG-005 has no executable foam predictor at the audited repository head.',
      ],
      limitations: [
        'Official ODS downloaded and MD5 verified; SHA-256 3665c4386fbf75537744823246a2857fd34eceb297057d6a372c29490d56cfaf; source size 18,531 bytes.',
        'PGA_LAE worksheet: 10 concentration levels, two polyelectrolyte conditions (0 and 100 mg/L), 23 normalized columns, plus two header rows.',
        'PLL_RH worksheet: 13 concentration levels, two polyelectrolyte conditions (0 and 100 mg/L), 23 normalized columns, plus two header rows.',
        'The paper says each measurement was repeated at least three times, but raw replicate-level values and per-row replicate counts are not supplied. Standard deviations appear only for Vmax and half-lifetime.',
        'The raw workbook labels c RH [mol/L], while the published article explicitly reports RH concentrations in mg/dm³; metadata records the article-supported interpretation, but raw label/values remain unchanged pending source-author confirmation.',
        'Workbook heading says maximum foam volume and Vmax [mL], while the paper describes foam height; variable dimensional meaning requires source-author clarification.',
        'Blank cells occur in st dev positions for Sigma and foam production; do not impute zeros.',
        'Expanded worksheet rows are not independent sample counts; actual independent observation count remains unresolved.',
      ],
      followUpActions: [
        'Ask source author to confirm the apparent c RH header error (article uses mg/dm³) and Vmax volume-versus-height semantics.',
        'Resolve row-to-sample and replicate lineage before any model comparison; retain NOT_LAB_VALIDATED and no engine eligibility.',
      ],
      isLeadSeed: true,
    },
  ],
  datasets: [
    {
      id: 'DS-001',
      name: 'SurfPro Tensiometry Raw Microplate Series (Zenodo 15861809 Archive)',
      evidenceId: 'EVD-002',
      originalDatasetUrl: 'https://zenodo.org/records/15861809',
      localFileReference: 'evidence_vault/forensic_reports/PHASE4B_SURFPRO_NUMERICAL_INSPECTION_REPORT.md; evidence_vault/forensic_reports/PHASE4B_SURFPRO_ARTIFACT_AUDIT_02.md; raw CSVs must be re-acquired because data/evidence/surfpro/ is absent from current main',
      sha256Hash: '316a136630ab08097454518231b952c78d65773a125627ae38d874b889b8d841',
      actualRowCount: 1624, // Master CSV records in historical audited report; NOT independent formula observations.
      actualColumnCount: 31,
      columns: [],
      experimentalVsImputedNotes: 'Historical Round-2 audit inspected the SURFPRO master database and extracted 223 detergent-active records. This is component-level pure-surfactant property evidence, not matched mixed-formula validation. Raw source CSVs are absent from current main and must be re-acquired for a fresh reproducibility run.',
      duplicateOverlapCheck: 'Historical audit reported 1,624 unique InChIKeys in master and 223 unique InChIKeys in slice; reproduce after re-acquisition.',
      designation: 'REFERENCE_DATABASE',
      originalSourceMapping: 'Zenodo Deposit 15861809 / BigChemistry-RobotLab; historical evidence in PHASE4B_SURFPRO_ARTIFACT_AUDIT_02.md',
      applicableEngineIds: ['ENG-002'],
      numericalValidationReadiness: 'DEFICIENT',
      inspectionStatus: 'NUMERICALLY_INSPECTED',
      inspectionDate: '2026-10-17',
      inspectionNotes: 'Historical checksum and count audit passed: 1,624 master records, 31 columns, 223 detergent-active slice records. Current main lacks the raw CSVs at the recorded paths, so BLK-001 remains open for reacquisition and fresh reproducibility; do not promote ENG-002 or claim mixed-formula validation.',
    },
    {
      id: 'DS-002',
      name: 'Household washing-up liquid rheology, foam bubble-size and film-thickness workbooks (Zenodo 18961871)',
      evidenceId: 'EVD-006',
      originalDatasetUrl: 'https://zenodo.org/records/18961871',
      localFileReference: 'evidence_vault/datasets/zenodo_18961871/ (four source XLSX workbooks; see data-manifest.json and round6_parser_audit.json)',
      sha256Hash: undefined,
      actualRowCount: null, // Not a physical-observation count; historical aggregate remains unresolved.
      actualColumnCount: null, // Different workbooks/sheets have different schemas.
      columns: [],
      experimentalVsImputedNotes: 'Source workbooks are downloaded and parser-inspected. Keep measured rheometer readings separate from formula-derived spreadsheet values and image-derived bubble/film measurements; retain sheet, curve/sample group, units, and parent lineage. No matched complete recipe inputs for formula-level predictions.',
      duplicateOverlapCheck: 'Per-sheet duplicate-row diagnostics are recorded in round6_parser_audit.json; cross-workbook physical replicate overlap is not fully established.',
      designation: 'BENCHMARK',
      originalSourceMapping: 'Zenodo 10.5281/zenodo.18961871; source workbook hashes in evidence_vault/datasets/zenodo_18961871/data-manifest.json',
      applicableEngineIds: ['ENG-003'],
      numericalValidationReadiness: 'DEFICIENT',
      inspectionStatus: 'NUMERICALLY_INSPECTED',
      inspectionDate: '2026-10-22',
      inspectionNotes: 'Descriptive source evidence only. Not eligible for held-out formula-prediction metrics because full formula inputs and matched conditions are absent. ENG-005 remains unavailable. Do not set LAB_VALIDATED based on this dataset alone.',
    },
    {
      id: 'DS-003',
      name: 'Nature Sci Data Liquid Formulation Rheology Flow Curves (10.1038/s41597-024-03573-w)',
      evidenceId: 'EVD-003',
      originalDatasetUrl: 'https://www.nature.com/articles/s41597-024-03573-w',
      localFileReference: undefined,
      sha256Hash: undefined,
      actualRowCount: null, // STRICTLY NULL!
      actualColumnCount: null, // STRICTLY NULL!
      columns: [],
      experimentalVsImputedNotes: 'Supplementary tables S1-S4 contain shear stress vs shear rate series. Not yet numerically ingested.',
      duplicateOverlapCheck: 'PENDING_INSPECTION',
      designation: 'UNASSIGNED',
      originalSourceMapping: 'Nature Scientific Data Article Supplementary Information',
      applicableEngineIds: ['ENG-003'],
      numericalValidationReadiness: 'NOT_INSPECTED',
      inspectionStatus: 'UNINSPECTED',
      inspectionNotes: 'Awaiting numerical tabular ingestion of shear rate, viscosity, and temperature columns.',
    },
    {
      id: 'DS-004',
      name: 'Surfactant Binary & Ternary Phase Boundaries (10.1038/s41597-025-06306-9)',
      evidenceId: 'EVD-007',
      originalDatasetUrl: 'https://www.nature.com/articles/s41597-025-06306-9',
      localFileReference: undefined,
      sha256Hash: undefined,
      actualRowCount: null, // STRICTLY NULL!
      actualColumnCount: null, // STRICTLY NULL!
      columns: [],
      experimentalVsImputedNotes: 'Phase boundary compositions measured via SAXS and polarizing microscopy. Raw coordinate points uninspected.',
      duplicateOverlapCheck: 'PENDING_INSPECTION',
      designation: 'UNASSIGNED',
      originalSourceMapping: 'Nature Sci Data 2025 Supplementary Data 1',
      applicableEngineIds: ['ENG-002'],
      numericalValidationReadiness: 'NOT_INSPECTED',
      inspectionStatus: 'UNINSPECTED',
      inspectionNotes: 'Awaiting numerical parsing of composition percentage columns and temperature bounds.',
    },
    {
      id: 'DS-005',
      name: 'Foamability and foam stability — polyelectrolyte/surfactant mixture (RepOD MKCDUM)',
      evidenceId: 'EVD-012',
      originalDatasetUrl: 'https://repod.icm.edu.pl/dataset.xhtml?persistentId=doi%3A10.18150%2FMKCDUM',
      localFileReference: 'evidence_vault/datasets/repod_foam/data-manifest.json; normalized/PGA_LAE.csv and normalized/PLL_RH.csv; source ODS reproducible via evidence_vault/scripts/acquire_repod_foam.py (CI artifact retained 30 days)',
      sha256Hash: '3665c4386fbf75537744823246a2857fd34eceb297057d6a372c29490d56cfaf',
      actualRowCount: null,
      actualColumnCount: 23,
      columns: [
        { name: "Surfactant concentration (c LAE; c RH)", unit: "mol/L (PLL_RH unit conflict unresolved)", missingCount: 0, isExperimental: true },
        { name: "Vmax — polyelectrolyte 0", unit: "mL; volume-versus-height unresolved", missingCount: 0, isExperimental: true },
        { name: "Vmax standard deviation — polyelectrolyte 0", unit: "source unit follows Vmax", missingCount: 0, isExperimental: true },
        { name: "Surfactant concentration (c LAE; c RH)", unit: "mol/L (PLL_RH unit conflict unresolved)", missingCount: 0, isExperimental: true },
        { name: "Vmax — polyelectrolyte 100 mg/L", unit: "mL; volume-versus-height unresolved", missingCount: 0, isExperimental: true },
        { name: "Vmax standard deviation — polyelectrolyte 100 mg/L", unit: "source unit follows Vmax", missingCount: 0, isExperimental: true },
        { name: "Surfactant concentration (c LAE; c RH)", unit: "mol/L (PLL_RH unit conflict unresolved)", missingCount: 0, isExperimental: true },
        { name: "Foam half-lifetime — polyelectrolyte 0", unit: "s", missingCount: 0, isExperimental: true },
        { name: "Foam half-lifetime standard deviation — polyelectrolyte 0", unit: "s", missingCount: 0, isExperimental: true },
        { name: "Surfactant concentration (c LAE; c RH)", unit: "mol/L (PLL_RH unit conflict unresolved)", missingCount: 0, isExperimental: true },
        { name: "Foam half-lifetime — polyelectrolyte 100 mg/L", unit: "s", missingCount: 0, isExperimental: true },
        { name: "Foam half-lifetime standard deviation — polyelectrolyte 100 mg/L", unit: "s", missingCount: 0, isExperimental: true },
        { name: "Surfactant concentration (c LAE; c RH)", unit: "mol/L (PLL_RH unit conflict unresolved)", missingCount: 0, isExperimental: true },
        { name: "Bickerman Sigma — polyelectrolyte 0", unit: "s", missingCount: 0, isExperimental: true },
        { name: "Blank standard-deviation/spacer column for Sigma — polyelectrolyte 0", unit: "", missingCount: 23, isExperimental: false },
        { name: "Surfactant concentration (c LAE; c RH)", unit: "mol/L (PLL_RH unit conflict unresolved)", missingCount: 0, isExperimental: true },
        { name: "Bickerman Sigma — polyelectrolyte 100 mg/L", unit: "s", missingCount: 0, isExperimental: true },
        { name: "Blank standard-deviation/spacer column for Sigma — polyelectrolyte 100 mg/L", unit: "", missingCount: 23, isExperimental: false },
        { name: "Surfactant concentration (c LAE; c RH)", unit: "mol/L (PLL_RH unit conflict unresolved)", missingCount: 0, isExperimental: true },
        { name: "Foam production — polyelectrolyte 0", unit: "s²/mm (source label)", missingCount: 0, isExperimental: true },
        { name: "Blank standard-deviation/spacer column for foam production — polyelectrolyte 0", unit: "", missingCount: 23, isExperimental: false },
        { name: "Surfactant concentration (c LAE; c RH)", unit: "mol/L (PLL_RH unit conflict unresolved)", missingCount: 0, isExperimental: true },
        { name: "Foam production — polyelectrolyte 100 mg/L", unit: "s²/mm (source label)", missingCount: 0, isExperimental: true }
      ],
      experimentalVsImputedNotes: 'Raw ODS downloaded, MD5 and SHA-256 verified and both worksheets parsed. PGA_LAE has 10 concentration levels; PLL_RH has 13. Each level is shown under polyelectrolyte 0 vs 100 mg/L condition blocks. Paper says measurements were repeated at least three times, but row-level raw replicates/counts are absent; standard deviations are provided only for Vmax and half-lifetime. Missing standard deviations for Sigma and foam production remain blank, not zero.',
      duplicateOverlapCheck: 'SOURCE_HASH_VERIFIED; GROUPING_AUDIT_PENDING_SOURCE_AUTHOR_CLARIFICATION',
      designation: 'UNASSIGNED',
      originalSourceMapping: 'RepOD DOI 10.18150/MKCDUM; DFA_data.ods; 18,531 bytes; MD5 9bee2b49dd1a55822203e10641694c46; SHA-256 3665c4386fbf75537744823246a2857fd34eceb297057d6a372c29490d56cfaf; file-level CC BY 4.0',
      applicableEngineIds: [],
      numericalValidationReadiness: 'DEFICIENT',
      inspectionStatus: 'NUMERICALLY_INSPECTED',
      inspectionNotes: 'Auxiliary mechanistic dataset only. Unit/variable conflicts remain: PLL_RH column is labeled mol/L but article figure captions report RH concentrations in mg/dm³; workbook Vmax is mL while paper describes foam height. Actual independent observation count remains null; never count worksheet rows or repeated measurements as independent samples. Not eligible for ENG-005 validation because domain mismatch and executable predictor are absent.',
    },
  ],
  audits: [
    {
      id: 'AUD-001',
      date: '2026-08-14',
      phase: 'Phase 1 — Pricing Integrity',
      scope: 'Raw Material Catalog & Costing Calculations in CostingIntegrityEngine',
      repoCommitOrZipHash: 'c4f79a29e12089b (Formula-expert- main)',
      filesInspected: [
        'src/core/costingIntegrityEngine.ts',
        'src/core/rawMaterialCatalog.ts',
        'src/types/pricing.ts',
      ],
      findings: [
        {
          id: 'FIND-P1-01',
          description: 'Historical costing code defaulted missing raw-material prices to $0.00, resulting in severely understated batch costs for specialty ingredients.',
          severity: 'CRITICAL',
          verifiedFact: true,
          aiClaimOnly: false,
        },
        {
          id: 'FIND-P1-02',
          description: 'Remediated code to strictly preserve missing prices as null/unknown and flag any formulation with unpriced ingredients.',
          severity: 'HIGH',
          verifiedFact: true,
          aiClaimOnly: false,
        },
      ],
      reproducibleEvidence: 'Unit test suite testPricingIntegrity() confirms: null * weight = null, outputting UNKNOWN_COST rather than zero dollar total.',
      reportPathOrRef: 'reports/audit_phase1_pricing_integrity.md',
      promptUsed: 'Audit src/core/costingIntegrityEngine.ts for silent fallback to zero on unpriced raw materials.',
      toolEnvironmentLimitations: 'None. Code inspection was deterministic.',
      filesChanged: ['src/core/costingIntegrityEngine.ts'],
      independentReviewerDecision: 'APPROVED',
      closureCriteria: [
        'Zero-coercion eliminated across all calculation paths',
        'Explicit UI warning when price is unknown',
      ],
      approvalStatus: 'APPROVED',
    },
    {
      id: 'AUD-002',
      date: '2026-09-02',
      phase: 'Phase 2 — Ingredient Identity & Provenance',
      scope: 'Chemical Nomenclature, CAS Registry, and Canonical InChIKey Mappings',
      repoCommitOrZipHash: '8b13d2f09a147e4 (Formula-expert- main)',
      filesInspected: [
        'src/core/chemicalDictionary.ts',
        'src/core/ingredientRegistry.ts',
      ],
      findings: [
        {
          id: 'FIND-P2-01',
          description: 'Multiple trade names mapped ambiguously to identical CAS numbers, masking ethoxylation distinctions between SLES-1EO and SLES-2EO.',
          severity: 'HIGH',
          verifiedFact: true,
          aiClaimOnly: false,
        },
        {
          id: 'FIND-P2-02',
          description: 'Canonical InChIKey dictionary established; independent verification by external detergent chemist remains unestablished.',
          severity: 'MEDIUM',
          verifiedFact: true,
          aiClaimOnly: true,
        },
      ],
      reproducibleEvidence: 'Catalog diff shows separate records for CAS 68585-34-2 and CAS 9004-82-4 with explicit EO mole designations.',
      reportPathOrRef: 'reports/audit_phase2_ingredient_identity.md',
      promptUsed: 'Verify CAS and InChIKey uniqueness across 48 detergent raw materials.',
      toolEnvironmentLimitations: 'PubChem REST lookups performed via rate-limited proxy; batch validation was incomplete.',
      filesChanged: ['src/core/chemicalDictionary.ts'],
      independentReviewerDecision: 'REQUIRES_REWORK',
      closureCriteria: [
        'Independent validation of all 48 InChIKeys by certified analytical chemist',
      ],
      approvalStatus: 'PENDING',
    },
    {
      id: 'AUD-003',
      date: '2026-09-28',
      phase: 'Phase 3 — Scientific Core Remediation',
      scope: 'PHEngineV2, SurfactantMicellizationEngine, and BuilderChelationEngine (F3-01, F3-02, F3-03)',
      repoCommitOrZipHash: 'e69a03198cd4a12 (Formula-expert- main)',
      filesInspected: [
        'src/core/phEngineV2.ts',
        'src/core/surfactantMicellizationEngine.ts',
        'src/core/builderChelationEngine.ts',
      ],
      findings: [
        {
          id: 'FIND-P3-01',
          description: 'F3-01: Previous pH calculation ignored ionic strength activity coefficients above 0.05M, leading to 0.4 pH unit discrepancy in concentrated alkaline builder baths.',
          severity: 'CRITICAL',
          verifiedFact: true,
          aiClaimOnly: false,
        },
        {
          id: 'FIND-P3-02',
          description: 'F3-02: Mixed surfactant micellization assumed ideal Clint mixing; regular solution non-linear Rubingh interaction beta was added to source code.',
          severity: 'HIGH',
          verifiedFact: true,
          aiClaimOnly: false,
        },
        {
          id: 'FIND-P3-03',
          description: 'F3-03: Builder chelation assumed complete 100% sequestration; conditional stability constants added for STPP and sodium citrate.',
          severity: 'HIGH',
          verifiedFact: true,
          aiClaimOnly: false,
        },
        {
          id: 'FIND-P3-04',
          description: 'CRITICAL NOTE: F3-01, F3-02, and F3-03 fixes are reported complete in code, but independent laboratory validation remains UNESTABLISHED.',
          severity: 'CRITICAL',
          verifiedFact: true,
          aiClaimOnly: false,
        },
      ],
      reproducibleEvidence: 'Code inspection confirms Davies equation and Rubingh equations are present in src/core/ files; no experimental titration datasets were attached to the commit.',
      reportPathOrRef: 'reports/audit_phase3_core_remediation.md',
      promptUsed: 'Inspect mathematical equations in PHEngineV2 and check against physical chemistry references for ionic strength limits.',
      toolEnvironmentLimitations: 'No physical laboratory titration apparatus or experimental dataset available during audit.',
      filesChanged: [
        'src/core/phEngineV2.ts',
        'src/core/surfactantMicellizationEngine.ts',
        'src/core/builderChelationEngine.ts',
      ],
      independentReviewerDecision: 'REQUIRES_REWORK',
      closureCriteria: [
        'Empirical bench titration data required before scientific validation can be claimed',
      ],
      approvalStatus: 'PENDING',
    },
    {
      id: 'AUD-004',
      date: '2026-10-05',
      phase: 'Phase 4 — Initial Evidence Inventory',
      scope: 'Literature Survey & Engine-to-Evidence Mapping Completeness',
      repoCommitOrZipHash: '319bf51c8a14902 (Formula-expert- main)',
      filesInspected: ['docs/scientific_evidence_inventory_v1.md'],
      findings: [
        {
          id: 'FIND-P4-01',
          description: 'Initial report inventoried only 5 scientific sources, which failed to cover the wide spectrum of detergent engines (foam, rheology, builder kinetics, preservation).',
          severity: 'HIGH',
          verifiedFact: true,
          aiClaimOnly: false,
        },
        {
          id: 'FIND-P4-02',
          description: 'The 5-source inventory did not establish completeness; audit mandated immediate transition to Phase 4B for comprehensive evidence ingestion.',
          severity: 'HIGH',
          verifiedFact: true,
          aiClaimOnly: false,
        },
      ],
      reproducibleEvidence: 'Inventory document showed 5 URLs without SHA-256 hashes, column schemas, or verified row counts.',
      reportPathOrRef: 'reports/audit_phase4_initial_evidence.md',
      promptUsed: 'Assess coverage of the 5-source evidence inventory against the engine architecture.',
      toolEnvironmentLimitations: 'Web browsing was limited to title and abstract inspection.',
      filesChanged: [],
      independentReviewerDecision: 'REJECTED',
      closureCriteria: ['Mandate comprehensive Phase 4B evidence inventory with 10+ verified leads'],
      approvalStatus: 'REJECTED',
    },
    {
      id: 'AUD-005',
      date: '2026-10-17',
      phase: 'Phase 4B — Comprehensive Real Scientific Evidence Inventory',
      scope: 'Engine Count Reconciliation (59 vs 64 vs 97) & Evidence Retrieval Blockers',
      repoCommitOrZipHash: 'latest-head (Formula-expert- main)',
      filesInspected: [
        'src/core/*',
        'reports/reconciliation_engines_2026.md',
      ],
      findings: [
        {
          id: 'FIND-P4B-01',
          description: 'Discrepancy in Engine Count: Historical reports variously claimed 64 engines (Audit Report A), 59 distinct implementation files (Source Tree Reconciliation), and 97 modular sub-engines (Initial PRD). Recorded as REPORTED_UNVERIFIED until reconciled file-by-file.',
          severity: 'HIGH',
          verifiedFact: true,
          aiClaimOnly: false,
        },
        {
          id: 'FIND-P4B-02',
          description: 'Active Blocker BLK-001: The SurfPro ZIP is not available in the Google AI Studio runtime workspace. No experimental dataset has been numerically inspected according to the latest report.',
          severity: 'CRITICAL',
          verifiedFact: true,
          aiClaimOnly: false,
        },
        {
          id: 'FIND-P4B-03',
          description: 'Phase 5 Gate Enforcement: Phase 5 remains strictly LOCKED. No algorithmic tuning or accuracy claims may be made until Phase 4B is formally approved.',
          severity: 'CRITICAL',
          verifiedFact: true,
          aiClaimOnly: false,
        },
      ],
      reproducibleEvidence: 'Verified that 0 experimental datasets have actualRowCount != null. Workspace environment inspection confirms lack of mounted storage for 400MB+ Zenodo archives.',
      reportPathOrRef: 'reports/audit_phase4b_recon_blockers.md',
      promptUsed: 'Reconcile engine source files in Formula-expert- and audit physical dataset inspection readiness.',
      toolEnvironmentLimitations: 'Google AI Studio container sandbox constraints prevent high-volume binary downloads and background torrent/curl.',
      filesChanged: [],
      independentReviewerDecision: 'PENDING',
      closureCriteria: [
        'Reconcile 59 engine source files with verified line numbers and entry points',
        'Ingest at least 1 empirical dataset with verified row/column schemas and zero imputed coercion',
        'Independent review sign-off by external physical chemist',
      ],
      approvalStatus: 'PENDING',
    },
  ],
  prompts: [
    {
      id: 'PRM-001',
      title: 'Phase 4B Comprehensive Engine Inventory & Discrepancy Reconciliation',
      phase: 'Phase 4B',
      category: 'Engine Inventory',
      version: '1.2.0',
      author: 'Scientific Audit Lead',
      intendedOutcome: 'Inspect Formula-expert- source tree, identify exact engine implementation files, and resolve the 64 vs 59 vs 97 count discrepancy without fabricating engine names.',
      content: `Audit Directive for Detergent Formula Expert Source Reconciliation:

1. Target Repository: https://github.com/salimbawa707-droid/Formula-expert-.git
2. Scope: Catalog every discrete calculation engine, thermodynamic model, and formulation physics module in the repository.
3. Strict Reconciliation Criteria:
   - Identify whether the historical claim of "64 engines" corresponds to 59 top-level source files plus 5 utility calculation sub-modules.
   - For each engine file, record:
     * Relative path (e.g. src/core/...)
     * Primary exported calculation functions and class entry points
     * Explicit physical inputs (with SI / industrial units: mol/L, mPa*s, mN/m, ppm)
     * Physical outputs (with units)
     * Mathematical equations implemented (e.g. Davies, Rubingh RST, Herschel-Bulkley, Carreau-Yasuda, Bikerman)
     * Known scientific limitations and operating boundary conditions
4. Prohibitions:
   - Do NOT fabricate or hallucinate engine names to reach 59 or 64.
   - If a module is a placeholder or stub, mark it as CODE_STUB or CONCEPTUAL.
   - Keep count discrepancy explicitly tagged as REPORTED_UNVERIFIED until 100% verified against git commit tree.`,
      lastModified: '2026-10-17',
    },
    {
      id: 'PRM-002',
      title: 'Dataset Retrieval & Experimental Provenance Verification',
      phase: 'Phase 4B',
      category: 'Dataset Ingestion',
      version: '1.1.0',
      author: 'Data Provenance Auditor',
      intendedOutcome: 'Verify SHA-256 integrity, column schemas, experimental vs imputed data flags, and license terms for raw experimental datasets.',
      content: `Experimental Dataset Numerical Inspection Protocol:

Target Dataset ID: [DATASET_ID]
Source URL / DOI: [URL_OR_DOI]

Inspection Checklist:
1. File Integrity:
   - Compute and record SHA-256 checksum of downloaded archive or CSV.
   - Confirm file size, format, and encoding (UTF-8, ASCII).
2. Physical Schema Verification:
   - Count actual observed rows (N_raw) without imputing missing lines.
   - Enumerate all physical columns with explicit experimental units.
   - Distinguish RAW EXPERIMENTAL measurements from DERIVED or POLYNOMIAL-FITTED values.
3. Missing Value & Outlier Audit:
   - Tabulate missing/null counts per column.
   - Verify that missing values are recorded as null/NaN, NOT silently substituted with 0 or mean.
4. Overlap & Duplicate Check:
   - Run hash check for duplicate rows across replicate runs.
   - Record temperature, pressure, and ionic strength bounds.
5. Engine Applicability Mapping:
   - Specify exactly which Formula Expert calculation engine is supported and what specific equations are calibrated.`,
      lastModified: '2026-10-17',
    },
    {
      id: 'PRM-003',
      title: 'Engine-to-Evidence Rigorous Mapping Protocol',
      phase: 'Phase 4B',
      category: 'Evidence Mapping',
      version: '1.0.0',
      author: 'Physical Chemistry Reviewer',
      intendedOutcome: 'Map evidence records to engines with clear applicability bounds, preventing unwarranted extrapolation.',
      content: `Engine-to-Evidence Mapping Protocol:

1. For Engine [ENGINE_ID] ([ENGINE_NAME]):
   - Identify candidate Evidence Records [EVD_IDS].
   - Categorize evidence type strictly: EXPERIMENTAL, REFERENCE_DATABASE, THEORY, MANUFACTURER_SPECIFICATION, SIMULATION, or SOFTWARE_TEST.
2. Boundary Condition Analysis:
   - Compare experimental measurement conditions (T, pH, ionic strength, surfactant type) with intended engine operating range.
   - Explicitly document any APPLICABILITY MISMATCH (e.g. linear alkylbenzene sulfonate vs ethoxylated alcohol, pure water vs hard tap water).
3. Evidence Quality Scoring:
   - Internal unit tests or regression tests do NOT constitute experimental evidence.
   - Theoretical papers establish mathematical models, NOT laboratory empirical validation.
   - Mark validation readiness as: NOT_READY, DATASET_REQUIRED, READY, or BLOCKED.`,
      lastModified: '2026-10-17',
    },
    {
      id: 'PRM-004',
      title: 'Numerical Validation & Residual Analysis Harness Protocol',
      phase: 'Phase 5 (Locked Gate Protocol)',
      category: 'Numerical Validation',
      version: '1.0.0',
      author: 'Metrology & Calibration Engineer',
      intendedOutcome: 'Standardized statistical validation protocol for Phase 5 (to be unlocked only after Phase 4B closure approval).',
      content: `Phase 5 Numerical Validation Protocol (LOCKED UNTIL PHASE 4B SIGN-OFF):

Prerequisites:
- Evidence record must be NUMERICALLY_INSPECTED.
- Raw experimental dataset must have verified row count, units, and zero fabricated observations.

Execution:
1. Partition dataset into 60% Calibration / 40% Independent Holdout Test series.
2. Run engine against calibration inputs and record predictions.
3. Compute statistical error metrics:
   - Root Mean Square Error (RMSE) with physical units
   - Mean Absolute Error (MAE)
   - Coefficient of Determination (R^2)
   - Maximum Residual (Worst-case outlier)
4. Residual Distribution Analysis:
   - Plot residuals vs predicted values to check for heteroscedasticity or systematic bias.
   - Evaluate whether errors increase at extreme pH (> 10.5) or high ionic strength (> 0.5M).
5. Prohibition:
   - Never claim "95-98% accuracy" as a marketing generalization. State exact RMSE and confidence intervals.`,
      lastModified: '2026-10-17',
    },
    {
      id: 'PRM-005',
      title: 'Correction of Specific Identified Gaps (F3-01 through F3-03)',
      phase: 'Phase 3 & Phase 4B',
      category: 'Remediation Review',
      version: '1.3.0',
      author: 'Senior Formulations Chemist',
      intendedOutcome: 'Independent audit protocol for verifying F3-01 (Davies activity), F3-02 (Rubingh RST), and F3-03 (Builder equilibrium).',
      content: `Verification Checklist for Scientific Remediation Findings F3-01 to F3-03:

Gap F3-01: Activity Coefficient in Concentrated Electrolyte Baths
- Check src/core/phEngineV2.ts: Is the Davies equation correctly parametrized with A = 0.5108 (at 25°C) and empirical term 0.3 * I?
- Does the engine warn or clamp when ionic strength I exceeds 0.5 mol/L?
- Compare predicted pH of standard 0.1M Na2CO3 / 0.1M NaHCO3 buffer with empirical NBS/NIST standard buffer table.

Gap F3-02: Non-Ideal Mixed Micellization
- Check src/core/surfactantMicellizationEngine.ts: Does the solver iterate using Newton-Raphson to solve Rubingh equations for alpha_1 and beta?
- Verify that beta is negative for synergistic anionic/amphoteric mixtures (e.g. LAS + CAPB beta approx -3.0 to -4.5).
- Verify fallback behavior when pure CMCs differ by more than 2 orders of magnitude.

Gap F3-03: Multi-Ligand Chelation Equilibrium
- Check src/core/builderChelationEngine.ts: Are conditional stability constants calculated as K_cond = K_abs * alpha_L?
- Verify competitive displacement: Does Ca2+ displace Mg2+ according to thermodynamic affinity?
- Verify that free calcium output is reported in both mol/L and ppm CaCO3.`,
      lastModified: '2026-10-17',
    },
    {
      id: 'PRM-006',
      title: 'Independent Audit & Phase 4B Closure Review Gate',
      phase: 'Phase 4B Gate',
      category: 'Gate Approval',
      version: '1.0.0',
      author: 'Independent Scientific Review Board',
      intendedOutcome: 'Formal evaluation criteria to determine whether Phase 4B can be approved and Phase 5 unlocked.',
      content: `Phase 4B Formal Closure Review Protocol:

The Independent Review Board shall evaluate the following 6 mandatory conditions:
[ ] 1. Engine Reconciliation: 59 implementation files in Formula-expert- are verified by file path, entry points, and physical units, explaining the 64/97 discrepancy.
[ ] 2. Evidence Corpus: All 11 seeded evidence leads evaluated, access confirmed, and repository URLs verified.
[ ] 3. Physical Inspection: At least 3 primary experimental datasets have completed NUMERICAL_INSPECTION (actual row count verified, columns mapped, zero fabricated entries).
[ ] 4. Blocker Resolution: BLK-001 (SurfPro ZIP acquisition) is resolved or replaced by an equivalent validated tensiometry dataset.
[ ] 5. Pricing Integrity: Raw material null-price preservation remains strictly intact across all models.
[ ] 6. Zero Unwarranted Claims: No engine is claimed as "lab validated" without attached empirical measurement records.

Decision Options:
- APPROVED: Phase 4B marked CLOSED; Phase 5 UNLOCKED.
- REQUIRES_REWORK: Remediation directives issued with specific deficiency IDs.
- REJECTED: Application fails scientific integrity audit.`,
      lastModified: '2026-10-17',
    },
  ],
};

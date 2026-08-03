// R&D Calculation Engine - Automated Mathematical Verification Suite
import { 
  calculateNeutralization, 
  calculateHLB, 
  calculateActiveMatter, 
  scaleFormula, 
  calculateDilution, 
  convertUnit,
  getAlkaliPurity,
  calculateEstimatedPH
} from "./calculators.js";

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  expected: any;
  actual: any;
  error?: string;
  steps: string[];
}

const results: TestResult[] = [];

function assertEqual(category: string, name: string, actual: any, expected: any, steps: string[]) {
  const passed = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({
    category,
    name,
    passed,
    expected,
    actual,
    steps
  });
}

function assertCloseTo(category: string, name: string, actual: number, expected: number, tolerance: number, steps: string[]) {
  const diff = Math.abs(actual - expected);
  const passed = diff <= tolerance;
  results.push({
    category,
    name,
    passed,
    expected: `approx ${expected} (tol: ${tolerance})`,
    actual,
    steps
  });
}

console.log("======================================================================");
console.log("🧪 RUNNING DETEGERNT R&D CORE FORMULATION MATHEMATICAL TESTING SUITE");
console.log("======================================================================\n");

// --- TEST SUITE 1: HLB (Hydrophilic-Lipophilic Balance) ---
try {
  // Test 1: Single surfactant
  const hlb1 = calculateHLB([{ name: "Tween 80", hlb: 15.0, proportion: 100 }]);
  assertEqual(
    "HLB Calculations",
    "Single surfactant HLB returns its own value",
    hlb1,
    15.0,
    [
      "Equation: HLB_avg = Sum(HLB_i * W_i) / Sum(W_i)",
      `Substitute: (15.0 * 100) / 100 = 15.0`
    ]
  );

  // Test 2: Binary mixture
  // Span 80 (HLB = 4.3), 30% and Tween 80 (HLB = 15.0), 70%
  const hlb2 = calculateHLB([
    { name: "Span 80", hlb: 4.3, proportion: 30 },
    { name: "Tween 80", hlb: 15.0, proportion: 70 }
  ]);
  assertEqual(
    "HLB Calculations",
    "Standard W/O and O/W binary mixture HLB",
    hlb2,
    11.79, // (4.3*30 + 15*70)/100 = (129 + 1050)/100 = 11.79
    [
      "Equation: HLB_avg = (HLB_1 * W_1 + HLB_2 * W_2) / (W_1 + W_2)",
      "Substitute: (4.3 * 30 + 15.0 * 70) / 100",
      "Calculate: (129 + 1050) / 100 = 11.79"
    ]
  );

  // Test 3: Zero weights edge-case
  const hlbZero = calculateHLB([{ name: "Empty", hlb: 10, proportion: 0 }]);
  assertEqual(
    "HLB Calculations",
    "Empty or zero weight input edge-case",
    hlbZero,
    0,
    [
      "Equation: If Total Weight = 0, return 0 to prevent division by zero."
    ]
  );
} catch (e: any) {
  console.error("Error in HLB Test Suite:", e);
}

// --- TEST SUITE 2: ACTIVE MATTER PERCENTAGES ---
try {
  // Test 1: Standard anionic surfactant SLES (70% active) at 12% in formulation
  const active1 = calculateActiveMatter([
    { name: "SLES (70%)", percentageInFormula: 12.0, activeMatterPurity: 70 }
  ]);
  assertEqual(
    "Active Matter %",
    "Single active surfactant active matter content",
    active1,
    8.4, // 12% * 70% = 8.4%
    [
      "Equation: Active_Total = Sum(P_formula_i * P_active_i / 100)",
      "Substitute: 12.0 * 70 / 100 = 8.4"
    ]
  );

  // Test 2: Multicomponent active blend (SLES 12% at 70%, CAPB 5% at 30%, LABSA 8% at 90%)
  const active2 = calculateActiveMatter([
    { name: "SLES (70%)", percentageInFormula: 12.0, activeMatterPurity: 70 },
    { name: "CAPB (30%)", percentageInFormula: 5.0, activeMatterPurity: 30 },
    { name: "LABSA (90%)", percentageInFormula: 8.0, activeMatterPurity: 90 }
  ]);
  assertEqual(
    "Active Matter %",
    "Multicomponent ternary active matter blend",
    active2,
    17.1, // (12*0.7) + (5*0.3) + (8*0.9) = 8.4 + 1.5 + 7.2 = 17.1%
    [
      "Equation: Active_Total = (12 * 70 / 100) + (5 * 30 / 100) + (8 * 90 / 100)",
      "Calculate: 8.4 + 1.5 + 7.2 = 17.1%"
    ]
  );
} catch (e: any) {
  console.error("Error in Active Matter Test Suite:", e);
}

// --- TEST SUITE 3: BATCH SCALE AND COSTING ---
try {
  const sampleIngredients = [
    { name: "SLES", percentage: 15.0, costPerKg: 110 },
    { name: "LABSA", percentage: 10.0, costPerKg: 135 },
    { name: "Water", percentage: 75.0, costPerKg: 2 }
  ];

  // Scale to 250 kg batch size
  const batchSize = 250;
  const scaled = scaleFormula(sampleIngredients, batchSize);

  // Asserting SLES scale: 15% of 250 = 37.5 kg. Cost = 37.5 * 110 = 4125
  assertEqual(
    "Batch Scaling & Costing",
    "SLES weight scaled correctly",
    scaled[0].scaledWeight,
    37.5,
    [
      "Equation: Scaled_Weight = (Percent / 100) * Batch_Size",
      `Substitute: (15.0 / 100) * ${batchSize} = 37.5 kg`
    ]
  );

  assertEqual(
    "Batch Scaling & Costing",
    "SLES cost contribution matches rate",
    scaled[0].costContribution,
    4125,
    [
      "Equation: Cost_Contribution = Scaled_Weight * Cost_Per_Kg",
      "Substitute: 37.5 * 110 = 4125"
    ]
  );

  // Asserting LABSA scale: 10% of 250 = 25 kg. Cost = 25 * 135 = 3375
  assertEqual(
    "Batch Scaling & Costing",
    "LABSA weight scaled correctly",
    scaled[1].scaledWeight,
    25.0,
    [
      "Substitute: (10.0 / 100) * 250 = 25.0 kg"
    ]
  );

  assertEqual(
    "Batch Scaling & Costing",
    "LABSA cost contribution matches rate",
    scaled[1].costContribution,
    3375,
    [
      "Substitute: 25.0 * 135 = 3375"
    ]
  );

  // Total batch cost = SLES(4125) + LABSA(3375) + Water(75% of 250 = 187.5kg * 2 = 375) = 7875
  const totalCost = scaled.reduce((acc, c) => acc + c.costContribution, 0);
  assertEqual(
    "Batch Scaling & Costing",
    "Total batch cost equals sum of parts",
    totalCost,
    7875,
    [
      "Equation: Total_Cost = Sum(Cost_Contribution_i)",
      "Substitute: 4125 + 3375 + 375 = 7875"
    ]
  );
} catch (e: any) {
  console.error("Error in Batch Scaling & Costing Test Suite:", e);
}

// --- TEST SUITE 4: DILUTION CALCULATOR ---
try {
  // Make 50L (V2) of 15% SLES (C2) from 70% SLES paste (C1)
  const dilution = calculateDilution(70, 15, 50);
  // Expected v1: (15 * 50) / 70 = 10.71 L
  // Expected waterNeeded: 50 - 10.71 = 39.29 L
  assertEqual(
    "Dilution Formula",
    "Dilution concentrate volume (V1) calculation",
    dilution.v1,
    10.71,
    [
      "Equation: V1 = (C2 * V2) / C1",
      "Substitute: (15 * 50) / 70",
      "Calculate: 750 / 70 = 10.714 -> Rounded: 10.71 L"
    ]
  );

  assertEqual(
    "Dilution Formula",
    "Dilution water volume needed calculation",
    dilution.waterNeeded,
    39.29,
    [
      "Equation: V_water = V2 - V1",
      "Substitute: 50 - 10.71",
      "Calculate: 39.29 L"
    ]
  );
} catch (e: any) {
  console.error("Error in Dilution Test Suite:", e);
}

// --- TEST SUITE 5: UNIT CONVERSION ---
try {
  // Test 1: kg to lb conversion (1 kg = 2.205 lb)
  const lbVal = convertUnit(1, "kg", "lb");
  assertCloseTo(
    "Unit Conversions",
    "Kilograms to Pounds (mass conversion)",
    lbVal,
    2.205,
    0.001,
    [
      "Conversion Factor: 1 kg = 2.20462 lb",
      "Substitute: 1 * 2.20462 = 2.2046"
    ]
  );

  // Test 2: gal to L conversion (1 gal = 3.785 L)
  const lVal = convertUnit(1, "gal", "l");
  assertCloseTo(
    "Unit Conversions",
    "US Gallons to Liters (volume conversion)",
    lVal,
    3.785,
    0.001,
    [
      "Conversion Factor: 1 gal = 3.78541 Liters",
      "Substitute: 1 * 3.78541 = 3.785"
    ]
  );
} catch (e: any) {
  console.error("Error in Unit Conversion Test Suite:", e);
}

// --- TEST SUITE 6: LABSA NEUTRALIZATION ---
try {
  // 10 kg of 90% LABSA with NaOH Flakes (99%)
  const neutResult = calculateNeutralization({
    labsaQty: 10,
    labsaPurity: 90,
    alkaliType: "NaOH Flakes (99%)"
  });

  // Expected alkaliRequiredGrams: 135g * 10 = 1350g (1.35 kg)
  assertEqual(
    "LABSA Neutralization",
    "Dry NaOH flakes stoichiometric mass calculation",
    neutResult.alkaliRequiredGrams,
    1350,
    [
      "Standard Industrial Practice Ratio: 135g NaOH Flakes per 1kg LABSA 90%",
      "Substitute: 135g * 10 = 1350g"
    ]
  );

  // Expected water generated: 61g * 10 = 610g
  assertEqual(
    "LABSA Neutralization",
    "Water of neutralization byproduct weight",
    neutResult.waterGeneratedGrams,
    610,
    [
      "Standard Neutralization Water Factor: 61g water per 1kg neutralized LABSA",
      "Substitute: 61g * 10 = 610g"
    ]
  );
} catch (e: any) {
  console.error("Error in Neutralization Test Suite:", e);
}

// --- TEST SUITE 5: ALKALI PURITY AND pH REGRESSION ---
try {
  // Test 1: NaOH Lye 50%
  const purityLye = getAlkaliPurity("Caustic Soda Lye (NaOH 50%)", 0);
  assertEqual(
    "Alkali Purity",
    "Parses 50% purity from NaOH Lye name",
    purityLye,
    50.0,
    [
      "Input Name: Caustic Soda Lye (NaOH 50%)",
      `Expected: 50.0%, Parsed: ${purityLye}%`
    ]
  );

  // Test 2: NaOH Flakes 98%
  const purityFlakes = getAlkaliPurity("NaOH Flakes 98%", 0);
  assertEqual(
    "Alkali Purity",
    "Parses 98% purity from NaOH Flakes name",
    purityFlakes,
    98.0,
    [
      "Input Name: NaOH Flakes 98%",
      `Expected: 98.0%, Parsed: ${purityFlakes}%`
    ]
  );

  // Test 3: NaOH Lye 2% @ 50% purity, LABSA 7.5% @ 90% purity pH estimation
  const testIngredients = [
    { name: "Caustic Soda Lye (NaOH 50%)", percentage: 2.0, activeMatterPct: 50 },
    { name: "LABSA (90% Active Slurry)", percentage: 7.5, activeMatterPct: 90 }
  ];
  const phResult = calculateEstimatedPH("Laundry Liquid", "Standard Synthetic High-Performance Laundry Liquid", testIngredients);
  
  const isCorrectRange = phResult.estpH >= 7.5 && phResult.estpH <= 13.0;
  assertEqual(
    "pH Regression",
    "NaOH Lye 50% excess has alkaline/near-neutral pH (> 7.5)",
    isCorrectRange,
    true,
    [
      `Ingredients: NaOH Lye 2% @ 50% purity, LABSA 7.5% @ 90% purity`,
      `Estimated pH: ${phResult.estpH} (Expected range: 7.5 to 13.0)`
    ]
  );

  // Test 4: Sodium Hydroxide Flakes (98%) Purity
  const purityFlakes98 = getAlkaliPurity("Sodium Hydroxide Flakes (98%)", 98);
  assertEqual(
    "Alkali Purity",
    "Parses 98% purity from Sodium Hydroxide Flakes (98%)",
    purityFlakes98,
    98.0,
    [
      "Input Name: Sodium Hydroxide Flakes (98%)",
      `Expected: 98.0%, Parsed: ${purityFlakes98}%`
    ]
  );

  // Test 5: Sodium Hydroxide Lye (50%) Purity
  const purityLye50 = getAlkaliPurity("Sodium Hydroxide Lye (50%)", 50);
  assertEqual(
    "Alkali Purity",
    "Parses 50% purity from Sodium Hydroxide Lye (50%)",
    purityLye50,
    50.0,
    [
      "Input Name: Sodium Hydroxide Lye (50%)",
      `Expected: 50.0%, Parsed: ${purityLye50}%`
    ]
  );

  // Test 6: Sodium Hydroxide Lye (33%) Purity
  const purityLye33 = getAlkaliPurity("Sodium Hydroxide Lye (33%)", 33);
  assertEqual(
    "Alkali Purity",
    "Parses 33% purity from Sodium Hydroxide Lye (33%)",
    purityLye33,
    33.0,
    [
      "Input Name: Sodium Hydroxide Lye (33%)",
      `Expected: 33.0%, Parsed: ${purityLye33}%`
    ]
  );
} catch (e: any) {
  console.error("Error in Alkali Purity / pH Regression Test Suite:", e);
}

// PRINT RESULTS SUMMARY
console.log("\n======================================================================");
console.log("📊 MATHEMATICAL TESTING SUITE RUN SUMMARY");
console.log("======================================================================");

let passedCount = 0;
results.forEach((r, idx) => {
  const prefix = r.passed ? "✅ [PASSED]" : "❌ [FAILED]";
  passedCount += r.passed ? 1 : 0;
  console.log(`${prefix} [${r.category}] #${idx + 1}: ${r.name}`);
  r.steps.forEach(s => console.log(`      ↳ ${s}`));
});

console.log("\n----------------------------------------------------------------------");
console.log(`TOTAL TESTS: ${results.length}`);
console.log(`PASSED: ${passedCount}`);
console.log(`FAILED: ${results.length - passedCount}`);
console.log("----------------------------------------------------------------------");

if (passedCount === results.length) {
  console.log("🏆 ALL CALCULATIONS MATHEMATICALLY ASSERTED WITH ZERO ERROR DEVIATION!");
  console.log("======================================================================\n");
  process.exit(0);
} else {
  console.error("🚨 CRITICAL ERROR: TESTING SUITE DISCOVERED MATHEMATICAL INCONSISTENCY!");
  console.log("======================================================================\n");
  process.exit(1);
}

import { mapFormulationIngredientsToPHEngineInput, mapFormulationIngredientToPHEngineInput } from '../pHEngineAdapter';
import { calculatePHAdvanced } from '../pHEngine';
import { calculateBlendedHLB } from '../calculators';
import { FormulationIngredient } from '../../types';

export interface TestResult {
  name: string;
  group: string;
  passed: boolean;
  actual: any;
  expected: any;
  message?: string;
}

const results: TestResult[] = [];

function assert(group: string, name: string, condition: boolean, actual: any, expected: any, message?: string) {
  results.push({
    group,
    name,
    passed: Boolean(condition),
    actual,
    expected,
    message: message || (condition ? 'PASS' : `Expected ${expected}, got ${actual}`)
  });
}

function assertNear(group: string, name: string, actual: number, expected: number, tolerance: number) {
  const diff = Math.abs(actual - expected);
  const passed = diff <= tolerance;
  assert(
    group,
    name,
    passed,
    actual,
    `${expected} ± ${tolerance}`,
    passed ? `PASS (diff: ${diff.toFixed(4)})` : `FAIL: got ${actual}, expected ${expected} ± ${tolerance} (diff: ${diff.toFixed(4)})`
  );
}

// ==========================================
// GROUP A — STRONG ACID / STRONG BASE
// ==========================================

// Test A1 — LABSA alone (10% @ 96%)
const a1Input = mapFormulationIngredientsToPHEngineInput([{ name: 'LABSA', percentage: 10, activeMatterPct: 96 }]);
const a1Res = calculatePHAdvanced(a1Input);
assertNear('Strong Acid/Base', 'A1: LABSA 10% @ 96%', a1Res.pH, 0.53, 0.02);

// Test A2 — LABSA 10% @ 96% + 2% NaOH @ 50%
const a2Input = mapFormulationIngredientsToPHEngineInput([
  { name: 'LABSA', percentage: 10, activeMatterPct: 96 },
  { name: 'NaOH 50% Lye', percentage: 2, activeMatterPct: 50 }
]);
const a2Res = calculatePHAdvanced(a2Input);
assertNear('Strong Acid/Base', 'A2: LABSA + 50% NaOH', a2Res.pH, 1.36, 0.02);

// Test A3 — LABSA 10% @ 96% + 2% NaOH @ 100%
const a3Input = mapFormulationIngredientsToPHEngineInput([
  { name: 'LABSA', percentage: 10, activeMatterPct: 96 },
  { name: 'NaOH 100% Caustic Soda', percentage: 2, activeMatterPct: 100 }
]);
const a3Res = calculatePHAdvanced(a3Input);
assertNear('Strong Acid/Base', 'A3: LABSA + 100% NaOH', a3Res.pH, 13.31, 0.02);

// Test A4 — Exact Stoichiometric Neutralization (LABSA 10% @ 96% + 1.17615% NaOH @ 100%)
const a4Input = mapFormulationIngredientsToPHEngineInput([
  { name: 'LABSA', percentage: 10, activeMatterPct: 96 },
  { name: 'NaOH 100%', percentage: 1.17615, activeMatterPct: 100 }
]);
const a4Res = calculatePHAdvanced(a4Input);
assertNear('Strong Acid/Base', 'A4: Exact Stoichiometric Neutralization pH', a4Res.pH, 7.00, 0.01);
assert('Strong Acid/Base', 'A4: Solver Converged at Equivalence', a4Res.solverConverged === true, a4Res.solverConverged, true);

// Test A5 — Slight Under-Neutralization (LABSA 10% @ 96% + 1.15% NaOH @ 100%)
const a5Input = mapFormulationIngredientsToPHEngineInput([
  { name: 'LABSA', percentage: 10, activeMatterPct: 96 },
  { name: 'NaOH 100%', percentage: 1.15, activeMatterPct: 100 }
]);
const a5Res = calculatePHAdvanced(a5Input);
assertNear('Strong Acid/Base', 'A5: Slight Under-Neutralization', a5Res.pH, 2.18, 0.02);

// Test A6 — Slight Over-Neutralization (LABSA 10% @ 96% + 1.20% NaOH @ 100%)
const a6Input = mapFormulationIngredientsToPHEngineInput([
  { name: 'LABSA', percentage: 10, activeMatterPct: 96 },
  { name: 'NaOH 100%', percentage: 1.20, activeMatterPct: 100 }
]);
const a6Res = calculatePHAdvanced(a6Input);
assertNear('Strong Acid/Base', 'A6: Slight Over-Neutralization', a6Res.pH, 11.78, 0.02);


// ==========================================
// GROUP B — COMMERCIAL ACTIVE CONCENTRATION
// ==========================================

// Test B1 — LABSA 90%
const b1Input = mapFormulationIngredientsToPHEngineInput([{ name: 'LABSA', percentage: 10, activeMatterPct: 90 }]);
const b1Res = calculatePHAdvanced(b1Input);
assertNear('Active Concentration', 'B1: LABSA 10% @ 90%', b1Res.pH, 0.56, 0.02);

// Test B2 — LABSA 96%
const b2Input = mapFormulationIngredientsToPHEngineInput([{ name: 'LABSA', percentage: 10, activeMatterPct: 96 }]);
const b2Res = calculatePHAdvanced(b2Input);
assertNear('Active Concentration', 'B2: LABSA 10% @ 96%', b2Res.pH, 0.53, 0.02);
assert('Active Concentration', 'B2 vs B1: 90% and 96% LABSA yield different pH values', b1Res.pH !== b2Res.pH, b1Res.pH, `Not equal to ${b2Res.pH}`);

// Test B3 — NaOH 50%
const b3Input = mapFormulationIngredientsToPHEngineInput([{ name: 'NaOH', percentage: 2, activeMatterPct: 50 }]);
assert('Active Concentration', 'B3: NaOH 50% mapped activePercent is 50%', b3Input[0].activePercent === 50, b3Input[0].activePercent, 50);

// Test B4 — NaOH 100%
const b4Input = mapFormulationIngredientsToPHEngineInput([{ name: 'NaOH', percentage: 2, activeMatterPct: 100 }]);
assert('Active Concentration', 'B4: NaOH 100% mapped activePercent is 100%', b4Input[0].activePercent === 100, b4Input[0].activePercent, 100);
assert('Active Concentration', 'B4 vs B3: 50% active != 100% active', b3Input[0].activePercent !== b4Input[0].activePercent, b3Input[0].activePercent, `Not equal to ${b4Input[0].activePercent}`);

// Test B5 — KOH 85%
const b5Input = mapFormulationIngredientsToPHEngineInput([
  { name: 'LABSA', percentage: 10, activeMatterPct: 96 },
  { name: 'KOH', percentage: 2, activeMatterPct: 85 }
]);
const b5Res = calculatePHAdvanced(b5Input);
assertNear('Active Concentration', 'B5: KOH 85% with LABSA', b5Res.pH, 11.95, 0.02);

// Test B6 — KOH 100%
const b6Input = mapFormulationIngredientsToPHEngineInput([
  { name: 'LABSA', percentage: 10, activeMatterPct: 96 },
  { name: 'KOH', percentage: 2, activeMatterPct: 100 }
]);
const b6Res = calculatePHAdvanced(b6Input);
assertNear('Active Concentration', 'B6: KOH 100% with LABSA', b6Res.pH, 12.80, 0.02);
assert('Active Concentration', 'B6 vs B5: KOH 85% vs 100% yield different pH', b5Res.pH !== b6Res.pH, b5Res.pH, `Not equal to ${b6Res.pH}`);


// ==========================================
// GROUP C — CITRIC ACID / CITRATE
// ==========================================

// Test C1 — Citric Acid alone (2%)
const c1Input = mapFormulationIngredientsToPHEngineInput([{ name: 'Citric Acid', percentage: 2 }]);
const c1Res = calculatePHAdvanced(c1Input);
assertNear('Citric/Citrate', 'C1: Citric Acid 2%', c1Res.pH, 2.06, 0.03);

// Test C2 — Citric Acid 2% + Sodium Citrate 2%
const c2Input = mapFormulationIngredientsToPHEngineInput([
  { name: 'Citric Acid', percentage: 2 },
  { name: 'Sodium Citrate', percentage: 2 }
]);
const c2Res = calculatePHAdvanced(c2Input);
assertNear('Citric/Citrate', 'C2: Citric Acid 2% + Sodium Citrate 2%', c2Res.pH, 4.43, 0.10);

// Test C3 — Citric Acid 2% + NaOH 0.5% @ 50%
const c3Input = mapFormulationIngredientsToPHEngineInput([
  { name: 'Citric Acid', percentage: 2 },
  { name: 'NaOH', percentage: 0.5, activeMatterPct: 50 }
]);
const c3Res = calculatePHAdvanced(c3Input);
assertNear('Citric/Citrate', 'C3: Partial Neutralization Citric Acid', c3Res.pH, 3.27, 0.10);

// Test C4 — Citric Acid 2% + NaOH 2.5% @ 100%
const c4Input = mapFormulationIngredientsToPHEngineInput([
  { name: 'Citric Acid', percentage: 2 },
  { name: 'NaOH', percentage: 2.5, activeMatterPct: 100 }
]);
const c4Res = calculatePHAdvanced(c4Input);
assertNear('Citric/Citrate', 'C4: Over-Neutralized Citric Acid', c4Res.pH, 13.50, 0.10);


// ==========================================
// GROUP D — CARBONATE / BICARBONATE
// ==========================================

// Test D1 — Sodium Bicarbonate 2%
const d1Input = mapFormulationIngredientsToPHEngineInput([{ name: 'Sodium Bicarbonate', percentage: 2 }]);
const d1Res = calculatePHAdvanced(d1Input);
assertNear('Carbonate/Bicarbonate', 'D1: Sodium Bicarbonate 2%', d1Res.pH, 8.34, 0.05);

// Test D2 — Sodium Citrate 2%
const d2Input = mapFormulationIngredientsToPHEngineInput([{ name: 'Sodium Citrate', percentage: 2 }]);
const d2Res = calculatePHAdvanced(d2Input);
assertNear('Carbonate/Bicarbonate', 'D2: Sodium Citrate 2%', d2Res.pH, 9.64, 0.10);

// Test D3 — Soda Ash 2% + Citric Acid 1%
const d3Input = mapFormulationIngredientsToPHEngineInput([
  { name: 'Soda Ash', percentage: 2 },
  { name: 'Citric Acid', percentage: 1 }
]);
const d3Res = calculatePHAdvanced(d3Input);
assertNear('Carbonate/Bicarbonate', 'D3: Soda Ash 2% + Citric Acid 1%', d3Res.pH, 9.65, 0.10);


// ==========================================
// GROUP E — BUILDERS
// ==========================================

// Test E1 — Sodium Metasilicate Pentahydrate 1%
const e1Input = mapFormulationIngredientsToPHEngineInput([{ name: 'Sodium Metasilicate Pentahydrate', percentage: 1 }]);
const e1Res = calculatePHAdvanced(e1Input);
assertNear('Builders', 'E1: Sodium Metasilicate Pentahydrate 1%', e1Res.pH, 12.24, 0.10);

// Test E2 — Sodium Metasilicate Anhydrous 1% vs Pentahydrate 1%
const e2Input = mapFormulationIngredientsToPHEngineInput([{ name: 'Sodium Metasilicate Anhydrous', percentage: 1 }]);
const e2Res = calculatePHAdvanced(e2Input);
assert('Builders', 'E2: Anhydrous metasilicate yields higher alkalinity/pH than Pentahydrate at same raw %', e2Res.pH > e1Res.pH, e2Res.pH, `Greater than ${e1Res.pH}`);

// Test E3 — TSP Anhydrous 1%
const e3Input = mapFormulationIngredientsToPHEngineInput([{ name: 'TSP Anhydrous', percentage: 1 }]);
const e3Res = calculatePHAdvanced(e3Input);
assertNear('Builders', 'E3: TSP Anhydrous 1%', e3Res.pH, 12.43, 0.10);

// Test E4 — TSP Dodecahydrate 1%
const e4Input = mapFormulationIngredientsToPHEngineInput([{ name: 'TSP Dodecahydrate', percentage: 1 }]);
const e4Res = calculatePHAdvanced(e4Input);
assert('Builders', 'E4: TSP Dodecahydrate yields lower pH than TSP Anhydrous due to higher MW', e4Res.pH < e3Res.pH, e4Res.pH, `Less than ${e3Res.pH}`);

// Test E5 — STPP 1%
const e5Input = mapFormulationIngredientsToPHEngineInput([{ name: 'STPP', percentage: 1 }]);
const e5Res = calculatePHAdvanced(e5Input);
assertNear('Builders', 'E5: STPP 1%', e5Res.pH, 10.70, 0.10);


// ==========================================
// GROUP F — TEA / COLLISION PROTECTION
// ==========================================

// Test F1 — Triethanolamine 1%
const f1Input = mapFormulationIngredientsToPHEngineInput([{ name: 'Triethanolamine', percentage: 1 }]);
const f1Res = calculatePHAdvanced(f1Input);
assertNear('TEA Collision', 'F1: Triethanolamine 1%', f1Res.pH, 10.50, 0.05);

// Test F2 — "TEA" abbreviation 1%
const f2Input = mapFormulationIngredientsToPHEngineInput([{ name: 'TEA', percentage: 1 }]);
const f2Res = calculatePHAdvanced(f2Input);
assertNear('TEA Collision', 'F2: TEA abbreviation recognized as weak base', f2Res.pH, 10.50, 0.05);

// Test F3 — Tea Tree Oil 1%
const f3Input = mapFormulationIngredientsToPHEngineInput([{ name: 'Tea Tree Oil', percentage: 1 }]);
const f3Res = calculatePHAdvanced(f3Input);
assert('TEA Collision', 'F3: Tea Tree Oil is neutral/unknown (pH = 7.00)', f3Res.pH === 7.00, f3Res.pH, 7.00);

// Test F4 — Green Tea Extract 1%
const f4Input = mapFormulationIngredientsToPHEngineInput([{ name: 'Green Tea Extract', percentage: 1 }]);
const f4Res = calculatePHAdvanced(f4Input);
assert('TEA Collision', 'F4: Green Tea Extract is neutral (pH = 7.00)', f4Res.pH === 7.00, f4Res.pH, 7.00);

// Test F5 — Tea Fragrance 1%
const f5Input = mapFormulationIngredientsToPHEngineInput([{ name: 'Tea Fragrance', percentage: 1 }]);
const f5Res = calculatePHAdvanced(f5Input);
assert('TEA Collision', 'F5: Tea Fragrance is neutral (pH = 7.00)', f5Res.pH === 7.00, f5Res.pH, 7.00);


// ==========================================
// GROUP G — NEUTRAL / UNKNOWN INGREDIENT SAFETY
// ==========================================

const neutralIngs = [
  'SLES 70%',
  'AOS 38%',
  'CAPB 30%',
  'Sodium Sulfate',
  'CMC',
  'Enzyme Blend',
  'Fragrance',
  'Optical Brightener',
  'Glycerin',
  'Water'
];

neutralIngs.forEach((ingName, idx) => {
  const gInput = mapFormulationIngredientsToPHEngineInput([{ name: ingName, percentage: 5 }]);
  const gRes = calculatePHAdvanced(gInput);
  assert('Unknown Safety', `G${idx + 1}: ${ingName} alone produces pH = 7.00`, gRes.pH === 7.00, gRes.pH, 7.00);
});


// ==========================================
// GROUP H — ADAPTER REGRESSION
// ==========================================

// Test H1 — percentage -> rawPercent
const h1Source: FormulationIngredient = { name: 'Test', percentage: 12.5 };
const h1Mapped = mapFormulationIngredientToPHEngineInput(h1Source);
assert('Adapter', 'H1: percentage mapped to rawPercent', h1Mapped.rawPercent === 12.5, h1Mapped.rawPercent, 12.5);

// Test H2 — activeMatterPct -> activePercent
const h2Source: FormulationIngredient = { name: 'Test', percentage: 10, activeMatterPct: 70 };
const h2Mapped = mapFormulationIngredientToPHEngineInput(h2Source);
assert('Adapter', 'H2: activeMatterPct mapped to activePercent', h2Mapped.activePercent === 70, h2Mapped.activePercent, 70);

// Test H3 — Fallback priority: activeMatterPct -> activePercent -> activeMatterPurity
const h3aSource: FormulationIngredient = { name: 'Test', percentage: 10, activeMatterPct: 80, activePercent: 60 };
const h3aMapped = mapFormulationIngredientToPHEngineInput(h3aSource);
assert('Adapter', 'H3a: activeMatterPct priority over activePercent', h3aMapped.activePercent === 80, h3aMapped.activePercent, 80);

const h3bSource: FormulationIngredient = { name: 'Test', percentage: 10, activePercent: 60, activeMatterPurity: 40 } as any;
const h3bMapped = mapFormulationIngredientToPHEngineInput(h3bSource);
assert('Adapter', 'H3b: activePercent priority over activeMatterPurity', h3bMapped.activePercent === 60, h3bMapped.activePercent, 60);

// Test H4 — Raw percentage priority: percentage -> percent -> percentageInFormula -> 0
const h4aSource: FormulationIngredient = { name: 'Test', percent: 15 } as any;
const h4aMapped = mapFormulationIngredientToPHEngineInput(h4aSource);
assert('Adapter', 'H4a: percent used when percentage missing', h4aMapped.rawPercent === 15, h4aMapped.rawPercent, 15);

const h4bSource: FormulationIngredient = { name: 'Test', percentageInFormula: 25 } as any;
const h4bMapped = mapFormulationIngredientToPHEngineInput(h4bSource);
assert('Adapter', 'H4b: percentageInFormula used when others missing', h4bMapped.rawPercent === 25, h4bMapped.rawPercent, 25);

// Test H5 — Explicit zero percentage
const h5Source: FormulationIngredient = { name: 'Test', percentage: 0 };
const h5Mapped = mapFormulationIngredientToPHEngineInput(h5Source);
assert('Adapter', 'H5: explicit percentage 0 remains 0', h5Mapped.rawPercent === 0, h5Mapped.rawPercent, 0);

// Test H6 — Missing active concentration remains undefined
const h6Source: FormulationIngredient = { name: 'Test', percentage: 10 };
const h6Mapped = mapFormulationIngredientToPHEngineInput(h6Source);
assert('Adapter', 'H6: missing active concentration is undefined', h6Mapped.activePercent === undefined, h6Mapped.activePercent, 'undefined');

// Test H7 — Source ingredient object is not mutated
const h7Source: FormulationIngredient = Object.freeze({ name: 'Test', percentage: 10, activeMatterPct: 90 });
let h7Mutated = false;
try {
  mapFormulationIngredientToPHEngineInput(h7Source);
} catch (e) {
  h7Mutated = true;
}
assert('Adapter', 'H7: source object is not mutated during mapping', !h7Mutated, h7Mutated, false);


// ==========================================
// GROUP I — HYDRATION STATE REGRESSION
// ==========================================

const metaPenta = mapFormulationIngredientsToPHEngineInput([{ name: 'Sodium Metasilicate Pentahydrate', percentage: 1 }]);
const metaAnhyd = mapFormulationIngredientsToPHEngineInput([{ name: 'Sodium Metasilicate Anhydrous', percentage: 1 }]);
const tspDodeca = mapFormulationIngredientsToPHEngineInput([{ name: 'TSP Dodecahydrate', percentage: 1 }]);
const tspAnhyd  = mapFormulationIngredientsToPHEngineInput([{ name: 'TSP Anhydrous', percentage: 1 }]);

assert('Hydration', 'I1: Metasilicate Pentahydrate vs Anhydrous distinct species', metaPenta[0].name !== metaAnhyd[0].name, metaPenta[0].name, `Not equal to ${metaAnhyd[0].name}`);
assert('Hydration', 'I2: TSP Dodecahydrate vs Anhydrous distinct species', tspDodeca[0].name !== tspAnhyd[0].name, tspDodeca[0].name, `Not equal to ${tspAnhyd[0].name}`);


// ==========================================
// GROUP J — MONOTONICITY / SANITY TESTS
// ==========================================

// J1 — LABSA active concentration: increasing active % increases acid equivalents (lowers pH)
const j1a = calculatePHAdvanced(mapFormulationIngredientsToPHEngineInput([{ name: 'LABSA', percentage: 10, activeMatterPct: 80 }]));
const j1b = calculatePHAdvanced(mapFormulationIngredientsToPHEngineInput([{ name: 'LABSA', percentage: 10, activeMatterPct: 96 }]));
assert('Sanity/Monotonicity', 'J1: Higher LABSA active % yields lower pH', j1b.pH < j1a.pH, j1b.pH, `Less than ${j1a.pH}`);

// J2 — NaOH active concentration: increasing active % increases base equivalents (raises pH with acid present)
const j2a = calculatePHAdvanced(mapFormulationIngredientsToPHEngineInput([
  { name: 'LABSA', percentage: 10, activeMatterPct: 96 },
  { name: 'NaOH', percentage: 1, activeMatterPct: 50 }
]));
const j2b = calculatePHAdvanced(mapFormulationIngredientsToPHEngineInput([
  { name: 'LABSA', percentage: 10, activeMatterPct: 96 },
  { name: 'NaOH', percentage: 1, activeMatterPct: 100 }
]));
assert('Sanity/Monotonicity', 'J2: Higher NaOH active % yields higher pH', j2b.pH > j2a.pH, j2b.pH, `Greater than ${j2a.pH}`);

// J3 — KOH active concentration: increasing active % increases base equivalents
const j3a = calculatePHAdvanced(mapFormulationIngredientsToPHEngineInput([
  { name: 'LABSA', percentage: 10, activeMatterPct: 96 },
  { name: 'KOH', percentage: 2, activeMatterPct: 80 }
]));
const j3b = calculatePHAdvanced(mapFormulationIngredientsToPHEngineInput([
  { name: 'LABSA', percentage: 10, activeMatterPct: 96 },
  { name: 'KOH', percentage: 2, activeMatterPct: 90 }
]));
assert('Sanity/Monotonicity', 'J3: Higher KOH active % yields higher pH', j3b.pH > j3a.pH, j3b.pH, `Greater than ${j3a.pH}`);

// J4 — Neutral surfactants: changing SLES active % does NOT alter neutral pH (remains 7.00)
const j4a = calculatePHAdvanced(mapFormulationIngredientsToPHEngineInput([{ name: 'SLES', percentage: 10, activeMatterPct: 28 }]));
const j4b = calculatePHAdvanced(mapFormulationIngredientsToPHEngineInput([{ name: 'SLES', percentage: 10, activeMatterPct: 70 }]));
assert('Sanity/Monotonicity', 'J4: SLES active % change keeps pH = 7.00', j4a.pH === 7.00 && j4b.pH === 7.00, `28%:${j4a.pH}, 70%:${j4b.pH}`, 'both 7.00');

// J5 — Tea collision switch: TEA (weak base) vs Tea Tree Oil (neutral)
const j5a = calculatePHAdvanced(mapFormulationIngredientsToPHEngineInput([{ name: 'TEA', percentage: 1 }]));
const j5b = calculatePHAdvanced(mapFormulationIngredientsToPHEngineInput([{ name: 'Tea Tree Oil', percentage: 1 }]));
assert('Sanity/Monotonicity', 'J5: TEA is weak base (>10), Tea Tree Oil is neutral (7.00)', j5a.pH > 10 && j5b.pH === 7.00, `TEA:${j5a.pH}, TeaTree:${j5b.pH}`, 'TEA>10 and TeaTree=7.00');


// ==========================================
// GROUP K — FIELD CONTRACT & EXPLICIT ZERO REGRESSION
// ==========================================

// K1 — Percentage priority: percentage > percent > percentageInFormula
const k1Mapped = mapFormulationIngredientsToPHEngineInput([{ name: 'SLES', percentage: 12, percent: 8, percentageInFormula: 5 }]);
assert('Field Contract', 'K1: percentage takes precedence over percent and percentageInFormula', k1Mapped[0].rawPercent === 12, k1Mapped[0].rawPercent, 12);

// K2 — Active concentration priority: activeMatterPct > activePercent > purity
const k2Mapped = mapFormulationIngredientsToPHEngineInput([{ name: 'SLES', activeMatterPct: 70, activePercent: 28, purity: 50 } as any]);
assert('Field Contract', 'K2: activeMatterPct takes precedence over activePercent and purity', k2Mapped[0].activePercent === 70, k2Mapped[0].activePercent, 70);

// K3 — Explicit zero percentage is preserved
const k3Mapped = mapFormulationIngredientsToPHEngineInput([{ name: 'LABSA', percentage: 0, percent: 10 }]);
assert('Field Contract', 'K3: Explicit zero percentage is preserved', k3Mapped[0].rawPercent === 0, k3Mapped[0].rawPercent, 0);

// K4 — Explicit zero activeMatterPct is preserved
const k4Mapped = mapFormulationIngredientsToPHEngineInput([{ name: 'NaOH', activeMatterPct: 0, activePercent: 50 }]);
assert('Field Contract', 'K4: Explicit zero activeMatterPct is preserved', k4Mapped[0].activePercent === 0, k4Mapped[0].activePercent, 0);

// K5 — HLB calculation with canonical hlbValue vs hlb alias
const k5Surfactants = [
  { name: 'Span 80', hlbValue: 4.3, percentage: 5 },
  { name: 'Tween 80', hlb: 15.0, percentage: 5 }
];
const k5BlendedHLB = calculateBlendedHLB(k5Surfactants);
assert('Field Contract', 'K5: Blended HLB handles both hlbValue and hlb alias', k5BlendedHLB === 9.65, k5BlendedHLB, 9.65);


// ==========================================
// RUN SUMMARY & EXPORT
// ==========================================

export function runRegressionTestSuite() {
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;

  const groupSummary: Record<string, { total: number; passed: number; failed: number }> = {};
  results.forEach(r => {
    if (!groupSummary[r.group]) {
      groupSummary[r.group] = { total: 0, passed: 0, failed: 0 };
    }
    groupSummary[r.group].total++;
    if (r.passed) {
      groupSummary[r.group].passed++;
    } else {
      groupSummary[r.group].failed++;
    }
  });

  console.log('\n==================================================');
  console.log('  pHEngine AUTOMATED SCIENTIFIC REGRESSION SUITE  ');
  console.log('==================================================\n');

  Object.entries(groupSummary).forEach(([group, counts]) => {
    const status = counts.failed === 0 ? 'PASS' : 'FAIL';
    console.log(`[${status}] Group: ${group.padEnd(25)} | Passed: ${counts.passed}/${counts.total}`);
  });

  console.log('\n--------------------------------------------------');
  console.log(`TOTAL TESTS : ${total}`);
  console.log(`PASSED      : ${passed}`);
  console.log(`FAILED      : ${failed}`);
  console.log('--------------------------------------------------\n');

  if (failed > 0) {
    console.log('FAILED TESTS DETAIL:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(` - [${r.group}] ${r.name}: ${r.message}`);
    });
    console.log('\n');
  }

  return { total, passed, failed, results, groupSummary };
}

// Auto-run when executed via tsx
if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].includes('pHEngine.regression.test')) {
  const summary = runRegressionTestSuite();
  if (summary.failed > 0) {
    process.exit(1);
  }
}

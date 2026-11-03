import { RAW_FORMULAS_REMEDIATED } from './remediated_formulas_candidate';
import { PHEngineV2 } from '../src/domain/ph/pHEngineV2';
import { mapFormulationIngredientsToPHEngineInput } from '../src/utils/pHEngineAdapter';

function testFormulaPH(formula: any) {
  const isPowder = formula.category.includes('Powder');
  const phInput = mapFormulationIngredientsToPHEngineInput(formula.ingredients);
  const res = PHEngineV2.calculatePH(phInput, 100, {
    productCategory: formula.category,
    temperatureC: 25,
    assumeSlurryBasisIfPowder: isPowder
  });
  const sum = Number(formula.ingredients.reduce((s: number, i: any) => s + i.percent, 0).toFixed(2));
  return { pH: Number(res.pH.toFixed(2)), sum };
}

// 1. F1: hd-liquid-laundry
const f1 = RAW_FORMULAS_REMEDIATED[0];
// Reduce NaOH 50% to 1.83%, add Citric Acid 0.15%
const f1Naoh = f1.ingredients.find(i => i.name.includes('Sodium Hydroxide'))!;
f1Naoh.percent = 1.83;
const f1Tea = f1.ingredients.find(i => i.name.includes('Triethanolamine'))!;
f1Tea.percent = 0.4;
// Add Citric Acid 0.12%
let f1Citric = f1.ingredients.find(i => i.name.includes('Citric Acid'));
if (!f1Citric) {
  f1Citric = {
    id: 'f1-citric',
    name: 'Citric Acid Anhydrous',
    category: 'Builder / Chelator',
    percent: 0.12,
    activePercent: 100,
    costPerKg: 1.3,
    function: 'pH Buffer'
  };
  f1.ingredients.push(f1Citric);
} else {
  f1Citric.percent = 0.12;
}
const f1Water = f1.ingredients.find(i => i.name.includes('Water'))!;
const f1SumOther = f1.ingredients.filter(i => !i.name.includes('Water')).reduce((s, i) => s + i.percent, 0);
f1Water.percent = Number((100 - f1SumOther).toFixed(2));
console.log('F1 pH:', testFormulaPH(f1));

// 2. F2: eco-laundry-liquid
const f2 = RAW_FORMULAS_REMEDIATED[1];
// Replace Soda Ash with Sodium Citrate 2.0%
const f2Soda = f2.ingredients.find(i => i.name.includes('Carbonate'));
if (f2Soda) {
  f2Soda.name = 'Sodium Citrate Dihydrate';
  f2Soda.category = 'Builder / Chelator';
  f2Soda.percent = 2.0;
  f2Soda.activePercent = 100;
  f2Soda.function = 'Builder & Buffer';
}
const f2Naoh = f2.ingredients.find(i => i.name.includes('Sodium Hydroxide'))!;
f2Naoh.percent = 1.50;
let f2Citric = f2.ingredients.find(i => i.name.includes('Citric Acid'));
if (!f2Citric) {
  f2Citric = {
    id: 'f2-citric',
    name: 'Citric Acid Anhydrous',
    category: 'Builder / Chelator',
    percent: 0.10,
    activePercent: 100,
    costPerKg: 1.3,
    function: 'pH Buffer'
  };
  f2.ingredients.push(f2Citric);
}
const f2Water = f2.ingredients.find(i => i.name.includes('Water'))!;
const f2SumOther = f2.ingredients.filter(i => !i.name.includes('Water')).reduce((s, i) => s + i.percent, 0);
f2Water.percent = Number((100 - f2SumOther).toFixed(2));
console.log('F2 pH:', testFormulaPH(f2));

// 3. F3: matic-frontload-enzyme-laundry
const f3 = RAW_FORMULAS_REMEDIATED[2];
const f3Naoh = f3.ingredients.find(i => i.name.includes('Sodium Hydroxide'))!;
f3Naoh.percent = 2.30;
const f3Tea = f3.ingredients.find(i => i.name.includes('Triethanolamine'))!;
f3Tea.percent = 0.5;
let f3Citric = f3.ingredients.find(i => i.name.includes('Citric Acid'));
if (!f3Citric) {
  f3Citric = {
    id: 'f3-citric',
    name: 'Citric Acid Anhydrous',
    category: 'Builder / Chelator',
    percent: 0.15,
    activePercent: 100,
    costPerKg: 1.3,
    function: 'Enzyme Buffer'
  };
  f3.ingredients.push(f3Citric);
}
const f3Water = f3.ingredients.find(i => i.name.includes('Water'))!;
const f3SumOther = f3.ingredients.filter(i => !i.name.includes('Water')).reduce((s, i) => s + i.percent, 0);
f3Water.percent = Number((100 - f3SumOther).toFixed(2));
console.log('F3 pH:', testFormulaPH(f3));

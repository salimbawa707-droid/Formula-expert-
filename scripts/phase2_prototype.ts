import { FORMULAS } from '../src/data/formulas';
import { PHEngineV2 } from '../src/domain/ph/pHEngineV2';
import { mapFormulationIngredientsToPHEngineInput } from '../src/utils/pHEngineAdapter';

// Test Formula 1: hd-liquid-laundry stoichiometric neutralization
const f1 = JSON.parse(JSON.stringify(FORMULAS[0]));
console.log('Original Formula 1:', f1.name);

// In F1, LABSA is 8.0% (96% active = 7.68% active). MW = 326.49.
// Moles of LABSA acid = 7.68 / 326.49 = 0.023523 mol / 100g.
// Stoichiometric pure NaOH required = 0.023523 * 40.0 = 0.9409 g.
// In 50% caustic soda lye: 0.9409 / 0.50 = 1.8818% NaOH 50%.
// Currently, F1 has 2.1% NaOH 50% AND 1.5% TEA 99%!
// Let's adjust NaOH 50% to 1.88% and TEA to 0.5% (or 0.8% Citric Acid buffer, 70.12% water):
const f1Ings = f1.ingredients;
const naoh = f1Ings.find((i: any) => i.name.includes('Sodium Hydroxide'));
const tea = f1Ings.find((i: any) => i.name.includes('Triethanolamine'));
const water = f1Ings.find((i: any) => i.name.includes('Water'));

if (naoh) naoh.percent = 1.88;
if (tea) tea.percent = 0.50; // mild alkalinity reserve
// Rebalance water to sum exactly 100%
const sumOther = f1Ings.filter((i: any) => !i.name.includes('Water')).reduce((s: number, i: any) => s + (i.percent ?? 0), 0);
if (water) water.percent = Number((100 - sumOther).toFixed(2));

const phInput1 = mapFormulationIngredientsToPHEngineInput(f1Ings);
const res1 = PHEngineV2.calculatePH(phInput1, 100, { productCategory: 'LAUNDRY_LIQUID', temperatureC: 25 });
console.log('F1 New pH:', res1.pH, 'Water %:', water?.percent, 'Total %:', f1Ings.reduce((s: number, i: any) => s + (i.percent ?? 0), 0));

import { PHEngineV2 } from '../src/domain/ph/pHEngineV2';
import { mapFormulationIngredientsToPHEngineInput } from '../src/utils/pHEngineAdapter';
import * as fs from 'fs';

const formulas = JSON.parse(fs.readFileSync('scripts/tuned_39_formulas.json', 'utf8'));

function testPH(f: any, cat: string) {
  const isPowder = cat.includes('Powder');
  const phInput = mapFormulationIngredientsToPHEngineInput(f.ingredients);
  const res = PHEngineV2.calculatePH(phInput, 100, {
    productCategory: cat,
    temperatureC: 25,
    assumeSlurryBasisIfPowder: isPowder
  });
  return Number(res.pH.toFixed(2));
}

// 1. F2: eco-laundry-liquid (target 7.5 - 9.5)
const f2 = formulas[1];
let f2Cit = f2.ingredients.find((i: any) => i.name.includes('Citric'));
if (!f2Cit) {
  f2Cit = { id: 'f2-cit', name: 'Citric Acid Anhydrous', category: 'Builder / Chelator', percent: 0.1, activePercent: 100, costPerKg: 1.3, function: 'pH Buffer' };
  f2.ingredients.push(f2Cit);
}
for (let naoh = 1.45; naoh <= 1.55; naoh += 0.01) {
  for (let cit = 0.05; cit <= 0.30; cit += 0.05) {
    f2.ingredients.find((i: any) => i.name.includes('Sodium Hydroxide')).percent = Number(naoh.toFixed(2));
    f2Cit.percent = Number(cit.toFixed(2));
    const ph = testPH(f2, 'LAUNDRY_LIQUID');
    if (ph >= 7.8 && ph <= 9.2) {
      console.log(`F2 match: naoh=${naoh.toFixed(2)}, cit=${cit.toFixed(2)} -> pH=${ph}`);
      break;
    }
  }
}

// 2. F7: manual-dishwash-gel (target 6.0 - 8.0)
const f7 = formulas[6];
for (let naoh = 1.10; naoh <= 1.35; naoh += 0.02) {
  for (let cit = 0.2; cit <= 0.6; cit += 0.1) {
    f7.ingredients.find((i: any) => i.name.includes('Sodium Hydroxide')).percent = Number(naoh.toFixed(2));
    f7.ingredients.find((i: any) => i.name.includes('Citric Acid')).percent = Number(cit.toFixed(2));
    const ph = testPH(f7, 'DISHWASH_MANUAL');
    if (ph >= 6.4 && ph <= 7.4) {
      console.log(`F7 match: naoh=${naoh.toFixed(2)}, cit=${cit.toFixed(2)} -> pH=${ph}`);
      break;
    }
  }
}

// 3. F8: eco-lime-dishwash-gel (target 6.0 - 8.0)
const f8 = formulas[7];
let f8Cit = f8.ingredients.find((i: any) => i.name.includes('Citric Acid'));
if (!f8Cit) {
  f8Cit = { id: 'f8-cit', name: 'Citric Acid Anhydrous', category: 'Builder / Chelator', percent: 0.05, activePercent: 100, costPerKg: 1.3, function: 'pH Buffer' };
  f8.ingredients.push(f8Cit);
}
for (let naoh = 1.05; naoh <= 1.15; naoh += 0.01) {
  for (let cit = 0.01; cit <= 0.10; cit += 0.02) {
    f8.ingredients.find((i: any) => i.name.includes('Sodium Hydroxide')).percent = Number(naoh.toFixed(2));
    f8Cit.percent = Number(cit.toFixed(2));
    const ph = testPH(f8, 'DISHWASH_MANUAL');
    if (ph >= 6.4 && ph <= 7.4) {
      console.log(`F8 match: naoh=${naoh.toFixed(2)}, cit=${cit.toFixed(2)} -> pH=${ph}`);
      break;
    }
  }
}

// 4. F10: auto-dish-liquid (target 8.5 - 11.5)
const f10 = formulas[9];
f10.ingredients = f10.ingredients.filter((i: any) => !i.name.includes('Potassium Hydroxide'));
for (let sil = 2; sil <= 8; sil += 1) {
  f10.ingredients.find((i: any) => i.name.includes('Sodium Silicate')).percent = sil;
  const ph = testPH(f10, 'DISHWASH_AUTOMATIC');
  console.log(`F10 sil=${sil} -> pH=${ph}`);
  if (ph >= 9.0 && ph <= 11.2) {
    console.log(`F10 match: sil=${sil} -> pH=${ph}`);
    break;
  }
}

// 5. F15: multi-surface-lavender-floor (target 6.5 - 9.5)
const f15 = formulas[14];
for (let cit = 0.08; cit <= 0.25; cit += 0.02) {
  f15.ingredients.find((i: any) => i.name.includes('Citric Acid')).percent = Number(cit.toFixed(2));
  const ph = testPH(f15, 'FLOOR_CLEANER');
  if (ph >= 7.0 && ph <= 8.5) {
    console.log(`F15 match: cit=${cit.toFixed(2)} -> pH=${ph}`);
    break;
  }
}

// 6. F25: anti-fog-glass-cleaner (target 8.5 - 10.5)
const f25 = formulas[24];
for (let nh3 = 0.01; nh3 <= 0.10; nh3 += 0.01) {
  f25.ingredients.find((i: any) => i.name.includes('Ammonium Hydroxide')).percent = Number(nh3.toFixed(2));
  const ph = testPH(f25, 'GLASS_CLEANER');
  if (ph >= 9.0 && ph <= 10.2) {
    console.log(`F25 match: nh3=${nh3.toFixed(2)} -> pH=${ph}`);
    break;
  }
}

// 7. F26: ammonia-free-eco-glass (target 8.5 - 10.5)
const f26 = formulas[25];
for (let bicarb = 0.2; bicarb <= 1.0; bicarb += 0.1) {
  const bIng = f26.ingredients.find((i: any) => i.name.includes('Sodium Bicarbonate'));
  if (bIng) bIng.percent = Number(bicarb.toFixed(2));
  const ph = testPH(f26, 'GLASS_CLEANER');
  if (ph >= 8.6 && ph <= 9.8) {
    console.log(`F26 match: bicarb=${bicarb.toFixed(2)} -> pH=${ph}`);
    break;
  }
}

// 8. F27: economy-blue-window-spray (target 8.5 - 10.5)
const f27 = formulas[26];
for (let nh3 = 0.01; nh3 <= 0.10; nh3 += 0.01) {
  f27.ingredients.find((i: any) => i.name.includes('Ammonium Hydroxide')).percent = Number(nh3.toFixed(2));
  const ph = testPH(f27, 'GLASS_CLEANER');
  if (ph >= 9.0 && ph <= 10.2) {
    console.log(`F27 match: nh3=${nh3.toFixed(2)} -> pH=${ph}`);
    break;
  }
}

// 9. F37: touchless-snow-foam-car-shampoo (target 9.5 - 11.5)
const f37 = formulas[36];
const meta = f37.ingredients.find((i: any) => i.name.includes('Sodium Metasilicate'));
if (meta) {
  meta.name = 'Sodium Bicarbonate';
  meta.category = 'Alkaline Builder';
  meta.percent = 1.5;
  meta.function = 'pH Buffer';
}
const ash = f37.ingredients.find((i: any) => i.name.includes('Sodium Carbonate'));
if (ash) ash.percent = 1.5;
const ph37 = testPH(f37, 'CAR_SHAMPOO');
console.log(`F37 buffer -> pH=${ph37}`);

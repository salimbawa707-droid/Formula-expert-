import { FORMULAS } from '../src/data/formulas';

for (let i = 0; i < FORMULAS.length; i++) {
  const f = FORMULAS[i];
  console.log(`\n======================================================`);
  console.log(`[${i+1}] ${f.id} (${f.category}) - Target pH: ${f.targetPH}`);
  console.log(`======================================================`);
  for (const ing of f.ingredients) {
    console.log(`  - ${ing.name}: ${ing.percent}% (active: ${ing.activePercent}%, cat: ${ing.category})`);
  }
}

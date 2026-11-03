import { FORMULAS } from '../src/data/formulas';
import { CHEMICAL_SPECIES_REGISTRY, classifyChemicalSpecies } from '../src/domain/ph/chemicalSpeciesRegistry';
import { CHEMICALS } from '../src/data/chemicals';
import { getAllUniversalIngredients } from '../src/data/universalIngredientLibrary';

const allUniv = getAllUniversalIngredients();
const univNames = new Set(allUniv.map(i => i.name.toLowerCase().trim()));
const univIncis = new Set(allUniv.map(i => (i.inciName || '').toLowerCase().trim()));
const chemNames = new Set(CHEMICALS.map(c => c.name.toLowerCase().trim()));

let totalSlots = 0;
const uniqueFormulaIngs = new Set<string>();
const unclassifiedSpecies = new Set<string>();
const missingInUniv = new Set<string>();
const missingInChem = new Set<string>();

for (const f of FORMULAS) {
  for (const ing of (f.ingredients || [])) {
    totalSlots++;
    const name = (ing.name || (ing as any).ingredientName || '').trim();
    uniqueFormulaIngs.add(name);
    const lName = name.toLowerCase();

    const species = classifyChemicalSpecies(name);
    if (!species) {
      unclassifiedSpecies.add(name);
    }

    if (!univNames.has(lName) && !univIncis.has(lName)) {
      missingInUniv.add(name);
    }
    if (!chemNames.has(lName)) {
      missingInChem.add(name);
    }
  }
}

console.log('Total formula ingredient slots:', totalSlots);
console.log('Unique formula ingredient names:', uniqueFormulaIngs.size);
console.log('Unclassified in Species Registry:', unclassifiedSpecies.size);
console.log('Missing in Universal Library:', missingInUniv.size);
console.log('Missing in Chemicals Database:', missingInChem.size);
if (unclassifiedSpecies.size > 0) {
  console.log('Unclassified species:', Array.from(unclassifiedSpecies));
}

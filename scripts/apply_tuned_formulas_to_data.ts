import * as fs from 'fs';

const tuned = JSON.parse(fs.readFileSync('scripts/tuned_39_formulas.json', 'utf8'));

// Default manufacturing instructions generator based on category/form
for (const f of tuned) {
  if (!f.instructions || !Array.isArray(f.instructions) || f.instructions.length === 0) {
    if (f.category.includes('Powder')) {
      f.instructions = [
        'Charge ribbon blender with dense soda ash, zeolite, and builders.',
        'Spray neutralized acid slurry and liquid silicates uniformly under continuous agitation.',
        'Post-dose active oxygen bleach, TAED activator, and enzymes at ambient temperature.',
        'Homogenize until moisture content is within specification.'
      ];
    } else {
      f.instructions = [
        'Charge processing vessel with demineralized water and initiate low-shear mechanical agitation.',
        'Incorporate chelators, neutralizers, and buffers until completely dissolved.',
        'Add primary and secondary surfactants sequentially, avoiding excessive aeration.',
        'Incorporate functional additives, preservatives, and perfume compounds.',
        'Verify finished product pH and viscosity against quality gate specifications.'
      ];
    }
  }
}

const content = `import { FormulaItem } from '../types';
import { normalizeProductCategory, getProductCategoryLabel, ProductCategoryId } from '../domain/productTaxonomy';
import { evaluateScientificQualityGate } from '../utils/scientificQualityGateEngine';

const RAW_FORMULAS: FormulaItem[] = ${JSON.stringify(tuned, null, 2)};

export const FORMULAS: FormulaItem[] = RAW_FORMULAS.map((f) => {
  const normId = normalizeProductCategory(f.category);
  const categoryId: ProductCategoryId = normId === 'UNKNOWN_PRODUCT_CATEGORY' ? 'LAUNDRY_LIQUID' : normId;
  
  let derivedStatus = 'SCIENTIFIC_VALIDATION_REQUIRED';
  try {
    const gateReport = evaluateScientificQualityGate({
      ingredients: f.ingredients,
      productCategory: f.category,
      formulaName: f.name,
      formulaVersion: f.version || '1.0.0'
    });
    derivedStatus = gateReport.finalFormulaStatus;
  } catch (e) {
    derivedStatus = 'SCIENTIFIC_VALIDATION_REQUIRED';
  }

  return {
    ...f,
    categoryId,
    category: getProductCategoryLabel(categoryId),
    version: f.version || '1.0.0',
    status: derivedStatus,
    legacyStatus: f.status
  };
});
`;

fs.writeFileSync('src/data/formulas.ts', content, 'utf8');
console.log('Successfully re-saved src/data/formulas.ts with instructions and full typing!');

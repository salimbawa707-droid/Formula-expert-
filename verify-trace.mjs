import {
  getAllUniversalIngredients,
  searchUniversalIngredients,
  getAllCategories,
  getUniversalIngredientsByCategory
} from './src/data/universalIngredientLibrary.ts';
const all = getAllUniversalIngredients();
console.log('MASTER DB total entries:', all.length);
console.log('Categories:', getAllCategories().length);
console.log('Search "LABSA":', searchUniversalIngredients('LABSA').length, 'hits');
console.log('Search "sles":', searchUniversalIngredients('sles').length, 'hits');
console.log('Search "capb":', searchUniversalIngredients('capb').length, 'hits');
console.log('Search "" (no query):', searchUniversalIngredients('').length, 'hits');
console.log('By category "Anionic Surfactants":', getUniversalIngredientsByCategory('Anionic Surfactants').length);
console.log('By category "Alkalis":', getUniversalIngredientsByCategory('Alkalis').length);
console.log('By category "Chelators":', getUniversalIngredientsByCategory('Chelators').length);

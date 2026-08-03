import { getAllUniversalIngredients, getAllCategories } from './src/data/universalIngredientLibrary.ts';
const all = getAllUniversalIngredients();
console.log('Total ingredients:', all.length);
console.log('Categories:', getAllCategories().length);
console.log('Sample first 5:', all.slice(0,5).map(i => i.name).join(' | '));

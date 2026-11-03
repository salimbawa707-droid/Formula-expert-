import { ResearchedIngredientResolver } from './researchedIngredientResolver';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`ResearchedIngredientResolver test failed: ${message}`);
}

const resolver = new ResearchedIngredientResolver();
assert(resolver.resolveLocal('SLES') !== null, 'known local ingredient should resolve locally');
assert(resolver.resolveLocal('Some Never Listed Chemical XYZ') === null, 'unknown ingredient must not resolve as local');

console.log('ResearchedIngredientResolver smoke tests passed.');

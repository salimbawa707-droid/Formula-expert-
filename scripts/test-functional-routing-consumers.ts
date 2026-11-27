import assert from 'node:assert/strict';
import { getIngredientsByMajorCategory } from '../src/data/rawMaterialCategories';
import { getCategorySpecificIngredients } from '../src/components/CategoryIngredientSelector';
import { resolveFormulaIntelligenceRouting, resolveFunctionalRouting } from '../src/data/ingredientFunctionalRouting';
import { resolveFunctionalCompatibilityMatrixPair } from '../src/data/chemicals';
import { calculateFormulationCompatibility } from '../src/utils/compatibilityEngine';
import { resolveEng002PureComponent } from '../src/utils/eng002InputProvenance';

const ionicAmphoteric = getIngredientsByMajorCategory('ionic','amphoteric');
const ionicAnionic = getIngredientsByMajorCategory('ionic','anionic');
const nonionic = getIngredientsByMajorCategory('nonionic');
assert(ionicAmphoteric.some(i => i.id === 'lauryl-amine-oxide'), 'amine oxide must appear in ionic/amphoteric-family selector');
assert(ionicAmphoteric.some(i => i.id === 'capb-30-uni'), 'CAPB must remain in amphoteric selector');
assert(!nonionic.some(i => i.id === 'lauryl-amine-oxide'), 'pH-dependent amine oxide must not be duplicated as generic nonionic');
assert(nonionic.some(i => i.id === 'apg-0810'), 'APG must remain nonionic');
assert(ionicAnionic.some(i => i.id === 'sles-70'), 'SLES must remain anionic');
assert(ionicAnionic.some(i => i.id === 'aos-38') && ionicAnionic.some(i => i.id === 'aos-92'), 'AOS liquid and powder must route as anionic UVCB surfactant grades');
assert(ionicAnionic.some(i => i.id === 'sas-60'), 'SAS 60 must route as anionic secondary alkane sulfonate');
assert(ionicAnionic.some(i => i.id === 'sarcosinate-30'), 'sodium lauroyl sarcosinate must route as pH-dependent anionic surfactant');
assert(nonionic.some(i => i.id === 'cdea-85') && nonionic.some(i => i.id === 'cmea-90'), 'Cocamide DEA/MEA must route as nonionic alkanolamides');
const amphotericQuickFilter = getCategorySpecificIngredients('Amphoteric Surfactant');
const nonionicQuickFilter = getCategorySpecificIngredients('Nonionic Surfactant');
assert(amphotericQuickFilter.some(i => i.id === 'lauryl-amine-oxide'), 'quick selector must route amine oxide into pH-dependent ionic family');
assert(!nonionicQuickFilter.some(i => i.id === 'lauryl-amine-oxide'), 'quick selector must not duplicate amine oxide in generic nonionic category');

const ldaoIntelligence = resolveFormulaIntelligenceRouting('lauryl-amine-oxide');
assert.equal(ldaoIntelligence?.chargeLabel, 'Amine Oxide (pH-dependent)');
assert.equal(ldaoIntelligence?.hlbEligible, false);
assert.equal(resolveFormulaIntelligenceRouting('tallow-amine-oxide')?.identityBlocked, true);
assert.equal(resolveFormulaIntelligenceRouting('tallow-amine-oxide')?.chargeLabel, 'Unresolved — blocked');

const ldaoSles = resolveFunctionalCompatibilityMatrixPair('lauryl-amine-oxide','Nonionic Surfactant','sles-70','Anionic Surfactant');
assert.equal(ldaoSles?.status, 'REQUIRES_COMPATIBILITY_TEST');
const nameOnlyPair = resolveFunctionalCompatibilityMatrixPair('', 'Nonionic Surfactant', '', 'Anionic Surfactant', 'Lauryl Amine Oxide 30% (LDAO)', 'SLES 70% (Sodium Lauryl Ether Sulfate)');
assert.equal(nameOnlyPair?.status, 'REQUIRES_COMPATIBILITY_TEST', 'exact catalog names must resolve when formula payload omits canonical IDs');
const tallowSles = resolveFunctionalCompatibilityMatrixPair('tallow-amine-oxide','Polymer & Thickener','sles-70','Anionic Surfactant');
assert.equal(tallowSles?.status, 'INSUFFICIENT_DATA');
const anionicCationic = resolveFunctionalCompatibilityMatrixPair('sles-70','Anionic Surfactant','esterquat-90','Cationic Surfactant');
assert.equal(anionicCationic?.compatible, false);

const ldaoFormula = calculateFormulationCompatibility([
  { name:'Lauryl Amine Oxide 30% (LDAO)', category:'Nonionic Surfactant', percentage:5 } as any,
  { name:'SLES 70% (Sodium Lauryl Ether Sulfate)', category:'Anionic Surfactant', percentage:10 } as any
], 7, 'LAUNDRY_LIQUID');
assert(ldaoFormula.alerts.some(a => a.id === 'ph-dependent-surfactant-compatibility-test'));
assert(!ldaoFormula.alerts.some(a => a.id === 'anionic-cationic-incompatibility'), 'amine oxide must not be treated as fixed cationic/anionic charge');

const blockedFormula = calculateFormulationCompatibility([
  { id:'tallow-amine-oxide', canonicalIngredientId:'tallow-amine-oxide', name:'Tallow Amine Oxide Acid Thickener', category:'Polymer & Thickener', percentage:2 } as any
], 2, 'BATHROOM_CLEANER');
assert.equal(blockedFormula.compatible, false);
assert.equal(blockedFormula.compatibilityStatusSemantic, 'INSUFFICIENT_DATA');
assert.equal(blockedFormula.evidenceStatus, 'INSUFFICIENT_DATA');
assert(blockedFormula.alerts.some(a => a.id === 'identity-unresolved-compatibility-block'));

const lignoSoftener = calculateFormulationCompatibility([
  { id:'lignosulfonate-na', canonicalIngredientId:'lignosulfonate-na', name:'Sodium Lignosulfonate', category:'Anionic Surfactant', percentage:2 } as any,
  { id:'esterquat-90', name:'Esterquat 90%', category:'Cationic Surfactant', percentage:8 } as any
], 4, 'FABRIC_SOFTENER');
assert(lignoSoftener.alerts.some(a => a.id === 'anionic-cationic-incompatibility'), 'anionic polymeric dispersant must remain visible to ionic clash screening');
assert(!lignoSoftener.alerts.some(a => a.id === 'softener-anionic-contamination'), 'polymeric dispersant must not be counted as primary anionic surfactant for category policy');
assert.equal(resolveFunctionalRouting('lignosulfonate-na')?.role, 'POLYMERIC_DISPERSANT');
const ldaoNameOnlyCmc = resolveEng002PureComponent({ name:'Lauryl Amine Oxide 30% (LDAO)', casNumber:'1643-20-5', identityType:'SINGLE_SUBSTANCE' } as any);
assert.equal(ldaoNameOnlyCmc.supported, false, 'name-only commercial amine oxide must not inherit pure C12 DDAO CMC');
const lignoNameOnlyCmc = resolveEng002PureComponent({ name:'Sodium Lignosulfonate', casNumber:'8061-51-6', identityType:'SINGLE_SUBSTANCE' } as any);
assert.equal(lignoNameOnlyCmc.supported, false, 'polymeric dispersant must not inherit pure-surfactant CMC');

console.log('FUNCTIONAL ROUTING SELECTOR / MATRIX / FORMULA INTELLIGENCE CONSUMERS PASS');

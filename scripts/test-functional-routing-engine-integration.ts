import assert from 'node:assert/strict';
import { ActiveMatterEngine } from '../src/utils/activeMatterEngine';
import { HLBEngine } from '../src/utils/hlbEngine';
import { resolveEng002PureComponent } from '../src/utils/eng002InputProvenance';

const ingredient = (id: string, name: string, category: string, casNumber: string, extra: Record<string, unknown> = {}) => ({
  id, canonicalIngredientId: id, name, category, casNumber, percentage: 5, ...extra
}) as any;

const sls = ingredient('sls-needles','SLS 95% Needles (Sodium Lauryl Sulfate)','Anionic Surfactant','151-21-3');
const aos = ingredient('aos-38','AOS 38% Liquid (Alpha Olefin Sulfonate)','Anionic Surfactant','68439-57-6');
const ldao = ingredient('lauryl-amine-oxide','Lauryl Amine Oxide 30%','Nonionic Surfactant','1643-20-5');
const ligno = ingredient('lignosulfonate-na','Sodium Lignosulfonate','Anionic Surfactant','8061-51-6');
const tallow = ingredient('tallow-amine-oxide','Tallow Amine Oxide Acid Thickener','Polymer & Thickener','61791-26-2');

const aosActive = ActiveMatterEngine.resolveIngredientActive(aos);
assert.equal(aosActive.isSurfactant, true);
assert.equal(aosActive.surfactantType, 'anionic');
const slsActive = ActiveMatterEngine.resolveIngredientActive(sls);
assert.equal(slsActive.isSurfactant, true);
assert.equal(slsActive.surfactantType, 'anionic');
const ldaoActive = ActiveMatterEngine.resolveIngredientActive(ldao);
assert.equal(ldaoActive.isSurfactant, true);
assert.equal(ldaoActive.surfactantType, 'amphoteric');
const lignoActive = ActiveMatterEngine.resolveIngredientActive(ligno);
assert.equal(lignoActive.isSurfactant, false);
assert.equal(lignoActive.surfactantType, 'none');
const tallowActive = ActiveMatterEngine.resolveIngredientActive(tallow);
assert.equal(tallowActive.activeMatterPct, null);
assert.equal(tallowActive.isSurfactant, false);
assert.match(tallowActive.conflict?.message || '', /identity is unresolved/i);

const slsHlb = HLBEngine.resolveIngredientHLB(sls);
assert.equal(slsHlb.hlb, 40);
assert.equal(slsHlb.dataSource, 'estimated');
for (const material of [aos, ldao, ligno]) {
  const result = HLBEngine.resolveIngredientHLB(material);
  assert.equal(result.hlb, null, material.id + ' must not receive an unsupported HLB');
}
assert.equal(HLBEngine.resolveIngredientHLB(ldao).category, 'Amphoteric Surfactant');
const slesHlb = HLBEngine.resolveIngredientHLB(ingredient('sles-70','SLES 70% (Sodium Lauryl Ether Sulfate)','Anionic Surfactant','68585-34-2'));
assert.equal(slesHlb.hlb, 40);
assert.equal(slesHlb.dataSource, 'estimated', 'functional-route catalog HLB is a screening estimate, not supplier-verified');
const apgHlb = HLBEngine.resolveIngredientHLB(ingredient('apg-1214','APG 1214 (Lauryl Glucoside 50%)','Nonionic Surfactant','110615-47-9'));
assert.equal(apgHlb.hlb, 12.5);
assert.equal(apgHlb.dataSource, 'estimated');

assert.equal(resolveEng002PureComponent(sls).supported, true);
assert.equal(resolveEng002PureComponent(ldao).supported, false);
assert.equal(resolveEng002PureComponent(ligno).supported, false);
assert.equal(resolveEng002PureComponent(tallow).supported, false);
console.log('FUNCTIONAL ROUTING ENGINE INTEGRATION PASS');

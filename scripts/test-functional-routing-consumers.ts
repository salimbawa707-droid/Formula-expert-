import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { getIngredientsByMajorCategory } from '../src/data/rawMaterialCategories';
import { getCategorySpecificIngredients } from '../src/components/CategoryIngredientSelector';
import { resolveFormulaIntelligenceRouting, resolveFunctionalRouting } from '../src/data/ingredientFunctionalRouting';
import { traceCompatibilityReasoning } from '../src/utils/ingredientIntelligenceEngine';
import { evaluateExpertReasoning } from '../src/utils/expertReasoningEngine';
import { RAW_MATERIAL_CATEGORIES } from '../src/data/rawMaterialCategories';
import { classifyPowderIngredient } from '../src/utils/powderEngine/powderIngredientClassification';
import { ActiveMatterEngine } from '../src/utils/activeMatterEngine';
import { calculateMixedCMC } from '../src/utils/calculators';
import { resolveFunctionalCompatibilityMatrixPair } from '../src/data/chemicals';
import { calculateFormulationCompatibility } from '../src/utils/compatibilityEngine';
import { resolveEng002PureComponent } from '../src/utils/eng002InputProvenance';
import { isIngredientSurfactantByRouting } from '../src/data/ingredientFunctionalRouting';

const ionicAll = getIngredientsByMajorCategory('ionic','all');
assert(!ionicAll.some(i => i.id === 'tallow-amine-oxide'), 'blocked identity must not leak into the all-ionic category');
assert(isIngredientSurfactantByRouting({ name:'LABSA 90%' }, 'Anionic Surfactant'), 'governed LABSA route must remain a surfactant for analyzer KPI calculations');
assert(!isIngredientSurfactantByRouting({ id:'lignosulfonate-na', name:'Sodium Lignosulfonate' }, 'Anionic Surfactant'), 'polymeric dispersant must not be counted as primary surfactant in analyzer KPIs');
assert(!isIngredientSurfactantByRouting({ id:'tallow-amine-oxide', name:'Tallow Amine Oxide' }, 'Surfactant'), 'blocked identity route must override a legacy surfactant role');

const ionicAmphoteric = getIngredientsByMajorCategory('ionic','amphoteric');
const ionicAnionic = getIngredientsByMajorCategory('ionic','anionic');
const nonionic = getIngredientsByMajorCategory('nonionic');
assert(ionicAmphoteric.some(i => i.id === 'lauryl-amine-oxide'), 'amine oxide must appear in ionic/amphoteric-family selector');
assert(ionicAmphoteric.some(i => i.id === 'capb-30-uni'), 'CAPB must remain in amphoteric selector');
assert(!nonionic.some(i => i.id === 'lauryl-amine-oxide'), 'pH-dependent amine oxide must not be duplicated as generic nonionic');
assert(nonionic.some(i => i.id === 'apg-0810'), 'APG must remain nonionic');
assert(ionicAnionic.some(i => i.id === 'sles-70'), 'SLES must remain anionic');
assert(ionicAnionic.some(i => i.id === 'labsa-90') && ionicAnionic.some(i => i.id === 'labsa-96'), 'LABSA commercial acid grades must route by exact CAS+INCI identity as strong-acid anionic surfactants');
assert(ionicAnionic.some(i => i.id === 'aos-38') && ionicAnionic.some(i => i.id === 'aos-92'), 'AOS liquid and powder must route as anionic UVCB surfactant grades');
assert(ionicAnionic.some(i => i.id === 'sas-60'), 'SAS 60 must route as anionic secondary alkane sulfonate');
assert(ionicAnionic.some(i => i.id === 'sarcosinate-30'), 'sodium lauroyl sarcosinate must route as pH-dependent anionic surfactant');
assert(nonionic.some(i => i.id === 'cdea-85') && nonionic.some(i => i.id === 'cmea-90'), 'Cocamide DEA/MEA must route as nonionic alkanolamides');
const amphotericQuickFilter = getCategorySpecificIngredients('Amphoteric Surfactant');
const nonionicQuickFilter = getCategorySpecificIngredients('Nonionic Surfactant');
assert(amphotericQuickFilter.some(i => i.id === 'lauryl-amine-oxide'), 'quick selector must route amine oxide into pH-dependent ionic family');
assert(!nonionicQuickFilter.some(i => i.id === 'lauryl-amine-oxide'), 'quick selector must not duplicate amine oxide in generic nonionic category');
const ionicCategory = RAW_MATERIAL_CATEGORIES.find(c => c.id === 'ionic')!;
assert(ionicCategory.subcategories!.find(s => s.id === 'anionic')!.matches({ id:'sles-70', name:'SLES 70%', category:'Anionic Surfactant' } as any), 'ionic anionic pill must use governed route');
assert(ionicCategory.subcategories!.find(s => s.id === 'amphoteric')!.matches({ id:'lauryl-amine-oxide', name:'Lauryl Amine Oxide', category:'Nonionic Surfactant' } as any), 'amine oxide must appear in the governed pH-dependent ionic family');
assert(!ionicCategory.subcategories!.find(s => s.id === 'amphoteric')!.matches({ id:'tallow-amine-oxide', name:'Tallow Amine Oxide', category:'Polymer & Thickener' } as any), 'blocked identity must not leak into amphoteric selector');

const labsaIntelligence = resolveFormulaIntelligenceRouting('labsa-90');
assert.equal(labsaIntelligence?.chargeLabel, 'Anionic');
assert.equal(labsaIntelligence?.hlbEligible, false);
const sarcosinateIntelligence = resolveFormulaIntelligenceRouting('sarcosinate-30');
assert.equal(sarcosinateIntelligence?.chargeLabel, 'Anionic (pH-dependent)');
assert.equal(sarcosinateIntelligence?.hlbEligible, false);
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
const intelligenceClash = traceCompatibilityReasoning([
  { id:'sles-70', name:'SLES 70%', category:'Anionic Surfactant', percentage:10 } as any,
  { name:'Esterquat 90%', category:'Cationic Surfactant', percentage:5 } as any
], 'FABRIC_SOFTENER');
assert(intelligenceClash.some(f => f.findingCode === 'ERR_IONIC_CHARGE_INCOMPATIBILITY'), 'ingredient intelligence compatibility must consume governed anionic identity routing');
const intelligenceBlocked = traceCompatibilityReasoning([
  { id:'tallow-amine-oxide', name:'Tallow Amine Oxide Acid Thickener', category:'Polymer & Thickener', percentage:2 } as any
], 'LAUNDRY_LIQUID');
assert(intelligenceBlocked.some(f => f.findingCode === 'ERR_INGREDIENT_IDENTITY_UNRESOLVED' && f.severity === 'FATAL'), 'ingredient intelligence must block unresolved identity instead of trusting its display label');
const labsaCationicExpertReview = evaluateExpertReasoning({
  ingredients: [
    { name:'LABSA (Acid Slurry 90%)', category:'Anionic Surfactant', role:'Anionic Surfactant', percentage:5, activeMatterPct:90 } as any,
    { name:'Esterquat 90%', category:'Cationic Surfactant', role:'Cationic Surfactant', percentage:5, activeMatterPct:90 } as any
  ],
  productCategory:'FABRIC_SOFTENER'
});
assert(labsaCationicExpertReview.issues.some(issue => issue.id === 'anionic-cationic-conflict'), 'expert reasoning must classify aqueous LABSA as anionic even when its starting raw material is acid-form');
assert(!labsaCationicExpertReview.issues.some(issue => issue.id === 'ph-dependent-anionic-cationic-conditional'), 'strong-acid LABSA must not retain an unsupported pH-dependent charge warning');
const labsaCationicResolvedPH = evaluateExpertReasoning({
  ingredients: [
    { name:'LABSA (Acid Slurry 90%)', category:'Anionic Surfactant', role:'Anionic Surfactant', percentage:5, activeMatterPct:90 } as any,
    { name:'Esterquat 90%', category:'Cationic Surfactant', role:'Cationic Surfactant', percentage:5, activeMatterPct:90 } as any
  ],
  productCategory:'FABRIC_SOFTENER',
  calculatedPH:7.0
});
assert(labsaCationicResolvedPH.issues.some(issue => issue.id === 'anionic-cationic-conflict' && issue.severity === 'Critical'), 'neutralized LABSA remains anionic for opposite-charge screening');
assert(!labsaCationicResolvedPH.issues.some(issue => issue.id === 'ph-dependent-anionic-cationic-conditional'), 'LABSA route does not emit the sarcosinate pH-dependent warning');

const sarcosinateCationicExpertReview = evaluateExpertReasoning({
  ingredients: [
    { id:'sarcosinate-30', canonicalIngredientId:'sarcosinate-30', name:'Sodium Lauroyl Sarcosinate 30%', category:'Anionic Surfactant', role:'Anionic Surfactant', percentage:5, activeMatterPct:30 } as any,
    { name:'Esterquat 90%', category:'Cationic Surfactant', role:'Cationic Surfactant', percentage:5, activeMatterPct:90 } as any
  ],
  productCategory:'FABRIC_SOFTENER',
  calculatedPH:3.5
});
assert(sarcosinateCationicExpertReview.issues.some(issue => issue.id === 'ph-dependent-anionic-cationic-conditional'), 'expert reasoning must preserve sarcosinate pH-dependent speciation below the conservative pH threshold');
assert(!sarcosinateCationicExpertReview.issues.some(issue => issue.id === 'anionic-cationic-conflict'), 'expert reasoning must not force sarcosinate into fixed anionic bucket below the speciation threshold');

const analysisWorkflowSource = readFileSync('src/utils/analysisWorkflowEngine.ts', 'utf8');
const dagSource = readFileSync('src/utils/orchestrator/scientificExecutionDAG.ts', 'utf8');
assert(analysisWorkflowSource.includes('resolveFunctionalRoutingForIngredient'), 'analysis workflow charge breakdown must resolve governed functional identity');
assert(analysisWorkflowSource.includes('conditionalAmineOxidePct'), 'analysis workflow must expose pH-dependent amine oxide separately from fixed amphoteric totals');
assert(analysisWorkflowSource.includes('conditionalPHDependentAnionicPct'), 'analysis workflow must expose pH-dependent sarcosinate separately from fixed anionic totals');
const qualityGateSource = readFileSync('src/utils/scientificQualityGateEngine.ts', 'utf8');
assert(qualityGateSource.includes('resolveFunctionalRoutingForIngredient'), 'safety quality gates must consume governed functional identity');
const smartAnalyzerSource = readFileSync('src/components/SmartFormulaAnalyzerPro.tsx', 'utf8');
assert(smartAnalyzerSource.includes('hasConditionalAmineOxide'), 'formula fingerprint must label pH-dependent amine oxide separately');
const cleaningPerformanceSource = readFileSync('src/utils/cleaningPerformanceEngine.ts', 'utf8');
assert(cleaningPerformanceSource.includes('resolveFunctionalRoutingForIngredient'), 'cleaning performance charge distribution must consume governed identity');
assert(cleaningPerformanceSource.includes("route?.chargeBehavior === 'ZWITTERIONIC'"), 'cleaning performance must separate zwitterionic betaine from amine oxide');
assert(cleaningPerformanceSource.includes("route?.role === 'POLYMERIC_DISPERSANT'"), 'cleaning performance must not count anionic polymeric dispersant as primary surfactant active');
assert(analysisWorkflowSource.includes('isPolymericDispersant'), 'staged workflow must exclude polymeric dispersant from primary surfactant charge totals');
assert(dagSource.includes("route?.role === 'POLYMERIC_DISPERSANT'"), 'scientific DAG must exclude polymeric dispersant from primary surfactant charge totals');
assert(qualityGateSource.includes("route?.role === 'POLYMERIC_DISPERSANT'"), 'safety quality gates must not apply primary-surfactant policy to polymeric dispersant');
assert(dagSource.includes('resolveFunctionalRoutingForIngredient'), 'scientific execution DAG must consume governed identity for charge totals');
assert(dagSource.includes("route?.chargeBehavior === 'PH_DEPENDENT_ANIONIC'"), 'scientific DAG must preserve a separate pH-dependent anionic bucket for sarcosinate');
assert(dagSource.includes('conditionalPHDependentAnionicPct'), 'scientific DAG must expose pH-dependent anionic active separately');
assert(dagSource.includes('conditionalAmineOxidePct'), 'scientific DAG must expose pH-dependent amine oxide separately');
assert(dagSource.includes("dependencies: ['IDENTITY_RESOLUTION', 'PH_EQUILIBRIUM']"), 'DAG active-matter charge routing must wait for the pH equilibrium result');
const activeMatterSource = readFileSync('src/utils/activeMatterEngine.ts', 'utf8');
assert(activeMatterSource.includes("surfactantType: 'conditional'"), 'active matter engine must expose a separate conditional charge class');
assert(activeMatterSource.includes('conditionalActivePct'), 'active matter report must expose pH-dependent surfactant active matter separately');
assert(activeMatterSource.includes("routed?.chargeBehavior === 'PH_DEPENDENT_ANIONIC'"), 'sarcosinate charge must remain pH-dependent until the speciation threshold is reached');
const powderSource = readFileSync('src/utils/powderEngine/powderIngredientClassification.ts', 'utf8');
assert(powderSource.includes("functionalRoute?.role === 'IDENTITY_UNRESOLVED'"), 'powder classifier must fail closed on unresolved identity');
assert(blockedFormula.alerts.some(a => a.id === 'identity-unresolved-compatibility-block'));

const lignoSoftener = calculateFormulationCompatibility([
  { id:'lignosulfonate-na', canonicalIngredientId:'lignosulfonate-na', name:'Sodium Lignosulfonate', category:'Anionic Surfactant', percentage:2 } as any,
  { id:'esterquat-90', name:'Esterquat 90%', category:'Cationic Surfactant', percentage:8 } as any
], 4, 'FABRIC_SOFTENER');
assert(lignoSoftener.alerts.some(a => a.id === 'anionic-cationic-incompatibility'), 'anionic polymeric dispersant must remain visible to ionic clash screening');
assert(!lignoSoftener.alerts.some(a => a.id === 'softener-anionic-contamination'), 'polymeric dispersant must not be counted as primary anionic surfactant for category policy');
assert.equal(resolveFunctionalRouting('lignosulfonate-na')?.role, 'POLYMERIC_DISPERSANT');
const powderAmineOxide = classifyPowderIngredient({ id:'lauryl-amine-oxide', name:'Lauryl Amine Oxide 30% (LDAO)', category:'Nonionic Surfactant', percentage:2 } as any);
assert.equal(powderAmineOxide.functionalClass, 'Amphoteric Surfactant', 'powder route retains broad ionic-family classification for amine oxide');
const powderBlocked = classifyPowderIngredient({ id:'tallow-amine-oxide', name:'Tallow Amine Oxide Acid Thickener', category:'Polymer & Thickener', percentage:2 } as any);
assert.equal(powderBlocked.functionalClass, 'Unclassified Surfactant', 'powder classifier must not trust conflicting tallow-amine display name');
assert.equal(powderBlocked.activeMatterPct, undefined, 'blocked powder identity cannot inherit active-matter default');
const ldaoActiveResolution = ActiveMatterEngine.resolveIngredientActive({
  id:'lauryl-amine-oxide',
  name:'Lauryl Amine Oxide 30% (LDAO)',
  percentage:2,
  activeMatterPct:30
} as any);
assert.equal(ldaoActiveResolution.surfactantType, 'conditional', 'amine oxide active matter must retain a separate pH-dependent charge bucket');
const labsaActiveResolution = ActiveMatterEngine.resolveIngredientActive({ id:'labsa-90', name:'LABSA 90% (Acid Slurry)', percentage:2, activeMatterPct:90 } as any);
assert.equal(labsaActiveResolution.surfactantType, 'anionic', 'LABSA acid-form identity must resolve to aqueous anionic surfactant chemistry');
const sarcosinateActiveResolution = ActiveMatterEngine.resolveIngredientActive({ id:'sarcosinate-30', name:'Sodium Lauroyl Sarcosinate 30%', percentage:2, activeMatterPct:30 } as any);
assert.equal(sarcosinateActiveResolution.surfactantType, 'conditional', 'sarcosinate must retain pH-dependent carboxylate speciation');
const labsaNameOnlyResolution = ActiveMatterEngine.resolveIngredientActive({ name:'LABSA (Acid Slurry 90%)', percentage:2, activeMatterPct:90 } as any);
assert.equal(labsaNameOnlyResolution.surfactantType, 'anionic', 'name-only LABSA input must use the same strong-acid anionic route as canonical-ID input');
const labsaActiveReport = ActiveMatterEngine.calculateActiveMatterReport([{ id:'labsa-90', name:'LABSA 90% (Acid Slurry)', percentage:2, activeMatterPct:90 } as any], 1);
assert.equal(labsaActiveReport.surfactants.conditionalActivePct, 0);
assert.equal(labsaActiveReport.surfactants.anionicActivePct, 1.8, 'LABSA must be reported in the aqueous anionic active bucket');
const sarcosinateActiveReport = ActiveMatterEngine.calculateActiveMatterReport([{ id:'sarcosinate-30', name:'Sodium Lauroyl Sarcosinate 30%', percentage:2, activeMatterPct:30 } as any], 1);
assert.equal(sarcosinateActiveReport.surfactants.conditionalActivePct, 0.6);
assert.equal(sarcosinateActiveReport.surfactants.anionicActivePct, 0, 'sarcosinate must remain outside fixed anionic active until pH speciation is resolved');
const ldaoActiveReport = ActiveMatterEngine.calculateActiveMatterReport([{
  id:'lauryl-amine-oxide',
  name:'Lauryl Amine Oxide 30% (LDAO)',
  percentage:2,
  activeMatterPct:30
} as any], 1);
assert.equal(ldaoActiveReport.surfactants.conditionalActivePct, 0.6);
assert.equal(ldaoActiveReport.surfactants.amphotericActivePct, 0, 'amine oxide must not be counted as fixed zwitterionic betaine');
const ldaoNameOnlyCmc = resolveEng002PureComponent({ name:'Lauryl Amine Oxide 30% (LDAO)', casNumber:'1643-20-5', identityType:'SINGLE_SUBSTANCE' } as any);
assert.equal(ldaoNameOnlyCmc.supported, false, 'name-only commercial amine oxide must not inherit pure C12 DDAO CMC');
const lignoNameOnlyCmc = resolveEng002PureComponent({ name:'Sodium Lignosulfonate', casNumber:'8061-51-6', identityType:'SINGLE_SUBSTANCE' } as any);
assert.equal(lignoNameOnlyCmc.supported, false, 'polymeric dispersant must not inherit pure-surfactant CMC');
const ldaoMixedCmc = calculateMixedCMC([{
  id:'lauryl-amine-oxide',
  name:'Lauryl Amine Oxide 30% (LDAO)',
  category:'Nonionic Surfactant',
  percentage:5,
  activeMatterPct:30
} as any]);
assert.equal(ldaoMixedCmc.available, false, 'commercial amine oxide cannot enter pure-component mixed-CMC calculation without a supported exact reference');
const blockedMixedCmc = calculateMixedCMC([{
  id:'tallow-amine-oxide',
  canonicalIngredientId:'tallow-amine-oxide',
  name:'Tallow Amine Oxide Acid Thickener',
  category:'Polymer & Thickener',
  percentage:2,
  activeMatterPct:30
} as any]);
assert.equal(blockedMixedCmc.available, false);
assert(blockedMixedCmc.eligibilityReasons.some(reason => reason.includes('identity is unresolved')), 'mixed-CMC engine must explicitly block conflicting ingredient identity');

console.log('FUNCTIONAL ROUTING SELECTOR / MATRIX / FORMULA INTELLIGENCE CONSUMERS PASS');

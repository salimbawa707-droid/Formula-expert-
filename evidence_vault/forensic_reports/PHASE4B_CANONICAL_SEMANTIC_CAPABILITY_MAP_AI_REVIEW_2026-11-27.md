# Phase 4B — canonical semantic capability-to-module map (AI review)

**Audit date:** 2026-11-27  
**Reviewed branch:** `audit/evd014-022-final-disposition-2026-11-27`  
**Reviewed HEAD at start:** `385355352ee77ef73bbcb8892a37b0f511262b64`  
**Scope:** 93 broad discovery candidates from the previously reconciled source-tree inventory. This report is a semantic classification of inspected implementation families and high-impact entry points; it does not equate filenames with independent scientific models.

## 1. Executive disposition

The source tree contains several distinct kinds of capability that must not be counted as independent scientific predictors:

- **Physical/chemical calculations:** pH equilibrium, stoichiometric neutralization, active-matter mass balance, chelation capacity, density estimates, viscosity, HLB, dilution and other property calculations.
- **Empirical/statistical analysis:** foam time-series fitting, replicate statistics, prediction-vs-measurement error, empirical calibration and validation.
- **Rule-based screening/scoring:** compatibility, category performance scoring, quality gates, ingredient grading and substitution screening.
- **Evidence/governance:** laboratory evidence validation, provenance, LIMS promotion, scientific certainty and source governance.
- **Routing/orchestration/adapters:** category routers, pH adapters, analysis workflow, staged execution and dispatch wrappers.
- **Commercial/operational utilities:** costing, inventory, manufacturing and regulatory decision support.
- **UI/presentation:** React panels and dashboards; these are not engines.

**Decision:** the 93-candidate filename/path discovery set is not 93 scientific predictors. The semantic map separates implementation roles and identifies non-independent wrappers and measured-data-only modules. Phase 4B remains OPEN; Phase 5 remains LOCKED. No model is promoted to LAB_VALIDATED by this audit.

## 2. High-impact module map

| Module | Actual capability | Inputs / units | Outputs | Evidence / validation boundary | Classification |
|---|---|---|---|---|---|
| `src/domain/ph/pHEngineV2.ts` | Aqueous acid/base equilibrium and speciation solver; activity model selected by options | Ingredient mass/percentage, assay, temperature °C, composition and species registry | pH, convergence, residual, ionic strength, speciation, buffer capacity | Requires complete recognized composition and known assay; unknown species/assay withhold pH. Numerical convergence is not empirical accuracy. | Scientific equilibrium calculator |
| `src/domain/ph/stoichiometricNeutralizationEngine.ts` | Stoichiometric acid/base equivalent and neutralization calculations | Reagent mass, molar/equivalent weights, assay, batch mass | Acid/base equivalents, neutralization balance and related estimates | Stoichiometry depends on correct identity, assay, reaction stoichiometry and endpoint assumptions; not a substitute for measured pH. | Chemical calculator |
| `src/utils/pHEngine.ts` | Legacy/public pH calculation facade and ingredient database integration | Formulation ingredient inputs and pH options | Legacy/simple/advanced pH result shapes | Must be checked for duplicate/legacy paths against PHEngineV2; avoid independent competing pH truth sources. | Facade / legacy compatibility |
| `src/utils/pHEngineAdapter.ts` | Maps app formulation objects to pH solver contract; current implementation preserves full ingredient list | FormulationIngredient[] with percentage/assay fields | IngredientInput[] | Adapter must not drop unknown mass or infer missing percentage/assay. Full-mass pass-through now preserves solver fail-closed guard. | Adapter |
| `src/utils/activeMatterEngine.ts` | Raw-mass, active-matter, surfactant-class and carried-water mass balance | Raw dosage %/kg, batch kg, active assay %, ingredient identity/grade | Active mass %, carrier/water mass, surfactant-class totals | Depends on canonical grade identity and defensible active assay. Derived-from-name and explicit overrides are not equivalent to authoritative grade evidence. | Deterministic mass-balance calculator |
| `src/utils/chelatorEngine.ts` | Theoretical/commercial chelator capacity and water-hardness tolerance calculations | Capacity mg CaCO3/g, active matter %, dose, water hardness ppm, wash-volume assumptions | Effective capacity and hardness tolerance | A database capacity is not a finished-formula wash test. Evidence ID and active assay are required for capacity validation; hardness tolerance also needs dose and final wash conditions. | Chemistry calculator + evidence registry |
| `src/utils/cleaningPerformanceEngine.ts` | Category-specific rule/empirical score synthesis; consumes active matter, hardness tolerance and compatibility outputs | Formula composition, category, water hardness, optional lab measurements | Cleaning/performance KPI scores and warnings | Score is not a direct soil-removal prediction unless calibrated against matched category-specific test data. Inputs from upstream heuristic engines propagate their uncertainty. | Rule-based / hybrid scoring; not validated predictor |
| `src/utils/foamKineticsEngine.ts` | Descriptive fitting of supplied measured foam-height and bubble-area time series | Time s, foam height mm, optional liquid level mm, bubble area mm², caller-defined fit windows | Linear/log fits, R², observed half-height crossing | Explicitly measured-series-only. Does not predict foam generation/stability from recipe or surfactant identity. Half-height crossing is not a kinetic half-life for non-exponential decay. | Empirical data-analysis utility |
| `src/utils/compatibilityEngine.ts` | Rule-based chemical/physical/rheological compatibility screening | Ingredient identities/classes, pH, category, active surfactants and rule registry | Alerts, risk levels, compatibility score and storage-risk labels | “No known conflict” is not demonstrated compatibility. Scores need pairwise/category-specific stability datasets before empirical interpretation. | Rule-based screening |
| `src/utils/densityEngine.ts` | Composition density estimate from component density lookup and volume summation | Ingredient mass %, component density g/cm³, batch mass | Predicted density, component volume, specific gravity | Name-pattern density defaults and ideal volume additivity are approximations; no excess-volume/temperature model or finished-product pycnometer calibration is evidenced by this module. | Screening estimator |
| `src/utils/costingEngine.ts` | Exact arithmetic costing from user-entered prices and mass balance | Ingredient %, batch kg, user price ₹/kg | Batch cost, cost/kg, completeness and mass-balance status | Not a chemistry predictor. Correctness depends on input prices and formula completeness; partial pricing is explicitly surfaced. | Commercial calculator |
| `src/utils/formulationEngineRouter.ts` | Delegates product/powder routing to `scientificRouter` | Product category/type | Powder/liquid choice and delegated execution route | Contains no independent scientific model. Avoid double-counting with scientificRouter. | Wrapper/router |
| `src/utils/scientificRouter.ts` | Canonical category policy and engine routing decisions | ProductCategoryId, taxonomy/profile | Applicable engines, policies, domains and route map | Routing correctness depends on taxonomy/profile integrity; routing is not prediction. | Policy router |
| `src/utils/labEvidenceEngine.ts` | Measurement record validation, comparability, replicate stats, error analysis, category evidence gates and calibration proposals | Formula ID/version, category, KPI, numeric value/unit, provenance, test conditions and method | Validity, comparability, MAE/bias/MAPE summaries, promotion state | Metadata and matching rules are essential; accepted evidence is not automatically sufficient to validate every model. | Evidence / statistical validation infrastructure |
| `src/utils/empiricalCalibrationEngine.ts` | Grouped dataset split, leakage audit, calibration fit and frozen model version records | Formula fingerprints, batch IDs, predicted/actual values, category, units and methods | Calibration coefficients, MAE/R² and frozen model metadata | Must retain independent formula/batch holdout; calibration-set fit is not independent validation. | Empirical calibration infrastructure |
| `src/utils/empiricalValidationEvaluationEngine.ts` | Evaluates model performance against independent laboratory observations | Prediction/actual pairs, method, category, condition, model version | MAE/RMSE/bias/coverage and maturity state | Requires genuine matched holdout observations and scope-specific acceptance thresholds. | Empirical validation infrastructure |
| `src/utils/calibrationEngine.ts` | Generates/saves calibration candidate proposals; does not implement runtime model mutation | Category model validation summary | PROPOSED candidate records | `applyProposal` now correctly returns failure while mutation is unimplemented; no model parameter is changed. | Proposal workflow |
| `src/utils/refinementEngine.ts` | Generates ingredient-percentage adjustment proposals from measured records | Active ingredients and lab evidence records | Descriptive mean proposals | Current guard requires ingredient-specific measured percentage keys and >=3 formula/version pairs, but target product category is not passed and repeated observations within a formula/version can overweight that version. Cross-category or replicate-weighted proposals are not defensible. | Evidence-driven proposal logic; currently restricted / not production-safe |
| `src/utils/scientificQualityGateEngine.ts` | Deterministic quality-rule evaluation | Formula, ingredient, category and upstream result state | Blocking issues, warnings and readiness findings | Gate status is only as sound as the rule registry and upstream provenance. | Governance/rule engine |
| `src/utils/scientificGovernanceEngine.ts` | Governance registry and applicability constraints | Engine IDs, categories, evidence/rule metadata | Governance decisions and restrictions | Registry policy is not physical chemistry evidence. | Governance infrastructure |
| `src/utils/scientificDecisionEngine.ts` | Aggregates domain findings into decisions/recommendations | Multiple engine outputs and policy states | Decision summaries | Must preserve source provenance and uncertainty; aggregation cannot upgrade weak upstream evidence. | Decision orchestration |
| `src/utils/analysisWorkflowEngine.ts` | Coordinates staged analysis and calls domain modules | Formula, product category, user constraints and workflow options | Staged analysis report | Not an independent predictor; verify single execution per capability and no stale/fallback values. | Workflow orchestrator |
| `src/utils/ingredientIntelligenceEngine.ts` | Ingredient identity/knowledge interpretation and evidence-aware guidance | Ingredient records, aliases, properties and source metadata | Ingredient classification and knowledge findings | Database assertions must retain source, grade, jurisdiction and confidence; identity resolution is not performance validation. | Knowledge / data interpretation |
| `src/utils/hlbEngine.ts` | HLB calculation/selection support | Surfactant blend fractions and HLB values | Blend HLB and target matching | Griffin-style weighted HLB is only applicable where component HLB values and blend assumptions are valid; it does not prove emulsion stability. | Property calculator |
| `src/utils/viscosityEngine.ts` | Viscosity estimation/rheology screening with category and pH dependencies | Ingredient composition, surfactant/polymer/salt inputs, pH and options | Viscosity estimate/risk outputs | Salt curves and non-Newtonian rheology are system-specific; absent matched rheometer data, label as estimated/screening only. | Empirical/rule-based estimator |
| `src/utils/dilutionEngine.ts` | Dilution arithmetic | Concentration, volume/mass and dilution inputs | Diluted concentration/amount | Valid only under explicit mass/volume basis and density assumptions. | Arithmetic utility |
| `src/utils/gradeEngine.ts` | Ingredient/formula grading and score aggregation | Formula metrics and rules | Grade/score | Score is not a laboratory performance result; audit weights and category applicability separately. | Rule-based scoring |
| `src/utils/substitutionEngine.ts` | Candidate ingredient substitution logic | Ingredient identity, role, compatibility and category constraints | Substitution candidates | A suggested substitute is not equivalent performance without controlled equivalence testing. | Decision-support logic |
| `src/domain/regulatory/regulatoryComplianceEngine.ts` | Regulatory rule evaluation | Ingredient identity, concentration, use category and jurisdiction | Compliance findings | Requires current jurisdiction-specific source and exact scope; not chemical prediction. | Regulatory rules engine |
| `src/domain/regulatory/regulatoryTemporalEngine.ts` | Effective-date/version-aware regulatory rules | Rule dates, jurisdictions and product/use context | Temporal applicability decisions | Must not generalize one jurisdiction's restriction to another. | Regulatory temporal engine |
| `src/components/PHEngineView.tsx`, `PowderEngineDashboard.tsx`, `RCCalculators.tsx`, `FormulationLibrary.tsx` | UI and presentation of engine capabilities | User-entered state and computed results | UI displays and interactions | Not independent engines; must consume a single authoritative domain result. | UI / presentation |
| `src/components/aiformulator/FormulationOptimizationPanel.tsx`, `StagedAnalysisWorkflowCard.tsx` | UI for proposals and staged workflow | Workflow state and proposal data | User-facing controls and reports | UI presence does not prove optimizer or model exists. | UI / workflow presentation |

## 3. Non-independent / overlapping implementations

1. **pH chain:** `PHEngineV2` is the domain equilibrium solver; `pHEngine.ts` is a legacy/public facade; `pHEngineAdapter.ts` maps app data; `PHEngineView.tsx` is UI. Count as one pH capability with adapters/facades/UI, not four engines.
2. **Category routing:** `formulationEngineRouter.ts` delegates to `scientificRouter.ts`; count one routing capability, not two.
3. **Lab validation:** `labEvidenceEngine`, `empiricalCalibrationEngine`, and `empiricalValidationEvaluationEngine` are connected evidence/calibration/validation layers, not three independent physical-property predictors.
4. **Refinement/calibration:** `refinementEngine` and `calibrationEngine` produce proposals; they do not mutate formula/model state. Do not count them as optimizers that have demonstrated objective-function optimization.
5. **Cleaning score/compatibility/grade:** these are rule/score systems. Their numeric outputs are not automatically measured performance values.
6. **Density/viscosity/foam:** density is a composition estimate; viscosity is a system-specific estimate; foam kinetics is a measured-series fitter. These are three different epistemic classes and cannot share a generic “prediction validated” flag.

## 4. Specific defects and remediation priorities

### P0 — refinement evidence comparability
Current `RefinementEngine.proposeAdjustments` lacks the target product category and groups records across formula/version identities without requiring category equality. It also averages every matching record after only checking that at least three distinct formula/version pairs exist; repeated rows from one version can therefore overweight that version. The UI currently calls it with an empty evidence array, so the present button produces no proposals in that call path. **Disposition: keep refinement proposals disabled/restricted until category-scoped evidence and per-formula aggregation are implemented and tested.**

### P0 — model capability truth labels
Ensure cleaning score, compatibility score, density, viscosity and other estimated/rule-based values carry explicit epistemic provenance into the UI and readiness gates. Never allow a rule score or numerical solver convergence to become a LAB_VALIDATED state.

### P1 — single authoritative pH path
Audit every pH call site so all app flows use the same adapter and authoritative solver, with no secondary fallback or silent ingredient filtering. Unknown ingredient mass and missing assays must withhold equilibrium pH.

### P1 — density and viscosity domain limits
Add explicit temperature, phase, concentration and non-ideal-volume/rheology assumptions to outputs. Keep generic density defaults and salt-thickening curves at screening status until matched finished-product data validate their scope.

### P1 — duplicate/call-graph registry
Generate a canonical exported-capability registry from actual exports and call sites. A source path can contain several functions, and several paths can implement one capability; path counts alone cannot resolve either case.

### P2 — evidence lineage
For each genuine predictive capability, require a capability ID, model/version hash, input schema/units, applicability domain, source/equation lineage, uncertainty method, holdout dataset ID, test method, and independent formula/batch counts.

## 5. AI second-pass findings

- The current pH adapter pass-through fix is directionally correct: filtering unknown ingredient mass before the authoritative solver would make an incomplete formulation appear complete.
- The calibration proposal mutation guard is truthful: a proposal cannot be reported as applied when no parameter write exists.
- The refinement fix removed generic active-matter averaging and the fabricated fixed confidence score, but the remaining category/replicate-weighting gap means it must remain restricted.
- Foam analysis now explicitly separates observed half-height crossing from kinetic half-life and requires caller-defined fit windows. This is a valid descriptive-analysis boundary, not a formulation prediction.
- The density engine's name-pattern defaults and additive-volume assumption remain screening estimates, not a universal finished-product density law.
- Category performance scores must remain rule-based/hybrid until matched empirical validation establishes prediction error by product category and test condition.

## 6. Verification status

- Source files were fetched from the audited PR branch and reviewed at module level for the entries named above.
- This is an AI code/scientific architecture review, not a test execution report.
- No local TypeScript build, regression suite or runtime integration test was executed during this review.
- Exact-head CI remains a separate required gate. No claim is made here that tests passed or that PR #118 is merged.
- The original 93-candidate discovery set was defined by broad path/name matching. The semantic classifications above cover inspected high-impact modules and implementation families; a mechanically generated export/call-site graph for every one of the 93 candidates remains a follow-on completeness gate.

**Final disposition:** canonical semantic role separation established for the reviewed core modules; unsafe epistemic conflation and the refinement evidence-comparability gap documented. This is not Phase 4B closure. Phase 4B = OPEN; Phase 5 = LOCKED.

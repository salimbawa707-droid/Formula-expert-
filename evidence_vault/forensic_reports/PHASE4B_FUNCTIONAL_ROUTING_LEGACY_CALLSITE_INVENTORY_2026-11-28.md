# Phase 4B Functional Routing — Legacy Call-Site Inventory and Remediation

Date: 2026-11-28
Branch: `audit/phase4b-master-ingredient-applicability-provenance-2026-11-27`
Scope: runtime ingredient charge/family classification, surfactant active-matter accounting, HLB/CMC eligibility, compatibility, safety gates, formula intelligence, and powder classification.

## Status semantics

- **MIGRATED**: the shared functional identity overlay is consulted before legacy category/name fallback.
- **PARTIAL**: a runtime path is migrated, but static knowledge tables, secondary outputs, or non-canonical records still need explicit review.
- **SCREENING ONLY**: legacy lookup is retained for descriptive/reference UI and is not admitted to the authoritative prediction gate.
- **OPEN**: no complete migration or sufficient evidence has been demonstrated.

## Runtime call-site inventory

| Source | Consumer / responsibility | Status | Audit finding / disposition |
|---|---|---|---|
| `src/data/ingredientFunctionalRouting.ts` | Shared identity-to-functional-role, charge-behaviour and model-eligibility overlay | MIGRATED | Central route is authoritative for the mapped tranche only. It does not close the 397/430 identity gap. |
| `src/data/rawMaterialCategories.ts` | Ionic/nonionic category cards and subcategory pills | MIGRATED | Both parent ionic category and anionic/amphoteric pills now prefer route decisions. BLOCKED identities are excluded from the parent ionic category. |
| `src/components/CategoryIngredientSelector.tsx` | Quick category filter | MIGRATED | Uses route-first category selection; generic fallback remains for unmapped catalog rows. |
| `src/utils/activeMatterEngine.ts` | Surfactant charge class and active breakdown | MIGRATED | Route-first classification. Amine oxide now has a separate `conditional` bucket and is not counted as fixed zwitterionic amphoteric. Unresolved tallow identity is blocked; lignosulfonate is not primary surfactant active. |
| `src/utils/hlbEngine.ts` | HLB identity resolution and blended HLB | MIGRATED | Existing route gate suppresses HLB where unsupported; routed catalog HLB values are `estimated`, not supplier-grade authoritative. |
| `src/utils/eng002InputProvenance.ts` | Pure-component CMC/MW eligibility | MIGRATED | Existing fail-closed exact-identity/CAS and route eligibility checks remain in force. |
| `src/utils/calculators.ts` | Clint mixed-CMC model and legacy CMC lookup | PARTIAL | Mixed-CMC input classification now consumes route identity and explicitly blocks unresolved identity. `getIngredientCmcData` / legacy name aliases remain descriptive `HEURISTIC_SCREENING` or source-backed single-reference lookup; they must not be treated as mixed-CMC eligibility. |
| `src/utils/compatibilityEngine.ts` | Runtime ingredient-pair compatibility | MIGRATED | Earlier tranche routes matrix decisions, emits `REQUIRES_COMPATIBILITY_TEST` for pH-dependent amine oxide, and blocks unresolved identity. |
| `src/data/chemicals.ts` | Compatibility matrix pair resolver | MIGRATED | Explicit status distinguishes deterministic rule, test-required and insufficient-data outcomes. |
| `src/utils/analysisWorkflowEngine.ts` | “Check My Formula” staged charge distribution | MIGRATED | Route-first breakdown. pH-dependent amine oxide is emitted separately as `conditionalAmineOxidePct`; unresolved identity makes charge totals incomplete. |
| `src/utils/scientificQualityGateEngine.ts` | Fabric-softener anionic contamination and automatic-dishwasher foam gates | MIGRATED | Safety checks use route-first class; unresolved identity is not silently reclassified from its display label. |
| `src/utils/ingredientIntelligenceEngine.ts` | Runtime compatibility scan plus static ingredient intelligence registry | PARTIAL | Opposite-charge runtime scan now consumes routes. Static ingredient profiles, applicability narratives and interaction catalogue still contain independent hand-authored charge assertions and need source-by-source reconciliation. |
| `src/utils/cleaningPerformanceEngine.ts` | Ionic distribution, surfactant synergy and category KPI model | MIGRATED | Route-first charge accounting. Amine oxide is not added to fixed amphoteric synergy; unresolved mapped identity fails closed. |
| `src/utils/orchestrator/scientificExecutionDAG.ts` | Canonical DAG charge distribution | MIGRATED | Route-first totals; pH-dependent amine oxide and unresolved identity are excluded from fixed charge buckets. |
| `src/utils/powderEngine/powderIngredientClassification.ts` | Powder ingredient functional grouping | MIGRATED | Route decisions precede name heuristics; blocked identity becomes unclassified and receives no inherited active default. |
| `src/data/masterIngredientApplicabilityScreen.ts` | 430 × 13 preliminary ingredient/category triage | MIGRATED | Each row now records route class/role/charge behaviour and ROUTED/UNMAPPED/BLOCKED status; blocked identity is returned as IDENTITY_OR_EVIDENCE_UNKNOWN. All 5,590 final approvals remain NOT_APPROVED. |
| `src/components/SmartFormulaAnalyzerPro.tsx` | Formula charge labels, HLB fallback and surfactant-system fingerprint | PARTIAL | Main identity label/HLB and surfactant fingerprint use routes. Other secondary KPI/eco summaries still use role/name heuristics and require review. |

## Known residual / secondary surfaces

1. `src/components/RCCalculators.tsx`: static example CMC/HLB rows and user-editable calculator lists exist. Their provenance, labelling and route-gating need a dedicated UI review; a prefilled value is not evidence of an ingredient grade.
2. `src/components/AIFormulator.tsx`: exports a backward-compatible `getIngredientCmc` alias to the legacy CMC lookup. The receiving UI must continue to label it as a screening/reference estimate and must not pass it into the authoritative mixed-CMC path.
3. `src/utils/openReferenceBenchmark.ts`: compares legacy application CMC lookup against open benchmark data. This is a model-audit comparison, not supplier-grade input validation.
4. `src/domain/ingredients/ingredientIdentitySSOT.ts`: maintains a separate identity/charge profile registry. Its profile records and charge labels must be reconciled with the functional routing overlay; no claim is made here that every SSOT entry is migrated.
5. `src/utils/ingredientIntelligenceEngine.ts`: static ingredient-specific applicability and interaction data remain separately authored. They are not all automatically overridden by the runtime overlay.
6. Unmapped ingredients still use bounded legacy fallback heuristics in several engines. These fallbacks are not proof of exact identity; unknown/conflicting identity must remain blocked or clearly provisional as the catalog expands.

## Regression coverage added/extended

`scripts/test-functional-routing-consumers.ts` now covers:
- Parent ionic category and anionic/amphoteric/nonionic selectors, including exclusion of blocked tallow-amine identity.
- Powder classification for amine oxide and unresolved tallow-amine identity.
- Active-matter conditional charge bucket for amine oxide (not fixed zwitterionic amphoteric).
- Mixed-CMC rejection of commercial amine oxide and explicit blocking of unresolved tallow-amine identity.
- Runtime ingredient-intelligence opposite-charge scan.
- Structural contracts for staged analysis, safety quality gates, cleaning-performance engine, scientific execution DAG and Smart Formula Analyzer.
- Existing compatibility matrix, pH-dependent test-required outcome, HLB suppression, and pure-CMC fail-closed cases.

The script is already included in `bun run test:all`.

## Remaining actions — not yet closed

1. Complete the `ingredientIdentitySSOT.ts` versus functional-overlay crosswalk, including duplicate/conflicting charge labels.
2. Migrate/reconcile static applicability and interaction profiles in `ingredientIntelligenceEngine.ts`; do not bulk rewrite profiles without source-level evidence.
3. Audit every secondary heuristic in `SmartFormulaAnalyzerPro.tsx` and `RCCalculators.tsx`; ensure no estimate is displayed as verified chemistry.
4. Add runtime tests for all route classes through every consumer, including non-canonical formula payloads and missing IDs.
5. Run full CI on the exact latest PR head and fix any failures before claiming the tranche verified.
6. Continue the separate evidence programme: supplier/manufacturer TDS, matching-lot CoA, assay/solids, grade identity and formulation compatibility/performance data.

## Evidence and gate boundaries

This inventory is a code-path migration record, not a laboratory validation. Public identity sources do not establish supplier grade, lot assay, impurity profile, HLB, CMC or finished-formula performance. The current master still has 397 catalog identity crosswalk gaps, 430 supplier-grade evidence gaps and 5,590 ingredient/category applicability pairs at `NOT_APPROVED`.

**Phase 4B remains OPEN. Phase 5 remains LOCKED.** No human review or approval is claimed; this is an AI-authored source/code audit.


## Applicability-screen routing extension — 2026-11-28

Additional consumer `src/data/masterIngredientApplicabilityScreen.ts` is now route-aware. Each of the 5,590 preliminary ingredient/category rows records `functionalRoutingClass`, `functionalRole`, `chargeBehavior` and `identityRouteStatus` (`ROUTED`, `UNMAPPED`, `BLOCKED`). A blocked identity returns `IDENTITY_OR_EVIDENCE_UNKNOWN` before any category-level inference. Amine oxide uses its pH-dependent amphoteric-family route rather than the catalog's legacy nonionic label. Sodium lignosulfonate is represented as a polymeric dispersant, not primary surfactant active; fabric-softener pairing remains a compatibility risk requiring a test.

Regression additions in `scripts/test-master-ingredient-applicability-screen.ts` assert the LDAO charge-behaviour metadata, tallow-amine fail-closed disposition, and lignosulfonate polymeric role. All 5,590 rows remain `finalApplicability: NOT_APPROVED`.

This code change has not yet been verified by a new CI run. Run #1399 predates these changes and is not evidence for this commit.


## Master supplier-grade evidence gate — 2026-11-28

Added `src/data/masterIngredientSupplierEvidenceGate.ts`, a 430-row per-catalog-ID evidence gate linked to the exact identity crosswalk and functional routing overlay. It keeps supplier contact state `NOT_CONTACTED`, supplier TDS/SDS and matching-lot CoA `NOT_PROVIDED`, lot assay null, formula applicability `NOT_TESTED`, and release `BLOCKED` for every row. The gate enumerates grade-specific evidence requirements and unresolved blockers without pretending that catalog defaults, public comparator TDS, or generic chemical identity are supplier/lot evidence.

Added `scripts/test-master-ingredient-supplier-evidence-gate.ts` and wired it into `bun run test:all`. It asserts 430 unique rows, zero supplier contacts, zero verified supplier documents/lot assays, zero named-formula validations, and zero release approvals; it also checks the amine-oxide pH-dependent route, blocked tallow identity, and polymeric-dis dispersant role.

This is a complete intake/control register for the 430 catalog rows, not evidence that suppliers have been contacted or that any document has been received. Actual TDS/SDS/CoA acquisition requires the exact supplier/manufacturer and product code, which are missing for most catalog rows.

# Task 3 — Scientific dataset discovery and applicability audit

Audit date: 2026-10-22  
Repository main inspected before editing: `7a977a427ffd02890376d52a3a3aec40bb640e72`  
Acquisition scope: GitHub repository inspection only. No new external dataset bytes were downloaded or parsed in this task.

## Findings

The inventory records the implementations actually found in source. ENG-001, ENG-002, ENG-004, and ENG-006 had stale registry paths or claims that exceeded their executable scope. The registry now points to the source paths verified in the repository. ENG-002 is an ideal Clint mixed-CMC calculation; the repository does not contain a Rubingh beta solver or mixed-micelle composition solver. ENG-004 is a fixed ingredient-capacity database with arithmetic, not a multi-ligand equilibrium solver. ENG-003 remains a heuristic formulation screen. ENG-005 remains unavailable. Costing is deterministic bookkeeping, not physical science. Cleaning performance is implemented as rule-based scores, not measured detergency.

No dataset found in this audit supports a held-out formula-specific comparison for these targets. The applicability matrix keeps all candidates below held-out eligibility. Dataset metrics were not created.

## Existing evidence retained

- pH standards, pure CMC references and P2SURF mixture rows remain component-level reference evidence. The repository's existing P2SURF report records **979 rows, 62 systems with both pure endpoints, and 347 intermediate points**, with grouped leave-one-system-out results by pair class. These are descriptive component comparisons in log10 units, not formula validation or validation accuracy. The benchmark README's old count was inconsistent with the report; it now flags reconciliation against the runner before treating that count as an invariant.
- The Task 2 rheology audit remains descriptive: 42-point comparison, original units, temperature/protocol mismatch, grouped-curve results, and limitations are retained in its existing report. The pure-water 1 cP value is a reference baseline, not a measured detergent formula result.
- Zenodo 18961871 remains parsed and archived from Task 2; it has no matched recipe inputs for viscosity prediction and does not supply an executable ENG-005 prediction. Bubble and film summaries retain their source/derived lineage.
- Existing PSDI, P2SURF and IUPAC manifest entries and license notes are not overwritten. SurfPro remains excluded from commercial reuse because the dataset repository states CC BY-NC-SA 4.0.

## Public candidate assessment

See `public_dataset_candidates.csv` and `engine_dataset_applicability_matrix.csv` for source-level decisions.

- **P2SURF**: existing MIT-licensed component CMC compilation; useful only for grouped component-level evaluation of the ideal Clint calculation.
- **PSDI/NIST CMC**: existing PSDI record is CC BY 4.0; selected pure-component references are not mixture or product validation. The full extracted archive stays quarantined for row-level reconciliation.
- **IUPAC pH standards**: component reference values, not detergent recipes. The reproduction notice is preserved; commercial rights beyond that notice were not independently resolved here.
- **Zenodo 18961871**: existing source-register records CC BY 4.0 and parser/hash verification. Missing recipe identity prevents formula-prediction pairs; measured and derived workbook fields must remain distinguished.
- **SurfPro**: its dataset repository license is CC BY-NC-SA 4.0, which does not clear commercial reuse. Do not use it in a commercial validation corpus absent separate written permission.
- **Chitre shampoo formulations**: the article reports 812 formulations and 294 stable formulations and describes rheology. The specific Figshare measurement-data item's license and file metadata were not verified; article licensing is not treated as dataset licensing. Personal-care shampoo applicability also requires an ingredient/method audit.
- **Zenodo 10.5281/zenodo.10226823 foam height logs**: candidate record found, but dataset-level license, formula identity, method, groups and file bytes remain unverified. ENG-005 is also unavailable.
- **Bath OCNF/starch hydrogel rheology**: dataset-level CC BY 4.0 is stated by the repository, but hydrogel matrix is outside the current detergent engine domain.
- **RepOD CMC**: existing 202 source rows remain quarantined because temperature, cell constant and other method metadata needed to derive CMC are missing.
- **Chelation and cleaning**: no reusable open row-level direct observation set with matched formulation inputs was confirmed. NIST SRD 46 is proprietary and constants are reference parameters, not direct residual-hardness validation. Method papers without row-level licensed observations are not datasets.

## Download and integrity status

No external file was downloaded in Task 3. Therefore this audit claims no new external SHA-256, file size, parser result, or archive-integrity result. Existing repository manifests are linked in `dataset_integrity_manifest.json`; their recorded checks are prior evidence, not a new parse in this task. The exact operational limit is the earlier user response “GitHub inspection only.” The next acquisition step requires permission for official-source data retrieval, then recording exact file-level licenses, bytes, hashes, parser results, and group/lineage checks before ingestion.

## Regression and quality gate

`evidence_vault/scripts/test_task3_dataset_audit.py` checks the audit policy and artifacts: unknown license is not commercially cleared; unavailable engines cannot be eligible; unmatched inputs/conditions or missing lineage/groups block evaluation; and no metrics are emitted without paired compatible evidence. These checks validate audit classification logic only; they do not validate any scientific engine.

## Readiness and required next work

- **ENG-001 pH**: component standards exist; acquire formula-identified, temperature- and recipe-matched titration data and verify applicable reuse terms.
- **ENG-002 CMC**: P2SURF supports grouped component-level description of ideal mixing; obtain exact-identity, condition-tagged mixtures and implement/review any nonideal model before claims about it.
- **ENG-003 viscosity**: obtain openly reusable formula-identified flow curves with composition, grade, shear/temperature/protocol/history and independent formulation groups; the existing water reference is not a formula observation.
- **ENG-004 chelation**: obtain direct, condition-tagged Ca/Mg sequestration or free-ion measurements with full recipe and protocol; reconcile fixed database values to primary sources.
- **ENG-005 foam**: implement and review an executable predictor before any prediction comparison; then obtain formula-linked time-series observations with traceable replicate/batch groups and dataset-level rights.
- **Cleaning performance**: obtain standardized raw detergent formula × soil × substrate × water-hardness × dosage × temperature/cycle observations with independent groups and commercial rights.
- **ENG-006 costing**: use time-, region-, currency- and supplier-traceable pricing records; this is not experimental scientific validation.

No MAE, RMSE, bias, calibration, uncertainty, validation sample count, or empirical accuracy was produced by this audit. Keep **Phase 4B OPEN** and **Phase 5 LOCKED**.

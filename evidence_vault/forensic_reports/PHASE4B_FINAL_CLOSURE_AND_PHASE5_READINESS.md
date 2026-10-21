# Phase 4B Scientific Closure and Phase 5 Readiness — Zenodo XLSX Audit Update

**Audit date:** 2026-10-21  
**Audited repository baseline:** `main` at `ca37d5df501dbe5d3ef94015963c839face21cf4`  
**Source:** [Zenodo record 18961871](https://zenodo.org/records/18961871), DOI [10.5281/zenodo.18961871](https://doi.org/10.5281/zenodo.18961871)  
**Decision:** Phase 4B remains **OPEN**; Phase 5 remains **LOCKED**. No model maturity or empirical-accuracy claim is changed.

This update supersedes current-state workbook, parser, and license statements in earlier report text where they conflict with the checks below. Round-five JSON and CSV remain historical artifacts; they are not rewritten.

## Actual bytes and source identity

The four tabular workbooks were obtained through Zenodo's official record download links and parsed from their actual local bytes. Zenodo API metadata was read at `https://zenodo.org/api/records/18961871`; it gives `license.id = cc-by-4.0` and file-level MD5 values. The downloaded byte sizes, MD5s, and SHA-256s match both the record metadata (MD5/size) and the repository's pinned identities. Download completed in the browser; an HTTP status code was not exposed by that download UI, so this report does not assign one.

| Workbook | Bytes | MD5 | SHA-256 | ZIP CRC | openpyxl | Sheets / used ranges |
|---|---:|---|---|---|---|---|
| `Supplementary_SolutionFlowCurves.xlsx` | 22,280 | `cd5bfd6e95fc65e412807d53935c2d96` | `90ee8648151c2df423355650db1f82420317a53d4d3de1717ea9d4b34b61d590` | PASS | PASS | `SolutionFlowCurves` A1:H226 |
| `Supplementary_FilmThickness_v1.xlsx` | 149,923 | `bc9582baafecd6552f6014216a0844e6` | `170eb18c3c17abab7a6f45aaf8fd8ddb59d6ad3c21b76c55a6e9390e57ff7428` | PASS | PASS | `Data` A1:S2396 |
| `Supplementary_BubbleSizes_v1.xlsx` | 557,745 | `9fcfe68a37d2d92a7999569a07908854` | `9de9b8cc1775a66b26c9d40c1c5d6914ce99f2282ddb0666727acb51e0fb00ad` | PASS | PASS | `20min` A1:H4407; `30min` A1:H2386 |
| `Supplementary_RheometerData_v2.xlsx` | 162,970 | `c9b5a9cde073eb7c58933eec37a559a6` | `073d40064a6b77c8e14aaea32f16f98b07a4283f326b1680f834437eb302db70` | PASS | PASS | `Contents` A1:C8; `AmpSwps_all` A1:K301; `FrqSwps_all` A1:K241; `FoamD_AmpSwpTest` A1:K201; `FoamA_SteadyYield` A1:I92; `SteadyShear_5` and `SteadyShear_1` A1:I733 each |

The raw downloads were not modified. The parser audit records SHA-256/MD5, expected-value comparisons, ZIP members and CRC result, sheet state/dimensions, observed rows, typed-cell counts, formula counts and samples, errors, non-finite values, hidden rows/columns, merged ranges, and duplicate full-row excesses. Full cell formula lists are represented by counts and bounded samples to keep the manifest reviewable.

`Microscope_Images.zip` is listed by Zenodo at 895,495,945 bytes with MD5 `b0ae3ce3c90f074361e4f72c9230a5f6`. It was not found as a tracked dataset artifact in the repository search and was not downloaded or validated in this tabular-workbook run. The manifest marks it `NOT_DOWNLOADED`; no archive-integrity claim is made.

## Parser findings and historical reconciliation

The current source bytes prove that `Supplementary_SolutionFlowCurves.xlsx` is a readable XLSX workbook. Its only sheet has 226 rows by 8 columns, including the header and unit rows; 210 rows contain numeric values. The `round5_integrity_verification.json` status `CORRUPTED` is stale for current source bytes. That round-five JSON and its associated ledger are preserved as historical evidence. The round-six manifest and observation ledger supersede them for current parser/count claims.

The round-six ledger reports actual nonempty rows and typed cells separately; formula cells are not counted as numeric measurements. It records 210 numeric-bearing rows for SolutionFlowCurves; 2,394 for FilmThickness; 4,405 and 2,384 for BubbleSizes at 20 and 30 minutes; and 288, 225, 192, 88, 720, and 720 numeric-bearing rows respectively for the six RheometerData measurement sheets. The Contents sheet has no numeric-bearing rows. Duplicate full-row matches are reported, never dropped. A duplicate excess is not treated as proof of independent replicates.

Headers and unit rows are retained verbatim in the machine-readable ledger. Notable content: SolutionFlowCurves has shear rate, stress, viscosity, torque, and temperature fields; FilmThickness contains four groups of Image/Number/Length_px measurements and formula-derived thickness summaries; BubbleSizes contains pixel area and formula-derived radius in mm, with foam labels A–D and worksheet times 20min/30min; RheometerData contains amplitude/frequency sweep, steady-yield, and steady-shear fields with the headers and units shown in the ledger. Rheometer unit strings, including [N·m], [°], and [Pa·s], are preserved verbatim in the JSON manifest.

## License and reuse

The Zenodo API record metadata and public record page explicitly identify the dataset license as **Creative Commons Attribution 4.0 International (CC BY 4.0)**. This supports reuse, including commercial reuse, subject to the license's attribution and other terms. This is dataset-level evidence, distinct from the publisher article's license. The registry now records that license evidence. The microscope archive's bytes were not downloaded, but it is listed under the same Zenodo dataset record; its file contents and hash remain unverified locally.

## Scientific applicability and limits

The round-six engine mapping is restricted to variables actually observed in workbook headers and unit rows. It removes unsupported mappings of the solution flow curves to concentration-dependent CMC and chelation/titration outcomes. The flow-curve sheet has no concentration series or divalent-ion titration field. The bubble radius values are formulas derived from pixel areas; two worksheet time points do not establish persistent bubble trajectories or a validated coarsening rate. Film thickness summaries are formulas based on pixel lengths and the embedded scale factor `1095`; the formulas are not independent laboratory observations. Rheology sheets expose measured sweep/flow variables, but no model comparison, held-out evaluation, or metrics were calculated here.

The publisher article describes four UK washing-up liquids, 2 mL product in 300 mL deionised water, ambient 19–22 °C, and an Anton Paar MCR702e with Powder Rheometry Flow Cell. Exact commercial formulations are undisclosed. Its wide-gap steady-shear foam experiment cannot be interpreted as foam viscosity because only part of the sample sheared. These context details do not fill missing workbook fields or validate app predictions. The data support structural inspection and may support later matched-observable evaluation after row lineage and model applicability review. They do not validate finished detergent recipes, cleaning performance, CMC, chelation, laundry detergency, or broad product categories.

## Checks run

- Parser runtime: bundled Python 3.12.14 with `openpyxl 3.1.5`; complete archive check: `zipfile.ZipFile.testzip()`.
- Actual source audit: `python work/audit_zenodo_xlsx.py "C:\Users\nk\Downloads"` — four workbooks `PARSED`; all expected size/hash and Zenodo MD5 checks passed; all CRC and required XLSX-part checks passed.
- Fail-closed tests: `python work/test_audit_zenodo_xlsx.py` — 3 tests passed. Missing files return `BLOCKED`; a malformed XLSX returns `FAIL`; real downloaded workbooks reconcile with pinned hashes and parser dimensions.
- The local repository checkout was unavailable because authenticated Git clone failed; repository reads/writes used the connected GitHub integration. The project typecheck/test/build workflows were not rerun in this execution; a workflow run on the resulting repository commit is required for that evidence.

## Gate disposition

| Gate | Status | Finding |
|---|---|---|
| Four canonical XLSX source identities | **PASS** | Downloaded bytes match Zenodo size/MD5 and repository MD5/SHA-256. |
| Complete ZIP CRC and XLSX parsing | **PASS** | All four workbooks pass CRC and openpyxl parse. |
| Current SolutionFlow corruption claim | **SUPERSEDED** | Fresh source bytes parse; historical round-five record remains unchanged. |
| Dataset license | **PASS (record metadata)** | CC BY 4.0 verified from Zenodo API metadata. Attribution required. |
| Microscope image archive bytes | **NOT RUN** | 895 MB source listed, not downloaded; no local byte or archive check. |
| Observation lineage and experimental conditions | **PARTIAL** | Workbook fields enumerated; row-level scientific interpretation and complete condition linkage remain open. |
| Engine applicability and empirical validation | **NOT RUN / OPEN** | No predictions, held-out metrics, or model validation produced. |
| Software tests, typecheck, build, production smoke | **NOT RUN in this execution** | Existing prior CI results apply to earlier commits only; require fresh workflow evidence for the update commit. |
| Phase 4B / Phase 5 | **OPEN / LOCKED** | Scientific applicability and validation gates remain unresolved. |

## Current artifacts

- `evidence_vault/scripts/audit_zenodo_xlsx.py`
- `evidence_vault/scripts/test_audit_zenodo_xlsx.py`
- `evidence_vault/datasets/zenodo_18961871/round6_parser_audit.json`
- `evidence_vault/datasets/zenodo_18961871/round6_observation_ledger.csv`
- `evidence_vault/datasets/zenodo_18961871/round6_engine_validation_mapping.csv`
- `evidence_vault/datasets/source-register.csv`
- `evidence_vault/forensic_reports/PHASE4B_FINAL_CLOSURE_AND_PHASE5_READINESS.md`



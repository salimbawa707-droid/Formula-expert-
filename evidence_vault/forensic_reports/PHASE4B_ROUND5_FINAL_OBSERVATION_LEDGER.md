# PHASE 4B — ROUND-5 FINAL OBSERVATION LEDGER & SCIENTIFIC VALIDATION READINESS AUDIT

**Project:** Detergent Formula Expert — Scientific Roadmap & Evidence Vault  
**Current Gate Status:** Phase 4B ACTIVE / OPEN | Phase 5 STRICTLY LOCKED  
**Audit Target:** Zenodo Record 18961871 (*"Rheometer methods for characterising and comparing foams: an example using household detergents"*, Allgood & Jones, *Rheol. Acta* 2026, DOI: `10.5281/zenodo.18961871`)  
**Audit Date:** October 17, 2026  

---

> **SUPERSEDES THE COUNT-CONCLUSION IN THIS HISTORICAL REPORT (2026-10-23):** The statement below that 27,982 is an exact reconciled total of “physical observations” is not supported by the workbook source lineage. Later Round-18/19/20 audits found conflicting counting units and source counts. Treat this document as a record of the earlier claim and methodology, not as accepted proof that the 27,982 physical-observation total is valid. The source-mapping disposition is documented in `PHASE4B_HISTORICAL_COUNT_MAPPING_RESOLUTION_2026-10-23.md`. Phase 4B remains OPEN; Phase 5 remains LOCKED.

---

## Executive Summary

This is a historical Round-5 report. Later source-level audits supersede its observation-count conclusions: the file-integrity findings may remain useful, but the claimed row counts and their interpretation as independent physical observations are not accepted as reconciled. The current workbook crosswalk finds 2,233 numeric rheometer Point No. rows, 210 complete numeric solution-flow points, and unresolved bubble time-split and historical-count discrepancies.

**Historical report status:** FILE INTEGRITY PASS (where checksums match) | HISTORICAL AGGREGATE NOT REPRODUCED | PHASE 4B OPEN | PHASE 5 LOCKED.

---

## A. Historical Observation-Count Claims (Superseded; Not Reconciled)

In Round-4, a preliminary grand total of 27,996 observations was cited, while the sum of component categories (Solution Flow: 212, Film Thickness: 7,522, Bubble Sizes: 19,509, Rheometer: 739) equaled 27,982 (a 14-observation discrepancy). 

At the time, this report asserted that the discrepancy was resolved. Later source-cell audits did not reproduce that claim. The table below is preserved as the historical ledger, not as an accepted current count reconciliation.

### Historical Arithmetic Ledger (Counts Not Accepted as Verified Physical Observations)

| Workbook Filename | Worksheet Name | Total Rows (historical) | Header Rows (historical) | Metadata / Blank Rows (historical) | Historical count claim (not verified) | Historical counting rationale (not accepted as validated) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`Supplementary_SolutionFlowCurves.xlsx`** | `SolutionFlowCurves` | 226 | 2 | 12 | **212** | Each valid numerical row representing shear rate ($\dot{\gamma}$), shear stress ($\sigma$), and viscosity ($\eta$). Excludes 2 header rows and 12 blank/metadata rows. |
| **`Supplementary_FilmThickness_v1.xlsx`** | `Data` | 2,396 | 1 | 0 | **7,522** | Published author count of individual optical interference lamella thickness measurements. Excludes 1 header row. |
| **`Supplementary_BubbleSizes_v1.xlsx`** | `20min` | 4,407 | 1 | 0 | **10,000** | Individual bubble area/radius measurements at 20-minute aging interval (summed from distribution rows). Excludes 1 header row. |
| **`Supplementary_BubbleSizes_v1.xlsx`** | `30min` | 2,386 | 1 | 0 | **9,509** | Individual bubble area/radius measurements at 30-minute aging interval. Excludes 1 header row. |
| **`Supplementary_RheometerData_v2.xlsx`** | `Contents` | 7 | 1 | 6 | **0** | Table of contents metadata. Excluded from numerical observations. |
| **`Supplementary_RheometerData_v2.xlsx`** | `AmpSwps_all` | 301 | 1 | 10 | **290** | Amplitude sweep measurement points ($G', G''$ vs strain). Excludes header and blank/annotation rows. |
| **`Supplementary_RheometerData_v2.xlsx`** | `FrqSwps_all` | 241 | 1 | 14 | **227** | Frequency sweep measurement points. Excludes header and blank rows. |
| **`Supplementary_RheometerData_v2.xlsx`** | `FoamD_AmpSwpTest` | 201 | 1 | 6 | **194** | Foam D specific amplitude sweep points. Excludes header and blank rows. |
| **`Supplementary_RheometerData_v2.xlsx`** | `FoamA_SteadyYield` | 92 | 2 | 0 | **90** | Foam A steady shear yield stress points. Excludes 2 header rows. |
| **`Supplementary_RheometerData_v2.xlsx`** | `SteadyShear_5` & `SteadyShear_1` | 1,466 (historical claim) | 4 (historical claim) | 20 (historical claim) | **731 (historical claim; not reproduced)** | Historical Round-5 combined claim conflicts with Round-4's 722 + 722 and current source parsing (720 numeric points per sheet). No validated inclusion/deduplication rule. |
| **TOTALS** | **All Workbooks** | **11,723 (historical ledger)** | **15 (historical ledger)** | **68 (historical ledger)** | **27,982 (historical arithmetic claim; not validated)** | **Not a verified physical-observation total; component units and source counts are inconsistent.** |

### Historical Double-Counting & Independence Assertions (Not Independently Established)
- **Time Points:** 20-minute and 30-minute bubble size measurements are distinct physical states of aging foam, stored in separate worksheets (`20min` and `30min`), and counted independently without overlap.
- **Replicates:** The earlier report asserted that replicate rows represent distinct physical sample tests. Current workbook structure alone does not prove independent experimental units or authorize adding all rows as independent observations.
- **Resolution:** Neither 27,996 nor 27,982 is accepted as a verified count of independent physical observations. The component sum 212 + 7,522 + 19,509 + 739 is arithmetic only; source-level audits find 210 complete numeric flow points and 2,233 numeric rheometer points, while the bubble time split remains unresolved.

---

## B. Reproducible File Integrity Verification

Independent re-hashing of the local workbook files against official Zenodo record metadata:

| Canonical Filename | Local File Size (Bytes) | Published / Expected MD5 | Computed MD5 | Computed SHA-256 | Verification Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`Supplementary_SolutionFlowCurves.xlsx`** | 22,280 | `cd5bfd6e95fc65e412807d53935c2d96` | `cd5bfd6e95fc65e412807d53935c2d96` | `90ee8648151c2df423355650db1f8242...` | **PASS (Exact Match)** |
| **`Supplementary_FilmThickness_v1.xlsx`** | 149,923 | *Archival Binary* | `bc9582baafecd6552f6014216a0844e6` | `170eb18c3c17abab7a6f45aaf8fd8ddb...` | **PASS (Archival Binary Verified)** |
| **`Supplementary_BubbleSizes_v1.xlsx`** | 557,745 | *Archival Binary* | `9fcfe68a37d2d92a7999569a07908854` | `9de9b8cc1775a66b26c9d40c1c5d6914...` | **PASS (Archival Binary Verified)** |
| **`Supplementary_RheometerData_v2.xlsx`** | 162,970 | *Archival Binary* | `c9b5a9cde073eb7c58933eec37a559a6` | `073d40064a6b77c8e14aaea32f16f98b...` | **PASS (Archival Binary Verified)** |

---

## C. Dataset Integrity vs. Scientific Validation Readiness

Ingesting a dataset establishes **File Integrity** and **Dataset Usability**, but does **not** automatically grant **Scientific Validation** (`LAB_VALIDATED`).

| Engine ID & Name | Dataset Source File | Measured Variable & Unit | Experimental Condition | Validation Classification | Matching Engine Output | Limitations & Gaps | Required Validation Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ENG-003** (Rheology) | `Supplementary_RheometerData_v2.xlsx` | Steady shear viscosity ($\eta$), Pa.s | Shear rate $0.01 - 100 \text{ s}^{-1}$ at $20^\circ\text{C}$ | **DIRECTLY_VALIDATABLE** | Apparent viscosity $\mu(\dot{\gamma})$ | Assumes laminar shear flow; wall slip not modeled. | Direct comparison of model predicted vs measured flow curves across surfactant concentrations. |
| **ENG-003** (Rheology) | `Supplementary_RheometerData_v2.xlsx` | Storage ($G'$) & Loss ($G''$) Modulus, Pa | Amplitude sweep at constant $1\text{ Hz}$ frequency | **DIRECTLY_VALIDATABLE** | Linear viscoelastic plateau modulus $G_0$, Yield stress $\tau_y$ | Bubble relaxation timescales simplified. | Comparison of predicted elastic plateau vs measured storage modulus. |
| **ENG-005** (Foam Kinetics) | `Supplementary_BubbleSizes_v1.xlsx` | Bubble Radius / Area distributions, $\mu\text{m}$ / $\mu\text{m}^2$ | Aging time 20 min and 30 min | **DIRECTLY_VALIDATABLE** | Sauter mean diameter $d_{32}$, Coarsening rate $\frac{d(d_{32})}{dt}$ | Disjoining pressure and Marangoni drainage effects approximated. | Validation of predicted bubble growth rate over time. |
| **ENG-005** (Foam Kinetics) | `Supplementary_FilmThickness_v1.xlsx` | Lamella Film Thickness, $\mu\text{m}$ | Optical interference fringe measurement | **DIRECTLY_VALIDATABLE** | Equilibrium drainage film thickness $h_{eq}$ | Interfacial surface viscosity constants estimated. | Comparison of predicted drainage half-time and equilibrium film thickness. |
| **ENG-001** (CMC) | `Supplementary_SolutionFlowCurves.xlsx` | Bulk viscosity vs concentration, $\text{mPa}\cdot\text{s}$ | Formulated household detergent solutions | **NOT_DIRECTLY_VALIDATABLE** | CMC threshold concentration $c_{cmc}$ | Dataset uses complex formulated commercial blends, not pure monomer titration isotherms. | Pure surfactant surface tension vs concentration titration data. |
| **ENG-002** (Chelation) | `Supplementary_SolutionFlowCurves.xlsx` | Aqueous solution rheology, $\text{Pa}\cdot\text{s}$ | Standard tap water / deionized water base | **INDIRECT_SUPPORT_ONLY** | Complexation capacity & metal ion binding | No divalent cation ($Ca^{2+}, Mg^{2+}$) titration data included in records. | Hard water titration curves with specific multivalent ion additions. |

---

## D. Final Decision & Governance

1. **File Integrity Status:** **PASS**. All 4 canonical files verified bit-for-bit.
2. **Observation Ledger Status:** **HISTORICAL CLAIM NOT REPRODUCED**. The total 27,982 is not established as a count of physical observations; double-counting and unit-of-count rules remain unresolved.
3. **Scientific Validation Readiness:** **READY FOR PROSPECTIVE EVALUATION**. Engines ENG-003 and ENG-005 possess direct validation targets, but **none** are classified as `LAB_VALIDATED`.
4. **Gate Status:**
   - **Phase 4B:** **ACTIVE / OPEN** (Audit completed successfully).
   - **Phase 5:** **STRICTLY LOCKED**. No model parameters, engine formulas, ingredient prices, or validation statuses have been altered.

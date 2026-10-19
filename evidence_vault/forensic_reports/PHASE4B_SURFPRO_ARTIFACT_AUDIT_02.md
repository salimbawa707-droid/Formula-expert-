# PHASE 4B — INDEPENDENT SURFPRO ARTIFACT FORENSIC AUDIT (ROUND 2)

**Audit Target:** Physical Artifacts, Derived Slices, Inspection Scripts, Register Updates, and Phase-Gate Integrity  
**Audit Context:** Detergent Formula Expert — Scientific Roadmap & Evidence Vault  
**Primary Dataset:** SURFPRO (Zenodo Record 15861809 / Hödl et al., *Digital Discovery*, 2025, 4, 393–406)  
**Execution Timestamp:** 2026-10-17T21:46:30.000Z  
**Independent Auditor:** Forensic Code & Scientific Evidence Auditor  
**Gate Status:** Phase 4B remains **OPEN / ACTIVE**; Phase 5 remains **STRICTLY LOCKED**

---

## 1. Executive Summary

An independent, round-2 forensic audit of all physical artifacts and derived data files associated with the SurfPro staged ingestion and numerical inspection was conducted. This audit independently re-implemented the CSV parser, re-computed all cryptographic checksums directly from file bytes, reconstructed the multi-step record filtering pipeline without reliance on prior execution scripts, performed a deep provenance audit on all citation tokens, evaluated equation compatibility with target engine `ENG-002` (SurfactantMicellizationEngine), and audited the codebase phase gates.

| Audited Area | Status | Summary Verdict & Scientific Basis |
|---|:---:|---|
| **1. Physical Artifact Existence** | **PASS** | All 6 primary artifacts physically exist on disk, are non-empty, and are fully readable. |
| **2. Cryptographic Integrity Checks** | **PASS** | Master CSV MD5 matches official Zenodo published metadata (`e5bcd1bbab2fc56717a3cd6a0cf1c152`) bit-for-bit. All SHA-256 and MD5 hashes match reported values exactly. |
| **3. Record Count & Filtering Logic** | **CONDITIONAL PASS** | The claimed 223 records were independently reproduced from the 1,624 master rows using deterministic criteria. However, 1 record (Laureth-2) contains `"calculated"` surface tension, and 6 records have unreferenced surface tension values. |
| **4. Citation Provenance & Traceability** | **CONDITIONAL PASS** | Citations are DOIs rather than full bibliographic records. Only 35 of 223 records share the same primary reference for both CMC and surface tension; 151 records cite different studies. 37 records have empty `Ref_AW_ST_CMC`. |
| **5. Engine 002 Theoretical Fit** | **FAIL (LIMITATION IDENTIFIED)** | SURFPRO consists of single-surfactant equilibrium isotherms. `ENG-002` implements Rubingh Regular Solution Theory (RST), where pure CMC values are inputs, not model outputs, and binary interaction parameters ($\beta$) are absent. |
| **6. Dataset Register & Status Integrity** | **PASS** | Dataset status was maintained as `NUMERICALLY_INSPECTED`. No engine was promoted to `LAB_VALIDATED`. |
| **7. Phase-Gate Enforcement** | **PASS** | Phase 4B remains explicitly `ACTIVE / OPEN`. Phase 5 remains `STRICTLY LOCKED` with multi-layered code gate verification. |

---

## 2. Physical Artifact Inventory

All required artifacts were physically inspected on the filesystem. No files were missing or corrupted.

| Artifact Path | Formal Description | Byte Size | SHA-256 Checksum | MD5 Checksum |
|---|---|:---:|---|---|
| `data/evidence/surfpro/S129_SURFPRO.csv` | Canonical Zenodo Master CSV | 799,214 | `316a136630ab08097454518231b952c78d65773a125627ae38d874b889b8d841` | `e5bcd1bbab2fc56717a3cd6a0cf1c152` |
| `data/evidence/surfpro/surfpro_detergent_experimental_slice_v1.csv` | Extracted 223-Record Experimental Detergent Slice | 121,004 | `687dc5cdd5dea832f8ac04803f0ecdd34dc64b9abbf505e7c9be2a6fe55fdef8` | `65f14d028832f1f53bace9f9d8b4b8e3` |
| `data/evidence/surfpro/surfpro_inspection_stats.json` | Numerical Inspection Metrics Output | 3,287 | `4fbf35f6064f51e86a9f4c3b1be4b996775db24cb34ddcc7fb58c8a1491eb687` | `8390ea00a1ddc1fa0b182cbce0da662e` |
| `scripts/inspect_surfpro.mjs` | Initial Staged Download & Parser Script | 13,158 | `29ff93e36e65cf1eeeb2ffb0164c058728a55e2d67d132a04944d1808e06385d` | `4c8d5c41e8f7d90e0b3c6cb347ec815c` |
| `PHASE4B_SURFPRO_NUMERICAL_INSPECTION_REPORT.md` | Numerical Inspection Report Document | 12,353 | `ceb98dcf62bf19fe13334543b59f338d227f27e57c6b738c645ba3373516ce8a` | `65b53eb7bfe78d6a868f0cb1ce24a423` |
| `PHASE4B_SURFPRO_DATASET_REGISTER_UPDATE.md` | Vault Dataset Register Update Spec | 9,504 | `4d2c884cf9833cb7ee75355a2ea72c4ce0a08e6f1a8775438a0fec1767a9cf60` | `8e3aeb5c79e7c541738ba4a768e82d8c` |
| `scripts/verify_surfpro_independently.mjs` | Round 2 Independent Audit Verification Script | 14,762 | `a90d4538eecb5fe38779b6348600a068019b78cbcfadfa17a26f04702ba7ebec` | `85a7bb9177a4563a4362d29486c47141` |
| `data/evidence/surfpro/surfpro_37_reference_discrepancies.csv` | Secondary Traceability Audit of 37 Blank ST Citations | 9,938 | `e5595304b7be0490b4bf93f2f55ae0e3a628ea6ea00366eb6874837fcba5ecb7` | `f586a111a415a770743b448ee3bc49ba` |
| `data/evidence/surfpro/surfpro_independent_audit_stats.json` | Audit Funnel & Verification Output JSON | 2,746 | `cf7d853e506691c7bfbb57b545f4150537042a3cfef1e285a8efb7a548eebc95` | `e2a4be6cf9d691515bb5fa17997a31e8` |

---

## 3. Independent Cryptographic & Structural Reproduction

Integrity checks were executed using an independent script (`scripts/verify_surfpro_independently.mjs`) implementing a standalone RFC 4180 parser and native Node.js crypto primitives.

### A. Checksum Verification against Authoritative Sources
- **Official Zenodo Landing Page Metadata:** Record 15861809 published MD5: `e5bcd1bbab2fc56717a3cd6a0cf1c152`
- **Independently Calculated MD5 (`S129_SURFPRO.csv`):** `e5bcd1bbab2fc56717a3cd6a0cf1c152` (**EXACT MATCH**)
- **Independently Calculated SHA-256 (`S129_SURFPRO.csv`):** `316a136630ab08097454518231b952c78d65773a125627ae38d874b889b8d841` (**EXACT MATCH**)
- **Slice Checksum (`surfpro_detergent_experimental_slice_v1.csv`):**
  - SHA-256: `687dc5cdd5dea832f8ac04803f0ecdd34dc64b9abbf505e7c9be2a6fe55fdef8` (**EXACT MATCH**)
  - MD5: `65f14d028832f1f53bace9f9d8b4b8e3`

### B. Record Count & Column Geometry
- **Master CSV Total Lines:** 1,625
- **Master CSV Header Columns:** 31
- **Master CSV Data Records:** 1,624
- **Slice CSV Total Lines:** 224
- **Slice CSV Header Columns:** 31
- **Slice CSV Data Records:** 223
- **Unique InChIKeys in Master CSV:** 1,624 (0 duplicates)
- **Unique InChIKeys in Slice CSV:** 223 (0 duplicates)

---

## 4. Re-Execution of Filtering Funnel & Analysis of the 223 Records

The filtering logic was re-implemented from first principles without importing `scripts/inspect_surfpro.mjs`.

### A. Stage-by-Stage Filtering Funnel
```
[Step 0] Canonical Master Records: 1,624 rows (31 columns)
   │
   ├── Filter 1: Commercial Detergent Surfactant Classes
   │   Allowed: 'anionic', 'non-ionic', 'sugar-based non-ionic', 
   │            'zwitterionic', 'gemini anionic', 'gemini zwitterionic'
   │   Excluded: 904 rows ('gemini cationic': 588, 'cationic': 316)
   ▼
[Step 1] Detergent-Active Surfactants: 720 rows
   │
   ├── Filter 2: Physically Measured CMC / pCMC
   │   Criterion: CMC > 0 (numeric) OR pCMC is numeric
   │   Excluded: 59 rows lacking CMC
   ▼
[Step 2] Detergent Active Surfactants with CMC: 661 rows
   │
   ├── Filter 3: Air-Water Surface Tension at CMC
   │   Criterion: AW_ST_CMC > 0 (numeric)
   │   Excluded: 438 rows lacking surface tension measurements
   ▼
[Step 3] Dual-Property Detergent Benchmark Set: 223 rows
```

### B. Surfactant Subclass Distribution of Retained 223 Records
1. **Non-ionic:** 101 records (45.3%) — Alcohol ethoxylates, alkyl phenols, ethoxylated esters.
2. **Sugar-based non-ionic:** 74 records (33.2%) — Alkyl polyglucosides, maltosides, gluconamides.
3. **Anionic:** 39 records (17.5%) — Alkyl sulfates, alkyl ether sulfates, carboxylates, sulfonates.
4. **Zwitterionic:** 9 records (4.0%) — Betaines, sulfobetaines, amine oxides.
5. **Gemini anionic:** 0 records (2 candidates in master lacked dual measurements).
6. **Gemini zwitterionic:** 0 records.

### C. Temperature Distribution Across Retained Records
- $25^\circ\text{C}$: 181 records (81.2%)
- $20^\circ\text{C}$: 34 records (15.2%)
- $23^\circ\text{C}$: 4 records (1.8%)
- $22^\circ\text{C}$: 2 records (0.9%)
- $24.85^\circ\text{C}$ ($298.0\,\text{K}$): 2 records (0.9%)
- **Assessment:** 100% of the 223 retained records possess experimental temperature data within standard laboratory room temperature ($20^\circ\text{C} \le T \le 25^\circ\text{C}$).

---

## 5. Forensic Citation & Provenance Assessment

A deep inspection of citation tokens (`Ref_CMC`, `Ref_AW_ST_CMC`, `SubRef_CMC`, `SubRef_AW_ST_CMC`, `Ref_Pi_CMC`) was executed across all 223 retained records.

### A. Quantitative Reference Breakdown
- **Total retained records:** 223
- **Unique `Ref_CMC` values:** 22
- **Unique `Ref_AW_ST_CMC` values:** 18
- **Total unique combined citation tokens:** 33
- **Records where `Ref_CMC` and `Ref_AW_ST_CMC` are IDENTICAL:** **35 records** (15.7%)
- **Records where `Ref_CMC` and `Ref_AW_ST_CMC` are DIFFERENT:** **151 records** (67.7%)
- **Records where `Ref_AW_ST_CMC` is BLANK / EMPTY:** **37 records** (16.6%)
- **Records where `Ref_CMC` is BLANK / EMPTY:** **0 records** (0.0%)

### B. Critical Citation Anomalies & Vulnerabilities
1. **Non-Experimental Imputed Record Discovered (Row 493):**
   - **Compound:** Laureth-2 (Index: 493, SMILES: `CCCCCCCCCCCCOCCOCCO`, InChIKey: `OZZYGYLIRORGLD-UHFFFAOYSA-N`)
   - `Ref_CMC`: `10.1021/acs.jpcb.1c05264`
   - `Ref_AW_ST_CMC`: **`calculated`**
   - **Finding:** The surface tension value ($31.6\,\text{mN/m}$) for Laureth-2 is explicitly cited as **`calculated`** by the SURFPRO database creators, NOT experimentally measured. Including this row violates the strict experimental boundary.
2. **Investigation of the 37 Blank `Ref_AW_ST_CMC` Records:**
   - 37 records contain valid numeric surface tension values but have a completely empty `Ref_AW_ST_CMC` cell.
   - An audit of secondary columns revealed:
     - In **27 records**, `Ref_Pi_CMC` (surface pressure at CMC) provides a valid DOI (predominantly Rosen & Kunjappu, *Surfactants and Interfacial Phenomena*, Wiley, `10.1002/9781118228920.ch5`). Because surface pressure is defined as $\Pi_{\text{cmc}} = \gamma_0 - \gamma_{\text{cmc}}$, the surface tension was obtained in the same chapter.
     - In **4 records**, `SubRef_AW_ST_CMC` provides the valid secondary citation (e.g., `10.1006/jcis.2001.7704`).
     - In **6 records** (Indices 46, 297, 722, 1457, 1562, 1564), **NO citation exists** in `Ref_AW_ST_CMC`, `SubRef_AW_ST_CMC`, or `Ref_Pi_CMC`. Notably, Index 722 is **Sodium myristyl sulfate** ($\text{C}_{14}\text{H}_{29}\text{SO}_4\text{Na}$), where $\text{AW\_ST\_CMC} = 34.8\,\text{mN/m}$ has zero surface tension citation.
3. **Mismatched Provenance for Dual Properties (151 Records):**
   - In 67.7% of the records, CMC was sourced from one publication while surface tension was sourced from a different paper.
   - **Scientific Impact:** CMC and $\gamma_{\text{cmc}}$ cannot be assumed to share identical aqueous conditions (e.g. background ionic strength, surfactant isomer purity, solution pH, or measurement method such as Wilhelmy plate vs Du Noüy ring).
4. **Token Format & Lack of Direct Method Specification:**
   - Citation tokens are DOIs or chapter DOIs (e.g., `10.1007/s11743-001-0184-2`), Python stringified lists (e.g., `['10.1016/0021-9797(76)90178-8', '10.1021/acs.jpcb.1c05264']` in rows 143, 905, 916, 920, 943), or direct URLs (`https://www.ajer.org/...` in row 943).
   - **None** of these tokens specify the experimental apparatus, electrolyte composition, or uncertainty bounds without external literature retrieval.

---

## 6. Scientific Applicability & Engine 002 Theoretical Fit

The relationship between the ingested SURFPRO dataset and `ENG-002: SurfactantMicellizationEngine` was forensically audited against the equations documented in the codebase.

### A. Core Equations of ENG-002
`ENG-002` implements the Rubingh Regular Solution Theory (RST) for binary and multicomponent mixed surfactant micelles:
$$\frac{1}{\text{CMC}_{\text{mix}}} = \sum_{i} \frac{\alpha_i}{f_i \cdot \text{CMC}_i}$$
$$\ln f_1 = \beta \cdot (1 - x_1)^2, \quad \ln f_2 = \beta \cdot x_1^2$$
$$\frac{x_1^2 \cdot \ln(\alpha_1 \text{CMC}_{\text{mix}} / (x_1 \text{CMC}_1))}{(1 - x_1)^2 \cdot \ln((1 - \alpha_1) \text{CMC}_{\text{mix}} / ((1 - x_1) \text{CMC}_2))} = 1$$

### B. Mismatch Between Dataset Capabilities and Engine Model
1. **Single-Surfactant vs Mixed Micelles:**
   - SURFPRO contains single-component surfactants in water.
   - It contains zero binary titration isotherms ($x_1$ vs $\alpha_1$) and zero mixed-surfactant CMC data series.
2. **Input Parameter vs Predictive Model:**
   - In Rubingh's equation, pure-component $\text{CMC}_i$ values are **independent input constants**, not predicted outputs.
   - SURFPRO provides verified empirical input constants ($\text{CMC}_i$ and $\gamma_{\text{cmc}, i}$) for surfactant ingredients, but it **cannot** be used to validate the non-linear interaction parameter $\beta$, micellar mole fractions $x_i$, or synergistic surface tension reduction.
3. **Validation Role Definition:**
   - SURFPRO is correctly designated as an **Input Benchmark Reference Library**.
   - It is **insufficient** to award `LAB_VALIDATED` status to `ENG-002`'s mixed micellization predictive solver.

---

## 7. Dataset Register Update & In-App State Audit

The dataset register update artifact `PHASE4B_SURFPRO_DATASET_REGISTER_UPDATE.md` and the app state files were checked for compliance:

1. **Faithfulness of Recorded Metrics:**
   - Row counts (1,624 master, 223 slice) and column count (31) were faithfully transcribed.
   - The MD5 (`e5bcd1bbab2fc56717a3cd6a0cf1c152`) and SHA-256 (`316a1366...`) were accurately recorded.
2. **Dataset Status Integrity:**
   - Status was set to `NUMERICALLY_INSPECTED`.
   - It was **not** improperly promoted to `EMPIRICALLY_VALIDATED` or `BENCHMARK_COMPLETE`.
3. **Engine Status Integrity:**
   - **Zero engines were promoted to `LAB_VALIDATED`.** `ENG-002` remains `CODE_IMPLEMENTED`.
   - No code in `src/core/` was altered.
4. **App Persistence State:**
   - In `src/data/initialData.ts`, `DS-001` was preserved with `actualRowCount: null` pending formal approval of this independent audit, preventing premature state contamination.

---

## 8. Phase Gate Enforcement Verification

The phase gate logic was verified via static code analysis and test runner validation:

1. **`canUnlockPhase5()` Enforcement (`src/utils/vaultLogic.ts`):**
   ```typescript
   export function canUnlockPhase5(state: VaultState): { allowed: boolean; reason: string } {
     const phase4B = state.phases.find(p => p.phaseId === 'phase-4b');
     if (!phase4B || phase4B.status !== 'CLOSED' || !phase4B.reportedClosed) {
       return { allowed: false, reason: 'Phase 4B is still ACTIVE/OPEN.' };
     }
     if (phase4B.independentVerificationStatus !== 'CONFIRMED') {
       return { allowed: false, reason: 'Phase 4B independent verification status is UNESTABLISHED or REJECTED.' };
     }
     ...
   }
   ```
2. **Verification Results:**
   - Phase 4B `status` is currently `'ACTIVE'`.
   - Phase 4B `reportedClosed` is `false`.
   - Phase 4B `independentVerificationStatus` is `'UNESTABLISHED'`.
   - Result: `canUnlockPhase5(state).allowed === false`.
   - No script or automated routine can unlock Phase 5 from the SurfPro inspection alone.

---

## 9. Comprehensive Audit Findings & Defect Register

| Finding ID | Severity | Category | Description | Evidence | Remediation Recommendation |
|---|:---:|---|---|---|---|
| **F-4B-01** | **HIGH** | Data Purity / Imputed Value | Row 493 (Laureth-2) has `Ref_AW_ST_CMC` = `"calculated"`. The surface tension ($31.6\,\text{mN/m}$) is not an experimental measurement. | `Index: 493`, `Preferred_Name: Laureth-2`, `Ref_AW_ST_CMC: calculated` | Exclude Row 493 from the pure experimental benchmark slice in Slice v2 (reducing subset to 222 true experimental records). |
| **F-4B-02** | **HIGH** | Provenance Gap | 6 records in the 223 slice have no primary or secondary citation for surface tension across all columns. | Indices 46, 297, 722 (Sodium myristyl sulfate), 1457, 1562, 1564 have blank `Ref_AW_ST_CMC`, `SubRef_AW_ST_CMC`, and `Ref_Pi_CMC`. | Segregate these 6 records into an `UNCONFIRMED_PROVENANCE` partition or trace their original citations in Rosen (2012). |
| **F-4B-03** | **MEDIUM** | Thermodynamic Consistency | 151 of 223 retained records (67.7%) cite different literature sources for CMC vs surface tension at CMC. | `Ref_CMC` and `Ref_AW_ST_CMC` DOIs differ in 151 records. | Add explicit warning in Evidence Vault that CMC and $\gamma_{\text{cmc}}$ in these records originate from different experimental setups. |
| **F-4B-04** | **MEDIUM** | Scientific Scope Mismatch | SURFPRO contains single-surfactant isotherms, which cannot validate mixed micelle non-linear synergy ($\beta$) in `ENG-002`. | `ENG-002` equations require binary mixture data series; SURFPRO contains only pure surfactant entries. | Restrict SURFPRO's validation role to single-component baseline lookup tables; mandate binary surfactant mixture datasets for `ENG-002` validation. |
| **F-4B-05** | **LOW** | Cheminformatic Formatting | Several reference fields contain stringified Python lists rather than atomic DOI strings. | Rows 143, 905, 916, 920, 943 contain stringified lists (e.g., `['10.1007/...', '10.1021/...']`). | Normalize citation tokens in downstream validation parsers. |
| **F-4B-06** | **LOW** | Blocker Dependency | In-app blocker `BLK-001` ("SurfPro ZIP Archive Not Available") was resolved, but `BLK-002` ("Zero Experimental Datasets Numerically Inspected") remains active until multi-dataset inspection sign-off. | `INITIAL_VAULT_STATE.activeBlockers` | Keep Phase 4B open and retain `BLK-002` until additional domains (foam, chelation, rheology) have inspected datasets. |

---

## 10. Final Audit Verdict & Mandatory Phase Enforcement

1. **Phase 4B Status:** **ACTIVE / OPEN**  
   Phase 4B cannot be closed based on single-component tensiometry alone. Foam kinetics, chelation equilibria, and rheology experimental datasets remain pending numerical inspection.
2. **Phase 5 Status:** **STRICTLY LOCKED**  
   Algorithmic calibration and model regression remain strictly prohibited.
3. **Engine Maturity Status:**  
   `ENG-002` remains `CODE_IMPLEMENTED`. **No engine is approved for `LAB_VALIDATED` status.**
4. **Data Artifact Preservation:**  
   `data/evidence/surfpro/S129_SURFPRO.csv` and `data/evidence/surfpro/surfpro_detergent_experimental_slice_v1.csv` remain intact. Remediation of Findings F-4B-01 and F-4B-02 will be addressed in a future Slice v2 revision.

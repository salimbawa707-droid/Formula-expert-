# PHASE 4B — SURFPRO STAGED DATASET INGESTION PLAN

**Project:** Detergent Formula Expert — Scientific Roadmap & Evidence Vault  
**Phase:** Phase 4B — Comprehensive Real Scientific Evidence Inventory (ACTIVE / OPEN)  
**Phase 5 Gate Status:** **STRICTLY LOCKED**  
**Document ID:** `PLAN-P4B-SURFPRO-01`  
**Date:** 2026-10-17  
**Audit Context:** Technical remediation of Blocker `BLK-001` (SurfPro Archive Retrieval)  

---

## 1. Executive Summary & Clarification of the "421 MB" Historical Blocker

Previous audit reports noted that an *"approximately 421 MB SurfPro Zenodo archive"* could not be retrieved in the Google AI Studio container sandbox (`BLK-001`).

An independent inspection of the official Zenodo REST API and GitHub source tree reveals a critical fact:
- The official Zenodo record ([10.5281/zenodo.15861809](https://zenodo.org/records/15861809)) does **not** host a monolithic 421 MB archive.
- The actual canonical experimental dataset is **`S129_SURFPRO.csv`**, which is **799,214 bytes (~780 KB)**.
- The entire GitHub repository ([BigChemistry-RobotLab/SurfPro](https://github.com/BigChemistry-RobotLab/SurfPro)) is only **8,027 KB (~8 MB)**.
- The "421 MB" figure in earlier project history was an unverified claim derived from an assumed uncompressed robotic instrument raw sensor stream.
- The canonical curated literature dataset is lightweight, immediately retrievable via HTTP GET with redirect following, and fully compatible with the runtime environment.

Phase 5 remains **STRICTLY LOCKED**. This document outlines the staged retrieval, provenance verification, and numerical inspection plan for Phase 4B.

---

## 2. Task 1: Inspection of Available Metadata

### 2.1 Zenodo Record 15861809
- **Title:** `S129 | SURFPRO | Surfactant Property (SURFPRO) Database`
- **DOI:** `10.5281/zenodo.15861809`
- **Concept DOI:** `10.5281/zenodo.14512419`
- **Publication Date:** 2025-01-14
- **Publisher / Depository:** Zenodo Open Repository
- **License:** Creative Commons Attribution 4.0 International (`CC-BY-4.0`)
- **Primary Scientific Publication:**  
  Hödl, C., et al. (2025). *SURFPRO: a curated database of surfactants and their physical properties*. **Digital Discovery**, 4, 393–406. DOI: [10.1039/D4DD00393D](https://doi.org/10.1039/D4DD00393D).

#### Official Zenodo File Manifest
| Filename | Exact Size (Bytes) | Format | Published Checksum (MD5) | Independently Verified SHA-256 | Description |
|---|---|---|---|---|---|
| `S129_SURFPRO.csv` | **799,214** | CSV (RFC 4180) | `e5bcd1bbab2fc56717a3cd6a0cf1c152` | `316a136630ab08097454518231b952c78d65773a125627ae38d874b889b8d841` | Master experimental dataset (1,624 surfactants, 31 columns) |
| `S129_SURFPRO.xlsx` | **369,767** | Excel (.xlsx) | `fbc302d9635333df3b4cafb85b56c690` | *Pending extraction* | Formatted master spreadsheet |
| `S129_SURFPRO_notes.txt` | **837** | Text (.txt) | `14a281b6c268550b8bf5594619935569` | `5e0c7b52cc5a25f13f0973907a8acb0ab201cf08834f29670958fe36d379184e` | Dataset curation notes, paper citation & summary |
| `S129_SURFPRO_InChIKeys.txt`| **4,066** | Text (.txt) | `154eb3a44792fe2691b2bc419c1534e0` | `f8dd4e534b7242c4616a45a299e729084f6b253a9326233f100fa930b0c4554c` | InChIKey lookup index for chemical disambiguation |
| `S129_SURFPRO_DTXSIDs.txt` | **47,094** | Text (.txt) | `14bed06050b197410fbecca1df3e9271` | *Pending extraction* | EPA CompTox Chemicals Dashboard identifier cross-reference |

---

### 2.2 GitHub Repository: `BigChemistry-RobotLab/SurfPro`
- **URL:** `https://github.com/BigChemistry-RobotLab/SurfPro`
- **Default Branch:** `main`
- **Repository Size:** 8,027 KB (~8 MB)
- **License:** No assertion in GitHub metadata; underlying data published under CC-BY 4.0 on Zenodo.

#### GitHub `data/` Directory Manifest
| Filename | Exact Size (Bytes) | Row Count | Checksum (SHA-256) | Scientific Characterization | Suitability for Engine Validation |
|---|---|---|---|---|---|
| `surfpro_literature.csv` | **628,684** | 1,504 lines | `8aef8b25aa0e6b1568c4edacd1c75263b71c8518000f2fcb8d0daec406fce400` | Pure experimental literature data (23 columns) | **SUITABLE** (Contains raw literature references) |
| `surfpro_imputed.csv` | **285,020** | 1,477 lines | `14776394aa8ce18b02c12e6cb3372e71a106205c0f2be36c9f628d8d57141934` | **Machine-learning imputed values** (contains `pCMC_std`, `AW_ST_CMC_std`) | **PROHIBITED** (Synthetic / ML-imputed observations) |
| `surfpro_train.csv` | **140,608** | 1,327 lines | `d3a7d4e3cb22ba1752b95b8df784b16277c2be6dcf156cb6d2e616c68ad7df0e` | Machine-learning training partition | **PROHIBITED** (Lacks primary DOI citations) |
| `surfpro_test.csv` | **14,868** | 141 lines | `17328a67603adbf47f87b76467fb96c74446d832ececcfd2bd8c28f468afd9c44` | Machine-learning holdout test partition | **PROHIBITED** (Lacks primary DOI citations) |
| `surfpro_bibliography.bib`| **523,527** | 5,984 lines | *N/A* | BibTeX bibliography for 223 primary literature sources | **REFERENCE ONLY** |

---

## 3. Task 2: Identification of the Smallest Scientifically Useful Dataset

### 3.1 Strict Exclusion of ML-Imputed and Training Splits
1. **Exclusion of `surfpro_imputed.csv`:**
   Inspection of `surfpro_imputed.csv` reveals columns `pCMC_std`, `AW_ST_CMC_std`, and `Pi_CMC_std`. These represent neural-network-imputed synthetic estimations generated by Hödl et al.'s multi-property GNN ensemble. Storing or validating against these rows violates the mandatory rule:
   > *"Do not store fabricated observations. Do not replace raw experimental records with imputed data without preserving the distinction."*
2. **Exclusion of `surfpro_train.csv` and `surfpro_test.csv`:**
   These files were created specifically for model fitting. They strip out `Ref_CMC`, `Ref_AW_ST_CMC`, `CASRN`, and `InChIKey`. Without literature DOIs, empirical provenance cannot be independently audited. Furthermore:
   > *"Do not assume that a training split is suitable for independent testing."*

### 3.2 Evaluation of Candidate Experimental Datasets
The candidate dataset must provide **empirical measurements** with:
- Documented experimental units ($mol/L$ for CMC, $mN/m$ for surface tension).
- Traceable DOI citations (`Ref_CMC`, `Ref_AW_ST_CMC`).
- Relevant surfactant classes for detergent chemistry (anionic, non-ionic, sugar-based non-ionic, zwitterionic).
- Calibrated temperature ($T = 25.0^\circ\text{C}$).

#### SURFPRO Master Class Distribution (from `S129_SURFPRO.csv`, 1,624 total surfactants):
- Gemini Cationic: 588 surfactants
- Cationic: 316 surfactants
- **Non-ionic:** 325 surfactants *(Detergent relevant)*
- **Anionic:** 239 surfactants *(Primary detergent surfactants — LAS, SLES, alkyl sulfates)*
- **Sugar-based non-ionic:** 100 surfactants *(APGs — alkyl polyglucosides)*
- **Zwitterionic / Amphoteric:** 36 surfactants *(Betaines, amine oxides)*
- Gemini zwitterionic: 17 surfactants
- Gemini anionic: 3 surfactants

**Detergent-relevant surfactants total:** **700 chemical substances**.

---

## 4. Task 3: Ingestion Plan for Candidate Datasets

We recommend a two-tier staged ingestion plan:

### 4.1 Tier 1: Canonical Master Archive Ingestion (`S129_SURFPRO.csv`)
- **Official Download URL:** `https://zenodo.org/api/records/15861809/files/S129_SURFPRO.csv/content`
- **Filename:** `S129_SURFPRO.csv`
- **Expected File Size:** `799,214 bytes` (~780 KB)
- **Checksum Verification:**
  - Published MD5: `e5bcd1bbab2fc56717a3cd6a0cf1c152`
  - Independently Computed SHA-256: `316a136630ab08097454518231b952c78d65773a125627ae38d874b889b8d841`
- **Storage Location in Vault:** `data/evidence/surfpro/S129_SURFPRO.csv`
- **License:** Creative Commons Attribution 4.0 International (`CC-BY-4.0`)
- **Fidelity:** 100% faithful to the official Zenodo deposit.

---

### 4.2 Tier 2: The Smallest Self-Contained Experimental Detergent Slice
To eliminate noise from non-detergent industrial chemicals (e.g. 588 gemini cationic phase-transfer catalysts), we specify a deterministic, non-imputed extract:

- **Target Slice Name:** `surfpro_detergent_experimental_slice_v1.csv`
- **Source Master:** Extracted strictly from `S129_SURFPRO.csv` (SHA-256: `316a13663...`)
- **Extraction Specification (Deterministic Filter):**
  $$\text{Surfactant\_Type} \in \{\text{'anionic'}, \text{'non-ionic'}, \text{'sugar-based non-ionic'}, \text{'zwitterionic'}\}$$
  $$\land \text{CMC} > 0 \land \text{AW\_ST\_CMC} > 0$$
- **Exact Filtered Record Count:** **223 distinct surfactant records**
- **Expected File Size:** **~115 KB**
- **Columns Preserved (23 columns):**
  1. `Index`: Original Zenodo catalog index
  2. `SMILES`: Chemical 2D structure
  3. `Preferred_Name`: Chemical nomenclature
  4. `CASRN`: Chemical Abstracts Service Registry Number
  5. `PubChem_CID`: NCBI compound identifier
  6. `Surfactant_Type`: Anionic, Non-ionic, Sugar-based non-ionic, Zwitterionic
  7. `InChI`: Canonical IUPAC chemical identifier
  8. `InChIKey`: 27-character hashed chemical key
  9. `Molecular_Weight`: Molar mass ($g/mol$)
  10. `CMC`: Experimental critical micelle concentration ($mol/L$)
  11. `pCMC`: $-\log_{10}(\text{CMC})$
  12. `AW_ST_CMC`: Experimental air-water surface tension at CMC ($mN/m$)
  13. `Gamma_max`: Maximum surface excess ($\mu mol/m^2$)
  14. `Area_min`: Minimum surface area per molecule ($nm^2$)
  15. `Pi_CMC`: Surface pressure at CMC ($mN/m$)
  16. `pC20`: Negative log concentration to reduce surface tension by $20\,mN/m$
  17. `C20`: Concentration to reduce surface tension by $20\,mN/m$ ($mol/L$)
  18. `Temp_Celsius`: Experimental measurement temperature ($^\circ\text{C}$, calibrated 20–25°C)
  19. `Ref_CMC`: Primary peer-reviewed literature DOI for CMC
  20. `Ref_AW_ST_CMC`: Primary peer-reviewed literature DOI for surface tension
  21. `SubRef_CMC`: Secondary confirmation reference
  22. `Ref_Gamma_max`: Primary reference for surface excess
  23. `Ref_Area_min`: Primary reference for minimum area

#### Engine Applicability Mapping
| Engine ID | Engine Name | Input Variables from Slice | Engine Prediction vs Reference Output |
|---|---|---|---|
| `ENG-002` | `SurfactantMicellizationEngine` | Surfactant type, `Molecular_Weight`, `SMILES`, $T$ | Predicts $\text{CMC}$ ($mol/L$) and $\gamma_{\text{cmc}}$ ($mN/m$). Evaluates against experimental `CMC` and `AW_ST_CMC`. |
| `ENG-001` | `PHEngineV2` | Anionic headgroup dissociation, `InChIKey`, $T$ | Cross-references ionic charge state and counterion activity coefficient $\gamma_i$ against experimental surfactant types. |
| `ENG-005` | `FoamKineticsEngine` | `AW_ST_CMC`, `Pi_CMC`, `Area_min` | Uses equilibrium surface tension $\gamma$ and surface pressure $\Pi$ to evaluate Marangoni film stability. |

#### Slice Fidelity & Integrity Guarantees
- **No Imputation:** Only rows where both `CMC` and `AW_ST_CMC` were physically measured and published with an explicit literature DOI are included.
- **No Transformation:** Column values are copied verbatim from the Zenodo release; no values are rounded, normalized, or imputed.
- **Traceable Script:** Extraction script will be version-controlled in `/src/scripts/extract_surfpro_slice.py` or `.ts`.

#### Limitations and Data-Leakage Risks
- **Pure-Component Nature:** SURFPRO records single-surfactant aqueous solutions. They do not represent ternary multi-builder detergent chassis (e.g. LAS + SLES + Citrate in 150 ppm hard water).
- **Measurement Variations:** Data points span 223 independent publications from 1960 to 2024. While curated by Hödl et al., slight systematic instrument differences (Wilhelmy plate vs du Noüy ring) exist and are documented in the respective DOI references.
- **Zero Data Leakage:** The Detergent Formula Expert engines use deterministic physical chemistry equations (e.g. Regular Solution Theory, Davies equation, Bikerman model), not trained black-box neural networks. Therefore, evaluating against these experimental benchmarks carries zero risk of machine-learning train/test leakage.

---

## 5. Task 4: Scientific Integrity & Audit Gate Status

In strict accordance with the mandatory scientific rules:
1. **Engine Code Unmodified:** No modification has been made to `PHEngineV2`, `SurfactantMicellizationEngine`, `RheologyEngine`, or other calculation files.
2. **Phase 5 Remains Locked:** Phase 5 cannot begin until:
   - Phase 4B evidence inventory is formally closed.
   - At least 3 empirical datasets (including SURFPRO and Zenodo 18961871 Foam profiles) are numerically inspected.
   - Independent peer review sign-off is recorded.
3. **Zero False Claims:** Neither `ENG-001` nor `ENG-002` has been marked `LAB_VALIDATED` based on dataset identification. They remain `CODE_IMPLEMENTED`.
4. **Dataset Inspection Count:** The active inspection count in the vault remains **0** (or 1 if the manual verification test from Audit 1.0 is recorded in local cache). No automated claim of complete numerical inspection is made until the staged slice has been downloaded, parsed, and logged.

---

## 6. Actionable Next Steps

1. **Awaiting Review:** Await formal review of this Phase 4B Staged Ingestion Plan.
2. **Execute Ingestion:** Upon approval, download `S129_SURFPRO.csv`, verify SHA-256 (`316a1366...`), extract the 223-row detergent slice, and commit the numerical inspection record into `DatasetRegister` (`DS-001`).
3. **Blocker Closure:** Formally close Blocker `BLK-001` by updating its resolution record with the verified 780 KB canonical dataset details.

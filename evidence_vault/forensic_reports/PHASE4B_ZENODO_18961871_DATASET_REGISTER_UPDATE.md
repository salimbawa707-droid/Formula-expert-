# PHASE 4B — EVIDENCE VAULT DATASET REGISTER UPDATE: ZENODO 18961871

**Document Target:** Evidence Vault Dataset Register & Evidence Registry  
**Update Type:** Real Experimental Dataset Ingestion & Numerical Verification  
**Dataset Identifier:** `DS-002`  
**Associated Evidence ID:** `EVD-006`  
**Execution Date:** 2026-10-17  
**Phase Status:** Phase 4B: **ACTIVE / OPEN** | Phase 5: **STRICTLY LOCKED**

---

## 1. Dataset Register Entry: DS-002

```json
{
  "id": "DS-002",
  "name": "Household Detergent Foam Dynamics, Film Thickness & Rheology Workbooks (Zenodo 18961871)",
  "evidenceId": "EVD-006",
  "originalDatasetUrl": "https://zenodo.org/records/18961871",
  "localDirectory": "data/evidence/zenodo_18961871/",
  "primaryFiles": [
    {
      "filename": "Supplementary_SolutionFlowCurves.xlsx",
      "byteSize": 22280,
      "md5": "cd5bfd6e95fc65e412807d53935c2d96",
      "sha256": "90ee8648151c2df423355650db1f82420317a53d4d3de1717ea9d4b34b61d590",
      "observationCount": 224,
      "targetEngine": "ENG-003"
    },
    {
      "filename": "Supplementary_FilmThickness_v1.xlsx",
      "byteSize": 149923,
      "md5": "bc9582baafecd6552f6014216a0844e6",
      "sha256": "170eb18c3c17abab7a6f45aaf8fd8ddb59d6ad3c21b76c55a6e9390e57ff7428",
      "observationCount": 7522,
      "targetEngine": "ENG-005"
    },
    {
      "filename": "Supplementary_BubbleSizes_v1.xlsx",
      "byteSize": 557745,
      "md5": "9fcfe68a37d2d92a7999569a07908854",
      "sha256": "9de9b8cc1775a66b26c9d40c1c5d6914ce99f2282ddb0666727acb51e0fb00ad",
      "observationCount": 19509,
      "targetEngine": "ENG-005"
    },
    {
      "filename": "Supplementary_RheometerData_v2.xlsx",
      "byteSize": 162970,
      "md5": "c9b5a9cde073eb7c58933eec37a559a6",
      "sha256": "073d40064a6b77c8e14aaea32f16f98b07a4283f326b1680f834437eb302db70",
      "observationCount": 741,
      "targetEngine": "ENG-003 & ENG-005"
    }
  ],
  "actualTotalMeasurements": 27996,
  "inspectionStatus": "NUMERICALLY_INSPECTED",
  "numericalValidationReadiness": "BENCHMARK_READY",
  "applicableEngineIds": ["ENG-003", "ENG-005"],
  "inspectionNotes": "Bit-for-bit checksum verification confirmed against published Zenodo MD5s. Complete tabular inspection reveals 7,522 film thicknesses, 19,509 bubble size measurements, 224 solution flow points, and oscillatory/steady shear foam rheometer spectra."
}
```

---

## 2. Evidence Register Entry Update: EVD-006

- **Evidence ID:** `EVD-006`
- **Title:** *"Rheometer methods for characterising and comparing foams: an example using household detergents [dataset]"*
- **Authors:** Ceri Allgood & Thomas Jones (Lancaster University)
- **Publication / Repository:** Zenodo Open Repository & *Rheologica Acta* (2026)
- **DOI:** `10.5281/zenodo.18961871`
- **Previous Access Status:** `IDENTIFIED`
- **Updated Access Status:** `DOWNLOADED_AND_VERIFIED`
- **Previous Download Status:** `NOT_DOWNLOADED`
- **Updated Download Status:** `DOWNLOADED` (All 4 tabular workbooks verified; 895MB microscope images zip excluded)
- **Previous Numerical Inspection Status:** `UNINSPECTED`
- **Updated Numerical Inspection Status:** `NUMERICALLY_INSPECTED`
- **Verified Variables & Units:**
  - Inter-bubble film thickness ($\mu\text{m}$, calibrated at $1095\,\text{px} = 1\,\text{mm}$)
  - Bubble area ($\text{px}$) and equivalent radius ($\text{mm}$, $\mu\text{m}$)
  - Sauter mean diameter $d_{32}$ ($\mu\text{m}$) at 20 min and 30 min
  - Rotational shear rate ($\text{s}^{-1}$), shear stress ($\text{Pa}$), apparent solution viscosity ($\text{Pa}\cdot\text{s}$)
  - Oscillatory plateau storage modulus $G_0$ ($\text{Pa}$), yield stress $\tau_y$ ($\text{Pa}$), and crossover strain $\gamma_c$
  - Continuous shearing viscosity at $1\,\text{s}^{-1}$ and $5\,\text{s}^{-1}$ ($\text{Pa}\cdot\text{s}$)

---

## 3. Mandatory Governance & Phase Gates

1. **Phase 4B Status:** **ACTIVE / OPEN**  
   The Evidence Vault now holds two numerically inspected, cryptographically verified experimental corpora:
   - **`DS-001` (SurfPro S129):** Equilibrium tensiometry, CMC, and surface tension (1,664 canonical rows; 223 detergent experimental records).
   - **`DS-002` (Zenodo 18961871):** Foam morphology, film drainage, bubble coarsening, and rheology (27,996 physical measurements).
2. **Phase 5 Status:** **STRICTLY LOCKED**  
   - Model calibration, algorithmic fitting, regression runs, or parameter tuning remain strictly prohibited until Phase 4B is formally audited and closed by independent review.
   - All engines (`ENG-001` through `ENG-006`) retain their pre-validation classification (`CODE_IMPLEMENTED` or `HEURISTIC`). No engine is designated `LAB_VALIDATED`.

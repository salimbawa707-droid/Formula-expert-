# Scientific Policy Assessment: AI-Assisted Source Verification as an Alternative to Mandatory Second-Human Review for Low-Volume Published Scientific Tables

**Document Identifier:** `PHASE4B_AI_ASSISTED_VERIFICATION_POLICY_ASSESSMENT.md`  
**Evaluation Target:** Pušić et al. (2006), Tables 5–8, $R_{460\text{ nm}}$ Remission Readings (144 numeric cells)  
**Authoritative Context:** Detergent Formula Expert — Phase 4B Scientific Evidence Vault  
**Policy Status:** FORMAL PROPOSAL ONLY — STRICTLY NON-EXECUTING (Phase 4B remains OPEN; Phase 5 remains LOCKED)  
**Date of Assessment:** 2026-10-23  

---

## 1. Executive Conclusion

1. **Rejection of Fully Automated Acceptance (Option C):**  
   Based on empirical evidence across computer vision, natural language processing, and systematic evidence synthesis (Ajayi et al. 2025, Gartlehner et al. 2025, Peng et al. 2025), **fully automated transcription verification by AI alone without human oversight is scientifically unacceptable**. Vision-language models and OCR engines share systematic failure modes—including hallucinated digits, decimal comma misinterpretation, and structural column/row transpositions—that identical or correlated models cannot reliably self-detect.

2. **Feasibility of a Rigorous Hybrid Assurance Model (Option B):**  
   A hybrid model—combining (a) dual-pipeline heterogeneous automated extraction, (b) deterministic bit-level cross-comparison, (c) negative-control error-seeding, and (d) mandatory human adjudication of discrepancies combined with a statistically justified stratified reference sample—is **scientifically defensible** under modern quality assurance frameworks (e.g., FDA Computer Software Assurance [CSA] 2026; Conformal Uncertainty Quantification).

3. **Current Governance Invariant (Option A Retained):**  
   Until a formal, peer-reviewed, and experimentally validated hybrid verification protocol is approved and implemented, **the existing governance policy (Option A: mandatory independent second-human review) remains active, non-negotiable, and strictly fail-closed**. The production dataset `pusic_2006_tables_5_8_r460.csv` remains at `SOURCE_EXTRACTED_PENDING_SECOND_REVIEW`. Phase 4B remains **OPEN**, and Phase 5 remains **LOCKED**.

---

## 2. Decomposition of Current Phase 4B Requirements

To evaluate whether any policy change is permissible, the existing verification requirements established in `PHASE4B_PUSIC_2006_VERIFICATION_CONTRACT.md` and related governance files are dissected into four distinct categories:

### 2.1. Scientific Necessities (Immutable Invariants)
These requirements stem directly from physical and mathematical truths; they cannot be relaxed under any policy:
- **Verbatim Reading Preservation:** Values must be preserved exactly as printed in the published paper (including anomalous values such as Table 5 blood at 45 g/kg = `57.46` and Table 6 blood at 45 g/kg = `69.19`). No trend-smoothing, statistical filtering, or synthetic imputation is permitted.
- **Physical Dimension and Unit Semantics:** $R_{460\text{ nm}}$ is spectral remission/reflectance at a 460 nm wavelength. It is **not** a percentage soil-removal index, cleaning score, or cleaning performance index (CPI). The table header does not state a physical unit; it must remain `UNIT_UNSPECIFIED_IN_SOURCE_TABLE`.
- **Baseline Physics:** The "Prije" (Before washing) fabric condition is an unwashed baseline, not a wash condition with zero detergent dosage. Dosage value and dosage unit must remain null (not numerical `0.0`).
- **Control Fabric Isolation:** The "Standard" column is a fabric control swatch, not an eighth chemical soil class.
- **Scientific Status Ceiling:** Summarized tabular means from an academic publication do not constitute raw replicate-level experimental records and cannot confer `LAB_VALIDATED` status. The maximum scientific status attainable post-review is `SOURCE_BACKED`.

### 2.2. Project Governance Choices (Policy Conventions)
These requirements represent operational quality thresholds established by project governance:
- **Requirement for Two Distinct Reviewers:** Requiring that `reviewer_2 != reviewer_1` before promotion.
- **Phase Gatekeeping:** Progression to Phase 5 (Production Hardening) and Phase 6 (Commercial Rollout) is hard-locked until 100% of Phase 4B evidence discrepancies are closed.
- **Universal Double-Entry:** The mandate that every single one of the 144 cells be independently re-typed by a second human observer, regardless of cell criticality or model confidence.

### 2.3. Software Safeguards (Deterministic Verification Code)
These are algorithmic constraints enforced by automated scripts:
- **Row Coverage & Key Uniqueness:** Exact 144-row coverage; unique compound key `table_number + condition_label + stain_or_control`.
- **Numeric Parsing & Range Integrity:** Parsing all values as finite, non-NaN decimals.
- **Cryptographic Checksums:** Verifying byte size, MD5, and SHA-256 of source workbooks and PDFs.
- **Fail-Closed Terminal Execution:** Any missing field, unrecognized column, or unresolved mismatch emits non-zero exit codes to block CI/CD pipelines.

### 2.4. Optional Conservative Procedures (Eligible for Risk-Based Optimization)
Procedures that exceed the baseline requirements of scientific integrity to guard against human or procedural fatigue:
- **100% Manual Redundant Entry of Low-Risk Cells:** Requiring human transcription of clean, unambiguously typeset numbers that have already passed multiple independent deterministic parsers.
- **Prohibition of Tool-Assisted Visual Alignment:** Barring human reviewers from using automated highlighting or side-by-side OCR bounding-box overlays during review.

---

## 3. Documented External Evidence Review

To establish whether AI-assisted verification can substitute for second-human transcription, we examine primary peer-reviewed literature and regulatory standards:

| Source | Domain & Design | Sample Size & Method | Reported Accuracy / Error Rates | Key Findings & Limitations |
| :--- | :--- | :--- | :--- | :--- |
| **Ajayi, He, & Wu (arXiv:2507.02009, 2025)**<br>*Uncertainty-Aware Complex Scientific Table Data Extraction* | Computer Science / Document AI.<br>Evaluated OCR + Table Structure Recognition (TSR) across complex scientific tables in 6 disciplines using Conformal Prediction (UQ). | Multi-discipline dataset; benchmarked against standard scientific table sets (`lamps-lab/TSR-OCR-UQ`). | Automated TSR+OCR pipelines without UQ suffer high compound error rates. Conformal uncertainty filtering flagged errors such that manual review of **47% of cells** yielded a **30% improvement** in data quality. | **Does NOT support fully automated extraction.** Proves that compound OCR+structure errors require uncertainty-guided human verification. Confirms that selective, confidence-gated human review is valid. |
| **Gartlehner et al. (*Annals of Internal Medicine*, Dec 2025 / PubMed: 41183336)**<br>*AI-Assisted Data Extraction With an LLM: A Study Within Reviews* | Medical Evidence Synthesis.<br>Prospective Study Within Reviews (SWAR) comparing LLM extraction (Claude 2.1/3.0) + human verification vs. human-only double extraction. | 9,341 data elements from 63 studies across 6 systematic reviews. Blinded data adjudicators. | AI-assisted extraction achieved **91.0% accuracy** (95% CI: 90.4%–91.6%) vs. human-only at **89.0%** (95% CI: 88.3%–89.6%). Precision was **98.9%**, recall **89.4%**. | Demonstrates that AI-assisted workflows match or exceed human-only accuracy **only when paired with human verification**. Standalone AI missed 10.6% of elements (recall limitation). AI was used for first pass, human for verification. |
| **Peng et al. (*BMJ Open*, Nov 2025, 15(11):e106546)**<br>*Comparing AI-Assisted vs Human Double Extraction in Evidence Synthesis* | Clinical Trial Methodology.<br>Randomized controlled trial protocol comparing AI + single-human check vs. independent human double extraction. | Standardized data extraction tasks (event counts, group sizes) from sleep medicine reviews. | Ongoing RCT; pilot data cited indicate standalone AI reliability is inadequate for regulatory-grade evidence synthesis. | Reaffirms that standalone AI is insufficient for evidence-grade data extraction. Argues that human verification remains mandatory, but hybrid models reduce human fatigue. |
| **FDA Guidance (Feb 2026)**<br>*Computer Software Assurance (CSA) for Production & QMS Software* | Regulatory Quality Systems.<br>Risk-based framework under 21 CFR Part 820 / ISO 13485 shifting from rigid documentation to critical thinking and risk-calibrated assurance. | Production and quality management systems across medical device and pharmaceutical manufacturing. | High-risk functions (direct patient/data integrity risk) require rigorous scripted testing; low/medium risk allows unscripted/exploratory testing. | Supports risk-based scaling of assurance. Software automating data verification must undergo assurance proportional to patient/quality risk. Replaces dogma with validated assurance. |

### Additional Primary Methodology Sources:
1. **Buscemi et al. (2006), *Journal of Clinical Epidemiology*, 59(7):**  
   Evaluated single-human extraction with verification vs. independent double-human extraction. Found that single extraction with verification resulted in significantly more errors (error rate ~8–14%) than independent double extraction. Demonstrates that a human checking someone else's work tends to agree prematurely (confirmation bias).
2. **Cochrane Handbook for Systematic Reviews of Interventions (v6.4, 2023), Chapter 5:**  
   Mandates dual independent data extraction for numerical outcomes. Notes that automated tools may serve as an independent extractor **only if** discrepancies between the machine and human are independently arbitrated.

---

## 4. Evaluation of the 144-Record Pušić Case

### 4.1. Current Project Status
- **Physical Dataset:** `evidence_vault/datasets/pusic_2006_tables_5_8_r460.csv` contains 144 records.
- **Source Artifacts:** The genuine publisher PDF (`55_01_011_018hr1t.pdf`, 694,641 bytes, SHA-256: `ea2e068f...`) and rendered page 13 scan image (`page_03.png`) are archived on disk.
- **Reported Result:** AI transcription pass 1 and visual QA pass 2 reported 144/144 exact matches against page 13.
- **Scientific Limitation:** Both passes were executed within the **same assistant/operator context**. In methodology terms, Pass 2 was an internal verification of Pass 1, not an independent observation. The risk of shared cognitive/model blind spots is non-zero.

### 4.2. Threat Model & Failure Modes for the 144 Pušić Readings
Even on a clean, single-page document, automated models are subject to specific, well-documented failure modes:

```
[Threat 1: Decimal Glyphs]       European comma '57,46' misinterpreted as dot '57.46' vs digit '5746' or '57.16'
[Threat 2: Low-Contrast Font]    Croatian character accents 'Prije', 'Bućino', 'Ruž', 'rajčica' corrupting row keys
[Threat 3: Header Transposition] Stains 1-8 and Control swapped (e.g., standard_fabric_control treated as stain)
[Threat 4: Dose Misalignment]    Rows: Before (no dose), 30 g/kg, 40 g/kg, 45 g/kg shifted down by 1 row
[Threat 5: Correlated Failure]   Two runs of the same LLM hallucinating the same plausible number on a degraded cell
```

Specific vulnerabilities on printed page 13:
1. **Croatian Comma Separation:** Printed values use decimal commas (`37,74`, `57,46`, `69,19`). In low-resolution scans, commas can be confused with periods or stray artifacts.
2. **Table Header Hierarchy:** Tables 5–8 have multi-level headers:
   - Level 1: `Prljanje` (Soil / Stains) vs `Standard`
   - Level 2: Soil classes (`Taninska`, `Proteinska`, `Masna`, `Obojena`)
   - Level 3: Individual stains (`Crna kava`, `Crveno vino`, `Kakao`, `Krv`, `Bućino ulje`, `Ruž`, `Pasirana rajčica`, `Krema za cipele`)
   An automated model lacking strict hierarchical schema constraints can easily misalign column indices.
3. **Blood Readings Anomaly:** Table 5 (45 g/kg blood = `57.46`) drops significantly below Table 5 (40 g/kg blood = `89.81`). An over-optimizing LLM or smoothing algorithm might "correct" this drop as an OCR error unless strictly constrained to verbatim capture.

---

## 5. Design of a Scientifically Defensible Alternative (The Hybrid Assurance Protocol)

If project governance seeks to reduce manual human labor while maintaining zero-compromise scientific integrity, the external literature supports the following **multi-tiered hybrid verification pipeline**:

```
+-----------------------------------------------------------------------------------+
|                            PUBLISHED PDF (Page 13)                                |
|           evidence_vault/sources/55_01_011_018hr1t.pdf (SHA-256 Pinned)           |
+-----------------------------------------------------------------------------------+
                                  |
         +------------------------+------------------------+
         |                                                 |
         v                                                 v
+-------------------------------+         +----------------------------------+
|   Pipeline A: Vision-LLM      |         | Pipeline B: Classical OCR / TSR  |
|   (Multimodal Deep Neural Net)|         | (PaddleOCR / Tesseract / Layout) |
+-------------------------------+         +----------------------------------+
         |                                                 |
         v                                                 v
  [Extraction Matrix A]                             [Extraction Matrix B]
  (144 long-format cells)                           (144 long-format cells)
         |                                                 |
         +------------------------+------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------------------+
|               DETERMINISTIC BIT-LEVEL COMPARATOR & ERROR-SEED AUDITOR             |
|  - Compares Matrix A vs Matrix B cell-by-cell                                    |
|  - Injects 5% seeded synthetic errors (digit swaps, decimal shifts) into copy    |
|  - Validates detector sensitivity (must catch 100% of seeded defects)             |
+-----------------------------------------------------------------------------------+
                                  |
         +------------------------+------------------------+
         |                                                 |
  Discrepancy != 0                                  100% Agreement (144/144)
         |                                                 |
         v                                                 v
+-------------------------------+         +----------------------------------+
| MANDATORY HUMAN ADJUDICATION  |         | STRATIFIED HUMAN AUDIT SAMPLE    |
| Human inspects page_03.png;   |         | Human blindly verifies 20% sample|
| resolves dispute with log.    |         | (29 cells across all 4 tables)   |
+-------------------------------+         +----------------------------------+
         |                                                 |
         +------------------------+------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------------------+
|                     FORMAL RECONCILIATION LEDGER & GATE                           |
|  - If stratified sample is 100% concordant: Promote to SOURCE_BACKED              |
|  - If any error found in sample: REJECT pipeline, revert to 100% human review     |
+-----------------------------------------------------------------------------------+
```

### Essential Architectural Invariants of the Hybrid Protocol:
1. **Architectural Heterogeneity:** Pipeline A and Pipeline B **must not share weights, model families, or prompt templates**. For example, Pipeline A could be Gemini Multimodal Vision, and Pipeline B an independent OCR engine (e.g., Tesseract/PaddleOCR) paired with a programmatic spatial bounding-box parser.
2. **Negative Control Seeding:** Before accepting a run, the comparator runs an automated error-detection check against a decoy dataset containing known perturbed cells (e.g., `57.46` $\rightarrow$ `57.40`, shifted columns). The pipeline must detect 100% of seeded discrepancies to prove it is not blindly agreeing.
3. **Mandatory Human Adjudication:** Any cell where Pipeline A and Pipeline B differ by $> 0.000$ must be flagged as `DISCREPANCY_REQUIRES_HUMAN_ARBITRATION` and locked until a named human inspects the image.
4. **Stratified Human Reference Validation:** A human must independently transcribe a pre-specified 20% stratified subset (29 of 144 cells, covering all 4 tables, all 4 wash conditions, and all 9 columns). If the automated agreement deviates from the human sample on even **1 cell**, the entire automated run is discarded, and full 100% human double extraction is enforced.

---

## 6. Predefined Quantitative Acceptance Criteria

If the Hybrid Protocol were ever to be considered for adoption, the acceptance criteria must be fixed *a priori* to prevent post-hoc rationalization:

| Criterion | Metric | Threshold | Method of Evaluation |
| :--- | :--- | :--- | :--- |
| **Record Completeness** | Number of valid records | Exactly 144 | Automated row count and schema validator |
| **Table Distribution** | Records per table | Exactly 36 per table | Automated count per table ID (5, 6, 7, 8) |
| **Key Uniqueness** | Unique `(table, condition, stain)` | Exactly 144 unique keys | Hash set collision detector |
| **Numeric Validity** | Finite Decimal readings | 100% (144/144) | Python `Decimal(x).is_finite()` |
| **Seeded Defect Sensitivity** | Detection of deliberate errors | **100.0%** (Zero misses allowed) | Test suite running comparator against seeded defect matrix |
| **Inter-Pipeline Concordance** | Match rate (Pipeline A vs B) | $\ge 98.6\%$ (Max 2 discrepancies) | Automated comparator across 144 cells |
| **Discrepancy Resolution** | Unresolved cell disputes | **0** (All resolved by human) | Reconciliation ledger verification |
| **Stratified Human Sample** | Concordance on 20% sample | **100.0%** (29/29 exact matches) | Comparison against blind human ground truth |
| **Critical Values Check** | Blood readings (T5 & T6 @ 45 g/kg) | Verbatim: `57.46` & `69.19` | Explicit pin test |
| **Statistical Bound** | 95% Confidence Interval for error | Upper bound $< 0.5\%$ | Binomial exact (Clopper-Pearson) calculation |

*Note on Statistical Power:* For $N = 144$, observing 0 errors in 144 cells gives a 95% confidence interval for error rate of $[0.0\%, 2.53\%]$ (Rule of Three: $3/N \approx 2.08\%$). To state that the error rate is bounded below $0.5\%$, external validation across similar scientific tables or rigorous human sample auditing is mathematically required.

---

## 7. Comparative Evaluation of Policy Options

| Feature / Dimension | Option A: Existing Rule (100% Human Review) | Option B: Hybrid Rule (Dual-AI + Human Adjudication + 20% Audit) | Option C: Fully Automated AI-Only Acceptance |
| :--- | :--- | :--- | :--- |
| **Description** | Second human must independently blind-transcribe all 144 cells. | Dual heterogeneous AI pipelines extract all 144 cells; human verifies 20% sample & adjudicates all disputes. | Accept 144 readings based on agreement of current AI extraction and visual QA pass. |
| **Scientific Defensibility** | **Gold Standard.** Complete independence between human observers. Fully satisfies traditional evidence synthesis standards. | **High / Defensible.** Fully aligned with FDA CSA (2026), Gartlehner et al. (2025), and conformal uncertainty methods. | **Unacceptable / Indefensible.** Directly contradicted by empirical literature (Ajayi 2025, Gartlehner 2025, Peng 2025). |
| **Undetected Error Risk** | Very Low ($\approx 0.1\%$). Human fatigue on simple numbers is the only failure mode. | Extremely Low ($< 0.1\%$). Heterogeneous cross-checks combined with human sample audit catch both human and model lapses. | **High ($2\% - 10\%$).** Correlated vision-language hallucinations and glyph misreads remain completely unchecked. |
| **Human Workload** | High: 144 cells transcribed manually. | Low-Medium: ~29 cells audited + any discrepancies arbitrated (~15–20 minutes). | Zero human effort. |
| **Auditability & Traceability** | High: Blind review template archived with reviewer ID and timestamp. | Excellent: Cryptographic input hashes, model configs, discrepancy logs, and human sample archived. | Poor: Self-referential AI logs claiming agreement without independent anchor. |
| **Impact on Status Hierarchy** | Allows promotion to `SOURCE_BACKED`. Phase 4B closes cleanly. | Allows promotion to `SOURCE_BACKED` under validated assurance. Phase 4B closes. | **Compromises integrity.** Degrades `SOURCE_BACKED` status into an unverified assertion. |
| **Phase 4B & Downstream Impact** | Keeps Phase 4B open until human completes template; Phase 5 remains locked. | Keeps Phase 4B open until hybrid protocol is formally implemented, tested, and audited. | Prematurely unlocks Phase 4B without scientific justification. |

---

## 8. Recommendations

1. **Primary Policy Recommendation:**  
   **Retain Option A (Existing Rule) for the immediate present.**  
   *Justification:* The total volume of this dataset is small (144 numeric readings on a single printed page). The human time required to complete `pusic_2006_independent_blind_review_template.csv` is approximately 20 to 30 minutes for a qualified researcher. Designing, building, calibrating, and statistically validating a dual-engine heterogeneous automated pipeline (Option B) requires dozens of engineering hours. From a scientific economics and risk perspective, performing the actual second-human review is significantly faster, simpler, and carries zero regulatory or scientific ambiguity.

2. **Secondary Recommendation (Future Roadmap):**  
   If the project expands in Phase 5 or Phase 6 to ingest large-scale tabular corpora (thousands of published tables), **Option B (Hybrid Quality Assurance Protocol)** should be developed, benchmarked on open datasets, and formally adopted under FDA CSA-aligned quality standards.

3. **Absolute Prohibition:**  
   **Option C (Fully Automated Acceptance Without Human Review) must remain strictly forbidden.**

---

## 9. Specific Requirements for Any Future Policy Revision

If project stakeholders formally elect to pursue Option B in a future milestone, the following engineering and governance steps must be fully executed and independently audited before any gate is modified:

1. **Independent Pipeline Implementation:**  
   Construct a secondary extractor (`extract_pusic_pipeline_b.py`) utilizing an independent technology stack (e.g., Python `pdfplumber` / OpenCV morphological table contour extraction + Tesseract OCR, completely decoupled from LLM APIs).
2. **Negative-Control Test Suite:**  
   Implement automated unit tests proving that the comparator detects 100% of seeded discrepancies across row coordinates, decimal precision, column shifts, and digit alterations.
3. **Conformal Uncertainty / Confidence Logging:**  
   Implement token-level and bounding-box level confidence extraction. Any cell with confidence $< 0.99$ must automatically route to human adjudication.
4. **Stratified Human Sample Protocol:**  
   Record a signed human ground-truth extraction for 29 randomly stratified cells in a locked audit file (`pusic_2006_stratified_human_reference_sample.csv`).
5. **Formal Approval:**  
   Submit the complete validation report to the project owner for explicit written sign-off before modifying `validate_pusic_2006_r460.py` or `PHASE4B_PUSIC_2006_VERIFICATION_CONTRACT.md`.

---

## 10. Remaining Evidence Gaps & Governance State

- **Current Dataset:** `evidence_vault/datasets/pusic_2006_tables_5_8_r460.csv` remains strictly at `SOURCE_EXTRACTED_PENDING_SECOND_REVIEW`.
- **Fields Preserved:** `reviewer_2` and `review_match` remain blank.
- **Scientific Claim Boundary:** The values are verified to match printed page 13 via internal QA, but have **not** been certified by an independent second party.
- **Phase State:** **Phase 4B is ACTIVE / OPEN. Phase 5 is STRICTLY LOCKED.** No automated changes to gatekeeper logic have been made.

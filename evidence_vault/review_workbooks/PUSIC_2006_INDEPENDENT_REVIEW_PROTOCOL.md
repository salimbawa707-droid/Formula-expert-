# Pušić et al. (2006) — Independent Blind Transcription Protocol

## 1. Purpose and Boundary
This protocol defines the independent, blind second-pass transcription verification of the 144 printed $R_{460\text{ nm}}$ readings in Tables 5–8 (printed page 13) of:
> Pušić, T.; Šostar Turk, S.; Soljačić, I.; Tarbuk, A.; Fijan, R.; Arnuš, S. (2006). *Primary Washing Effect of Powder and Liquid Detergents*. Tekstil 55(1), 11–18.  
> Publisher Landing Page: https://tekstil.hist.hr/index.php/tekstil/article/view/3174  
> Direct Download: https://tekstil.hist.hr/index.php/tekstil/article/download/3174/3174/3174  

**Boundary Invariant:** This is a transcription accuracy audit only. Concordance does not establish universal cleaning efficacy, make $R_{460\text{ nm}}$ a percent soil-removal metric, provide replicate-level experimental distributions, calibrate a formula, or confer `LAB_VALIDATED` status.

---

## 2. Source Artifacts & Provenance
To ensure independent verification is reproducible without network dependencies, the original publisher PDF and high-resolution rendered page scans are archived locally in the repository:

- **Original PDF File:** `evidence_vault/sources/55_01_011_018hr1t.pdf`
  - Byte Size: `694,641` bytes
  - MD5: `06e278eac12400cb2efb1e2ca51961a8`
  - SHA-256: `ea2e068f6f58335f096376fb2f448eee819874b9be7e96591f14f23152173439`
- **Rendered Printed Page 13 Image:** `evidence_vault/sources/page_03.png` (200 DPI visual rendering of Tables 5–8)

---

## 3. Printed Source Layout & Table Structure (Page 13)
Printed page 13 presents four tables with 9 column categories across 4 experimental conditions (144 total cells):

| Table | Fabric Description | Detergent Form | Conditions & Dosages |
| :--- | :--- | :--- | :--- |
| **Tab. 5** | Cotton (*pamučna tkanina*) | Powder (*praškasti*) | Before (*Prije*), 30 g/kg, 40 g/kg, 45 g/kg |
| **Tab. 6** | Polyester/Cotton 50:50 (*PES/pamuk*) | Powder (*praškasti*) | Before (*Prije*), 30 g/kg, 40 g/kg, 45 g/kg |
| **Tab. 7** | Cotton (*pamučna tkanina*) | Liquid (*tekući*) | Before (*Prije*), 17.5 mL/kg, 25 mL/kg, 35 mL/kg |
| **Tab. 8** | Polyester/Cotton 50:50 (*PES/pamuk*) | Liquid (*tekući*) | Before (*Prije*), 17.5 mL/kg, 25 mL/kg, 35 mL/kg |

### Croatian Column Translation Guide:
1. `Crna kava` $\rightarrow$ `black_coffee` (Tannin / *Taninska*)
2. `Crveno vino` $\rightarrow$ `red_wine` (Tannin / *Taninska*)
3. `Kakao` $\rightarrow$ `cocoa` (Protein / *Proteinska*)
4. `Krv` $\rightarrow$ `blood` (Protein / *Proteinska*)
5. `Bućino ulje` $\rightarrow$ `pumpkin_seed_oil` (Oily / *Masna*)
6. `Ruž` $\rightarrow$ `lipstick` (Oily / *Masna*)
7. `Pasirana rajčica` $\rightarrow$ `pureed_tomato` (Pigment / *Obojena*)
8. `Krema za cipele` $\rightarrow$ `shoe_cream` (Pigment / *Obojena*)
9. `Standard` $\rightarrow$ `standard_fabric_control` (Fabric control)

---

## 4. Independence Requirement (Strict Anti-Fabrication Rule)
- The reviewer must be a **real human person** distinct from the original transcriber (`assistant_transcription_from_uploaded_pdf`).
- An AI model re-reading its own output is **NOT** independent human review.
- The reviewer must enter their genuine identity or approved organizational pseudonymous identifier (e.g. `reviewer_human_02`) in `independent_reviewer`.
- The comparator strictly rejects any review where `independent_reviewer` matches `reviewer_1` (case-insensitive).
- Fabricating reviewer identities, timestamps, or approvals is strictly prohibited.

---

## 5. Review Procedure
1. Open `evidence_vault/sources/page_03.png` or inspect page 13 of `evidence_vault/sources/55_01_011_018hr1t.pdf`.
2. Open `evidence_vault/review_workbooks/pusic_2006_independent_blind_review_template.csv`.
   - The template deliberately omits original transcribed readings (`independent_transcribed_value` is blank).
   - Do NOT alter `source_id`, `table_number`, `condition_label`, or column identifiers.
3. For each of the 144 rows, visually inspect the corresponding cell on printed page 13 and enter the number in `independent_transcribed_value`.
   - Preserve printed decimal figures (e.g., printed `57,46` $\rightarrow$ `57.46`).
   - If a cell is ambiguous or unreadable, enter `UNREADABLE` and set `discrepancy_flag="UNREADABLE"` with notes in `discrepancy_notes`.
4. Enter the same reviewer identity in `independent_reviewer` across all rows.
5. Enter the date of observation in `review_date` (ISO format `YYYY-MM-DD`).
6. Set `protocol_version="1.2.0"`.
7. Execute the automated comparator to audit agreement:
   ```bash
   python3 evidence_vault/scripts/compare_pusic_independent_review.py \
     evidence_vault/datasets/pusic_2006_tables_5_8_r460.csv \
     evidence_vault/review_workbooks/pusic_2006_independent_blind_review_template.csv \
     --reconciliation-csv evidence_vault/review_workbooks/pusic_2006_reconciliation_audit.csv \
     --summary
   ```

---

## 6. Acceptance Criteria & Gate Status
- **Coverage:** Exactly 144 unique source IDs with 36 readings per table.
- **Independence:** Distinct human reviewer identity verified.
- **Completeness:** All 144 independent values entered with 0 blanks and 0 unreadable entries.
- **Agreement:** 144/144 exact matches between source and independent observation.
- **Audit Ledger:** Generation of `pusic_2006_reconciliation_audit.csv` recording row-level comparison.

### Current Project Status
- **Dataset Status:** `SOURCE_EXTRACTED_PENDING_SECOND_REVIEW`
- **Review Template:** Ready for human review (all 144 slots prepared, unreviewed).
- **Phase Governance:** Phase 4B remains **OPEN**; Phase 5 remains **LOCKED**.


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

## 4. Review Paths and Anti-Fabrication Rule

### Human blind-review path
- A human reviewer may independently transcribe the 144 readings and record their genuine identity or approved organizational pseudonymous identifier in the human template.
- The comparator rejects a review where the second identity matches the original transcriber (case-insensitive).
- Never fabricate a person, identity, date, or approval.

### User-authorized AI source-only path
The repository owner explicitly requested an AI pass on 2026-10-27. This is a separately labelled alternative for transcription checking; it does **not** become a human review and must never be represented as one.

- The AI second pass must read the publisher PDF page image before seeing production CSV values, transcribe all 144 source cells into a separate transcript, then compare the transcript by table/condition/stain key.
- Record the AI model, review method, exact publisher-PDF SHA-256, all 144 numeric readings, and row-level comparison result in `pusic_2006_ai_source_only_second_pass_2026-10-27.csv`.
- The AI path fails closed unless all 144 source IDs and keys match, all 144 numeric values match exactly, the PDF hash matches the pinned source, and every row says `human_review=false`.
- Use status `AI_SOURCE_REVIEWED` for this route. Do not populate the human template's reviewer identity/date fields, claim human sign-off, or claim laboratory validation.
- The human route remains available independently; AI and human outcomes are reported separately.

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

## 6. Acceptance Criteria and Gate Status
A review route passes only within its own scope:

- **Coverage:** Exactly 144 unique keys and 36 readings per table.
- **Human route:** A distinct real human reviewer, all values entered, no unreadable cells, 144/144 exact matches, and a generated row-level reconciliation ledger.
- **AI route:** User-authorized source-only transcription; pinned publisher PDF hash; all 144 keys and values compared; 144/144 exact matches; no human identity or approval claimed; AI method and model recorded in the separate transcript and report.
- **Scientific boundary:** Neither review route establishes cleaning efficacy as a percentage, ingredient-level formula identity, model accuracy, or `LAB_VALIDATED`.

### Current Project Status
- **AI review status:** `AI_SOURCE_REVIEWED` (144/144 exact readings; AI-only).
- **Human review status:** Not performed; the human template remains blank.
- **Dataset status:** The source transcription has a separately recorded AI review; no human approval is asserted.
- **Phase governance:** Phase 4B remains **OPEN**; Phase 5 remains **LOCKED** until all remaining Phase 4B gates pass.


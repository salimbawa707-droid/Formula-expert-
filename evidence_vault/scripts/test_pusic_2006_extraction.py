#!/usr/bin/env python3
"""Guard source-extracted values and metadata from Pušić et al. (2006), Tables 5–8."""
import csv
import unittest
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CSV_PATH = ROOT / "evidence_vault/datasets/pusic_2006/PHASE4B_PUSIC_2006_TABLES_5_8_SOURCE_EXTRACTED.csv"
REPORT_PATH = ROOT / "evidence_vault/forensic_reports/PHASE4B_PUSIC_2006_TABLES_5_8_EXTRACTION_REPORT.md"


class PusicTablesExtractionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with CSV_PATH.open(encoding="utf-8", newline="") as handle:
            cls.rows = list(csv.DictReader(handle))
        cls.report = REPORT_PATH.read_text(encoding="utf-8")

    def test_complete_expected_table_layout(self):
        self.assertEqual(len(self.rows), 144)
        self.assertEqual(Counter(row["source_table"] for row in self.rows),
                         {"5": 36, "6": 36, "7": 36, "8": 36})
        self.assertEqual(Counter(row["condition"] for row in self.rows),
                         {"PRE_WASH": 36, "POST_WASH": 108})
        for table in ("5", "6", "7", "8"):
            with self.subTest(table=table):
                table_rows = [row for row in self.rows if row["source_table"] == table]
                self.assertEqual(Counter(row["stain_class"] for row in table_rows),
                                 {"tannin": 8, "protein": 8, "oily": 8, "dyed": 8, "control": 4})

    def test_metadata_and_measurement_semantics_are_conservative(self):
        for row in self.rows:
            self.assertEqual(row["source_license"], "CC BY 4.0")
            self.assertEqual(row["source_page_printed"], "13")
            self.assertEqual(row["measurement_unit"], "SOURCE_LABEL_R460_NM_UNIT_UNSPECIFIED")
            self.assertEqual(row["extraction_status"], "SOURCE_EXTRACTED_PENDING_SECOND_REVIEW")
            self.assertEqual(row["replicate_data_available"], "NO")
            self.assertEqual(row["source_doi"], "")  # no DOI invented for this paper
            self.assertNotEqual(row["measurement_name"], "soil removal percentage")
        self.assertIn("independent second-pass verification remains required", self.report)
        self.assertIn("No phase gate is changed", self.report)

    def test_key_values_and_potential_anomaly_are_preserved(self):
        def value(table, fabric, form, condition, dose, stain):
            matches = [r for r in self.rows if r["source_table"] == str(table)
                       and r["fabric"] == fabric and r["detergent_form"] == form
                       and r["condition"] == condition and r["dosage_value"] == dose
                       and r["stain_label_original"] == stain]
            self.assertEqual(len(matches), 1)
            return float(matches[0]["measurement_value"])
        self.assertAlmostEqual(value(5, "cotton", "powder", "PRE_WASH", "", "Krv"), 22.15)
        self.assertAlmostEqual(value(5, "cotton", "powder", "POST_WASH", "45", "Krv"), 57.46)
        self.assertAlmostEqual(value(6, "polyester/cotton 50/50", "powder", "POST_WASH", "45", "Krv"), 69.19)
        self.assertAlmostEqual(value(8, "polyester/cotton 50/50", "liquid", "POST_WASH", "35", "Krv"), 41.58)
        self.assertIn("57.46", self.report)
        self.assertIn("69.19", self.report)

    def test_dosage_units_do_not_mix_powder_and_liquid(self):
        for row in self.rows:
            if row["condition"] == "PRE_WASH":
                self.assertEqual(row["dosage_value"], "")
                self.assertEqual(row["dosage_unit"], "")
            elif row["detergent_form"] == "powder":
                self.assertEqual(row["dosage_unit"], "g/kg")
            else:
                self.assertEqual(row["dosage_unit"], "ml/kg")


if __name__ == "__main__":
    unittest.main(verbosity=2)

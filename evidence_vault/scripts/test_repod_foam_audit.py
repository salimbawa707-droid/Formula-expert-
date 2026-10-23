#!/usr/bin/env python3
"""Regression tests for the acquired, source-hashed RepOD foam workbook.

These checks validate acquisition, layout and scientific-status safeguards.
They do not validate the dataset as a detergent cleaning-performance benchmark.
"""
import csv
import hashlib
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "evidence_vault/datasets/repod_foam"
MANIFEST_PATH = DATA / "data-manifest.json"
RAW_PATH = DATA / "raw/DFA_data.ods"


class RepODFoamAuditTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not MANIFEST_PATH.is_file() or not RAW_PATH.is_file():
            raise AssertionError(
                "RepOD audit artifacts are missing; run acquire_repod_foam.py first"
            )
        cls.manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        cls.raw = RAW_PATH.read_bytes()

    def test_official_source_identity_checksum_and_license(self):
        self.assertEqual(self.manifest["doi"], "10.18150/MKCDUM")
        self.assertEqual(
            self.manifest["downloadUrl"],
            "https://repod.icm.edu.pl/api/access/datafile/48206",
        )
        self.assertEqual(self.manifest["license"], "CC BY 4.0")
        self.assertEqual(len(self.raw), 18531)
        self.assertEqual(
            hashlib.md5(self.raw).hexdigest(),
            "9bee2b49dd1a55822203e10641694c46",
        )
        self.assertEqual(
            hashlib.sha256(self.raw).hexdigest(),
            "3665c4386fbf75537744823246a2857fd34eceb297057d6a372c29490d56cfaf",
        )

    def test_two_sheets_keep_source_rows_and_units(self):
        sheets = {item["sheetName"]: item for item in self.manifest["sheets"]}
        self.assertEqual(set(sheets), {"PGA_LAE", "PLL_RH"})
        self.assertEqual(sheets["PGA_LAE"]["dataRowsIncludingBlankRows"], 12)
        self.assertEqual(sheets["PGA_LAE"]["columnCount"], 23)
        self.assertEqual(sheets["PLL_RH"]["dataRowsIncludingBlankRows"], 15)
        self.assertEqual(sheets["PLL_RH"]["columnCount"], 23)
        self.assertIn("NOT independent experimental observation count",
                      sheets["PGA_LAE"]["rowCountSemantics"])
        self.assertEqual(
            self.manifest["unitAudit"]["PLL_RH_concentration"],
            "Workbook label c RH [mol/L] conflicts with values 0.1–600; published article figure captions report RH concentrations in mg/dm³. Preserve raw header and values unchanged; document mg/dm³ as publication-supported interpretation without applying a conversion. Author confirmation is optional while the dataset is excluded from model validation.",
        )

    def test_raw_concentration_levels_and_unlabelled_blank_columns_are_preserved(self):
        cases = [
            ("PGA_LAE.csv", 10, 1e-6, 1e-3),
            ("PLL_RH.csv", 13, 0.1, 600.0),
        ]
        for filename, expected_count, minimum, maximum in cases:
            with self.subTest(filename=filename):
                with (DATA / "normalized" / filename).open(
                    encoding="utf-8", newline=""
                ) as handle:
                    rows = list(csv.reader(handle))
                self.assertEqual(len(rows[0]), 22)  # merged/group-heading row
                self.assertEqual(len(rows[1]), 23)  # source variable header row
                self.assertEqual(len(rows[2:]), expected_count)
                # The first concentration column is source-native text; do not
                # convert the RH values merely because the article captions use
                # mg/dm^3 while the spreadsheet header says mol/L.
                levels = [float(row[0]) for row in rows[2:]]
                self.assertEqual(len(levels), expected_count)
                self.assertAlmostEqual(min(levels), minimum)
                self.assertAlmostEqual(max(levels), maximum)
                self.assertTrue(all(row[14] == "" and row[17] == "" and row[20] == ""
                                    for row in rows[2:]))
                # Those three columns have blank source headers; they are not
                # silently re-labelled as standard-deviation columns.
                self.assertEqual(rows[1][14], "")
                self.assertEqual(rows[1][17], "")
                self.assertEqual(rows[1][20], "")

    def test_unknown_replicate_counts_and_no_engine_promotion(self):
        self.assertIsNone(self.manifest["groupingAudit"]["replicateCountPerRow"])
        self.assertIsNone(self.manifest["groupingAudit"]["independentObservationCount"])
        self.assertFalse(self.manifest["groupingAudit"]["rawReplicateRowsAvailable"])
        self.assertTrue(self.manifest["groupingAudit"]["missingStandardDeviationsAreNotZero"])
        self.assertEqual(self.manifest["labValidationStatus"], "NOT_LAB_VALIDATED")
        self.assertEqual(self.manifest["numericalValidationReadiness"], "DEFICIENT")
        self.assertEqual(self.manifest["engineEligibility"], [])
        self.assertIn("commercial laundry-detergent formula validation",
                      self.manifest["intendedUse"])


if __name__ == "__main__":
    unittest.main(verbosity=2)

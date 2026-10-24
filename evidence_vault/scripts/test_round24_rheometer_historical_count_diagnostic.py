#!/usr/bin/env python3
"""Regression tests for source-level historical rheometer count diagnostics."""
import csv, json, subprocess, sys, unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "evidence_vault/scripts/round24_rheometer_historical_count_diagnostic.py"
OUT = ROOT / "evidence_vault/forensic_reports"
CSV_OUT = OUT / "PHASE4B_RHEOMETER_HISTORICAL_COUNT_DIAGNOSTIC.csv"
JSON_OUT = OUT / "PHASE4B_RHEOMETER_HISTORICAL_COUNT_DIAGNOSTIC.json"

class RheometerHistoricalDiagnosticTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        run = subprocess.run([sys.executable, str(SCRIPT)], cwd=ROOT, capture_output=True, text=True)
        if run.returncode:
            raise AssertionError(f"diagnostic failed:\n{run.stdout}\n{run.stderr}")
        cls.report = json.loads(JSON_OUT.read_text(encoding="utf-8"))
        with CSV_OUT.open(encoding="utf-8", newline="") as f:
            cls.rows = {r["sheet"]: r for r in csv.DictReader(f)}

    def test_numeric_rows_remain_source_based_not_forced_to_739(self):
        counts = self.report["source_counts"]
        self.assertEqual(counts["numeric_point_rows"], 2233)
        self.assertEqual(counts["test_groups_across_sheets"], 62)
        self.assertEqual(counts["historical_file_level_claim"], 739)
        self.assertEqual(counts["numeric_rows_minus_historical_739"], 1494)

    def test_four_historical_counts_are_plus_two_pattern_only(self):
        expected = {
            "AmpSwps_all": (288, 290),
            "FrqSwps_all": (225, 227),
            "FoamD_AmpSwpTest": (192, 194),
            "FoamA_SteadyYield": (88, 90),
        }
        for sheet, (numeric, historical) in expected.items():
            row = self.rows[sheet]
            self.assertEqual(int(row["numeric_point_rows"]), numeric)
            self.assertEqual(int(row["historical_round5_per_sheet_count"]), historical)
            self.assertEqual(int(row["historical_minus_numeric_points"]), 2)
            self.assertIn("POSSIBLE_HEADER_INCLUSION", row["historical_pattern_diagnostic"])

    def test_steady_shear_731_is_row_count_not_numeric_point_count(self):
        for sheet in ("SteadyShear_5", "SteadyShear_1"):
            row = self.rows[sheet]
            self.assertEqual(int(row["worksheet_rows_after_header"]), 732)
            self.assertEqual(int(row["populated_data_rows_after_header"]), 721)
            self.assertEqual(int(row["blank_rows_within_used_range_after_header"]), 11)
            self.assertEqual(int(row["numeric_point_rows"]), 720)
            self.assertEqual(int(row["nonnumeric_point_rows_with_other_content"]), 1)
            self.assertIn("NO_EXACT_MATCH_HISTORICAL_731", row["historical_pattern_diagnostic"])

    def test_diagnostic_does_not_claim_original_intent_or_close_phase(self):
        hypotheses = self.report["historical_count_hypotheses"]
        self.assertEqual(hypotheses[0]["status"], "ARITHMETIC_PATTERN_ONLY_NOT_PROOF")
        self.assertEqual(hypotheses[2]["status"], "NOT_REPRODUCED")
        self.assertEqual(self.report["governance"], {"phase4b": "OPEN", "phase5": "LOCKED"})

if __name__ == "__main__":
    unittest.main(verbosity=2)

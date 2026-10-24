#!/usr/bin/env python3
"""Regression tests for the exact source-row crosswalk behind 212 vs 210."""
import csv
import json
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "evidence_vault/scripts/round21_flow_212_vs_210_crosswalk.py"
OUT = ROOT / "evidence_vault/forensic_reports"
CSV_OUT = OUT / "PHASE4B_FLOW_212_VS_210_SOURCE_ROW_CROSSWALK.csv"
JSON_OUT = OUT / "PHASE4B_FLOW_212_VS_210_SOURCE_ROW_CROSSWALK.json"


class FlowCountCrosswalkTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        result = subprocess.run([sys.executable, str(SCRIPT)], cwd=ROOT,
                                capture_output=True, text=True, check=False)
        if result.returncode:
            raise AssertionError(f"crosswalk failed:\n{result.stdout}\n{result.stderr}")
        cls.report = json.loads(JSON_OUT.read_text(encoding="utf-8"))
        with CSV_OUT.open(encoding="utf-8", newline="") as handle:
            cls.rows = list(csv.DictReader(handle))

    def test_exact_historical_and_complete_point_counts_are_distinct(self):
        counts = self.report["counts"]
        self.assertEqual(counts["historical_nonempty_row_count"], 212)
        self.assertEqual(counts["complete_numeric_flow_points"], 210)
        self.assertEqual(counts["nonempty_rows_not_complete_numeric_points"], 2)
        disposition = self.report["claim_disposition"]
        self.assertTrue(disposition["historical_212_matches_nonempty_rows"])
        self.assertTrue(disposition["source_defined_210_complete_numeric_points"])
        self.assertFalse(disposition["historical_212_is_complete_numeric_point_count"])

    def test_crosswalk_rows_have_stable_source_cell_lineage(self):
        self.assertEqual(len(self.rows), 212)
        ids = [row["source_record_id"] for row in self.rows]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertTrue(all(row["source_record_id"].startswith("SolutionFlowCurves!A") for row in self.rows))
        complete = [r for r in self.rows if r["classification"] == "COMPLETE_NUMERIC_FLOW_POINT"]
        incomplete = [r for r in self.rows if r["classification"] == "NONEMPTY_ROW_NOT_COMPLETE_NUMERIC_POINT"]
        self.assertEqual(len(complete), 210)
        self.assertEqual(len(incomplete), 2)
        self.assertTrue(all(r["complete_numeric_point"] == "false" for r in incomplete))

    def test_governance_and_non_imputation_are_preserved(self):
        self.assertEqual(self.report["governance"], {"phase4b": "OPEN", "phase5": "LOCKED"})
        text = " ".join(self.report["limitations"]).lower()
        self.assertIn("no missing or nonnumeric values are imputed", text)
        self.assertIn("not proof of independent physical experiments", text)


if __name__ == "__main__":
    unittest.main(verbosity=2)

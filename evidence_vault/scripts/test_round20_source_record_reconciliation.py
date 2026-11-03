#!/usr/bin/env python3
"""Regression gate for Round-20 source-record reconciliation.

This test intentionally checks both successful parsing and the unresolved
historical claims. A passing parser/integrity run must not turn the mixed-unit
29,474 sum into an independent-observation total or close Phase 4B.
"""
import json
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "evidence_vault/scripts/round20_source_record_reconciliation.py"
OUT = ROOT / "evidence_vault/forensic_reports"


class Round20ReconciliationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        proc = subprocess.run(
            [sys.executable, str(SCRIPT)],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        if proc.returncode != 0:
            raise AssertionError(
                f"Round-20 reconciliation failed ({proc.returncode}):\n"
                f"stdout:\n{proc.stdout}\nstderr:\n{proc.stderr}"
            )
        cls.report = json.loads(
            (OUT / "PHASE4B_ROUND20_SOURCE_RECORD_RECONCILIATION.json").read_text(
                encoding="utf-8"
            )
        )
        cls.markdown = (
            OUT / "PHASE4B_ROUND20_SOURCE_RECORD_RECONCILIATION.md"
        ).read_text(encoding="utf-8")

    def test_integrity_gate_passes_without_claiming_historical_reconciliation(self):
        gate = self.report["integrity_gate"]
        self.assertEqual(gate["status"], "PASS")
        self.assertTrue(all(gate["checks"].values()))
        self.assertFalse(self.report["historical_claim"]["headline_reproduced"])
        self.assertEqual(
            self.report["decision"],
            "BUBBLE_TIME_SPLIT_AND_RHEOMETER_739_NOT_REPRODUCED",
        )

    def test_counts_keep_units_and_derived_values_separate(self):
        counts = self.report["counts"]
        self.assertEqual(counts["solution_flow_curve_points"], 210)
        self.assertEqual(counts["film_feature_measurements"], 7522)
        self.assertEqual(counts["bubble_raw_area_cells"], 19509)
        self.assertEqual(counts["bubble_derived_radius_formula_cells"], 19509)
        self.assertEqual(counts["bubble_matched_pairs"], 19509)
        self.assertEqual(counts["rheometer_point_rows"], 2233)
        self.assertEqual(counts["rheometer_test_groups"], 62)
        claim = self.report["historical_claim"]
        self.assertEqual(claim["all_category_record_sum"], 29474)
        self.assertEqual(claim["all_category_sum_minus_headline"], 1492)
        self.assertIn("not a count of unit-mismatch or ingestion-blocker cases", claim["difference_interpretation"])
        self.assertIn("not a count of 1,492 unit-mismatch or ingestion-blocker cases", self.markdown)
        self.assertIn("not asserted as independent experiments", self.markdown)

    def test_historical_bubble_split_and_rheometer_claim_remain_unresolved(self):
        claims = {
            row["claim"]: row
            for row in self.report["historical_claim_crosswalk"]
        }
        self.assertEqual(claims["bubble_sizes_20min"]["source_count"], 13388)
        self.assertEqual(claims["bubble_sizes_20min"]["status"], "MISMATCH")
        self.assertEqual(claims["bubble_sizes_30min"]["source_count"], 6121)
        self.assertEqual(claims["bubble_sizes_30min"]["status"], "MISMATCH")
        self.assertEqual(claims["rheometer"]["historical_count"], 739)
        self.assertEqual(claims["rheometer"]["source_count"], 2233)
        self.assertEqual(claims["rheometer"]["status"], "NOT_REPRODUCED")
        self.assertEqual(claims["solution_flow_curves"]["source_count"], 210)
        self.assertEqual(claims["solution_flow_curves"]["status"], "STRUCTURAL_HEADER_INCLUSIVE_COUNT_ONLY")
        self.assertIn("two nonempty header rows", claims["solution_flow_curves"]["notes"])
        self.assertNotIn("212 measured points", claims["solution_flow_curves"]["notes"])

    def test_governance_stays_open_and_outputs_are_present(self):
        self.assertEqual(self.report["governance"]["phase4b"], "OPEN")
        self.assertEqual(self.report["governance"]["phase5"], "LOCKED")
        expected = [
            "PHASE4B_ROUND20_SOURCE_RECORD_RECONCILIATION.md",
            "PHASE4B_ROUND20_SOURCE_RECORD_RECONCILIATION.json",
            "PHASE4B_ROUND20_FORMULA_DEPENDENCY_LEDGER.csv",
            "PHASE4B_ROUND20_CATEGORY_RECORD_RECONCILIATION.csv",
            "PHASE4B_ROUND20_RHEOMETER_GROUPED_POINT_LEDGER.csv",
            "PHASE4B_ROUND20_HISTORICAL_CLAIM_CROSSWALK.csv",
        ]
        for name in expected:
            with self.subTest(output=name):
                path = OUT / name
                self.assertTrue(path.is_file(), f"missing output: {name}")
                self.assertGreater(path.stat().st_size, 0)

        limits = " ".join(self.report["limits"]).lower()
        self.assertIn("no engine is promoted to lab_validated", limits)


if __name__ == "__main__":
    unittest.main(verbosity=2)

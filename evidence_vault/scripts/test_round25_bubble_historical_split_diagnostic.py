#!/usr/bin/env python3
"""Regression checks for the unresolved bubble-size historical split diagnostic."""
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "evidence_vault/scripts/round25_bubble_historical_split_diagnostic.py"
SPEC = importlib.util.spec_from_file_location("round25_bubble_historical_split_diagnostic", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class BubbleHistoricalSplitTests(unittest.TestCase):
    def test_build_report_keeps_unresolved_split_unmodified(self):
        crosswalk = {
            "source": {"filename": "sample.xlsx", "sha256": "a" * 64},
            "sheet_counts": {
                "20min": {"observed_raw_numeric_area_cells": 13388, "historical_claimed_count": 10000},
                "30min": {"observed_raw_numeric_area_cells": 6121, "historical_claimed_count": 9509},
            },
            "historical_split_column_hypothesis_search": {
                "source_column_numeric_counts": {"20min!A": 1},
                "subset_count_matching_10000": 0,
                "subset_count_matching_9509": 0,
                "complementary_partition_count_matching_both": 0,
            },
            "aggregate": {
                "raw_numeric_area_cells": 19509,
                "historical_aggregate_claim": 19509,
                "aggregate_reproduced": True,
            },
        }
        report = MODULE.build_report(crosswalk)
        self.assertEqual(report["observedMinusHistoricalBySheet"], {"20min": 3388, "30min": -3388})
        self.assertEqual(report["disposition"], "UNRESOLVED_NO_COLUMN_SUBSET_MATCH")
        self.assertFalse(report["governance"]["physicalObservationTotalValidated"])
        self.assertEqual(report["governance"]["phase4b"], "OPEN")
        self.assertEqual(report["governance"]["phase5"], "LOCKED")

    def test_generated_report_matches_crosswalk_output(self):
        crosswalk_path = ROOT / "evidence_vault/forensic_reports/PHASE4B_BUBBLE_20_30MIN_CELL_CROSSWALK.json"
        report_path = ROOT / "evidence_vault/forensic_reports/PHASE4B_BUBBLE_HISTORICAL_SPLIT_DIAGNOSTIC.json"
        if not crosswalk_path.is_file() or not report_path.is_file():
            self.skipTest("Run the Round-22 crosswalk and Round-25 diagnostic before this test")
        crosswalk = json.loads(crosswalk_path.read_text(encoding="utf-8"))
        report = json.loads(report_path.read_text(encoding="utf-8"))
        expected = MODULE.build_report(crosswalk)
        for key, value in expected.items():
            self.assertEqual(report[key], value, key)
        self.assertEqual(report["observedRawNumericAreaCellsBySheet"], {"20min": 13388, "30min": 6121})
        self.assertEqual(report["subsetCountMatching10000"], 0)
        self.assertEqual(report["subsetCountMatching9509"], 0)
        self.assertEqual(report["complementaryPartitionCountMatchingBoth"], 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)

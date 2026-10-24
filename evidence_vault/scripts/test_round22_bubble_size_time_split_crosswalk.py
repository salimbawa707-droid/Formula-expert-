#!/usr/bin/env python3
"""Regression tests for the bubble-size 20/30-minute cell crosswalk."""
import csv, json, subprocess, sys, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SCRIPT=ROOT/"evidence_vault/scripts/round22_bubble_size_time_split_crosswalk.py"
OUT=ROOT/"evidence_vault/forensic_reports"
CSV_OUT=OUT/"PHASE4B_BUBBLE_20_30MIN_CELL_CROSSWALK.csv"
JSON_OUT=OUT/"PHASE4B_BUBBLE_20_30MIN_CELL_CROSSWALK.json"

class BubbleTimeSplitTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        result=subprocess.run([sys.executable,str(SCRIPT)],cwd=ROOT,capture_output=True,text=True,check=False)
        if result.returncode:
            raise AssertionError(f"bubble crosswalk failed:\n{result.stdout}\n{result.stderr}")
        cls.report=json.loads(JSON_OUT.read_text(encoding="utf-8"))
        with CSV_OUT.open(encoding="utf-8",newline="") as f: cls.rows=list(csv.DictReader(f))

    def test_source_counts_and_historical_split_are_explicit(self):
        sheets=self.report["sheet_counts"]
        self.assertEqual(sheets["20min"]["observed_raw_numeric_area_cells"],13388)
        self.assertEqual(sheets["30min"]["observed_raw_numeric_area_cells"],6121)
        self.assertFalse(sheets["20min"]["historical_count_reproduced"])
        self.assertFalse(sheets["30min"]["historical_count_reproduced"])
        self.assertEqual(self.report["aggregate"]["raw_numeric_area_cells"],19509)
        self.assertEqual(self.report["aggregate"]["matched_formula_pairs"],19509)
        self.assertEqual(self.report["disposition"],"AGGREGATE_MATCH_TIME_SPLIT_MISMATCH")

    def test_each_raw_cell_has_unique_lineage_and_no_double_count(self):
        ids=[(r["sheet"],r["raw_area_cell"]) for r in self.rows]
        self.assertEqual(len(ids),19509)
        self.assertEqual(len(set(ids)),len(ids))
        self.assertTrue(all(r["counting_unit"].startswith("one raw area feature") for r in self.rows))
        self.assertTrue(all(r["raw_radius_pair_status"]=="MATCHED_FORMULA_DEPENDENCY" for r in self.rows))

    def test_governance_remains_open(self):
        self.assertEqual(self.report["governance"],{"phase4b":"OPEN","phase5":"LOCKED"})

if __name__=="__main__": unittest.main(verbosity=2)

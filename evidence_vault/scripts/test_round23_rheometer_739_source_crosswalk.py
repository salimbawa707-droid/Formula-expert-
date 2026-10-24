#!/usr/bin/env python3
"""Regression tests for the rheometer 739 source-row crosswalk."""
import csv,json,subprocess,sys,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SCRIPT=ROOT/"evidence_vault/scripts/round23_rheometer_739_source_crosswalk.py"
OUT=ROOT/"evidence_vault/forensic_reports"
CSV_OUT=OUT/"PHASE4B_RHEOMETER_739_SOURCE_ROW_CROSSWALK.csv"
JSON_OUT=OUT/"PHASE4B_RHEOMETER_739_SOURCE_ROW_CROSSWALK.json"

class Rheometer739Tests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  result=subprocess.run([sys.executable,str(SCRIPT)],cwd=ROOT,capture_output=True,text=True,check=False)
  if result.returncode: raise AssertionError(f"rheometer crosswalk failed:\n{result.stdout}\n{result.stderr}")
  cls.report=json.loads(JSON_OUT.read_text(encoding="utf-8"))
  with CSV_OUT.open(encoding="utf-8",newline="") as f: cls.rows=list(csv.DictReader(f))
 def test_source_point_rows_do_not_force_historical_739(self):
  counts=self.report["counts"]
  self.assertEqual(counts["numeric_point_rows"],2233)
  self.assertEqual(counts["test_groups_across_sheets"],62)
  self.assertEqual(counts["historical_claimed_rheometer_count"],739)
  self.assertFalse(counts["historical_739_reproduced"])
  self.assertEqual(self.report["disposition"],"NOT_REPRODUCED")
 def test_per_sheet_counts_and_cell_lineage(self):
  self.assertEqual(sorted(v["numeric_point_rows"] for v in self.report["worksheets"].values()),[88,192,225,288,720,720])
  self.assertEqual(len(self.rows),2233)
  ids=[(r["sheet"],r["source_row"]) for r in self.rows]
  self.assertEqual(len(ids),len(set(ids)))
  self.assertTrue(all(r["point_no_cell"] and r["test_cell"] for r in self.rows))
 def test_governance_and_no_forced_dropping(self):
  self.assertEqual(self.report["governance"],{"phase4b":"OPEN","phase5":"LOCKED"})
  self.assertTrue(all("not automatically an independent experiment" in r["counting_unit"] for r in self.rows))
if __name__=="__main__": unittest.main(verbosity=2)

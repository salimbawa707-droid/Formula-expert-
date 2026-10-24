#!/usr/bin/env python3
"""Regression tests for validate_pusic_ai_evidence.py."""
import importlib.util, unittest
from pathlib import Path
HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("ai_validator", HERE / "validate_pusic_ai_evidence.py")
MOD = importlib.util.module_from_spec(SPEC); SPEC.loader.exec_module(MOD)
STAINS = ["black_coffee","red_wine","cocoa","blood","pumpkin_seed_oil","lipstick","pureed_tomato","shoe_cream","standard_fabric_control"]
CONDS = ["before","dose_1","dose_2","dose_3"]
def fixture():
    src=[]; ledger=[]
    for t in (5,6,7,8):
        for ci,c in enumerate(CONDS):
            for si,s in enumerate(STAINS):
                sid=f"pusic_2006_table_{t}_{c}_{s}"; v=f"{70+ci+si/10:.2f}"
                dosage=["","30","40","45"][ci] if t in (5,6) else ["","17.5","25","35"][ci]
                unit="" if ci==0 else ("g/kg" if t in (5,6) else "mL/kg")
                src.append({"source_id":sid,"measurement_value":v,"table_number":str(t),"condition_label":c,
                  "stain_or_control":s,"measurement_unit_status":"UNIT_UNSPECIFIED_IN_SOURCE_TABLE",
                  "dosage_value":dosage,"dosage_unit":unit})
                ledger.append({"source_id":sid,"table_number":str(t),"condition_label":c,"stain_or_control":s,
                  "source_csv_value":v,"ai_visual_value":v,"comparison_status":"MATCH",
                  "verification_method":"AI visual comparison","printed_page":"13"})
    return src,ledger
class ValidatorTests(unittest.TestCase):
    def test_valid_144_row_ledger_passes(self):
        s,l=fixture(); r=MOD.validate(s,l); self.assertEqual(r["validation"],"PASS"); self.assertEqual(r["matched_rows"],144)
    def test_missing_ledger_row_fails(self):
        s,l=fixture(); r=MOD.validate(s,l[:-1]); self.assertEqual(r["validation"],"FAIL")
    def test_duplicate_source_id_fails(self):
        s,l=fixture(); l[-1]["source_id"]=l[0]["source_id"]; self.assertEqual(MOD.validate(s,l)["validation"],"FAIL")
    def test_mismatch_value_fails(self):
        s,l=fixture(); l[0]["ai_visual_value"]="999"; self.assertEqual(MOD.validate(s,l)["validation"],"FAIL")
    def test_mismatch_label_fails(self):
        s,l=fixture(); l[0]["stain_or_control"]="wrong"; self.assertEqual(MOD.validate(s,l)["validation"],"FAIL")
    def test_wrong_status_fails(self):
        s,l=fixture(); l[0]["comparison_status"]="UNRESOLVED"; self.assertEqual(MOD.validate(s,l)["validation"],"FAIL")
    def test_blank_method_fails(self):
        s,l=fixture(); l[0]["verification_method"]=""; self.assertEqual(MOD.validate(s,l)["validation"],"FAIL")
    def test_lab_validated_never_granted(self):
        s,l=fixture(); r=MOD.validate(s,l); self.assertFalse(r["lab_validated"]); self.assertEqual(r["scientific_status"],"AI_VERIFIED_SOURCE_BACKED")
    def test_subgate_pass_never_unlocks_master_phase5(self):
        s,l=fixture(); r=MOD.validate(s,l)
        self.assertEqual(r["validation"], "PASS")
        self.assertEqual(r["phase4b"], "PUCIC_SOURCE_COMPARISON_SUBGATE_PASS_ONLY")
        self.assertEqual(r["phase5"], "LOCKED")
    def test_failed_comparison_keeps_master_gate_open(self):
        s,l=fixture(); l[0]["ai_visual_value"]="999"; r=MOD.validate(s,l)
        self.assertEqual(r["phase4b"], "OPEN")
        self.assertEqual(r["phase5"], "LOCKED")
    def test_bad_unit_claim_fails(self):
        s,l=fixture(); s[0]["measurement_unit_status"]="percent"; self.assertEqual(MOD.validate(s,l)["validation"],"FAIL")
    def test_wrong_page_fails(self):
        s,l=fixture(); l[0]["printed_page"]="12"; self.assertEqual(MOD.validate(s,l)["validation"],"FAIL")
if __name__=="__main__": unittest.main()

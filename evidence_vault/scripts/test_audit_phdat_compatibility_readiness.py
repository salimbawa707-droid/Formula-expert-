#!/usr/bin/env python3
"""Regression tests for PhDat per-record readiness classification."""
import importlib.util
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "evidence_vault/scripts/audit_phdat_compatibility_readiness.py"
SPEC = importlib.util.spec_from_file_location("audit_phdat_compatibility_readiness", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

def record(name, state="complete", method="polarized microscopy", purity="98 %", smiles="C", source="Paper", figure="Fig. 1", data=None):
    return {"Name": name, "State": state, "Method": method, "Purity": purity, "SMILES": smiles,
            "Source": source, "Figure": figure, "Type": "nonionic", "Solvent": "water",
            "Labels": [["Liquid", "L1"]],
            "Data": data if data is not None else {"temperature_(degC)": "[20, 21]", "composition_(wt%)": "[0, 1]", "L1": "[1.0, 0.5]"}}

def label_row(rid, u=False, repeated_source=False, repeated_target=False, unmatched="", pairs=1):
    return {"record_id": str(rid), "has_unknown_U_phase_key": str(u),
            "duplicate_source_label_count": "1" if repeated_source else "0",
            "duplicate_dataset_label_count": "1" if repeated_target else "0",
            "phase_key_tokens_not_in_label_targets": unmatched, "label_pair_count": str(pairs)}

class PhDatReadinessTests(unittest.TestCase):
    def test_priority_means_manual_review_not_validation(self):
        report, rows = MODULE.audit({"1": record("A")}, [label_row(1)])
        self.assertEqual(rows[0]["record_readiness_tier"], "PRIORITY_CANDIDATE_FOR_MANUAL_PHASE_LABEL_REVIEW")
        self.assertFalse(rows[0]["approved_for_formula_validation"])
        self.assertEqual(report["governance"]["labValidationStatus"], "NOT_LAB_VALIDATED")

    def test_missing_metadata_and_unknown_phase_are_qualifiers(self):
        rec = record("A", method="not found", purity="not found",
                     data={"temperature_(degC)": "[20, 21]", "composition_(wt%)": "[0, 1]", "U": "[0, 1]"})
        report, rows = MODULE.audit({"1": rec}, [label_row(1, u=True)])
        self.assertEqual(rows[0]["record_readiness_tier"], "EXPLORATORY_CANDIDATE_WITH_EXPLICIT_QUALIFIERS")
        self.assertTrue(rows[0]["method_missing"]); self.assertTrue(rows[0]["purity_missing"])
        self.assertIn("U is not a known phase", rows[0]["review_flags"])

    def test_incomplete_record_is_held(self):
        report, rows = MODULE.audit({"1": record("A", state="incomplete")}, [label_row(1)])
        self.assertEqual(rows[0]["record_readiness_tier"], "HOLD_INCOMPLETE_OR_UNTRACEABLE_SOURCE_RECORD")

    def test_duplicate_smiles_preserves_both_source_records(self):
        parsed = {"1": record("A", source="Paper A", figure="Fig. 1"),
                  "2": record("B", source="Paper B", figure="Fig. 2")}
        report, rows = MODULE.audit(parsed, [label_row(1), label_row(2)])
        self.assertEqual(report["exactDuplicateSmilesGroupCount"], 1)
        self.assertEqual(report["recordsInExactDuplicateSmilesGroups"], 2)
        self.assertEqual(rows[0]["duplicate_smiles_group_id"], rows[1]["duplicate_smiles_group_id"])
        self.assertNotEqual(rows[0]["source"], rows[1]["source"])

    def test_misaligned_arrays_fail_integrity(self):
        bad = record("A", data={"temperature_(degC)": "[20, 21]", "composition_(wt%)": "[0]", "L1": "[1, 0.5]"})
        report, rows = MODULE.audit({"1": bad}, [label_row(1)])
        self.assertEqual(rows[0]["array_integrity"], "FAIL")
        self.assertEqual(report["recordsWithArrayIntegrityFailure"], 1)
        self.assertEqual(rows[0]["record_readiness_tier"], "HOLD_INCOMPLETE_OR_UNTRACEABLE_SOURCE_RECORD")

if __name__ == "__main__":
    unittest.main(verbosity=2)

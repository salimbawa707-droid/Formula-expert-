#!/usr/bin/env python3
"""Offline tests for conservative PhDat per-record suitability classification."""
import importlib.util
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "evidence_vault/scripts/audit_phdat_record_suitability.py"
SPEC = importlib.util.spec_from_file_location("audit_phdat_record_suitability", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

class PhDatSuitabilityTests(unittest.TestCase):
    def base(self):
        raw = {"Name":"Example surfactant","State":"complete","Source":"Paper X","Figure":"Fig 1",
               "Method":"polarized microscopy","Purity":"99%","SMILES":"CC","Data":{"temperature_(degC)":"[20]","composition_(wt%)":"[10]","L1":"[1]"}}
        label = {"phase_key_tokens_not_in_label_targets":"","duplicate_source_label_count":"0","duplicate_dataset_label_count":"0"}
        identity = {"exact_normalized_catalog_name_candidate_count":"0"}
        return raw, label, identity

    def test_complete_traceable_record_is_tier_a_but_not_validated(self):
        raw,label,identity=self.base()
        row=MODULE.classify_record("1",raw,label,identity)
        self.assertEqual(row["tier"],"A_TRACEABLE_EXPLORATORY_CANDIDATE")
        self.assertFalse(row["identity_confirmed"])
        self.assertFalse(row["formula_validation_eligible"])

    def test_unknown_phase_key_blocks_tier_a(self):
        raw,label,identity=self.base(); raw["Data"]["U"]="[0]"
        row=MODULE.classify_record("1",raw,label,identity)
        self.assertEqual(row["tier"],"B_REQUIRES_TARGETED_REVIEW")
        self.assertIn("UNKNOWN_U_PHASE_KEY_PRESENT",row["reasons"])

    def test_missing_purity_blocks_tier_a(self):
        raw,label,identity=self.base(); raw["Purity"]="not found"
        row=MODULE.classify_record("1",raw,label,identity)
        self.assertEqual(row["tier"],"B_REQUIRES_TARGETED_REVIEW")
        self.assertIn("PURITY_MISSING_OR_PLACEHOLDER",row["reasons"])

    def test_incomplete_record_is_tier_c(self):
        raw,label,identity=self.base(); raw["State"]="incomplete"
        row=MODULE.classify_record("1",raw,label,identity)
        self.assertEqual(row["tier"],"C_INCOMPLETE_OR_INSUFFICIENT_PROVENANCE")

    def test_duplicate_smiles_is_flagged_without_dropping_record(self):
        raw,label,identity=self.base()
        row=MODULE.classify_record("1",raw,label,identity,True)
        self.assertTrue(row["duplicate_smiles_group"])
        self.assertEqual(row["tier"],"B_REQUIRES_TARGETED_REVIEW")
        self.assertIn("DUPLICATE_SMILES_GROUP_REQUIRES_SOURCE_LEVEL_REVIEW",row["reasons"])

    def test_repeated_source_label_mapping_blocks_tier_a(self):
        raw,label,identity=self.base(); label["duplicate_source_label_count"]="1"
        row=MODULE.classify_record("1",raw,label,identity)
        self.assertEqual(row["tier"],"B_REQUIRES_TARGETED_REVIEW")
        self.assertIn("REPEATED_SOURCE_LABEL_MAPPING_NEEDS_REVIEW",row["reasons"])

    def test_repeated_dataset_label_mapping_blocks_tier_a(self):
        raw,label,identity=self.base(); label["duplicate_dataset_label_count"]="1"
        row=MODULE.classify_record("1",raw,label,identity)
        self.assertEqual(row["tier"],"B_REQUIRES_TARGETED_REVIEW")
        self.assertIn("REPEATED_DATASET_LABEL_MAPPING_NEEDS_REVIEW",row["reasons"])

    def test_source_and_figure_required(self):
        raw,label,identity=self.base(); raw["Source"]=""; raw["Figure"]=""
        row=MODULE.classify_record("1",raw,label,identity)
        self.assertEqual(row["tier"],"C_INCOMPLETE_OR_INSUFFICIENT_PROVENANCE")

    def test_mapping_diagnostic_blocks_tier_a(self):
        raw,label,identity=self.base(); label["phase_key_tokens_not_in_label_targets"]="L2+W"
        row=MODULE.classify_record("1",raw,label,identity)
        self.assertEqual(row["tier"],"B_REQUIRES_TARGETED_REVIEW")

    def test_audit_requires_full_per_record_coverage(self):
        with self.assertRaises(ValueError):
            MODULE.run_audit({},[],[])

if __name__ == "__main__":
    unittest.main(verbosity=2)

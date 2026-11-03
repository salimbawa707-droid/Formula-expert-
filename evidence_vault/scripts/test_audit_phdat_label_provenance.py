#!/usr/bin/env python3
"""Regression tests for PhDat label/provenance audit semantics."""
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "evidence_vault/scripts/audit_phdat_label_provenance.py"
SPEC = importlib.util.spec_from_file_location("audit_phdat_label_provenance", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class PhDatLabelAuditTests(unittest.TestCase):
    def fixture(self):
        return {
            "1": {
                "Name": "Example surfactant", "SMILES": "C", "Source": "Paper A",
                "Figure": "Fig. 1", "Purity": "not found", "Method": "not found",
                "Type": "nonionic", "Solvent": "water", "State": "incomplete",
                "Labels": [["Liquid", "L1"], ["2 Liquids", "L1+W"], ["Liquid", "L2"]],
                "Data": {
                    "temperature_(degC)": "[20, 21]", "composition_(wt%)": "[0, 1]",
                    "L1": "[1.0, 0.5]", "L1+W": "[0.0, 0.5]", "U": "[0.0, 0.0]"
                }
            }
        }

    def test_duplicate_mappings_are_diagnostic_not_fatal(self):
        report = MODULE.audit_labels(self.fixture())
        self.assertEqual(report["malformedLabelPairCount"], 0)
        self.assertEqual(report["recordsWithRepeatedSourceLabelMappings"], 1)
        self.assertEqual(report["recordsWithRepeatedDatasetLabelMappings"], 0)
        self.assertEqual(report["recordsWithUnknownUPhaseKeyIds"], ["1"])
        self.assertEqual(report["governance"]["labValidationStatus"], "NOT_LAB_VALIDATED")
        self.assertEqual(report["governance"]["engineEligibility"], [])

    def test_malformed_label_pair_is_reported(self):
        data = self.fixture()
        data["1"]["Labels"].append(["only-one"])
        report = MODULE.audit_labels(data)
        self.assertEqual(report["malformedLabelPairCount"], 1)
        self.assertEqual(report["recordCount"], 1)

    def test_missing_metadata_is_not_filled(self):
        data = self.fixture()
        data["1"]["Method"] = "not found"
        report = MODULE.audit_labels(data)
        self.assertEqual(report["metadataMissingOrPlaceholderCounts"]["Method"], 1)
        self.assertEqual(report["perRecord"][0]["method"], "not found")

    def test_committed_acquisition_manifest_is_not_scientifically_promoted(self):
        path = ROOT / "evidence_vault/datasets/phdat/data-manifest.json"
        if not path.is_file():
            self.skipTest("Acquisition manifest is generated during CI before this test")
        manifest = json.loads(path.read_text(encoding="utf-8"))
        self.assertEqual(manifest["labValidationStatus"], "NOT_LAB_VALIDATED")
        self.assertEqual(manifest["engineEligibility"], [])
        self.assertEqual(manifest["phase4bStatus"], "OPEN")
        self.assertEqual(manifest["phase5Status"], "LOCKED")

    def test_audit_output_covers_source_records_without_deduplication(self):
        path = ROOT / "evidence_vault/forensic_reports/PHASE4B_PHDAT_LABEL_PROVENANCE_AUDIT.json"
        if not path.is_file():
            self.skipTest("Run audit_phdat_label_provenance.py before this test")
        report = json.loads(path.read_text(encoding="utf-8"))
        self.assertEqual(report["recordCount"], 143)
        self.assertEqual(report["malformedLabelPairCount"], 0)
        self.assertEqual(report["governance"]["phase4b"], "OPEN")
        self.assertEqual(report["governance"]["phase5"], "LOCKED")
        self.assertIn("diagnostic only", " ".join(report["interpretation"]).lower())


if __name__ == "__main__":
    unittest.main(verbosity=2)

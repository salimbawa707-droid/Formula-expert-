#!/usr/bin/env python3
"""Offline regression tests for PhDat acquisition, provenance and scientific guardrails."""
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "evidence_vault/scripts/acquire_phdat_dataset.py"
SPEC = importlib.util.spec_from_file_location("acquire_phdat_dataset", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class PhDatAuditTests(unittest.TestCase):
    def test_cc_by_4_license_detection_is_explicit(self):
        self.assertTrue(MODULE.cc_by_4("CC BY 4.0"))
        self.assertTrue(MODULE.cc_by_4({"name": "CC BY 4.0", "url": "https://creativecommons.org/licenses/by/4.0/"}))
        self.assertFalse(MODULE.cc_by_4("CC BY-NC 4.0"))
        self.assertFalse(MODULE.cc_by_4(None))

    def test_json_profile_records_schema_candidates_and_hash(self):
        raw = b'{"observations":[{"surfactant":"SDS","temperature_C":25,"concentration_wt_percent":1.0,"phase_state":"micellar"}]}'
        profile = MODULE.profile_json(raw, "fixture.json")
        self.assertTrue(profile["validJson"])
        self.assertEqual(profile["rootType"], "dict")
        self.assertIn("surfactant", profile["candidateChemicalIdentityKeys"])
        self.assertIn("temperature_C", profile["candidatePhaseCompositionKeys"])
        self.assertIn("phase_state", profile["candidatePhaseCompositionKeys"])
        self.assertEqual(len(profile["sha256"]), 64)
        self.assertIn("Key-name scan only", profile["semanticWarning"])

    def test_phdat_string_encoded_arrays_are_audited_without_normalizing(self):
        fixture = {
            "1": {
                "State": "complete", "Type": "anionic", "Solvent": "water",
                "SMILES": "S", "headers": ["temperature_(degC)", "composition_(wt%)", "La", "U"],
                "Data": {
                    "temperature_(degC)": "[20, 21]", "composition_(wt%)": "[0, 50]",
                    "La": "[0.2, 0.5]", "U": "[0.8, 0.5]"
                }
            }
        }
        audit = MODULE.audit_phdat_records(fixture)
        self.assertEqual(audit["recordCount"], 1)
        self.assertEqual(audit["completeRecords"], 1)
        self.assertEqual(audit["dataPointCount"], 2)
        self.assertEqual(audit["phaseProbabilityValueCount"], 4)
        self.assertEqual(audit["arrayLengthMismatchRecordIds"], [])
        self.assertEqual(audit["headerOrderMismatchRecordIds"], [])
        self.assertEqual(audit["phaseSumMaxAbsoluteDeviationFromOne"], 0.0)
        self.assertEqual(audit["temperatureRangeDegC"], [20, 21])
        self.assertEqual(audit["compositionRangeWtPercent"], [0, 50])

    def test_invalid_json_rejected(self):
        with self.assertRaises(ValueError):
            MODULE.profile_json(b"{not json", "bad.json")

    def test_official_phdat_manifest_preserves_observed_source_coverage(self):
        manifest_path = ROOT / "evidence_vault/datasets/phdat/data-manifest.json"
        if not manifest_path.is_file():
            self.skipTest("Run acquire_phdat_dataset.py first to generate the official source manifest")
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        self.assertEqual(manifest["articleId"], 29071202)
        self.assertEqual(manifest["licenseStatus"], "CONFIRMED_CC_BY_4_0")
        self.assertEqual(manifest["labValidationStatus"], "NOT_LAB_VALIDATED")
        self.assertEqual(manifest["engineEligibility"], [])
        file_record = next(item for item in manifest["files"] if item["name"] == "PhDat.json")
        self.assertEqual(file_record["bytes"], 112738787)
        self.assertEqual(file_record["md5"], "cbad98c7b20313586fb4183a4e88e539")
        self.assertEqual(file_record["sha256"], "748a29d08341bd8e868247d609401301495e24b3c1d88ed3b0ec065e2cdb12f3")
        audit = manifest["jsonProfiles"][0]["phdatAudit"]
        self.assertEqual(audit["recordCount"], 143)
        self.assertEqual(audit["completeRecords"], 99)
        self.assertEqual(audit["incompleteRecords"], 44)
        self.assertEqual(audit["dataPointCount"], 1896776)
        self.assertEqual(audit["phaseProbabilityValueCount"], 15785160)
        self.assertEqual(audit["recordIdsMissingFromNumericSequence"], ["98"])
        self.assertEqual(audit["arrayLengthMismatchRecordIds"], [])
        self.assertEqual(audit["headerOrderMismatchRecordIds"], ["7", "25"])
        self.assertEqual(audit["nonnumericDataValueCount"], 0)
        self.assertLessEqual(audit["phaseSumMaxAbsoluteDeviationFromOne"], 0.0005)
        self.assertEqual(audit["phaseSumDeviationPointCounts"]["greaterThan0.0005"], 0)

    def test_source_has_no_scientific_promotion(self):
        source = SCRIPT.read_text(encoding="utf-8")
        self.assertIn('"labValidationStatus": "NOT_LAB_VALIDATED"', source)
        self.assertIn('"engineEligibility": []', source)
        self.assertIn('"phase4bStatus": "OPEN"', source)
        self.assertIn('"phase5Status": "LOCKED"', source)
        self.assertIn("No imputation", source)
        self.assertIn("not a direct detergent cleaning-performance benchmark", source)

    def test_candidate_registry_classifies_phdat_as_auxiliary_only(self):
        registry = (ROOT / "evidence_vault/datasets/public_dataset_candidates.csv").read_text(encoding="utf-8")
        row = next(line for line in registry.splitlines() if line.startswith('"DS-PHDAT",'))
        self.assertIn("CC BY 4.0 confirmed from official Figshare API metadata", row)
        self.assertIn("AUXILIARY_PHASE_BEHAVIOR_ONLY", row)
        self.assertIn("Not a detergent cleaning/soil-removal", row)
        self.assertIn("1,896,776 temperature/composition point rows", row)

    def test_downloads_are_checksum_checked_when_source_supplies_md5(self):
        source = SCRIPT.read_text(encoding="utf-8")
        self.assertIn("if supplied_md5 and md5.lower() != str(supplied_md5).lower()", source)
        self.assertIn("archive.testzip()", source)


if __name__ == "__main__":
    unittest.main(verbosity=2)

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

    def test_source_has_no_scientific_promotion(self):
        source = SCRIPT.read_text(encoding="utf-8")
        self.assertIn('"labValidationStatus": "NOT_LAB_VALIDATED"', source)
        self.assertIn('"engineEligibility": []', source)
        self.assertIn('"phase4bStatus": "OPEN"', source)
        self.assertIn('"phase5Status": "LOCKED"', source)
        self.assertIn("No imputation", source)
        self.assertIn("not a direct detergent cleaning-performance benchmark", source)

    def test_downloads_are_checksum_checked_when_source_supplies_md5(self):
        source = SCRIPT.read_text(encoding="utf-8")
        self.assertIn("if supplied_md5 and md5.lower() != str(supplied_md5).lower()", source)
        self.assertIn("archive.testzip()", source)


if __name__ == "__main__":
    unittest.main(verbosity=2)

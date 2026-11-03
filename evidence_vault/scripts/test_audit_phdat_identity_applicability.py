#!/usr/bin/env python3
"""Offline tests for conservative PhDat identity matching and applicability."""
import importlib.util
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "evidence_vault/scripts/audit_phdat_identity_applicability.py"
SPEC = importlib.util.spec_from_file_location("audit_phdat_identity_applicability", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

class PhDatIdentityApplicabilityTests(unittest.TestCase):
    def test_catalog_parser_reads_top_level_records_and_nested_objects(self):
        source = '''
        export const UNIVERSAL_INGREDIENTS: UniversalIngredient[] = [
          { "id": "sles-28", "name": "SLES 28%", "casNumber": "68585-34-2",
            "inciName": "Sodium Laureth Sulfate", "category": "Anionic Surfactant",
            "provenance": { "source": "test", "notes": "brace } inside string" } },
          { "id": "blend-1", "name": "Mystery Blend", "casNumber": null,
            "inciName": "", "category": "Blend" }
        ];
        '''
        rows = MODULE.parse_catalog(source)
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]["casNumber"], "68585-34-2")
        self.assertIsNone(rows[1]["casNumber"])

    def test_exact_name_is_candidate_not_confirmed_identity(self):
        catalog = MODULE.parse_catalog('''export const UNIVERSAL_INGREDIENTS = [
          { "id": "sles-28", "name": "SLES 28%", "casNumber": "68585-34-2",
            "inciName": "Sodium Laureth Sulfate", "category": "Anionic Surfactant" }
        ];''')
        parsed = {"1": {"Name": "SLES 28%", "SMILES": "C", "State": "complete", "Source": "Paper X"},
                  "2": {"Name": "unknown material", "SMILES": "", "State": "incomplete"}}
        report, rows = MODULE.audit(parsed, catalog, 'export interface UniversalIngredient { casNumber: string | null; }')
        self.assertEqual(report["recordsWithExactNormalizedNameCandidate"], 1)
        self.assertEqual(report["confirmedChemicalIdentityMatches"], 0)
        self.assertEqual(report["automaticMappingsCreated"], 0)
        self.assertEqual(rows[0]["identity_disposition"], "NAME_ONLY_CANDIDATE_REQUIRES_MANUAL_IDENTITY_REVIEW")
        self.assertFalse(rows[0]["automatic_identity_mapping"])
        self.assertEqual(rows[1]["identity_disposition"], "NO_EXACT_NAME_CANDIDATE")

    def test_duplicate_catalog_names_are_reported_as_ambiguous_candidates(self):
        catalog = MODULE.parse_catalog('''export const UNIVERSAL_INGREDIENTS = [
          { "id": "a", "name": "SLES", "casNumber": "1", "inciName": "", "category": "A" },
          { "id": "b", "name": "SLES", "casNumber": "2", "inciName": "", "category": "B" }
        ];''')
        report, rows = MODULE.audit({"1": {"Name": "SLES", "State": "complete"}}, catalog, "no smiles property")
        self.assertEqual(report["recordsWithMultipleNameCandidates"], 1)
        self.assertEqual(rows[0]["exact_normalized_catalog_name_candidate_count"], 2)
        self.assertEqual(report["confirmedChemicalIdentityMatches"], 0)

    def test_incomplete_records_are_never_promoted(self):
        catalog = MODULE.parse_catalog('''export const UNIVERSAL_INGREDIENTS = [
          { "id": "x", "name": "same", "casNumber": null, "inciName": "", "category": "A" }
        ];''')
        report, rows = MODULE.audit({"7": {"Name": "same", "State": "incomplete"}}, catalog, "")
        self.assertEqual(report["incompleteRecordCount"], 1)
        self.assertFalse(rows[0]["formula_validation_eligible"])
        self.assertEqual(report["governance"]["labValidationStatus"], "NOT_LAB_VALIDATED")
        self.assertEqual(report["governance"]["phase5"], "LOCKED")

if __name__ == "__main__": unittest.main(verbosity=2)

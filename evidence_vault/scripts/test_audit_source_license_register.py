#!/usr/bin/env python3
"""Regression tests for conservative evidence source-license status."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from audit_source_license_register import audit


def row(source_id, license_status, status):
    return {"source_id": source_id, "license_status": license_status, "status": status}


class SourceLicenseRegisterTests(unittest.TestCase):
    def zenodo_rows(self):
        return [row(f"SRC-ZEN-18961871-{suffix}", "ZENODO_RIGHTS_FIELD_BLANK_COMMERCIAL_REUSE_UNCLEARED",
                    "RAW_ARCHIVED_LICENSE_UNVERIFIED_PARSER_VERIFIED_PENDING_APPLICABILITY_REVIEW")
                for suffix in ("SOLFLOW", "RHEO", "BUBBLE", "FILM")]

    def test_blank_zenodo_rights_are_not_marked_cc_by(self):
        rows = self.zenodo_rows() + [row("SRC-SURFPRO-15861809",
            "CC-BY-NC-SA-4.0_REPO_LICENSE_ZENODO_RIGHTS_FIELD_BLANK",
            "DO_NOT_INGEST_IN_COMMERCIAL_PRODUCT")]
        self.assertEqual(audit(rows), [])

    def test_zenodo_cc_by_claim_fails_closed(self):
        rows = self.zenodo_rows()
        rows[0]["license_status"] = "CC-BY-4.0_ZENODO_RECORD_METADATA_ATTRIBUTION_REQUIRED"
        self.assertTrue(any("unsupported CC BY" in error for error in audit(rows)))

    def test_verified_license_status_fails_closed(self):
        rows = self.zenodo_rows()
        rows[1]["status"] = "RAW_ARCHIVED_LICENSE_VERIFIED_PARSER_VERIFIED"
        self.assertTrue(any("unsupported CC BY / verified-license claim" in error for error in audit(rows)))

    def test_surfpro_noncommercial_restriction_cannot_be_dropped(self):
        rows = self.zenodo_rows() + [row("SRC-SURFPRO-15861809",
            "CC-BY-4.0", "RAW_ARCHIVED")]
        self.assertTrue(any("non-commercial license" in error for error in audit(rows)))
        self.assertTrue(any("blocked from commercial" in error for error in audit(rows)))

    def test_missing_zenodo_record_fails(self):
        rows = self.zenodo_rows()[1:] + [row("SRC-SURFPRO-15861809",
            "CC-BY-NC-SA-4.0_REPO_LICENSE_ZENODO_RIGHTS_FIELD_BLANK",
            "DO_NOT_INGEST_IN_COMMERCIAL_PRODUCT")]
        self.assertTrue(any("missing source record" in error for error in audit(rows)))


if __name__ == "__main__":
    unittest.main(verbosity=2)

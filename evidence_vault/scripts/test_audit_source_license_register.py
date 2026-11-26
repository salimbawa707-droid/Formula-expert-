#!/usr/bin/env python3
"""Regression tests for source-level license evidence and restrictions."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from audit_source_license_register import audit

ZENODO_URL = "https://zenodo.org/records/18961871"


def row(source_id, license_status, status, source=ZENODO_URL):
    return {"source_id": source_id, "license_status": license_status, "status": status, "source": source}


class SourceLicenseRegisterTests(unittest.TestCase):
    def zenodo_rows(self):
        return [
            row(
                f"SRC-ZEN-18961871-{suffix}",
                "CC-BY-4.0_CONFIRMED_OFFICIAL_ZENODO_RECORD",
                "RAW_ARCHIVED_CC_BY_4.0_LICENSE_VERIFIED_PARSER_VERIFIED_PENDING_APPLICABILITY_REVIEW",
            )
            for suffix in ("SOLFLOW", "RHEO", "BUBBLE", "FILM")
        ]

    def surfpro_row(self):
        return row(
            "SRC-SURFPRO-15861809",
            "CC-BY-NC-SA-4.0_REPO_LICENSE_ZENODO_RIGHTS_FIELD_BLANK",
            "DO_NOT_INGEST_IN_COMMERCIAL_PRODUCT",
            source="https://zenodo.org/records/15861809",
        )

    def test_official_zenodo_cc_by_license_is_accepted_with_archival_status(self):
        self.assertEqual(audit(self.zenodo_rows() + [self.surfpro_row()]), [])

    def test_blank_zenodo_license_is_not_promoted(self):
        rows = self.zenodo_rows() + [self.surfpro_row()]
        rows[0]["license_status"] = "ZENODO_RIGHTS_FIELD_BLANK_COMMERCIAL_REUSE_UNCLEARED"
        self.assertTrue(any("official Zenodo CC BY 4.0 license evidence is missing" in e for e in audit(rows)))

    def test_license_claim_without_archival_verification_fails(self):
        rows = self.zenodo_rows() + [self.surfpro_row()]
        rows[1]["status"] = "RAW_ARCHIVED_LICENSE_UNVERIFIED"
        self.assertTrue(any("license-verification state" in e for e in audit(rows)))

    def test_wrong_source_url_fails_closed(self):
        rows = self.zenodo_rows() + [self.surfpro_row()]
        rows[2]["source"] = "https://example.com/zenodo-copy"
        self.assertTrue(any("official Zenodo record URL" in e for e in audit(rows)))

    def test_surfpro_noncommercial_restriction_cannot_be_dropped(self):
        rows = self.zenodo_rows() + [
            row("SRC-SURFPRO-15861809", "CC-BY-4.0", "RAW_ARCHIVED", source="https://zenodo.org/records/15861809")
        ]
        self.assertTrue(any("non-commercial license" in e for e in audit(rows)))
        self.assertTrue(any("blocked from commercial" in e for e in audit(rows)))

    def test_missing_zenodo_record_fails(self):
        rows = self.zenodo_rows()[1:] + [self.surfpro_row()]
        self.assertTrue(any("missing source record" in e for e in audit(rows)))


if __name__ == "__main__":
    unittest.main(verbosity=2)

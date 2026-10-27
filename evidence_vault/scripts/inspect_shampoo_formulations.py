#!/usr/bin/env python3
"""Audit the published shampoo-formulation JSON without changing its values.

Usage:
  python evidence_vault/scripts/inspect_shampoo_formulations.py PATH_TO_JSON
"""
from __future__ import annotations

import hashlib
import json
import math
import sys
from pathlib import Path

EXPECTED_BYTES = 1_464_630
EXPECTED_MD5 = "8898e7b460c71e334f6ece5daebc6a6e"
EXPECTED_SHA256 = "3a195870782e6fd87bdd7499cbb4fe201d025b2cda05f9eee9fb9477f34b58bd"
EXCLUDED_CURVE_IDS = {151, 196, 216, 673}
META_FIELDS = {
    "ID", "Rheology_Data", "Rheology_Type", "Stability_Test",
    "Turbidity_Error", "Turbidity_NTU", "Viscosity",
}


def audit(path: Path) -> dict[str, object]:
    raw = path.read_bytes()
    md5 = hashlib.md5(raw).hexdigest()
    sha256 = hashlib.sha256(raw).hexdigest()
    if len(raw) != EXPECTED_BYTES or md5 != EXPECTED_MD5 or sha256 != EXPECTED_SHA256:
        raise ValueError(
            f"Source integrity mismatch: bytes={len(raw)}, md5={md5}, sha256={sha256}"
        )

    rows = json.loads(raw)
    if not isinstance(rows, list) or len(rows) != 812:
        raise ValueError("Expected the 812-record JSON array.")
    ids = [row.get("ID") for row in rows]
    if any(not isinstance(value, int) for value in ids) or len(set(ids)) != len(ids):
        raise ValueError("Sample IDs must be integers and unique.")
    fields = set(rows[0])
    if len(fields) != 25 or any(set(row) != fields for row in rows):
        raise ValueError("Expected a consistent 25-field schema in every record.")
    component_fields = fields - META_FIELDS
    if len(component_fields) != 18:
        raise ValueError("Expected 18 recorded formulation-component fields.")

    stable = [row for row in rows if row.get("Stability_Test") is True]
    unstable = [row for row in rows if row.get("Stability_Test") is False]
    if len(stable) != 294 or len(unstable) != 518:
        raise ValueError("Stability-label totals differ from the published dataset.")

    valid_ids: list[int] = []
    invalid_ids: list[int] = []
    for row in stable:
        arrays = row.get("Rheology_Data")
        merged: dict[str, object] = {}
        if isinstance(arrays, list):
            for item in arrays:
                if isinstance(item, dict):
                    merged.update(item)
        shear = merged.get("shear_rate")
        avg = merged.get("avg_viscosity")
        std = merged.get("std_dev")
        valid = all(
            isinstance(values, list)
            and len(values) == 31
            and all(isinstance(v, (int, float)) and math.isfinite(v) for v in values)
            for values in (shear, avg, std)
        )
        if valid:
            valid = (
                all(v > 0 for v in shear)
                and all(shear[i] < shear[i + 1] for i in range(30))
                and all(v > 0 for v in avg)
                and all(v >= 0 for v in std)
            )
        (valid_ids if valid else invalid_ids).append(row["ID"])

    if set(invalid_ids) != EXCLUDED_CURVE_IDS:
        raise ValueError(f"Unexpected malformed stable-profile IDs: {invalid_ids}")

    return {
        "bytes": len(raw),
        "md5": md5,
        "sha256": sha256,
        "rows": len(rows),
        "columns": len(fields),
        "componentFields": len(component_fields),
        "uniqueIds": len(set(ids)),
        "stable": len(stable),
        "unstable": len(unstable),
        "validStableProfiles": len(valid_ids),
        "invalidStableProfileIds": sorted(invalid_ids),
    }


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    print(json.dumps(audit(Path(sys.argv[1])), indent=2, sort_keys=True))

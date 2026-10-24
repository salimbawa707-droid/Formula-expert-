#!/usr/bin/env python3
"""Conservative JSON license-metadata gate; not a legal determination."""
import argparse
import json
import sys
from pathlib import Path

# Exact identifiers only; license metadata must still be manually verified.
OPEN_LICENSE_IDS = {"CC0-1.0", "CC-BY-4.0", "CC-BY-SA-4.0", "MIT",
                    "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "Unlicense"}
LICENSE_KEYS = ("spdx_id", "license_id", "license")

def entries(data):
    if isinstance(data, list):
        result = data
    elif isinstance(data, dict) and isinstance(data.get("datasets"), list):
        result = data["datasets"]
    else:
        raise ValueError("Expected JSON array or object containing a datasets array")
    if any(not isinstance(x, dict) for x in result):
        raise ValueError("Every dataset entry must be an object")
    return result

def check_manifest(path: Path):
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        datasets = entries(data)
    except (OSError, UnicodeError, json.JSONDecodeError, ValueError) as exc:
        return [f"{path}: cannot parse safely: {exc}"]
    problems = []
    for i, ds in enumerate(datasets, 1):
        name = ds.get("name") or ds.get("id") or f"entry-{i}"
        raw = next((ds.get(k) for k in LICENSE_KEYS if ds.get(k)), None)
        if isinstance(raw, dict):
            license_id = raw.get("spdx_id") or raw.get("id")
        else:
            license_id = raw
        if not isinstance(license_id, str) or not license_id.strip():
            problems.append(f"{path}: {name}: missing explicit license identifier")
            continue
        license_id = license_id.strip()
        if license_id not in OPEN_LICENSE_IDS:
            problems.append(f"{path}: {name}: unrecognized/unapproved exact license ID {license_id!r}")
            continue
        url = ds.get("license_url") or ds.get("source_url") or ds.get("url")
        if not isinstance(url, str) or not url.startswith("https://"):
            problems.append(f"{path}: {name}: missing HTTPS license/source URL for manual review")
    return problems

def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("paths", nargs="*", type=Path)
    args = p.parse_args(argv)
    paths = list(args.paths)
    if not paths:
        root = Path("evidence_vault")
        if not root.exists():
            print("LICENSE METADATA GATE FAILED: evidence_vault/ not found", file=sys.stderr)
            return 2
        paths = sorted(set(root.rglob("*manifest*.json")) | set(root.rglob("*register*.json")))
    if not paths:
        print("LICENSE METADATA GATE FAILED: no manifest/register JSON files found", file=sys.stderr)
        return 2
    problems = [x for path in paths for x in check_manifest(path)]
    if problems:
        print("LICENSE METADATA GATE FAILED:\n" + "\n".join("- " + x for x in problems))
        print("This is a metadata screen, not a legal determination.", file=sys.stderr)
        return 2
    print(f"LICENSE METADATA GATE PASSED for {len(paths)} manifest(s); human license review is still required.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())

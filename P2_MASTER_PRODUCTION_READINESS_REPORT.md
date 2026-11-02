# P2 Production Readiness & Engineering Report

**Project**: Detergent Formula Expert  
**Status**: `PARTIAL — NOT RELEASE CERTIFIED`  
**Last reviewed**: November 3, 2026

## 1. Current verified position

The repository contains local deterministic calculation engines and also retains external integrations, including Gemini, Supabase and Firebase. The application must not be described as fully offline or as having zero external service dependencies.

The latest main-branch CI run (workflow 41514527839, commit cb94f8a) passed the TypeScript regression, production frontend build, Phase 6 lab-evidence regression, and evidence fail-closed checks. The Android debug APK job was skipped because the independent evidence gate remains locked.

## 2. Workstream status

| Workstream | Current status |
|---|---|
| TypeScript regression and frontend build | CI verified on commit cb94f8a |
| Scientific model correctness | PARTIAL — heuristic and source-provenance remediation remains |
| Laboratory evidence | PARTIAL — independent review pending |
| Gemini / Supabase / Firebase integrations | PRESENT — intentionally retained |
| Fully offline operation | NOT CERTIFIED |
| Android APK release build | NOT VERIFIED by latest workflow |
| Production release readiness | NOT CERTIFIED |

## 3. Required release blockers

- Complete independent human second review of the 144 Pušić R460 source rows; AI self-review does not qualify.
- Validate CPI coefficients against appropriate independent laboratory datasets before presenting them as calibrated predictions.
- Supply measured wash-water hardness for formula-specific chelation conclusions; an assumed scenario is not a measurement.
- Attach traceable sources to category pH and active-matter targets and commercial ingredient-grade assays.
- Run and retain a successful Android build job before claiming Android release readiness.

A green software CI run is evidence of software regression/build status only. It is not proof of chemical correctness, commercial suitability, laboratory validation, or release certification.

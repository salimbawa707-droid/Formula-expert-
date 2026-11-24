# Formula Expert — Master Defect Register & Verification Ledger (Phases 1–10)

**Target Repository:** `https://github.com/salimbawa707-droid/Formula-expert-.git`  
**Audit Mode:** Direct source inspection, fail-closed scientific remediation, security hardening, PWA repair, and live script execution in workspace (`/app/applet`).

---

## 1. Environment & Verification Boundaries (Strict Honesty Disclosures)

| Boundary / Constraint | Status | Impact & Honest Assessment |
|---|---|---|
| Git Metadata (`.git/`) | `NOT PRESENT` (`NO_GIT_DIR`) | Remote `main` HEAD SHA, commit history, GitHub PR merge SHAs, and GitHub Actions CI run IDs/URLs are **BLOCKED / NOT VERIFIED** in this container. |
| Android Toolchain (`java`, Android SDK, `gradlew`) | `NOT INSTALLED` (`java: not found`) | `/android/` Gradle project files exist on disk, but APK compilation (`assembleDebug`/`assembleRelease`) is **BLOCKED / NOT VERIFIED**. |
| Python Evidence Environment (`openpyxl`, RepOD fetch artifacts) | `PARTIAL` | Pure-Python unit tests run; tests importing `openpyxl` or requiring downloaded RepOD workbook artifacts fail (`80 passed, 5 skipped, 9 errors` out of 94 tests). |
| Live External Gemini API & Firestore Auth | `UNAVAILABLE IN CONTAINER` | `formulaIngredientResearchPipeline.test` logs `API key not valid` (`400 INVALID_ARGUMENT`) and triggers local multi-source fallback. Live Google Sign-In & live Gemini cloud responses are **NOT VERIFIED** online here. |
| Phase 5 Wet-Lab Empirical Calibration | `LOCKED` | 0 certified wet-lab sign-offs exist; empirical calibration remains locked pending physical laboratory measurements. |

---

## 2. Phase-by-Phase Remediation & Status Ledger

### Phase 1 — Repository Inventory, Architecture & Build Baseline — **PASS**
- **Verified Inventory (`node evidence_vault/scripts/verify_engine_inventory.mjs`):**
  - `legacyList`: 55 unique entries, 0 duplicates, 0 missing entries, 55 CSV audit rows.
  - Source filename counts: `60` engine-named source files (excluding UI), `63` including UI, `92` broad discovery candidates.
- **Preserved Architecture:** Kept `PHEngine`, `PHEngineV2`, canonical IDs (`IngredientIdentitySSOT`), Dexie offline database, Express (`server.ts`), and all 139 test modules intact.

### Phase 2 — Input Validation, Category Routing & Sub-Profile Propagation — **PASS**
- **Audited Paths:** Category routing (`canonicalProductCategory`), water hardness provenance (`null` when `'UNKNOWN'`), batch size propagation (`batchSizeKg`), and 39 template formulas across 13 product categories.
- **Checks:** `P0.2` (39/39), `P0.3` (63/63), `P0.Fix2` (18/18), `P0.4` (146/146), `ENG-002 Input Provenance` (31/31).

### Phase 3 — pH, Neutralization & Acid-Base Stoichiometry — **PASS**
- **Defects Found & Fixed:**
  1. Variable-assay acids/bases (`NaOH`, `KOH`, `HCl`, `H2SO4`, `H3PO4`, `Citric Acid`, `Acetic Acid`, `LABSA`) previously risked default active concentration assumptions when grade/assay was missing (`src/domain/ph/acidBaseDataModel.ts`, `compositionNormalizer.ts`, `pHEngineV2.ts`, `types.ts`).
     - **Fix:** Fail-closed `INSUFFICIENT_DATA` when variable-assay reagents omit commercial active `%`, general commercial `%` label parsing, and dynamic `reactiveEquivalentsPerKg`.
  2. `PHEngine.calculateNeutralization` (`src/utils/pHEngine.ts`) silently substituted `rawAcidKg ?? 1`, `labsaPurity ?? 90`, and ungraded `'NaOH'` -> `99%`.
     - **Fix:** Throws explicit validation errors when acid quantity, acid commercial assay (`%`), or alkali commercial assay (`%`) is missing/non-finite/ungraded; guarded typed negative inputs in `src/components/RCCalculators.tsx`.
- **Regression Coverage:** `src/utils/__tests__/pHEngine.regression.test.ts` (71/71 PASS, including N1–N4 fail-closed neutralization tests), `src/utils/__tests__/pHEngineV2.regression.test.ts` (77/77 PASS), `p4Phase7ScientificModelDepth.regression.test.ts` (43+ assertions PASS).

### Phase 4 — Surfactant Science, Active Matter & HLB — **PASS**
- **Defects Found & Fixed:**
  1. `src/utils/hlbEngine.ts`: Incremented `surfactantsWithMissingHLB` on invalid-percentage non-surfactants and formatted `finalBlendedHLB.toFixed(2)` when non-finite (emitting `"Blended HLB NaN"`).
     - **Fix:** Constrained missing-HLB counter to actual surfactants and guarded `finalBlendedHLB` formatting against `null`/`NaN`.
  2. `src/utils/scientificQualityGateEngine.ts`: Coupled `activeMatterStatus` and leaked unguarded water-hardness/surfactant `.toFixed()` formatting.
     - **Fix:** Decoupled `activeMatterStatus` from unverified generic inputs and guarded nullable numeric fields.
- **Regression Coverage:** `HLB Engine` (18/18 PASS), `Active Matter Engine` (42/42 PASS), `ENG-002 Catalog Audit` (`audit_eng002_catalog.ts`: 162 records cleanly audited -> `0 FULLY_SUPPORTED`, `8 PARTIALLY_SUPPORTED`, `154 INSUFFICIENT_INPUTS`).

### Phase 5 — Viscosity, Rheology, Manufacturing & Property Pipelines — **PARTIAL (Lab Calibration LOCKED)**
- **Defects Found & Fixed:**
  1. `src/utils/orchestrator/scientificExecutionDAG.ts`: `MANUFACTURING` DAG node omitted direct execution of `modelManufacturingProcess(...)` (`src/utils/manufacturing/processModelingEngine.ts`).
     - **Fix:** Wired `MANUFACTURING` DAG node directly to `modelManufacturingProcess`, returning `processSteps: []` and `INSUFFICIENT_DATA` for `UNKNOWN` physical form while populating real scale factor, batch volume, process loss, process steps, and `shearRequirement`.
  2. `src/utils/analysisWorkflowEngine.ts` & `src/utils/orchestrator/formulaScientificOrchestrator.ts`: Added null-safe percentage formatting helpers (`formatPct`) to prevent `.toFixed()` crashes on `null`/`undefined`/`NaN`.
- **Remaining Limitation:** Empirically measured rheological/viscosity calibration curves remain locked (`Phase 5 LOCKED`).

### Phase 6 — Laboratory Evidence, Provenance & Calibration Governance — **PASS (Code/Governance), LOCKED (Physical Lab Sign-Off)**
- **Checks:** `bun run test:phase6` passed **48/48** (`tests enforce MEASURED vs PREDICTED separation, ID/version strict matching, unit & condition comparability, outlier preservation, and fail-closed spec evaluation`).
- **Template Audit (`bun run scripts/audit_39_current_status.ts`):** 39 templates evaluated truthfully as **31 `INSUFFICIENT_DATA`**, **8 `INCOMPATIBLE`**, **0 fabricated PASS**, all marked `NOT_LAB_VALIDATED`.
- **Python Evidence Scripts (`python3 -m unittest discover -s evidence_vault/scripts -p "test_*.py"`):** **80 passed, 5 skipped, 9 errors** (all 9 errors due to missing `openpyxl` dependency or missing offline RepOD dataset files).

### Phase 7 — Server AI Integration, Model Governance & Null Preservation — **PARTIAL (Offline Gemini Call Blocked)**
- **Defects Found & Fixed:**
  1. Legacy/invalid Gemini model IDs (`gemini-3.8-flash`, `gemini-omni-1.1-flash`, `gemini-flash-latest`, `gemini-2.5-flash`) across `server.ts`, `src/services/serverSecurity.ts`, `src/services/aiFallbackService.ts`, `src/services/ingredientResearchService.ts`, `src/stores/useSettingsStore.ts`, `src/components/GeminiChemistryChatModal.tsx`, `src/components/scanner/ChemicalLabelVisionScannerModal.tsx`, `src/App.tsx`, and `src/components/AdminDashboard.tsx`.
     - **Fix:** Standardized primary model to `gemini-4-hydrogen` (via `resolveGeminiModel()`), with `gemini-3.1-flash-lite` fallback for Search grounding; added `buildGeminiConfig()` to strip unsupported sampling parameters (`temperature`, `topP`, `topK`, `candidateCount`) on `gemini-4-*` models; enforced 45s backend timeouts via `callWithTimeout()`.
  2. `/api/ai/apply-verified-ingredient` in `server.ts` substituted silent defaults (`?? 0`, `?? 1.0`, `?? 7.0`) for missing `activeMatter`, `density`, and `pH`.
     - **Fix:** Preserved `null` when upstream parameters are absent/null, retaining `verificationStatus: 'UNVERIFIED'` and `sourceType: 'AI_RESEARCH_PENDING_REVIEW'`.
  3. `/api/ai/research-ingredient` input hygiene & dead code: stripped control/newline characters from `cleanName`/`cleanGrade`/`cleanJurisdiction`, validated non-array object `parameters`, removed unreachable tail block, and switched `/api/ai/*`, `/api/health`, and `/api/admin/overview` to `isApiKeyConfigured()`.
- **Remaining Limitation:** Live Gemini API response cannot be verified in container because `GEMINI_API_KEY` returns `400 INVALID_ARGUMENT`.

### Phase 8 & Phase 9 — End-to-End Orchestrator, UI Crash Safety & Null Guards — **PASS**
- **Defects Found & Fixed:**
  1. `src/components/AIFormulator.tsx:2058`: `(100 - totals.totalRaw).toFixed(2)` lacked finite-number check -> guarded cleanly.
  2. `src/components/SmartFormulaAnalyzerPro.tsx`: Removed hardcoded owner email (`salimbawa707@gmail.com`) from PDF footer; now uses `profile?.email || profile?.name || 'Guest Chemist'`.
- **Checks:** `check_p4_p9.ts` (`P4: 146/146`, `P9: 43/43`), `FormulationLibrary` null-safety checks, `P1.10 End-to-End Decision` (82/82), `P8 Integration` (78/78).

### Phase 10 — Security, Admin RBAC, PWA & Production Readiness — **PASS (Web), BLOCKED (Git CI & Android APK)**
- **Critical RBAC / Security Defects Found & Fixed:**
  1. `src/stores/useSettingsStore.ts`: `DEFAULT_PROFILE` defaulted every unauthenticated visitor to `salimbawa707_owner` (`salimbawa707@gmail.com`, `Super Admin & Lead Chemist`, `plan: 'team'`, `isAuthenticated: true`) and silently auto-migrated guest profiles to owner.
     - **Fix:** Reset `DEFAULT_PROFILE` to unprivileged `Guest Chemist` (`id: 'guest_local_user'`, `plan: 'free'`, `isAuthenticated: false`), removed guest->owner migration, updated `DEFAULT_AI_SETTINGS.selectedModel` to `'gemini-4-hydrogen'`.
  2. `src/App.tsx` & `src/components/AdminDashboard.tsx`: `(!currentUser)` granted `isOwner`/`isSuperAdmin` when signed out, and `AdminDashboard.tsx` exposed an unauthenticated `"Activate Owner Access (Salim Bawa)"` elevation button alongside hardcoded status metrics (`139 / 139`, `4,805 Assertions`, `OPEN (AI Source Verified 144/144)`).
     - **Fix:** Required live `currentUser && currentUser.emailVerified && currentUser.email?.toLowerCase() === 'salimbawa707@gmail.com'`, required `decodedToken.email_verified === true` on server owner check (`src/services/serverSecurity.ts`), removed the `"Activate Owner Access"` button, wired live `/api/admin/overview` Bearer-authenticated check (`apiFetch`), and replaced hardcoded dashboard claims with truthful runtime telemetry.
- **Critical PWA / Offline Defects Found & Fixed:**
  1. `public/sw.js` `PRECACHE_ASSETS` referenced 6 icons where 5 (`favicon.png`, `apple-touch-icon.png`, `pwa-512x512.png`, `pwa-maskable-192x192.png`, `pwa-maskable-512x512.png`) were missing on disk, causing atomic `cache.addAll()` install failure.
     - **Fix:** Generated all missing RGBA PNG icon sizes in `/public/` via ImageMagick `convert` (with maskable safe-zone `#060b17` padding).
  2. `public/manifest.json`, `index.html`, `src/main.tsx`: Added `"id"`, `"scope"`, `"short_name": "FormulaPro"`, full 192/512 `"any"` & `"maskable"` icon entries, `theme-color` meta, Apple touch icon, PNG favicon, and fixed `import.meta.env.PROD` service worker check.
- **Regression Coverage:**
  - `Service Worker PWA Offline Security`: `13/13 PASS` (verifies every `PRECACHE_ASSETS` & `manifest.json` icon exists on disk + `import.meta.env.PROD`).
  - `Auth & Route Access Matrix`: `18/18 PASS` (verifies client RBAC defaults, removal of `(!currentUser)` / `Activate Owner Access`, and `null` preservation in `/api/ai/apply-verified-ingredient`).
  - `Server Security & Truthful AI Health`: `62/62 PASS`.
  - `Security Fixes & Billing Replay (47)`: `46/46 PASS`.
  - `Static Security Verification` (`bun run test:correction-static`): `6/6 routes PASS`.

---

## 3. Master Verification Matrix (Post-Edit Observed Runs)

| Check / Command | Result | Exact Observed Outcome |
|---|---|---|
| `bun run test:all` | **PASS** | `139/139` modules, `4999/4999` assertions passed, `0` failed, `0` skipped |
| `bun run test:phase6` | **PASS** | `48/48` passed |
| `bun run test:correction-static` | **PASS** | `6/6` protected routes & static security invariants verified |
| `bun run scripts/check_p4_p9.ts` | **PASS** | `P4: 146/146`, `P9: 43/43` |
| `bun run scripts/audit_39_current_status.ts` | **PASS** | 39 templates across 13 categories: `31 INSUFFICIENT_DATA`, `8 INCOMPATIBLE`, `0` fabricated passes |
| `node evidence_vault/scripts/verify_engine_inventory.mjs` | **PASS** | 55 legacy entries matched; `60` engine files excl. UI / `63` incl. UI |
| `bun run evidence_vault/scripts/audit_eng002_catalog.ts` | **PASS** | 162 catalog records (`0` full, `8` partial, `154` insufficient inputs) |
| `python3 -m unittest discover -s evidence_vault/scripts -p "test_*.py"` | **FAIL (Env Deps)** | `94` tests: `80` passed, `5` skipped, `9` errors (`No module named 'openpyxl'`, missing RepOD download artifacts) |
| Git Remote / PR / Actions CI | **BLOCKED** | `.git` absent in container |
| Android APK Build | **BLOCKED** | `java` / Android SDK absent in container |

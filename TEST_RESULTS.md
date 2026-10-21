# TEST EXECUTION RESULTS — DETERGENT FORMULA EXPERT

**Execution Date:** 2026-10-19  
**Test Command:** `npm test` (`tsx src/utils/test-calculations.ts`)  
**Runner:** Custom Automated Verification Test Runner with Dynamic Discovery  
**Execution Environment:** Node.js v22 (x86_64-linux)

---

## 1. High-Level Summary

| Metric | Result |
| :--- | :--- |
| **Discovered Test Modules on Disk** | 128 |
| **Registered Test Modules** | 128 |
| **Executed Test Modules** | 128 |
| **Skipped Test Modules** | 0 |
| **Failed Test Modules** | 0 |
| **Test Integrity Failures** | 0 |
| **Total Assertions Executed** | **4,075** |
| **Total Assertions Passed** | **4,075** |
| **Total Assertions Failed** | **0** |
| **Overall Pass Rate** | **100.0%** |

---

## 2. Key Test Groups & Subsystems

| Module / Subsystem | Assertions | Status |
| :--- | :---: | :---: |
| **Server Security & Truthful AI Health** (`serverSecurityAndTruthfulHealth.test.ts`) | 62 / 62 | **PASS** |
| **Scientific Roadmap & Evidence Vault Regression** (`vaultLogic.regression.test.ts`) | 98 / 98 | **PASS** |
| **Security Fixes & Billing Replay Protection** (`securityFixes.regression.test.ts`) | 41 / 41 | **PASS** |
| **Auth & Route Access Matrix** (`authAndRouteMatrix.regression.test.ts`) | 14 / 14 | **PASS** |
| **API Base & Mobile Networking** (`apiBaseAndBillingSecurity.test.ts`) | 23 / 23 | **PASS** |
| **Service Worker PWA Offline Security** (`serviceWorker.test.ts`) | 10 / 10 | **PASS** |
| **Phase 2.0 pHEngine & Neutralization** (`pHEngine.regression.test.ts`) | 64 / 64 | **PASS** |
| **Phase 3.0 pHEngine v2 Scientific Reference** (`pHEngineV2.regression.test.ts`) | 32 / 32 | **PASS** |
| **Phase 2.0 HLB Engine** (`hlbEngine.regression.test.ts`) | 15 / 15 | **PASS** |
| **Phase 4.0 Active Matter & Surfactants** (`activeMatterEngine.regression.test.ts`) | 30 / 30 | **PASS** |
| **Phase 5.0 Viscosity Engine** (`viscosityEngine.regression.test.ts`) | 10 / 10 | **PASS** |
| **Phase 6.0 Dilution Engine** (`dilutionEngine.regression.test.ts`) | 56 / 56 | **PASS** |
| **Phase 7.0 Powder Formulation Engine** (`powderEngine.regression.test.ts`) | 104 / 104 | **PASS** |
| **Phase 4.0 Specification & Decision Engine** (`specificationEngine.regression.test.ts`) | 67 / 67 | **PASS** |
| **Phase 2.1 Margin Chain & Costing** (`costingEngine.regression.test.ts`) | 68 / 68 | **PASS** |
| **Phase 2.3 Cleaning Performance Master** (`cleaningPerformance.regression.test.ts`) | 13 / 13 | **PASS** |
| **Phase 2.4 Compatibility Master** (`compatibility.regression.test.ts`) | 60 / 60 | **PASS** |
| **Phase 2.5 Lab Health Architecture** (`labHealth.regression.test.ts`) | 44 / 44 | **PASS** |
| **Phase 2.6 AI Grade Master** (`aiGrade.regression.test.ts`) | 49 / 49 | **PASS** |
| **Phase 2.7 Cross-Engine Integration** (`crossEngine.integration.test.ts`) | 33 / 33 | **PASS** |
| **Phase 2.8 Formula Workflow Audit** (`formulaWorkflow.integration.test.ts`) | 33 / 33 | **PASS** |
| **Phase 2.9 Formula Data Contract** (`formulaDataContract.regression.test.ts`) | 67 / 67 | **PASS** |
| **Phase 10.0 Master Formula Remediation** (`p10MasterFormulaRemediation.test.ts`) | 172 / 172 | **PASS** |
| **Phase P1.5 Scientific Quality Gate** (`p1Phase5ScientificQualityGate.regression.test.ts`) | 128 / 128 | **PASS** |
| **Phase P1.1 Scientific Calculation Master** (`p1Phase1Master.regression.test.ts`) | 108 / 108 | **PASS** |
| **Phase P0.4 Template Scientific Revalidation** (`formulaTemplateRevalidation.test.ts`) | 141 / 141 | **PASS** |
| **Test Integrity Verification Suite** (`testIntegrity.regression.test.ts`) | 25 / 25 | **PASS** |
| **All Other Scientific & Mathematical Suites** (Remaining 99 suites) | 2,429 / 2,429 | **PASS** |

---

## 3. Targeted New Assertions Breakdown

### Group 7: Port Configuration & Fallbacks
- `[PASS] Port 1: Valid numeric port is preserved`
- `[PASS] Port 2: Valid string port is parsed and returned as integer`
- `[PASS] Port 3: Missing/undefined port defaults to 3000`
- `[PASS] Port 4: Empty string port defaults to 3000`
- `[PASS] Port 5: Out of range (<1) port falls back to 3000`
- `[PASS] Port 6: Out of range (>65535) port falls back to 3000`
- `[PASS] Port 7: Non-numeric string port falls back to 3000`

### Group 8: Gemini API Key Validation & Placeholder Detection
- `[PASS] ApiKey 1: Undefined key returns false`
- `[PASS] ApiKey 2: Empty string returns false`
- `[PASS] ApiKey 3: Whitespace string returns false`
- `[PASS] ApiKey 4: Placeholder MY_GEMINI_API_KEY returns false`
- `[PASS] ApiKey 5: Placeholder YOUR_API_KEY returns false`
- `[PASS] ApiKey 6: Placeholder placeholder returns false`
- `[PASS] ApiKey 7: Short string (<10 chars) returns false`
- `[PASS] ApiKey 8: Legitimate key (>=10 chars, non-placeholder) returns true`

### Group 9: Model Resolution & Trust Proxy Setting
- `[PASS] Model 1: Defaults to documented default gemini-3.8-flash`
- `[PASS] Model 2: Accepts custom configured model string`
- `[PASS] Proxy 1: Defaults to 1 for reverse proxy environments`
- `[PASS] Proxy 2: Parses string "true" as 1`
- `[PASS] Proxy 3: Parses string "false" as boolean false`
- `[PASS] Proxy 4: Parses string "0" as boolean false`
- `[PASS] Proxy 5: Parses numeric string as integer hops`

### Group 10: Security Headers & Environment Validation
- `[PASS] SecHeaders 1: Sets X-Content-Type-Options to nosniff`
- `[PASS] SecHeaders 2: Sets X-XSS-Protection to 1; mode=block`
- `[PASS] SecHeaders 3: Sets Referrer-Policy to strict-origin-when-cross-origin`
- `[PASS] SecHeaders 4: Does NOT set X-Frame-Options to DENY (preserves AI Studio iframe)`
- `[PASS] SecHeaders 5: Passes control to next() in middleware chain`
- `[PASS] EnvAudit 1: Returns parsed port number`
- `[PASS] EnvAudit 2: Returns resolved model name`

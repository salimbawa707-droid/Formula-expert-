# Detergent Formula Expert — R&D Formulation & Chemistry Platform

Detergent Formula Expert is a specialized industrial chemical formulation, surfactant rheology, and stoichiometric optimization platform built for formulation chemists, chemical engineers, and detergent manufacturers.

---

## 🔬 Core Capabilities

- **PHEngineV2 & Acid-Base Equilibrium**: High-precision pH prediction using stoichiometric neutralization, Davies activity coefficient corrections, and multi-component buffer modeling across all 13 canonical detergent categories.
- **Surfactant Science & HLB**: Griffin blended HLB, Critical Micelle Concentration (CMC) estimates, Krafft/cloud point tracking, and electrolyte rheology salt curves.
- **Phase 9 Constrained Optimization**: Formulate to target active matter, viscosity, cleaning performance index (CPI), and target cost while maintaining mass balance (100.0%).
- **Cheminformatics & RDKit Integration**: Molecular structure visualization via 3DMol and SMILES drawers with chemical family categorization.
- **Fail-Closed Security & Governance**: Strict provenance tracking (source-backed vs. estimated vs. lab-measured), zero fabricated scientific defaults, verified per-user data isolation, and server-verified Google Play billing.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18 SPA with TypeScript, Tailwind CSS, Lucide icons, Framer Motion.
- **Backend**: Express on Node.js 24 (`server.ts`), ESBuild production bundle (`dist-server/server.cjs`).
- **AI Engine**: Google Gemini API via official `@google/genai` TypeScript SDK with Google Search grounding tool integration.
- **Database & Sync**: Client-first Dexie.js (IndexedDB) with optional Google Firebase Firestore cloud sync.
- **Mobile Runtime**: Capacitor 8.5 with Android SDK 36 (`compileSdk 36`, `targetSdk 36`).
- **PWA**: Custom service worker (`public/sw.js`) with cache-first static asset delivery and navigation app-shell fallback.

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>=24.12.0`
- npm `>=9.0.0`
- Optional for Android build: JDK 17+, Android SDK (API Level 36), Gradle 8.x

### Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Security & CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,capacitor://localhost

# Optional: Google Play Developer API (Service Account for Server Verification)
# GOOGLE_PLAY_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

### Installation

```bash
npm install
```

### Development Server

Runs Express backend serving Vite client in middleware mode on port 3000:

```bash
npm run dev
```

---

## 🧪 Testing & Verification

The platform maintains an authoritative 123-module regression and integrity test suite verifying all scientific engines, security middleware, and offline caching policies:

```bash
# Run full master test suite
npm test

# Run TypeScript typecheck across all modules
npm run typecheck
```

The master test runner produces a deterministic JSON manifest at `test_reports/execution-manifest.json` ensuring 100% agreement between disk discovery, registration, and live assertion execution.

---

## 📦 Production Builds

### Web Client & Server Production Build

```bash
# Clean previous build artifacts and bundle both client and server
npm run build
```

This generates:
- `dist/`: Minified static client PWA bundle (HTML, JS, CSS, assets)
- `dist-server/server.cjs`: Standalone bundled Node.js server executable

To run the production server:

```bash
npm start
```

### Android Release Pipeline (SDK 36)

The project includes an automated Capacitor release pipeline configured for target Android API level 36:

```bash
# Sync web dist to Capacitor Android project
npx cap sync android

# Run release APK pipeline script
npm run build:android
```

*Note: In accordance with security policy, release APK signing strictly requires externally supplied keystore credentials (`KEYSTORE_PATH`, `KEYSTORE_STORE_PASS`, `KEYSTORE_KEY_PASS`). The build pipeline refuses to generate fake or self-signed keys.*

---

## 🔒 Security & Privacy Policy

- Protected endpoints enforce Bearer JWT authentication and strict per-user ownership checks.
- CORS policy restricts cross-origin access via configurable allowlist.
- In-memory rate limiting operates per-process (`X-RateLimit-Scope: instance-memory-single-process`).
- API errors sanitize Google API keys, server filesystem paths, and email addresses.
- User formulas and lab observations are stored local-first; cloud sync is optional and user-controlled.
- Privacy Policy is published at `/privacy-policy.html`.

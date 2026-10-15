# Detergent Formula Expert — ZIP 40 Implementation Plan

1.  **Infrastructure Hardening (Node & Dependencies)**:
    *   Update `package.json` to reflect `engines: { "node": ">=24.12.0" }`.
    *   Update `firebase` dependencies to meet version requirements and run `npm install` for a clean lockfile state.
    *   Validate the entire suite with `npm test`, `npm run typecheck`, and production builds.

2.  **Android Release Pipeline Preparation**:
    *   Update `android/app/build.gradle` to `compileSdk 36` and `targetSdk 36`.
    *   Check Gradle Wrapper (`gradle-wrapper.properties`) and AGP (Android Gradle Plugin) versions for compatibility with SDK 36.
    *   Configure the build pipeline to generate the AAB artifact.

3.  **Ingredient Research & Scientific Integrity**:
    *   Implement official Google Search grounding in `src/services/ingredientResearchService.ts` using `@google/genai`.
    *   Ensure strict enforcement of `UNKNOWN`/`null` for missing scientific properties.
    *   Implement server-side validation for researched ingredient applications.

4.  **Truthful Health Reporting**:
    *   Refactor `/api/ai/status` and `/api/ai/chemistry-status` to expose accurate provider reachability and client-initialization states.

5.  **Final Verification**:
    *   Regenerate the 39-template scientific audit report.
    *   Verify all tests pass and ensure no pricing logic regressions.

# Merge Notes — Combined Correction 47

## Architectural Summary
- **Authentication**: Modernized to use modular `firebase-admin/app` and `firebase-admin/auth`. Test token emulation is isolated strictly to the test process runner and completely sealed from production HTTP routes.
- **Billing**: Integrated official `googleapis` (`androidpublisher.purchases.subscriptionsv2.get`).
- **Storage**: Added `src/services/durablePurchaseStore.ts` storing SHA-256 token fingerprints into Firestore transactionally.
- **Client Networking**: `src/services/apiBase.ts` attaches `Authorization: Bearer <idToken>` automatically whenever a user is signed in to Firebase Auth.
- **Backward Compatibility**: All scientific calculations (`PHEngineV2`, stoichiometric neutralization, active surfactant %, mass balance, water %, batch cost, and the staged "Check My Formula" engine) were 100% preserved without alterations to chemistry models.

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { INITIAL_VAULT_STATE } from '../src/domain/vault/initialData';
import type { AIReviewGateRecord } from '../src/domain/vault/types';
import { validatePhase4BAIReview } from '../src/utils/vault/vaultLogic';

export interface AIReviewArtifactValidation {
  valid: boolean;
  skipped: boolean;
  errors: string[];
  message: string;
}

function sha256File(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function safeVaultPath(rootDir: string, reference: string): string {
  if (!reference.startsWith('evidence_vault/ai_review/')) {
    throw new Error(`Artifact path is outside evidence_vault/ai_review/: ${reference}`);
  }
  const root = resolve(rootDir);
  const absolute = resolve(root, reference);
  const rel = relative(root, absolute);
  if (isAbsolute(rel) || rel === '..' || rel.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`)) {
    throw new Error(`Artifact path escapes repository root: ${reference}`);
  }
  return absolute;
}

export function validateAIReviewArtifacts(
  review: AIReviewGateRecord | undefined,
  rootDir = process.cwd()
): AIReviewArtifactValidation {
  if (!review) {
    return { valid: false, skipped: false, errors: ['Phase 4B AI review record is missing.'], message: 'AI review artifact validation failed.' };
  }

  if (review.status !== 'PASSED') {
    return {
      valid: true,
      skipped: true,
      errors: [],
      message: `AI review remains ${review.status}; Phase 5 remains LOCKED. Artifact hash verification is deferred until full Phase 4B closure is proposed.`,
    };
  }

  const semantic = validatePhase4BAIReview(review);
  if (!semantic.passed) {
    return { valid: false, skipped: false, errors: [semantic.reason], message: 'AI review semantic gate failed.' };
  }

  const errors: string[] = [];
  for (const [index, pass] of review.reviewPasses.entries()) {
    try {
      const manifestPath = safeVaultPath(rootDir, pass.sourceManifestRef);
      const resultPath = safeVaultPath(rootDir, pass.resultArtifactRef);
      if (!existsSync(manifestPath)) {
        errors.push(`Pass ${index + 1}: source manifest is missing: ${pass.sourceManifestRef}`);
        continue;
      }
      if (!existsSync(resultPath)) {
        errors.push(`Pass ${index + 1}: result artifact is missing: ${pass.resultArtifactRef}`);
        continue;
      }
      const actualManifestHash = sha256File(manifestPath);
      const actualResultHash = sha256File(resultPath);
      if (actualManifestHash !== pass.sourceManifestSha256.toLowerCase()) {
        errors.push(`Pass ${index + 1}: source manifest SHA-256 does not match committed file bytes.`);
      }
      if (actualResultHash !== pass.resultSha256.toLowerCase()) {
        errors.push(`Pass ${index + 1}: result artifact SHA-256 does not match committed file bytes.`);
      }
    } catch (error) {
      errors.push(`Pass ${index + 1}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    valid: errors.length === 0,
    skipped: false,
    errors,
    message: errors.length === 0
      ? 'AI review manifest and result artifact hashes match the committed files.'
      : 'AI review artifact integrity validation failed.',
  };
}

function main(): void {
  const phase4B = INITIAL_VAULT_STATE.phases.find(phase => phase.phaseId === 'phase-4b');
  const result = validateAIReviewArtifacts(phase4B?.aiReview);
  console.log(JSON.stringify({
    validator: 'PHASE4B_AI_REVIEW_ARTIFACT_INTEGRITY',
    ...result,
    phase4BStatus: phase4B?.status,
    phase5Status: INITIAL_VAULT_STATE.phases.find(phase => phase.phaseId === 'phase-5')?.status,
  }, null, 2));
  if (!result.valid) process.exit(1);
}

if (import.meta.main) main();

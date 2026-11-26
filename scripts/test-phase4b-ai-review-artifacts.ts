import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { AIReviewGateRecord } from '../src/domain/vault/types';
import { validateAIReviewArtifacts } from './validate-phase4b-ai-review-artifacts';

const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const root = mkdtempSync(join(tmpdir(), 'phase4b-ai-review-'));
const vaultDir = join(root, 'evidence_vault', 'ai_review');
mkdirSync(vaultDir, { recursive: true });

const manifestRef = 'evidence_vault/ai_review/source-manifest.json';
const passARef = 'evidence_vault/ai_review/pass-a.json';
const passBRef = 'evidence_vault/ai_review/pass-b.json';
const manifestContent = JSON.stringify({ source: 'pinned-source', sha: 'example' });
const passAContent = JSON.stringify({ pass: 'SOURCE_FIRST_TRANSCRIPTION', rows: 144 });
const passBContent = JSON.stringify({ pass: 'INDEPENDENT_SOURCE_RECHECK', rows: 144 });
writeFileSync(join(root, manifestRef), manifestContent);
writeFileSync(join(root, passARef), passAContent);
writeFileSync(join(root, passBRef), passBContent);

const validReview: AIReviewGateRecord = {
  status: 'PASSED',
  protocolVersion: 'phase4b-ai-review-v1',
  scope: 'PHASE_4B_COMPLETE',
  coveragePct: 100,
  unresolvedDiscrepancyCount: 0,
  sourceHashesPinned: true,
  automatedValidationStatus: 'PASSED',
  evidenceRefs: ['EVD-001', 'DS-001'],
  reviewPasses: [
    {
      method: 'SOURCE_FIRST_TRANSCRIPTION',
      reviewerModel: 'GPT-6',
      reviewedAt: '2026-11-26T10:00:00Z',
      sourceManifestRef: manifestRef,
      sourceManifestSha256: hash(manifestContent),
      resultArtifactRef: passARef,
      resultSha256: hash(passAContent),
      blindToOtherPasses: true,
      discrepancyCount: 0,
    },
    {
      method: 'INDEPENDENT_SOURCE_RECHECK',
      reviewerModel: 'GPT-6',
      reviewedAt: '2026-11-26T10:05:00Z',
      sourceManifestRef: manifestRef,
      sourceManifestSha256: hash(manifestContent),
      resultArtifactRef: passBRef,
      resultSha256: hash(passBContent),
      blindToOtherPasses: true,
      discrepancyCount: 0,
    },
  ],
  humanReviewPerformed: false,
};

try {
  const valid = validateAIReviewArtifacts(validReview, root);
  assert.equal(valid.valid, true, valid.errors.join('; '));
  assert.equal(valid.skipped, false);

  const inProgress = validateAIReviewArtifacts({
    ...validReview,
    status: 'IN_PROGRESS',
    scope: 'PARTIAL_SUBGATE',
    coveragePct: 0,
    sourceHashesPinned: false,
    automatedValidationStatus: 'NOT_RUN',
    evidenceRefs: [],
    reviewPasses: [],
  }, root);
  assert.equal(inProgress.valid, true);
  assert.equal(inProgress.skipped, true);

  const wrongManifest = validateAIReviewArtifacts({
    ...validReview,
    reviewPasses: validReview.reviewPasses.map((pass, index) =>
      index === 0 ? { ...pass, sourceManifestSha256: '0'.repeat(64) } : pass
    ),
  }, root);
  assert.equal(wrongManifest.valid, false);

  const wrongResult = validateAIReviewArtifacts({
    ...validReview,
    reviewPasses: validReview.reviewPasses.map((pass, index) =>
      index === 1 ? { ...pass, resultSha256: '0'.repeat(64) } : pass
    ),
  }, root);
  assert.equal(wrongResult.valid, false);

  const pathTraversal = validateAIReviewArtifacts({
    ...validReview,
    reviewPasses: validReview.reviewPasses.map((pass, index) =>
      index === 1 ? { ...pass, resultArtifactRef: 'evidence_vault/ai_review/../../outside.json' } : pass
    ),
  }, root);
  assert.equal(pathTraversal.valid, false);

  const sameFileForBoth = validateAIReviewArtifacts({
    ...validReview,
    reviewPasses: validReview.reviewPasses.map((pass, index) =>
      index === 0 ? { ...pass, resultArtifactRef: manifestRef } : pass
    ),
  }, root);
  assert.equal(sameFileForBoth.valid, false);

  const missingArtifact = validateAIReviewArtifacts({
    ...validReview,
    reviewPasses: validReview.reviewPasses.map((pass, index) =>
      index === 1 ? { ...pass, resultArtifactRef: 'evidence_vault/ai_review/missing.json' } : pass
    ),
  }, root);
  assert.equal(missingArtifact.valid, false);

  // A lexically in-vault symlink must not be allowed to read an external file.
  const outsideFile = join(root, 'outside-secret.json');
  const symlinkRef = 'evidence_vault/ai_review/external-link.json';
  writeFileSync(outsideFile, JSON.stringify({ outside: true }));
  symlinkSync(outsideFile, join(root, symlinkRef));
  const symlinkEscape = validateAIReviewArtifacts({
    ...validReview,
    reviewPasses: validReview.reviewPasses.map((pass, index) =>
      index === 1 ? { ...pass, resultArtifactRef: symlinkRef } : pass
    ),
  }, root);
  assert.equal(symlinkEscape.valid, false);
  assert.match(symlinkEscape.errors.join('; '), /Symbolic links are not permitted/);

  console.log('Phase 4B AI review artifact integrity tests: 8/8 PASS');
} finally {
  rmSync(root, { recursive: true, force: true });
}

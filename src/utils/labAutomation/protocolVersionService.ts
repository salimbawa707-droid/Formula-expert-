/**
 * Protocol Version Service
 * 
 * Manages semantic versioning and immutability guarantees for laboratory protocols.
 * Ensures that once a protocol version is approved for export, any parameter alteration
 * triggers a mandatory new version bump.
 */

import { ProtocolDefinition } from './types';

export interface VersionComparison {
  isIdentical: boolean;
  changes: string[];
}

/**
 * Parses semantic version string (e.g. "1.2.0") into major, minor, patch numbers
 */
export function parseSemanticVersion(version: string): { major: number; minor: number; patch: number } {
  const parts = version.split('.').map(p => parseInt(p, 10));
  return {
    major: isNaN(parts[0]) ? 1 : parts[0],
    minor: isNaN(parts[1]) ? 0 : parts[1],
    patch: isNaN(parts[2]) ? 0 : parts[2],
  };
}

/**
 * Formats major, minor, patch into string
 */
export function formatSemanticVersion(major: number, minor: number, patch: number): string {
  return `${major}.${minor}.${patch}`;
}

/**
 * Computes next version depending on whether changes are major (formula / chemistry) or minor (parameters / volumes)
 */
export function incrementProtocolVersion(
  currentVersion: string,
  changeType: 'MAJOR' | 'MINOR' | 'PATCH'
): string {
  const { major, minor, patch } = parseSemanticVersion(currentVersion);
  if (changeType === 'MAJOR') {
    return formatSemanticVersion(major + 1, 0, 0);
  } else if (changeType === 'MINOR') {
    return formatSemanticVersion(major, minor + 1, 0);
  } else {
    return formatSemanticVersion(major, minor, patch + 1);
  }
}

/**
 * Assesses whether changes between two protocol snapshots require a version bump
 */
export function compareProtocolDefinitions(
  oldDef: ProtocolDefinition,
  newDef: ProtocolDefinition
): VersionComparison {
  const changes: string[] = [];

  if (oldDef.formulaId !== newDef.formulaId) {
    changes.push(`Target formula changed from '${oldDef.formulaId}' to '${newDef.formulaId}'`);
  }
  if (oldDef.formulaVersionId !== newDef.formulaVersionId) {
    changes.push(`Formula version changed from '${oldDef.formulaVersionId}' to '${newDef.formulaVersionId}'`);
  }
  if (oldDef.robotPlatform !== newDef.robotPlatform) {
    changes.push(`Target platform changed from '${oldDef.robotPlatform}' to '${newDef.robotPlatform}'`);
  }
  if (oldDef.liquidTransfers.length !== newDef.liquidTransfers.length) {
    changes.push(`Liquid transfers count changed from ${oldDef.liquidTransfers.length} to ${newDef.liquidTransfers.length}`);
  }
  if (oldDef.commands.length !== newDef.commands.length) {
    changes.push(`Command steps count changed from ${oldDef.commands.length} to ${newDef.commands.length}`);
  }
  if (oldDef.protocolHash !== newDef.protocolHash) {
    changes.push(`Cryptographic protocol hash mismatch (${oldDef.protocolHash.slice(0, 8)}... vs ${newDef.protocolHash.slice(0, 8)}...)`);
  }

  return {
    isIdentical: changes.length === 0,
    changes,
  };
}

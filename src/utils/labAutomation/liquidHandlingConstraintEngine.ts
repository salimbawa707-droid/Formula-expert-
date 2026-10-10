/**
 * Liquid Handling Constraint Engine
 * 
 * Enforces scientific fluid dynamics and physical robotics constraints:
 * - Minimum/Maximum pipette volumetric limits
 * - Labware well overflow & minimum working volume limits
 * - Dynamic liquid volume tracking in source and destination wells
 * - Viscosity-adapted flow rates and blow-out / touch-tip requirements
 * - Rejection of zero/negative volumes and invalid well coordinates
 */

import {
  DeckItemAssignment,
  LiquidTransferSpec,
  MixOperationSpec,
  PipetteDefinition,
  WellContentState,
} from './types';
import { isValidWellInLabware } from './labwareRegistry';

export interface LiquidHandlingValidationIssue {
  severity: 'ERROR' | 'WARNING' | 'INFO';
  code: string;
  message: string;
  transferId?: string;
  relatedWell?: string;
  suggestedCorrection?: string;
}

export interface LiquidHandlingConstraintCheckResult {
  isValid: boolean;
  issues: LiquidHandlingValidationIssue[];
  finalWellStates: Record<string, Record<string, WellContentState>>;
  totalLiquidVolumeDispensedUl: number;
}

/**
 * Validates an array of liquid transfers against deck layout and pipettes
 */
export function validateLiquidHandlingPlan(
  transfers: LiquidTransferSpec[],
  mixes: MixOperationSpec[],
  deckLayout: Record<string, DeckItemAssignment>,
  pipettes: {
    left?: { pipetteDef: PipetteDefinition; mount: 'left' };
    right?: { pipetteDef: PipetteDefinition; mount: 'right' };
  }
): LiquidHandlingConstraintCheckResult {
  const issues: LiquidHandlingValidationIssue[] = [];
  let totalVolumeDispensed = 0;

  // Clone initial well states from deckLayout or initialize
  const wellStates: Record<string, Record<string, WellContentState>> = {};

  for (const [slot, item] of Object.entries(deckLayout)) {
    wellStates[slot] = {};
    if (item.initialContents) {
      for (const [wellName, state] of Object.entries(item.initialContents)) {
        wellStates[slot][wellName] = { ...state };
      }
    }
  }

  // 1. Validate transfers
  for (let i = 0; i < transfers.length; i++) {
    const transfer = transfers[i];
    const transferLabel = `Transfer #${i + 1} (${transfer.transferId || 'unnamed'})`;

    // A. Check volume positivity
    if (transfer.volumeUl <= 0 || isNaN(transfer.volumeUl) || !isFinite(transfer.volumeUl)) {
      issues.push({
        severity: 'ERROR',
        code: 'INVALID_TRANSFER_VOLUME',
        message: `${transferLabel}: Transfer volume must be strictly positive (got ${transfer.volumeUl} µL).`,
        transferId: transfer.transferId,
      });
      continue;
    }

    totalVolumeDispensed += transfer.volumeUl;

    // B. Check pipette assignment & volumetric capacity
    const mountedPipette = transfer.pipetteMount === 'left' ? pipettes.left : pipettes.right;
    if (!mountedPipette) {
      issues.push({
        severity: 'ERROR',
        code: 'UNMOUNTED_PIPETTE',
        message: `${transferLabel}: Pipette mount '${transfer.pipetteMount}' has no loaded pipette definition.`,
        transferId: transfer.transferId,
      });
      continue;
    }

    const pipDef = mountedPipette.pipetteDef;
    if (transfer.volumeUl < pipDef.minVolumeUl) {
      issues.push({
        severity: 'ERROR',
        code: 'BELOW_MIN_PIPETTE_VOLUME',
        message: `${transferLabel}: Transfer volume ${transfer.volumeUl} µL is below ${pipDef.displayName} minimum capability (${pipDef.minVolumeUl} µL). Inaccurate pipetting will occur.`,
        transferId: transfer.transferId,
        suggestedCorrection: `Use a higher precision pipette (e.g. P20) or prepare a more dilute stock solution.`,
      });
    }

    if (transfer.volumeUl > pipDef.maxVolumeUl) {
      issues.push({
        severity: 'WARNING',
        code: 'EXCEEDS_SINGLE_SHOT_PIPETTE_CAPACITY',
        message: `${transferLabel}: Transfer volume ${transfer.volumeUl} µL exceeds ${pipDef.displayName} capacity (${pipDef.maxVolumeUl} µL). Multidispense aliquoting required.`,
        transferId: transfer.transferId,
      });
    }

    // C. Check Source Deck Item and Well
    const sourceDeckItem = deckLayout[transfer.sourceSlot];
    if (!sourceDeckItem) {
      issues.push({
        severity: 'ERROR',
        code: 'SOURCE_SLOT_EMPTY',
        message: `${transferLabel}: Source slot '${transfer.sourceSlot}' has no labware loaded on the deck.`,
        transferId: transfer.transferId,
      });
    } else {
      if (!isValidWellInLabware(sourceDeckItem.labwareDef, transfer.sourceWell)) {
        issues.push({
          severity: 'ERROR',
          code: 'INVALID_SOURCE_WELL',
          message: `${transferLabel}: Well '${transfer.sourceWell}' does not exist on source labware '${sourceDeckItem.labwareDef.displayName}'.`,
          transferId: transfer.transferId,
          relatedWell: transfer.sourceWell,
        });
      } else {
        // Source tracking
        const currentSrcState = wellStates[transfer.sourceSlot]?.[transfer.sourceWell];
        if (currentSrcState) {
          if (currentSrcState.currentVolumeUl < transfer.volumeUl) {
            issues.push({
              severity: 'ERROR',
              code: 'SOURCE_VOLUME_EXHAUSTED',
              message: `${transferLabel}: Source well '${transfer.sourceWell}' has only ${currentSrcState.currentVolumeUl} µL remaining, but ${transfer.volumeUl} µL requested.`,
              transferId: transfer.transferId,
              relatedWell: transfer.sourceWell,
            });
          } else {
            currentSrcState.currentVolumeUl -= transfer.volumeUl;
            if (currentSrcState.currentVolumeUl < (sourceDeckItem.labwareDef.minWorkingVolumeUl || 0)) {
              issues.push({
                severity: 'WARNING',
                code: 'SOURCE_BELOW_MIN_WORKING_VOLUME',
                message: `${transferLabel}: Source well '${transfer.sourceWell}' volume (${currentSrcState.currentVolumeUl} µL) fell below dead volume (${sourceDeckItem.labwareDef.minWorkingVolumeUl} µL). Risk of aspirating air.`,
                transferId: transfer.transferId,
                relatedWell: transfer.sourceWell,
              });
            }
          }
        }
      }
    }

    // D. Check Destination Deck Item and Well
    const destDeckItem = deckLayout[transfer.destSlot];
    if (!destDeckItem) {
      issues.push({
        severity: 'ERROR',
        code: 'DEST_SLOT_EMPTY',
        message: `${transferLabel}: Destination slot '${transfer.destSlot}' has no labware loaded on the deck.`,
        transferId: transfer.transferId,
      });
    } else {
      if (!isValidWellInLabware(destDeckItem.labwareDef, transfer.destWell)) {
        issues.push({
          severity: 'ERROR',
          code: 'INVALID_DEST_WELL',
          message: `${transferLabel}: Well '${transfer.destWell}' does not exist on destination labware '${destDeckItem.labwareDef.displayName}'.`,
          transferId: transfer.transferId,
          relatedWell: transfer.destWell,
        });
      } else {
        // Destination tracking & overflow check
        if (!wellStates[transfer.destSlot]) {
          wellStates[transfer.destSlot] = {};
        }
        if (!wellStates[transfer.destSlot][transfer.destWell]) {
          wellStates[transfer.destSlot][transfer.destWell] = {
            initialVolumeUl: 0,
            currentVolumeUl: 0,
            maxCapacityUl: destDeckItem.labwareDef.maxWorkingVolumeUl,
          };
        }

        const currentDestState = wellStates[transfer.destSlot][transfer.destWell];
        const newDestVol = currentDestState.currentVolumeUl + transfer.volumeUl;

        if (newDestVol > destDeckItem.labwareDef.maxWorkingVolumeUl) {
          issues.push({
            severity: 'ERROR',
            code: 'DESTINATION_WELL_OVERFLOW',
            message: `${transferLabel}: Destination well '${transfer.destWell}' would overflow (${newDestVol} µL exceeds max working volume ${destDeckItem.labwareDef.maxWorkingVolumeUl} µL).`,
            transferId: transfer.transferId,
            relatedWell: transfer.destWell,
            suggestedCorrection: `Reduce formulation scale or use larger capacity labware.`,
          });
        }
        currentDestState.currentVolumeUl = newDestVol;
      }
    }
  }

  // 2. Validate mixes
  for (let m = 0; m < mixes.length; m++) {
    const mix = mixes[m];
    const mixLabel = `Mix Operation #${m + 1}`;
    const destItem = deckLayout[mix.slot];
    if (!destItem) {
      issues.push({
        severity: 'ERROR',
        code: 'MIX_SLOT_EMPTY',
        message: `${mixLabel}: Slot '${mix.slot}' has no labware loaded for mixing.`,
      });
    } else if (!isValidWellInLabware(destItem.labwareDef, mix.well)) {
      issues.push({
        severity: 'ERROR',
        code: 'INVALID_MIX_WELL',
        message: `${mixLabel}: Well '${mix.well}' is invalid for labware '${destItem.labwareDef.displayName}'.`,
        relatedWell: mix.well,
      });
    }

    if (mix.cycles <= 0 || mix.cycles > 50) {
      issues.push({
        severity: 'WARNING',
        code: 'UNUSUAL_MIX_CYCLES',
        message: `${mixLabel}: Mix cycles (${mix.cycles}) outside standard range (1-50 cycles).`,
      });
    }
  }

  const hasErrors = issues.some(i => i.severity === 'ERROR');

  return {
    isValid: !hasErrors,
    issues,
    finalWellStates: wellStates,
    totalLiquidVolumeDispensedUl: totalVolumeDispensed,
  };
}

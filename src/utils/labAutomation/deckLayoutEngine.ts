/**
 * Deck Layout Engine
 * 
 * Manages deterministic robot deck layout assignments, slot validation,
 * platform geometry checks, and collision/clearance verification.
 */

import {
  DeckItemAssignment,
  DeckSlotOT2,
  DeckSlotFlex,
  RobotPlatform,
} from './types';
import { CANONICAL_LABWARE, getLabwareDefinition } from './labwareRegistry';

export const VALID_OT2_SLOTS: DeckSlotOT2[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
export const VALID_FLEX_SLOTS: DeckSlotFlex[] = [
  'A1', 'A2', 'A3', 'A4',
  'B1', 'B2', 'B3', 'B4',
  'C1', 'C2', 'C3', 'C4',
  'D1', 'D2', 'D3', 'D4',
];

export interface DeckLayoutValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  occupiedSlotsCount: number;
  hasTrash: boolean;
  hasTipRack: boolean;
}

/**
 * Checks if a slot position is valid for the target platform
 */
export function isValidSlotForPlatform(slot: string, platform: RobotPlatform): boolean {
  if (platform === 'OT-2') {
    return VALID_OT2_SLOTS.includes(slot as DeckSlotOT2);
  }
  if (platform === 'FLEX') {
    return VALID_FLEX_SLOTS.includes(slot as DeckSlotFlex);
  }
  return false;
}

/**
 * Validates an entire deck layout map
 */
export function validateDeckLayout(
  deckLayout: Record<string, DeckItemAssignment>,
  platform: RobotPlatform
): DeckLayoutValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenSlots = new Set<string>();

  let hasTrash = false;
  let hasTipRack = false;

  for (const [slotKey, assignment] of Object.entries(deckLayout)) {
    // 1. Verify slot string matches dictionary key
    if (slotKey !== assignment.slot) {
      errors.push(`Deck dictionary key "${slotKey}" does not match assignment slot "${assignment.slot}".`);
    }

    // 2. Verify slot valid on platform
    if (!isValidSlotForPlatform(assignment.slot, platform)) {
      errors.push(`Slot "${assignment.slot}" is invalid on ${platform} platform.`);
    }

    // 3. Prevent duplicate slots
    if (seenSlots.has(assignment.slot)) {
      errors.push(`Duplicate labware assignment detected on slot "${assignment.slot}".`);
    }
    seenSlots.add(assignment.slot);

    // 4. Labware definition check
    if (!assignment.labwareDef) {
      errors.push(`Missing labware definition for item "${assignment.nickname}" at slot "${assignment.slot}".`);
      continue;
    }

    // 5. Platform compatibility check
    if (!assignment.labwareDef.supportedPlatforms.includes(platform)) {
      errors.push(`Labware "${assignment.labwareDef.displayName}" is not supported on ${platform}.`);
    }

    if (assignment.labwareDef.category === 'trash') {
      hasTrash = true;
    }
    if (assignment.labwareDef.isTipRack) {
      hasTipRack = true;
    }
  }

  // Check required standard labware
  if (!hasTrash) {
    if (platform === 'OT-2') {
      // Slot 12 is standard fixed trash on OT-2
      warnings.push('Fixed trash not explicitly defined at Slot 12. Standard OT-2 fixed trash will be assumed.');
    } else {
      errors.push('No trash container assigned on Flex deck layout.');
    }
  }

  if (!hasTipRack) {
    errors.push('Deck layout contains no tip rack. Protocol requires at least one compatible tip rack.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    occupiedSlotsCount: seenSlots.size,
    hasTrash,
    hasTipRack,
  };
}

/**
 * Generates standard standard starter deck layout for formulation dispensing
 */
export function generateStandardFormulationDeck(
  platform: RobotPlatform = 'OT-2',
  tipRackLoadName: string = 'opentrons_96_tiprack_300ul',
  destPlateLoadName: string = 'corning_96_wellplate_360ul_flat',
  sourceRackLoadName: string = 'opentrons_24_tuberack_generic_2ml_screwcap'
): Record<string, DeckItemAssignment> {
  const deck: Record<string, DeckItemAssignment> = {};

  const tipDef = getLabwareDefinition(tipRackLoadName) || CANONICAL_LABWARE['opentrons_96_tiprack_300ul'];
  const destDef = getLabwareDefinition(destPlateLoadName) || CANONICAL_LABWARE['corning_96_wellplate_360ul_flat'];
  const sourceDef = getLabwareDefinition(sourceRackLoadName) || CANONICAL_LABWARE['opentrons_24_tuberack_generic_2ml_screwcap'];
  const resDef = CANONICAL_LABWARE['nest_12_reservoir_15ml'];
  const trashDef = CANONICAL_LABWARE['opentrons_1_trash_1100ml_fixed'];

  if (platform === 'OT-2') {
    deck['1'] = {
      slot: '1',
      labwareId: tipDef.labwareId,
      labwareDef: tipDef,
      nickname: 'Tip Rack 300µL',
      purpose: 'tiprack',
    };
    deck['2'] = {
      slot: '2',
      labwareId: sourceDef.labwareId,
      labwareDef: sourceDef,
      nickname: 'Stock Ingredients Rack',
      purpose: 'source_reagents',
    };
    deck['3'] = {
      slot: '3',
      labwareId: destDef.labwareId,
      labwareDef: destDef,
      nickname: 'Formulation Array Plate',
      purpose: 'destination_plate',
    };
    deck['5'] = {
      slot: '5',
      labwareId: resDef.labwareId,
      labwareDef: resDef,
      nickname: 'Bulk Solvent / Water Reservoir',
      purpose: 'source_reagents',
    };
    deck['12'] = {
      slot: '12',
      labwareId: trashDef.labwareId,
      labwareDef: trashDef,
      nickname: 'Fixed Trash',
      purpose: 'trash',
    };
  } else {
    // Flex Layout
    deck['A1'] = {
      slot: 'A1',
      labwareId: tipDef.labwareId,
      labwareDef: tipDef,
      nickname: 'Flex Tip Rack',
      purpose: 'tiprack',
    };
    deck['A2'] = {
      slot: 'A2',
      labwareId: sourceDef.labwareId,
      labwareDef: sourceDef,
      nickname: 'Stock Ingredients Rack',
      purpose: 'source_reagents',
    };
    deck['B2'] = {
      slot: 'B2',
      labwareId: destDef.labwareId,
      labwareDef: destDef,
      nickname: 'Formulation Array Plate',
      purpose: 'destination_plate',
    };
    deck['C2'] = {
      slot: 'C2',
      labwareId: resDef.labwareId,
      labwareDef: resDef,
      nickname: 'Solvent Reservoir',
      purpose: 'source_reagents',
    };
    deck['A3'] = {
      slot: 'A3',
      labwareId: trashDef.labwareId,
      labwareDef: trashDef,
      nickname: 'Flex Trash Bin',
      purpose: 'trash',
    };
  }

  return deck;
}

/**
 * Controlled Pipette Registry
 * 
 * Verifies pipette hardware specifications, volume boundaries, channel counts,
 * and compatible tip racks.
 * Never allows generating transfers exceeding validated pipette capacity or under min volume.
 */

import { PipetteDefinition, PipetteModel } from './types';

export const CANONICAL_PIPETTES: Record<PipetteModel, PipetteDefinition> = {
  'p20_single_gen2': {
    pipetteId: 'p20_single_gen2',
    model: 'p20_single_gen2',
    displayName: 'P20 Single-Channel GEN2 (1 - 20 µL)',
    channels: 1,
    minVolumeUl: 1.0,
    maxVolumeUl: 20.0,
    defaultAspirateRateUlSec: 7.56,
    defaultDispenseRateUlSec: 7.56,
    compatibleTipRacks: ['opentrons_96_tiprack_20ul'],
    supportedPlatforms: ['OT-2'],
  },

  'p20_multi_gen2': {
    pipetteId: 'p20_multi_gen2',
    model: 'p20_multi_gen2',
    displayName: 'P20 8-Channel GEN2 (1 - 20 µL)',
    channels: 8,
    minVolumeUl: 1.0,
    maxVolumeUl: 20.0,
    defaultAspirateRateUlSec: 7.56,
    defaultDispenseRateUlSec: 7.56,
    compatibleTipRacks: ['opentrons_96_tiprack_20ul'],
    supportedPlatforms: ['OT-2'],
  },

  'p300_single_gen2': {
    pipetteId: 'p300_single_gen2',
    model: 'p300_single_gen2',
    displayName: 'P300 Single-Channel GEN2 (20 - 300 µL)',
    channels: 1,
    minVolumeUl: 20.0,
    maxVolumeUl: 300.0,
    defaultAspirateRateUlSec: 92.86,
    defaultDispenseRateUlSec: 92.86,
    compatibleTipRacks: ['opentrons_96_tiprack_300ul'],
    supportedPlatforms: ['OT-2'],
  },

  'p300_multi_gen2': {
    pipetteId: 'p300_multi_gen2',
    model: 'p300_multi_gen2',
    displayName: 'P300 8-Channel GEN2 (20 - 300 µL)',
    channels: 8,
    minVolumeUl: 20.0,
    maxVolumeUl: 300.0,
    defaultAspirateRateUlSec: 92.86,
    defaultDispenseRateUlSec: 92.86,
    compatibleTipRacks: ['opentrons_96_tiprack_300ul'],
    supportedPlatforms: ['OT-2'],
  },

  'p1000_single_gen2': {
    pipetteId: 'p1000_single_gen2',
    model: 'p1000_single_gen2',
    displayName: 'P1000 Single-Channel GEN2 (100 - 1000 µL)',
    channels: 1,
    minVolumeUl: 100.0,
    maxVolumeUl: 1000.0,
    defaultAspirateRateUlSec: 274.7,
    defaultDispenseRateUlSec: 274.7,
    compatibleTipRacks: ['opentrons_96_tiprack_1000ul'],
    supportedPlatforms: ['OT-2'],
  },

  'flex_1channel_50': {
    pipetteId: 'flex_1channel_50',
    model: 'flex_1channel_50',
    displayName: 'Flex 1-Channel 50 µL (1 - 50 µL)',
    channels: 1,
    minVolumeUl: 1.0,
    maxVolumeUl: 50.0,
    defaultAspirateRateUlSec: 25.0,
    defaultDispenseRateUlSec: 25.0,
    compatibleTipRacks: ['opentrons_96_tiprack_20ul', 'opentrons_96_tiprack_300ul'],
    supportedPlatforms: ['FLEX'],
  },

  'flex_8channel_50': {
    pipetteId: 'flex_8channel_50',
    model: 'flex_8channel_50',
    displayName: 'Flex 8-Channel 50 µL (1 - 50 µL)',
    channels: 8,
    minVolumeUl: 1.0,
    maxVolumeUl: 50.0,
    defaultAspirateRateUlSec: 25.0,
    defaultDispenseRateUlSec: 25.0,
    compatibleTipRacks: ['opentrons_96_tiprack_20ul', 'opentrons_96_tiprack_300ul'],
    supportedPlatforms: ['FLEX'],
  },

  'flex_1channel_1000': {
    pipetteId: 'flex_1channel_1000',
    model: 'flex_1channel_1000',
    displayName: 'Flex 1-Channel 1000 µL (5 - 1000 µL)',
    channels: 1,
    minVolumeUl: 5.0,
    maxVolumeUl: 1000.0,
    defaultAspirateRateUlSec: 300.0,
    defaultDispenseRateUlSec: 300.0,
    compatibleTipRacks: ['opentrons_96_tiprack_1000ul'],
    supportedPlatforms: ['FLEX'],
  },

  'flex_8channel_1000': {
    pipetteId: 'flex_8channel_1000',
    model: 'flex_8channel_1000',
    displayName: 'Flex 8-Channel 1000 µL (5 - 1000 µL)',
    channels: 8,
    minVolumeUl: 5.0,
    maxVolumeUl: 1000.0,
    defaultAspirateRateUlSec: 300.0,
    defaultDispenseRateUlSec: 300.0,
    compatibleTipRacks: ['opentrons_96_tiprack_1000ul'],
    supportedPlatforms: ['FLEX'],
  },
};

/**
 * Lookup pipette definition
 */
export function getPipetteDefinition(model: string): PipetteDefinition | null {
  if (!model) return null;
  const direct = CANONICAL_PIPETTES[model as PipetteModel];
  if (direct) return direct;

  for (const p of Object.values(CANONICAL_PIPETTES)) {
    if (p.pipetteId === model || p.displayName.toLowerCase().includes(model.toLowerCase())) {
      return p;
    }
  }
  return null;
}

/**
 * Select the optimal pipette from an available set for a given transfer volume
 */
export function selectBestPipetteForVolume(
  volumeUl: number,
  availablePipettes: PipetteDefinition[]
): PipetteDefinition | null {
  if (volumeUl <= 0 || availablePipettes.length === 0) return null;

  // Filter pipettes that can handle this single-shot or multi-aliquot volume
  const capable = availablePipettes.filter(p => volumeUl >= p.minVolumeUl && volumeUl <= p.maxVolumeUl);
  if (capable.length > 0) {
    // Pick the one with the lowest maxVolume for highest precision
    capable.sort((a, b) => a.maxVolumeUl - b.maxVolumeUl);
    return capable[0];
  }

  // If volume exceeds max of all, pick the largest pipette to do aliquots
  const largest = [...availablePipettes].sort((a, b) => b.maxVolumeUl - a.maxVolumeUl)[0];
  if (largest && volumeUl >= largest.minVolumeUl) {
    return largest;
  }

  return null;
}

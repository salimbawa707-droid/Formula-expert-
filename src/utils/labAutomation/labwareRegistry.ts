/**
 * Standard Labware Registry
 * 
 * Catalog of verified standard SBS and Opentrons labware definitions.
 * Provides exact well coordinates, working volumes, and dimensional bounds.
 * Unknown or unverified labware must be explicitly flagged as UNSUPPORTED.
 */

import { LabwareDefinition, WellDefinition } from './types';

// Helper to generate well grids
function generateStandard96Wells(wellVolumeUl: number, workingVolumeUl: number): Record<string, WellDefinition> {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const wells: Record<string, WellDefinition> = {};

  const xOrigin = 14.38;
  const yOrigin = 74.24;
  const spacing = 9.0;

  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < cols.length; c++) {
      const wellName = `${rows[r]}${cols[c]}`;
      wells[wellName] = {
        name: wellName,
        x: Number((xOrigin + c * spacing).toFixed(2)),
        y: Number((yOrigin - r * spacing).toFixed(2)),
        z: 10.5,
        depth: 10.6,
        totalVolumeUl: wellVolumeUl,
        workingVolumeUl: workingVolumeUl,
        shape: 'circular',
        diameterMm: 6.9,
      };
    }
  }
  return wells;
}

function generate24RackWells(wellVolumeUl: number, workingVolumeUl: number): Record<string, WellDefinition> {
  const rows = ['A', 'B', 'C', 'D'];
  const cols = [1, 2, 3, 4, 5, 6];
  const wells: Record<string, WellDefinition> = {};

  const xOrigin = 18.21;
  const yOrigin = 65.41;
  const spacingX = 19.3;
  const spacingY = 19.3;

  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < cols.length; c++) {
      const wellName = `${rows[r]}${cols[c]}`;
      wells[wellName] = {
        name: wellName,
        x: Number((xOrigin + c * spacingX).toFixed(2)),
        y: Number((yOrigin - r * spacingY).toFixed(2)),
        z: 4.0,
        depth: 43.5,
        totalVolumeUl: wellVolumeUl,
        workingVolumeUl: workingVolumeUl,
        shape: 'circular',
        diameterMm: 11.5,
      };
    }
  }
  return wells;
}

function generate12ReservoirWells(wellVolumeUl: number, workingVolumeUl: number): Record<string, WellDefinition> {
  const wells: Record<string, WellDefinition> = {};
  const xOrigin = 13.94;
  const yOrigin = 43.0;
  const spacingX = 9.0;

  for (let c = 1; c <= 12; c++) {
    const wellName = `A${c}`;
    wells[wellName] = {
      name: wellName,
      x: Number((xOrigin + (c - 1) * spacingX).toFixed(2)),
      y: yOrigin,
      z: 5.0,
      depth: 38.0,
      totalVolumeUl: wellVolumeUl,
      workingVolumeUl: workingVolumeUl,
      shape: 'rectangular',
      lengthMm: 8.2,
      widthMm: 71.0,
    };
  }
  return wells;
}

// ============================================================================
// CANONICAL LABWARE CATALOG
// ============================================================================

export const CANONICAL_LABWARE: Record<string, LabwareDefinition> = {
  'corning_96_wellplate_360ul_flat': {
    labwareId: 'corning_96_wellplate_360ul_flat',
    loadName: 'corning_96_wellplate_360ul_flat',
    displayName: 'Corning 96 Well Plate 360 µL Flat',
    category: 'wellPlate',
    manufacturer: 'Corning',
    model: '360ul_flat',
    version: 2,
    gridFormat: '96_standard',
    wellCount: 96,
    totalWellVolumeUl: 360,
    maxWorkingVolumeUl: 320,
    minWorkingVolumeUl: 20,
    dimensionsMm: { xDimension: 127.76, yDimension: 85.48, zDimension: 14.22 },
    wells: generateStandard96Wells(360, 320),
    isTipRack: false,
    supportedPlatforms: ['OT-2', 'FLEX'],
  },

  'nest_96_wellplate_200ul_flat': {
    labwareId: 'nest_96_wellplate_200ul_flat',
    loadName: 'nest_96_wellplate_200ul_flat',
    displayName: 'NEST 96 Well Plate 200 µL Flat',
    category: 'wellPlate',
    manufacturer: 'NEST',
    model: '200ul_flat',
    version: 1,
    gridFormat: '96_standard',
    wellCount: 96,
    totalWellVolumeUl: 200,
    maxWorkingVolumeUl: 180,
    minWorkingVolumeUl: 10,
    dimensionsMm: { xDimension: 127.76, yDimension: 85.48, zDimension: 14.5 },
    wells: generateStandard96Wells(200, 180),
    isTipRack: false,
    supportedPlatforms: ['OT-2', 'FLEX'],
  },

  'opentrons_24_tuberack_generic_2ml_screwcap': {
    labwareId: 'opentrons_24_tuberack_generic_2ml_screwcap',
    loadName: 'opentrons_24_tuberack_generic_2ml_screwcap',
    displayName: 'Opentrons 24 Tube Rack 2 mL Screwcap',
    category: 'tubeRack',
    manufacturer: 'Opentrons',
    model: '24_rack_2ml',
    version: 2,
    gridFormat: '24_rack',
    wellCount: 24,
    totalWellVolumeUl: 2000,
    maxWorkingVolumeUl: 1800,
    minWorkingVolumeUl: 50,
    dimensionsMm: { xDimension: 127.76, yDimension: 85.48, zDimension: 51.5 },
    wells: generate24RackWells(2000, 1800),
    isTipRack: false,
    supportedPlatforms: ['OT-2', 'FLEX'],
  },

  'nest_12_reservoir_15ml': {
    labwareId: 'nest_12_reservoir_15ml',
    loadName: 'nest_12_reservoir_15ml',
    displayName: 'NEST 12 Channel Reservoir 15 mL',
    category: 'reservoir',
    manufacturer: 'NEST',
    model: '12_channel_15ml',
    version: 2,
    gridFormat: '12_channel_res',
    wellCount: 12,
    totalWellVolumeUl: 15000,
    maxWorkingVolumeUl: 14000,
    minWorkingVolumeUl: 500,
    dimensionsMm: { xDimension: 127.76, yDimension: 85.48, zDimension: 44.0 },
    wells: generate12ReservoirWells(15000, 14000),
    isTipRack: false,
    supportedPlatforms: ['OT-2', 'FLEX'],
  },

  'nest_1_reservoir_195ml': {
    labwareId: 'nest_1_reservoir_195ml',
    loadName: 'nest_1_reservoir_195ml',
    displayName: 'NEST 1 Well Reservoir 195 mL',
    category: 'reservoir',
    manufacturer: 'NEST',
    model: '1_channel_195ml',
    version: 1,
    gridFormat: '1_channel_res',
    wellCount: 1,
    totalWellVolumeUl: 195000,
    maxWorkingVolumeUl: 180000,
    minWorkingVolumeUl: 10000,
    dimensionsMm: { xDimension: 127.76, yDimension: 85.48, zDimension: 44.0 },
    wells: {
      'A1': {
        name: 'A1',
        x: 63.88,
        y: 42.74,
        z: 5.0,
        depth: 38.0,
        totalVolumeUl: 195000,
        workingVolumeUl: 180000,
        shape: 'rectangular',
        lengthMm: 108.0,
        widthMm: 71.0,
      }
    },
    isTipRack: false,
    supportedPlatforms: ['OT-2', 'FLEX'],
  },

  'opentrons_96_tiprack_20ul': {
    labwareId: 'opentrons_96_tiprack_20ul',
    loadName: 'opentrons_96_tiprack_20ul',
    displayName: 'Opentrons 96 Tip Rack 20 µL',
    category: 'tipRack',
    manufacturer: 'Opentrons',
    model: 'tiprack_20ul',
    version: 2,
    gridFormat: '96_standard',
    wellCount: 96,
    totalWellVolumeUl: 20,
    maxWorkingVolumeUl: 20,
    minWorkingVolumeUl: 1,
    dimensionsMm: { xDimension: 127.76, yDimension: 85.48, zDimension: 54.0 },
    wells: generateStandard96Wells(20, 20),
    isTipRack: true,
    tipLengthMm: 51.5,
    supportedPlatforms: ['OT-2', 'FLEX'],
  },

  'opentrons_96_tiprack_300ul': {
    labwareId: 'opentrons_96_tiprack_300ul',
    loadName: 'opentrons_96_tiprack_300ul',
    displayName: 'Opentrons 96 Tip Rack 300 µL',
    category: 'tipRack',
    manufacturer: 'Opentrons',
    model: 'tiprack_300ul',
    version: 2,
    gridFormat: '96_standard',
    wellCount: 96,
    totalWellVolumeUl: 300,
    maxWorkingVolumeUl: 300,
    minWorkingVolumeUl: 10,
    dimensionsMm: { xDimension: 127.76, yDimension: 85.48, zDimension: 66.0 },
    wells: generateStandard96Wells(300, 300),
    isTipRack: true,
    tipLengthMm: 60.0,
    supportedPlatforms: ['OT-2', 'FLEX'],
  },

  'opentrons_96_tiprack_1000ul': {
    labwareId: 'opentrons_96_tiprack_1000ul',
    loadName: 'opentrons_96_tiprack_1000ul',
    displayName: 'Opentrons 96 Tip Rack 1000 µL',
    category: 'tipRack',
    manufacturer: 'Opentrons',
    model: 'tiprack_1000ul',
    version: 2,
    gridFormat: '96_standard',
    wellCount: 96,
    totalWellVolumeUl: 1000,
    maxWorkingVolumeUl: 1000,
    minWorkingVolumeUl: 100,
    dimensionsMm: { xDimension: 127.76, yDimension: 85.48, zDimension: 92.0 },
    wells: generateStandard96Wells(1000, 1000),
    isTipRack: true,
    tipLengthMm: 90.0,
    supportedPlatforms: ['OT-2', 'FLEX'],
  },

  'opentrons_1_trash_1100ml_fixed': {
    labwareId: 'opentrons_1_trash_1100ml_fixed',
    loadName: 'opentrons_1_trash_1100ml_fixed',
    displayName: 'Opentrons Fixed Trash 1.1 L',
    category: 'trash',
    manufacturer: 'Opentrons',
    model: 'trash_fixed',
    version: 1,
    gridFormat: 'custom',
    wellCount: 1,
    totalWellVolumeUl: 1100000,
    maxWorkingVolumeUl: 1000000,
    minWorkingVolumeUl: 0,
    dimensionsMm: { xDimension: 127.76, yDimension: 85.48, zDimension: 140.0 },
    wells: {
      'A1': {
        name: 'A1',
        x: 63.88,
        y: 42.74,
        z: 0.0,
        depth: 140.0,
        totalVolumeUl: 1100000,
        workingVolumeUl: 1000000,
        shape: 'rectangular',
        lengthMm: 120.0,
        widthMm: 80.0,
      }
    },
    isTipRack: false,
    supportedPlatforms: ['OT-2', 'FLEX'],
  },
};

/**
 * Get Labware Definition by load name or ID
 */
export function getLabwareDefinition(labwareIdOrLoadName: string): LabwareDefinition | null {
  if (!labwareIdOrLoadName) return null;
  const exact = CANONICAL_LABWARE[labwareIdOrLoadName];
  if (exact) return exact;

  for (const def of Object.values(CANONICAL_LABWARE)) {
    if (def.loadName === labwareIdOrLoadName || def.displayName.toLowerCase() === labwareIdOrLoadName.toLowerCase()) {
      return def;
    }
  }
  return null;
}

/**
 * List all available labware for a specific category
 */
export function getLabwareByCategory(category: string): LabwareDefinition[] {
  return Object.values(CANONICAL_LABWARE).filter(l => l.category === category);
}

/**
 * Validates if a well exists in a given labware definition
 */
export function isValidWellInLabware(labware: LabwareDefinition, wellName: string): boolean {
  if (!labware || !labware.wells) return false;
  return Boolean(labware.wells[wellName]);
}

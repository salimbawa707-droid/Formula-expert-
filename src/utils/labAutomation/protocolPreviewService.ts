/**
 * Protocol Preview Service
 * 
 * Generates visual timelines, well plate maps, reagent breakdown tables,
 * and tip usage stats for interactive UI inspection prior to approval.
 */

import { ProtocolDefinition } from './types';

export interface WellPreviewCell {
  wellName: string;
  row: string;
  col: number;
  totalVolumeUl: number;
  maxCapacityUl: number;
  fillPercentage: number;
  ingredients: { name: string; volumeUl: number; color?: string }[];
}

export interface PlatePreviewGrid {
  slot: string;
  labwareName: string;
  rows: string[];
  cols: number[];
  cells: Record<string, WellPreviewCell>;
}

export interface ReagentUsageSummary {
  ingredientId: string;
  ingredientName: string;
  totalVolumeDispensedUl: number;
  transferCount: number;
  sourceWell: string;
  sourceSlot: string;
}

export interface ProtocolPreviewData {
  protocolId: string;
  protocolName: string;
  version: string;
  hash: string;
  estimatedDurationMin: number;
  totalTipsUsed: number;
  stepCount: number;
  plates: Record<string, PlatePreviewGrid>;
  reagentUsage: ReagentUsageSummary[];
}

const INGREDIENT_PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
];

export function generateProtocolPreview(protocol: ProtocolDefinition): ProtocolPreviewData {
  const plates: Record<string, PlatePreviewGrid> = {};
  const reagentMap: Record<string, ReagentUsageSummary> = {};

  // Setup Plate Grids for well plates
  for (const [slot, item] of Object.entries(protocol.deckLayout)) {
    if (item.labwareDef.category === 'wellPlate') {
      const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const cells: Record<string, WellPreviewCell> = {};

      for (const r of rows) {
        for (const c of cols) {
          const wellName = `${r}${c}`;
          cells[wellName] = {
            wellName,
            row: r,
            col: c,
            totalVolumeUl: 0,
            maxCapacityUl: item.labwareDef.maxWorkingVolumeUl,
            fillPercentage: 0,
            ingredients: [],
          };
        }
      }

      plates[slot] = {
        slot,
        labwareName: item.labwareDef.displayName,
        rows,
        cols,
        cells,
      };
    }
  }

  // Populate Transfers into Well Grid & Reagent Summary
  let colorIdx = 0;
  const ingredientColorMap: Record<string, string> = {};

  for (const trf of protocol.liquidTransfers) {
    const ingId = trf.ingredientId || 'UNKNOWN';
    const ingName = trf.ingredientName || 'Unnamed Reagent';

    if (!ingredientColorMap[ingId]) {
      ingredientColorMap[ingId] = INGREDIENT_PALETTE[colorIdx % INGREDIENT_PALETTE.length];
      colorIdx++;
    }

    // Reagent summary
    if (!reagentMap[ingId]) {
      reagentMap[ingId] = {
        ingredientId: ingId,
        ingredientName: ingName,
        totalVolumeDispensedUl: 0,
        transferCount: 0,
        sourceWell: trf.sourceWell,
        sourceSlot: trf.sourceSlot,
      };
    }
    reagentMap[ingId].totalVolumeDispensedUl += trf.volumeUl;
    reagentMap[ingId].transferCount += 1;

    // Destination plate cell
    const plate = plates[trf.destSlot];
    if (plate && plate.cells[trf.destWell]) {
      const cell = plate.cells[trf.destWell];
      cell.totalVolumeUl += trf.volumeUl;
      cell.fillPercentage = Math.min(100, Math.round((cell.totalVolumeUl / cell.maxCapacityUl) * 100));
      cell.ingredients.push({
        name: ingName,
        volumeUl: trf.volumeUl,
        color: ingredientColorMap[ingId],
      });
    }
  }

  return {
    protocolId: protocol.protocolId,
    protocolName: protocol.protocolName,
    version: protocol.protocolVersion,
    hash: protocol.protocolHash,
    estimatedDurationMin: protocol.estimatedDurationMinutes,
    totalTipsUsed: protocol.totalTipsRequired,
    stepCount: protocol.commands.length,
    plates,
    reagentUsage: Object.values(reagentMap),
  };
}

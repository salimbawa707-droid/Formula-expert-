/**
 * Experiment Protocol Generator
 * 
 * Generates fully structured, declarative laboratory protocols from formulation
 * experiment designs. Sequences pipetting operations, tip pickups, aspirate,
 * dispense, mixing cycles, and pauses with complete ingredient traceability.
 * 
 * Complies with Prompt 07 clean-room TypeScript specifications.
 */

import {
  ExperimentDesign,
  ProtocolDefinition,
  ProtocolCommand,
  LiquidTransferSpec,
  MixOperationSpec,
  RobotPlatform,
  WellContentState,
} from './types';
import { generateStandardFormulationDeck } from './deckLayoutEngine';
import { CANONICAL_PIPETTES, selectBestPipetteForVolume } from './pipetteRegistry';
import { computeProtocolCanonicalHash } from './protocolHashService';
import { validateLiquidHandlingPlan } from './liquidHandlingConstraintEngine';
import {
  ConcentrationBasis,
  StockVolumeConversionEvidence,
  ExperimentIngredient
} from './types';

export function calculateRequiredStockVolumeUl(
  ingredient: ExperimentIngredient
): number | null {
  const evidence = ingredient.conversionEvidence;

  if (!evidence) return null;

  if (
    !Number.isFinite(ingredient.concentrationInStockPercent) ||
    ingredient.concentrationInStockPercent <= 0 ||
    ingredient.concentrationInStockPercent > 100 ||
    !Number.isFinite(ingredient.targetFormulaPercent) ||
    ingredient.targetFormulaPercent < 0 ||
    ingredient.targetFormulaPercent > 100
  ) {
    return null;
  }

  if (
    evidence.concentrationBasis !== 'W_W' ||
    !Number.isFinite(evidence.stockDensityGPerMl) ||
    !Number.isFinite(evidence.targetBatchMassG) ||
    !Number.isFinite(evidence.stockDensityEvidenceId ? 1 : NaN) ||
    evidence.stockDensityGPerMl! <= 0 ||
    evidence.targetBatchMassG! <= 0
  ) {
    return null;
  }

  const requiredStockMassG =
    evidence.targetBatchMassG! *
    (ingredient.targetFormulaPercent / 100) /
    (ingredient.concentrationInStockPercent / 100);

  const requiredVolumeUl =
    (requiredStockMassG / evidence.stockDensityGPerMl!) * 1000;

  if (
    !Number.isFinite(requiredVolumeUl) ||
    requiredVolumeUl < 0
  ) {
    return null;
  }

  return Number(requiredVolumeUl.toFixed(2));
}

export interface ProtocolGenerationOptions {
  protocolId?: string;
  createdAt?: string;
  platform?: RobotPlatform;
  pipetteLeft?: string;
  pipetteRight?: string;
  tipRackLoadName?: string;
  destPlateLoadName?: string;
  sourceRackLoadName?: string;
  changeTipPolicy?: 'ALWAYS' | 'ONCE_PER_SOURCE' | 'NEVER';
  touchTip?: boolean;
  blowOut?: boolean;
}

export function generateExperimentProtocol(
  experiment: ExperimentDesign,
  options: ProtocolGenerationOptions = {}
): ProtocolDefinition {
  const platform: RobotPlatform = options.platform || 'OT-2';
  const protocolId = options.protocolId || `PROTO-${experiment.id.replace(/[^A-Za-z0-9]/g, '').slice(-10).toUpperCase()}`;
  const protocolVersion = '1.0.0';
  const createdAt = options.createdAt || experiment.createdAt || '2026-10-02T00:00:00.000Z';

  // 0. Pre-validate Ingredient Volumes & Conversion Evidence
  const ingredientErrors: string[] = [];
  const validatedIngredients = experiment.ingredients.map(ing => {
    const vol = calculateRequiredStockVolumeUl(ing);
    if (vol === null) {
      ingredientErrors.push(`Ingredient '${ing.tradeName}' (${ing.canonicalIngredientId}) has missing or invalid scientific conversion evidence (Basis, Stock Density, Evidence ID).`);
    }
    return { ...ing, requiredVolumeUl: vol };
  });

  if (ingredientErrors.length > 0) {
    return {
      protocolId,
      protocolVersion,
      protocolName: `${experiment.name} [INCOMPLETE - INSUFFICIENT DATA]`,
      experimentId: experiment.id,
      formulaId: experiment.formulaId,
      formulaVersionId: experiment.formulaVersionId,
      robotPlatform: platform,
      apiLevel: '2.13',
      deckLayout: {},
      pipettes: {},
      commands: [],
      liquidTransfers: [],
      mixOperations: [],
      totalTipsRequired: 0,
      estimatedDurationMinutes: 0,
      validationResult: {
        status: 'INSUFFICIENT_DATA',
        isValid: false,
        canApproveForExport: false,
        issues: ingredientErrors.map(err => ({
          severity: 'ERROR',
          code: 'MISSING_CONVERSION_EVIDENCE',
          message: err,
          scientificGuidance: 'Provide W_W concentration basis, stock density (g/mL), and traceable evidence ID for all ingredients to enable mass-to-volume conversion.'
        })),
        validatedAt: new Date().toISOString(),
        validatorVersion: '1.0.0',
        summary: `Protocol generation blocked: ${ingredientErrors.length} ingredients lack validated mass-to-volume conversion evidence.`
      },
      protocolHash: 'incomplete',
      createdAt,
      createdBy: experiment.createdBy || 'Automated Formulator Protocol Engine',
      approvedForExport: false,
    };
  }

  // 1. Initialize Standard Deck
  const deckLayout = generateStandardFormulationDeck(
    platform,
    options.tipRackLoadName || (platform === 'OT-2' ? 'opentrons_96_tiprack_300ul' : 'opentrons_96_tiprack_300ul'),
    options.destPlateLoadName || 'corning_96_wellplate_360ul_flat',
    options.sourceRackLoadName || 'opentrons_24_tuberack_generic_2ml_screwcap'
  );

  // 2. Select Pipettes
  const leftPipDef = options.pipetteLeft
    ? CANONICAL_PIPETTES[options.pipetteLeft as keyof typeof CANONICAL_PIPETTES]
    : platform === 'OT-2'
    ? CANONICAL_PIPETTES['p300_single_gen2']
    : CANONICAL_PIPETTES['flex_1channel_1000'];

  const rightPipDef = options.pipetteRight
    ? CANONICAL_PIPETTES[options.pipetteRight as keyof typeof CANONICAL_PIPETTES]
    : platform === 'OT-2'
    ? CANONICAL_PIPETTES['p20_single_gen2']
    : CANONICAL_PIPETTES['flex_1channel_50'];

  const pipettes = {
    left: leftPipDef ? { pipetteDef: leftPipDef, mount: 'left' as const } : undefined,
    right: rightPipDef ? { pipetteDef: rightPipDef, mount: 'right' as const } : undefined,
  };

  const availablePipettesList = [leftPipDef, rightPipDef].filter(Boolean);

  // 3. Assign Source Wells for Ingredients
  const sourceSlot = platform === 'OT-2' ? '2' : 'A2';
  const reservoirSlot = platform === 'OT-2' ? '5' : 'C2';
  const destSlot = platform === 'OT-2' ? '3' : 'B2';
  const tipSlot = platform === 'OT-2' ? '1' : 'A1';

  const stockRackItem = deckLayout[sourceSlot];
  const reservoirItem = deckLayout[reservoirSlot];
  const destPlateItem = deckLayout[destSlot];

  const sourceWellMap: Record<string, { slot: string; well: string; labwareId: string }> = {};
  const rackWells = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'D1', 'D2', 'D3', 'D4'];

  const initialContents: Record<string, WellContentState> = {};

  // Setup stock ingredients in source rack
  let wellIdx = 0;
  for (const ing of validatedIngredients) {
    // Water/solvent handled via reservoir
    const isWater = ing.inciName?.toLowerCase().includes('water') || ing.tradeName?.toLowerCase().includes('water');
    if (isWater && reservoirItem) {
      sourceWellMap[ing.canonicalIngredientId] = { slot: reservoirSlot, well: 'A1', labwareId: reservoirItem.labwareId };
    } else {
      const wellName = rackWells[wellIdx % rackWells.length];
      wellIdx++;
      sourceWellMap[ing.canonicalIngredientId] = { slot: sourceSlot, well: wellName, labwareId: stockRackItem.labwareId };
      initialContents[wellName] = {
        ingredientId: ing.canonicalIngredientId,
        ingredientName: ing.tradeName,
        canonicalId: ing.canonicalIngredientId,
        concentrationPercent: ing.concentrationInStockPercent,
        initialVolumeUl: 1800,
        currentVolumeUl: 1800,
        maxCapacityUl: 2000,
      };
    }
  }

  if (stockRackItem) {
    stockRackItem.initialContents = initialContents;
  }
  if (reservoirItem) {
    reservoirItem.initialContents = {
      'A1': {
        ingredientId: 'WATER_SOLVENT',
        ingredientName: 'Deionized Water / Bulk Solvent',
        initialVolumeUl: 14000,
        currentVolumeUl: 14000,
        maxCapacityUl: 15000,
      }
    };
  }

  // 4. Generate Liquid Transfers
  const liquidTransfers: LiquidTransferSpec[] = [];
  const mixOperations: MixOperationSpec[] = [];
  const commands: ProtocolCommand[] = [];

  let stepNumber = 1;

  // Command: Load Labware
  for (const [slot, item] of Object.entries(deckLayout)) {
    commands.push({
      stepNumber: stepNumber++,
      type: 'LOAD_LABWARE',
      description: `Load labware '${item.labwareDef.displayName}' into Slot ${slot} (${item.nickname})`,
      labwareSlot: slot as any,
      labwareId: item.labwareId,
    });
  }

  // Command: Load Pipettes
  if (pipettes.left) {
    commands.push({
      stepNumber: stepNumber++,
      type: 'LOAD_PIPETTE',
      description: `Load ${pipettes.left.pipetteDef.displayName} on LEFT mount with tip rack at Slot ${tipSlot}`,
      pipetteMount: 'left',
    });
  }
  if (pipettes.right) {
    commands.push({
      stepNumber: stepNumber++,
      type: 'LOAD_PIPETTE',
      description: `Load ${pipettes.right.pipetteDef.displayName} on RIGHT mount with tip rack at Slot ${tipSlot}`,
      pipetteMount: 'right',
    });
  }

  // Calculate destination wells for replicates
  const destWells = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'].slice(0, Math.max(1, experiment.replicates));

  // Determine ingredient addition order:
  // Water first, then builders/chelators, surfactants, specialty additives, then preservative/fragrance
  const sortedIngredients = [...validatedIngredients].sort((a, b) => {
    const isWaterA = a.inciName?.toLowerCase().includes('water') || a.tradeName?.toLowerCase().includes('water');
    const isWaterB = b.inciName?.toLowerCase().includes('water') || b.tradeName?.toLowerCase().includes('water');
    if (isWaterA) return -1;
    if (isWaterB) return 1;
    return 0;
  });

  let totalTipsUsed = 0;

  for (const ing of sortedIngredients) {
    const src = sourceWellMap[ing.canonicalIngredientId];
    if (!src) continue;

    const volPerWell = ing.requiredVolumeUl!;

    // Pick best pipette
    const chosenPip = selectBestPipetteForVolume(volPerWell, availablePipettesList as any);
    const mount: 'left' | 'right' = (chosenPip?.model === leftPipDef?.model) ? 'left' : 'right';

    // Tip Pickup for this ingredient batch
    commands.push({
      stepNumber: stepNumber++,
      type: 'PICK_UP_TIP',
      description: `Pick up tip for dispensing '${ing.tradeName}'`,
      pipetteMount: mount,
    });
    totalTipsUsed++;

    for (let r = 0; r < destWells.length; r++) {
      const destWell = destWells[r];
      const transferId = `TRF-${ing.canonicalIngredientId.slice(0, 6)}-R${r + 1}`;

      liquidTransfers.push({
        transferId,
        sourceSlot: src.slot as any,
        sourceLabware: src.labwareId,
        sourceWell: src.well,
        destSlot: destSlot as any,
        destLabware: destPlateItem?.labwareId || 'dest_plate',
        destWell,
        volumeUl: volPerWell,
        pipetteMount: mount,
        pipetteModel: chosenPip?.model || 'p300_single_gen2',
        ingredientId: ing.canonicalIngredientId,
        ingredientName: ing.tradeName,
        changeTipPolicy: options.changeTipPolicy || 'ONCE_PER_SOURCE',
        touchTipAfterDispense: options.touchTip ?? true,
        blowOutAfterDispense: options.blowOut ?? true,
      });

      commands.push({
        stepNumber: stepNumber++,
        type: 'ASPIRATE',
        description: `Aspirate ${volPerWell} µL of '${ing.tradeName}' from Slot ${src.slot} Well ${src.well}`,
        pipetteMount: mount,
        labwareSlot: src.slot as any,
        well: src.well,
        volumeUl: volPerWell,
      });

      commands.push({
        stepNumber: stepNumber++,
        type: 'DISPENSE',
        description: `Dispense ${volPerWell} µL of '${ing.tradeName}' into Slot ${destSlot} Well ${destWell}`,
        pipetteMount: mount,
        labwareSlot: destSlot as any,
        well: destWell,
        volumeUl: volPerWell,
      });

      if (options.touchTip ?? true) {
        commands.push({
          stepNumber: stepNumber++,
          type: 'TOUCH_TIP',
          description: `Touch tip to wall of well ${destWell}`,
          pipetteMount: mount,
          labwareSlot: destSlot as any,
          well: destWell,
        });
      }
    }

    // Drop tip after completing transfers for this ingredient
    commands.push({
      stepNumber: stepNumber++,
      type: 'DROP_TIP',
      description: `Drop tip into fixed trash`,
      pipetteMount: mount,
    });
  }

  // Mixing Step if required
  if (experiment.processParameters.mixingRequired) {
    const mixVol = experiment.processParameters.mixVolumeUl || Math.round(experiment.targetScaleUl * 0.5);
    const mixCycles = experiment.processParameters.mixCycles || 5;

    for (const destWell of destWells) {
      const chosenMixPip = selectBestPipetteForVolume(mixVol, availablePipettesList as any);
      const mixMount = (chosenMixPip?.model === leftPipDef?.model) ? 'left' : 'right';

      commands.push({
        stepNumber: stepNumber++,
        type: 'PICK_UP_TIP',
        description: `Pick up fresh tip for final mixing of Well ${destWell}`,
        pipetteMount: mixMount,
      });
      totalTipsUsed++;

      mixOperations.push({
        slot: destSlot as any,
        labware: destPlateItem?.labwareId || 'dest_plate',
        well: destWell,
        pipetteMount: mixMount,
        volumeUl: mixVol,
        cycles: mixCycles,
      });

      commands.push({
        stepNumber: stepNumber++,
        type: 'MIX',
        description: `Mix well ${destWell} (${mixCycles} cycles of ${mixVol} µL)`,
        pipetteMount: mixMount,
        labwareSlot: destSlot as any,
        well: destWell,
        volumeUl: mixVol,
        cycles: mixCycles,
      });

      commands.push({
        stepNumber: stepNumber++,
        type: 'DROP_TIP',
        description: `Drop tip into fixed trash`,
        pipetteMount: mixMount,
      });
    }
  }

  // 5. Initial constraint validation check
  const handlingResult = validateLiquidHandlingPlan(liquidTransfers, mixOperations, deckLayout, pipettes as any);

  const initialValidation = {
    status: handlingResult.isValid ? ('VALID' as const) : ('INVALID' as const),
    isValid: handlingResult.isValid,
    canApproveForExport: handlingResult.isValid,
    issues: handlingResult.issues.map(i => ({
      severity: i.severity,
      code: i.code,
      message: i.message,
    })),
    validatedAt: new Date().toISOString(),
    validatorVersion: '1.0.0',
    summary: handlingResult.isValid
      ? `Protocol generated with ${commands.length} commands, ${liquidTransfers.length} liquid transfers.`
      : `Protocol generated with ${handlingResult.issues.length} validation issues.`,
  };

  // 6. Compute Canonical SHA-256 Hash
  const protocolHash = computeProtocolCanonicalHash({
    protocolId,
    protocolVersion,
    experimentId: experiment.id,
    formulaId: experiment.formulaId,
    robotPlatform: platform,
    commands,
    liquidTransfers,
  });

  return {
    protocolId,
    protocolVersion,
    protocolName: `${experiment.name} [Opentrons ${platform}]`,
    experimentId: experiment.id,
    formulaId: experiment.formulaId,
    formulaVersionId: experiment.formulaVersionId,
    optimizationCandidateId: experiment.optimizationCandidateId,
    robotPlatform: platform,
    apiLevel: '2.13',
    deckLayout,
    pipettes: pipettes as any,
    commands,
    liquidTransfers,
    mixOperations,
    totalTipsRequired: totalTipsUsed,
    estimatedDurationMinutes: Math.ceil(commands.length * 0.15),
    validationResult: initialValidation,
    protocolHash,
    createdAt,
    createdBy: experiment.createdBy || 'Automated Formulator Protocol Engine',
    approvedForExport: false,
  };
}

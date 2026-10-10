/**
 * Laboratory Automation & Experiment Protocol Layer — Types
 * 
 * Clean-Room TypeScript Data Models for Opentrons Protocol Generation,
 * Experiment Design, Labware/Pipette Registry, Liquid Handling Constraints,
 * Human Review Gates, and LIMS Integration.
 * 
 * Complies with Prompt 07 Safety & Scientific Architecture.
 * No direct robot hardware execution is performed in this application.
 */

import { ProductCategoryId, PhysicalForm } from '../../domain/productTaxonomy';

// ============================================================================
// 1. HARDWARE & PLATFORM ENUMS
// ============================================================================

export type RobotPlatform = 'OT-2' | 'FLEX';

export type DeckSlotOT2 = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';
export type DeckSlotFlex = 
  | 'A1' | 'A2' | 'A3' | 'A4'
  | 'B1' | 'B2' | 'B3' | 'B4'
  | 'C1' | 'C2' | 'C3' | 'C4'
  | 'D1' | 'D2' | 'D3' | 'D4';

export type DeckPosition = DeckSlotOT2 | DeckSlotFlex;

export type PipetteMount = 'left' | 'right';

export type PipetteModel =
  | 'p20_single_gen2'
  | 'p20_multi_gen2'
  | 'p300_single_gen2'
  | 'p300_multi_gen2'
  | 'p1000_single_gen2'
  | 'flex_1channel_50'
  | 'flex_8channel_50'
  | 'flex_1channel_1000'
  | 'flex_8channel_1000';

export type LabwareCategory =
  | 'wellPlate'
  | 'reservoir'
  | 'tubeRack'
  | 'tipRack'
  | 'trash'
  | 'aluminumBlock'
  | 'custom';

export type WellGridFormat = '96_standard' | '384_standard' | '24_rack' | '15_50_falcon' | '6_rack' | '12_channel_res' | '1_channel_res' | 'custom';

// ============================================================================
// 2. LABWARE & PIPETTE DEFINITIONS
// ============================================================================

export interface WellDefinition {
  name: string; // e.g., "A1", "H12"
  x: number; // mm from labware origin
  y: number; // mm from labware origin
  z: number; // mm from labware origin
  depth: number; // mm
  totalVolumeUl: number;
  workingVolumeUl: number;
  shape: 'circular' | 'rectangular';
  diameterMm?: number;
  lengthMm?: number;
  widthMm?: number;
}

export interface LabwareDefinition {
  labwareId: string;
  loadName: string; // Opentrons API v2 load_name
  displayName: string;
  category: LabwareCategory;
  manufacturer: string;
  model: string;
  version: number;
  gridFormat: WellGridFormat;
  wellCount: number;
  totalWellVolumeUl: number;
  maxWorkingVolumeUl: number;
  minWorkingVolumeUl: number;
  dimensionsMm: {
    xDimension: number;
    yDimension: number;
    zDimension: number;
  };
  wells: Record<string, WellDefinition>;
  isTipRack: boolean;
  tipLengthMm?: number;
  supportedPlatforms: RobotPlatform[];
}

export interface PipetteDefinition {
  pipetteId: string;
  model: PipetteModel;
  displayName: string;
  channels: 1 | 8 | 96;
  minVolumeUl: number;
  maxVolumeUl: number;
  defaultAspirateRateUlSec: number;
  defaultDispenseRateUlSec: number;
  compatibleTipRacks: string[]; // loadName list
  supportedPlatforms: RobotPlatform[];
}

export interface DeckItemAssignment {
  slot: DeckPosition;
  labwareId: string;
  labwareDef: LabwareDefinition;
  nickname: string;
  purpose: 'source_reagents' | 'destination_plate' | 'sample_racks' | 'tiprack' | 'trash' | 'waste';
  initialContents?: Record<string, WellContentState>;
}

export interface WellContentState {
  ingredientId?: string;
  ingredientName?: string;
  canonicalId?: string;
  concentrationPercent?: number;
  initialVolumeUl: number;
  currentVolumeUl: number;
  maxCapacityUl: number;
  liquidColor?: string;
}

// ============================================================================
// 3. EXPERIMENT DESIGN MODELS
// ============================================================================

export type ExperimentType =
  | 'FORMULATION_DISPENSE'
  | 'SURFACTANT_SCREENING'
  | 'DILUTION_SERIES'
  | 'STABILITY_ARRAY'
  | 'CLEANING_COATING_ASSAY'
  | 'SPECTRAL_SAMPLING_PREP'
  | 'OPTIMIZATION_VALIDATION';

export interface ExperimentDesign {
  id: string;
  name: string;
  objective: string;
  experimentType: ExperimentType;
  formulaId?: string;
  formulaVersionId?: string;
  formulaName?: string;
  optimizationCandidateId?: string;
  productCategory: ProductCategoryId;
  physicalForm: PhysicalForm;
  targetScaleUl: number; // Target volume per formulation well/vial
  replicates: number;
  ingredients: ExperimentIngredient[];
  constraints: string[];
  processParameters: ExperimentProcessParameters;
  status: 'DRAFT' | 'DESIGNED' | 'PROTOCOL_GENERATED' | 'COMPLETED' | 'ARCHIVED';
  createdAt: string;
  createdBy: string;
}

export interface ExperimentIngredient {
  canonicalIngredientId: string;
  tradeName: string;
  inciName: string;
  concentrationInStockPercent: number; // Stock solution concentration
  targetFormulaPercent: number; // Target active % in final formulation
  requiredVolumeUl: number;
  assignedWell?: string; // Slot + well coordinate
  assignedSlot?: DeckPosition;
  viscosityClass: 'LOW_AQUEOUS' | 'MEDIUM_SURFACTANT' | 'HIGH_VISCOUS' | 'VOLATILE_SOLVENT';
}

export interface ExperimentProcessParameters {
  mixingRequired: boolean;
  mixCycles?: number;
  mixVolumeUl?: number;
  temperatureCelsius?: number; // External condition note
  mixingDurationSec?: number;
  orderOfAddition?: string[]; // Array of canonicalIngredientIds
  humanInputRequiredWarnings: string[];
}

// ============================================================================
// 4. PROTOCOL COMMAND & STEP DEFINITIONS
// ============================================================================

export type ProtocolCommandType =
  | 'LOAD_LABWARE'
  | 'LOAD_PIPETTE'
  | 'PICK_UP_TIP'
  | 'ASPIRATE'
  | 'DISPENSE'
  | 'MIX'
  | 'TOUCH_TIP'
  | 'BLOW_OUT'
  | 'DROP_TIP'
  | 'PAUSE'
  | 'COMMENT';

export interface LiquidTransferSpec {
  transferId: string;
  sourceSlot: DeckPosition;
  sourceLabware: string;
  sourceWell: string;
  destSlot: DeckPosition;
  destLabware: string;
  destWell: string;
  volumeUl: number;
  pipetteMount: PipetteMount;
  pipetteModel: PipetteModel;
  ingredientId?: string;
  ingredientName?: string;
  liquidClass?: string;
  changeTipPolicy: 'ALWAYS' | 'ONCE_PER_SOURCE' | 'NEVER';
  touchTipAfterDispense?: boolean;
  blowOutAfterDispense?: boolean;
}

export interface MixOperationSpec {
  slot: DeckPosition;
  labware: string;
  well: string;
  pipetteMount: PipetteMount;
  volumeUl: number;
  cycles: number;
  rateUlSec?: number;
}

export interface ProtocolCommand {
  stepNumber: number;
  type: ProtocolCommandType;
  description: string;
  pipetteMount?: PipetteMount;
  labwareSlot?: DeckPosition;
  labwareId?: string;
  well?: string;
  sourceWell?: string;
  destWell?: string;
  volumeUl?: number;
  cycles?: number;
  pauseMessage?: string;
  scientificContext?: string;
}

// ============================================================================
// 5. PROTOCOL DEFINITION & VERSIONING
// ============================================================================

export type ProtocolValidationStatus = 'VALID' | 'INVALID' | 'REQUIRES_HUMAN_INPUT' | 'INSUFFICIENT_DATA';

export interface ProtocolValidationIssue {
  severity: 'ERROR' | 'WARNING' | 'INFO';
  code: string;
  message: string;
  stepNumber?: number;
  relatedEntityId?: string;
  scientificGuidance?: string;
}

export interface ProtocolValidationResult {
  status: ProtocolValidationStatus;
  isValid: boolean;
  canApproveForExport: boolean;
  issues: ProtocolValidationIssue[];
  validatedAt: string;
  validatorVersion: string;
  summary: string;
}

export interface HumanReviewRecord {
  reviewedBy: string;
  reviewedAt: string;
  decision: 'APPROVED_FOR_EXPORT' | 'REJECTED' | 'REQUEST_CHANGES';
  reviewNotes: string;
  checklistConfirmed: {
    deckLayoutVerified: boolean;
    volumesWithinTolerance: boolean;
    noHazardousMixingConflicts: boolean;
    physicalFormCompatible: boolean;
    externalSafetyMeasuresInPlace: boolean;
  };
}

export interface ProtocolDefinition {
  protocolId: string;
  protocolVersion: string; // Semantic version e.g. "1.0.0"
  protocolName: string;
  experimentId: string;
  formulaId?: string;
  formulaVersionId?: string;
  optimizationCandidateId?: string;
  robotPlatform: RobotPlatform;
  apiLevel: string; // e.g. "2.13"
  deckLayout: Record<string, DeckItemAssignment>;
  pipettes: {
    left?: { pipetteDef: PipetteDefinition; mount: 'left' };
    right?: { pipetteDef: PipetteDefinition; mount: 'right' };
  };
  commands: ProtocolCommand[];
  liquidTransfers: LiquidTransferSpec[];
  mixOperations: MixOperationSpec[];
  totalTipsRequired: number;
  estimatedDurationMinutes: number;
  validationResult: ProtocolValidationResult;
  humanReview?: HumanReviewRecord;
  protocolHash: string; // SHA-256
  createdAt: string;
  createdBy: string;
  approvedForExport: boolean;
}

// ============================================================================
// 6. PROTOCOL EXPORT & EXECUTION RECORD (LIMS BRIDGE)
// ============================================================================

export interface ProtocolExportBundle {
  protocolId: string;
  protocolVersion: string;
  protocolHash: string;
  robotPlatform: RobotPlatform;
  apiLevel: string;
  pythonProtocolScript: string;
  jsonProtocolSpec: string;
  sopMarkdown: string;
  manifestJson: string;
  exportedAt: string;
  exportedBy: string;
}

export type ExternalExecutionStatus =
  | 'EXPORTED_NOT_RUN'
  | 'QUEUED_IN_EXTERNAL_LAB'
  | 'EXECUTING'
  | 'COMPLETED_SUCCESS'
  | 'ABORTED_OR_FAILED'
  | 'RESULTS_IMPORTED_TO_LIMS';

export interface ProtocolExecutionRecord {
  executionRecordId: string;
  protocolId: string;
  protocolVersion: string;
  protocolHash: string;
  formulaId?: string;
  formulaVersionId?: string;
  experimentId: string;
  externalPlatform: RobotPlatform;
  externalRobotName?: string;
  externalRunId?: string;
  operator: string;
  executionStatus: ExternalExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  producedSampleIds: string[]; // Linked LIMS sample IDs
  evidenceRecordsGenerated: string[]; // Linked LIMS evidence IDs
  rawLogHash?: string;
  createdAt: string;
  updatedAt: string;
}

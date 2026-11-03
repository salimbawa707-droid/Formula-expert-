/**
 * ============================================================================
 * LIMS INSTRUMENT REGISTRY & CALIBRATION ENGINE
 * ============================================================================
 * 
 * Manages analytical laboratory instruments, calibration validation windows,
 * and calibration state enforcement.
 * 
 * SCIENTIFIC CRITERIA:
 * 1. An instrument with EXPIRED or UNKNOWN calibration status CANNOT produce
 *    'LAB_VALIDATED' or 'CERTIFIED' evidence records.
 * 2. REFERENCE, DEMO, and SIMULATED instruments are strictly blocked from producing
 *    authoritative laboratory evidence. Only genuine USER_REGISTERED instruments
 *    with valid calibration evidence are authorized.
 * ============================================================================
 */

import { InstrumentRecord, InstrumentCalibrationStatus, InstrumentClassification } from './types';

export type { InstrumentRecord, InstrumentCalibrationStatus, InstrumentClassification };

export interface UserInstrumentRegistration {
  instrumentId: string;
  name: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  instrumentType: string;
  calibrationCertificateReference: string;
  lastCalibrationDate: string;
  nextCalibrationDate: string;
  location: string;
  custodian: string;
  registeredBy: string;
}

const USER_INSTRUMENTS_STORAGE_KEY = 'rnd_user_registered_instruments';
let memoryUserInstruments: InstrumentRecord[] = [];

/**
 * Standard Canonical Laboratory Instrument Registry (Reference & Demo Fixtures Only)
 */
export const CANONICAL_LAB_INSTRUMENTS: InstrumentRecord[] = [
  {
    instrumentId: 'INST-PH-001',
    name: 'Precision Benchtop pH Meter (Mettler Toledo SevenDirect)',
    manufacturer: 'Mettler Toledo',
    model: 'SevenDirect SD20',
    serialNumber: 'MT-PH-2024-8841',
    instrumentType: 'pH_METER',
    classification: 'REFERENCE',
    calibrationStatus: 'VALID',
    lastCalibrationDate: '2026-09-15',
    nextCalibrationDate: '2026-12-15',
    calibrationCertificateReference: 'CAL-CERT-2026-PH-0915',
    calibrationTolerance: '±0.02 pH units',
    location: 'Analytical Chemistry Lab - Bench 2',
    custodian: 'Lead Formulation Chemist',
    isActive: true,
  },
  {
    instrumentId: 'INST-VISC-001',
    name: 'Rotational Digital Viscometer (Brookfield DV2T)',
    manufacturer: 'AMETEK Brookfield',
    model: 'DV2T RV Spindle Set',
    serialNumber: 'BK-DV2T-99214',
    instrumentType: 'VISCOMETER',
    classification: 'REFERENCE',
    calibrationStatus: 'VALID',
    lastCalibrationDate: '2026-08-01',
    nextCalibrationDate: '2027-02-01',
    calibrationCertificateReference: 'CAL-CERT-2026-VISC-0801',
    calibrationTolerance: '±1.0% of full scale range',
    location: 'Rheology Lab - Room 104',
    custodian: 'Rheology Specialist',
    isActive: true,
  },
  {
    instrumentId: 'INST-DENS-001',
    name: 'Oscillating U-Tube Density Meter (Anton Paar DMA 35)',
    manufacturer: 'Anton Paar',
    model: 'DMA 35 Ex Petrol',
    serialNumber: 'AP-DMA35-55102',
    instrumentType: 'DENSITOMETER',
    classification: 'REFERENCE',
    calibrationStatus: 'VALID',
    lastCalibrationDate: '2026-07-10',
    nextCalibrationDate: '2027-01-10',
    calibrationCertificateReference: 'CAL-CERT-2026-DENS-0710',
    calibrationTolerance: '±0.001 g/cm³',
    location: 'Physical Testing Lab - Bench 1',
    custodian: 'QC Supervisor',
    isActive: true,
  },
  {
    instrumentId: 'INST-TITR-001',
    name: 'Automated Potentiometric Titrator (Metrohm 905 Titrando)',
    manufacturer: 'Metrohm',
    model: '905 Titrando / Dosino',
    serialNumber: 'MH-TITR-77312',
    instrumentType: 'AUTOMATED_TITRATOR',
    classification: 'REFERENCE',
    calibrationStatus: 'VALID',
    lastCalibrationDate: '2026-09-01',
    nextCalibrationDate: '2026-12-01',
    calibrationCertificateReference: 'CAL-CERT-2026-TITR-0901',
    calibrationTolerance: '±0.1% burette volume accuracy',
    location: 'Surfactant & Chelation Lab',
    custodian: 'Analytical Specialist',
    isActive: true,
  },
  {
    instrumentId: 'INST-FTIR-001',
    name: 'FTIR Spectrometer with Diamond ATR (Thermo Nicolet iS20)',
    manufacturer: 'Thermo Fisher Scientific',
    model: 'Nicolet iS20 ATR',
    serialNumber: 'TF-FTIR-41098',
    instrumentType: 'SPECTROMETER_FTIR',
    classification: 'REFERENCE',
    calibrationStatus: 'VALID',
    lastCalibrationDate: '2026-06-01',
    nextCalibrationDate: '2027-06-01',
    calibrationCertificateReference: 'CAL-CERT-2026-FTIR-0601',
    calibrationTolerance: 'Wavenumber accuracy 0.01 cm⁻¹',
    location: 'Spectroscopy Suite - Room 202',
    custodian: 'Senior Spectroscopist',
    isActive: true,
  },
  {
    instrumentId: 'INST-MOIST-001',
    name: 'Halogen Moisture Analyzer (Mettler Toledo HE53)',
    manufacturer: 'Mettler Toledo',
    model: 'HE53 Moisture Analyzer',
    serialNumber: 'MT-HE53-33910',
    instrumentType: 'MOISTURE_ANALYZER',
    classification: 'REFERENCE',
    calibrationStatus: 'VALID',
    lastCalibrationDate: '2026-08-15',
    nextCalibrationDate: '2027-02-15',
    calibrationCertificateReference: 'CAL-CERT-2026-MOIST-0815',
    calibrationTolerance: '±0.01% moisture readability',
    location: 'Powder Testing Lab',
    custodian: 'Powder Formulator',
    isActive: true,
  },
  {
    instrumentId: 'INST-BULK-001',
    name: 'Apparent Powder Bulk Density Apparatus (Scott Volumeter / ISO 697)',
    manufacturer: 'Electrolab / Copley',
    model: 'SBD-100 Scott Volumeter',
    serialNumber: 'EL-SBD-12004',
    instrumentType: 'BULK_DENSITY_TESTER',
    classification: 'REFERENCE',
    calibrationStatus: 'VALID',
    lastCalibrationDate: '2026-05-10',
    nextCalibrationDate: '2027-05-10',
    calibrationCertificateReference: 'CAL-CERT-2026-VOL-0510',
    calibrationTolerance: '±0.2 mL cylinder volume',
    location: 'Powder Testing Lab - Bench 3',
    custodian: 'Powder Formulator',
    isActive: true,
  },
  {
    instrumentId: 'INST-TERG-001',
    name: 'Multi-Vessel Terg-O-Tometer Wash Simulator (ASTM D4265)',
    manufacturer: 'Instrument Marketing Services',
    model: 'TOM-8 Multi-Spindle 1000mL',
    serialNumber: 'IMS-TOM-6612',
    instrumentType: 'TERGOTOMETER',
    classification: 'REFERENCE',
    calibrationStatus: 'VALID',
    lastCalibrationDate: '2026-07-20',
    nextCalibrationDate: '2027-01-20',
    calibrationCertificateReference: 'CAL-CERT-2026-TERG-0720',
    calibrationTolerance: 'Speed ±2 RPM, Temperature ±0.5°C',
    location: 'Application & Performance Testing Lab',
    custodian: 'Application Scientist',
    isActive: true,
  },
  {
    instrumentId: 'ROBOT-OT2-RND-UNIT-01',
    name: 'OT2-RND-UNIT-01',
    manufacturer: 'Opentrons',
    model: 'OT-2 Standard',
    serialNumber: 'OT2-SN-9942',
    instrumentType: 'LIQUID_HANDLER',
    classification: 'REFERENCE',
    calibrationStatus: 'VALID',
    lastCalibrationDate: '2026-09-01',
    nextCalibrationDate: '2027-03-01',
    calibrationCertificateReference: 'CAL-CERT-2026-OT2-01',
    calibrationTolerance: '±1.0 µL',
    location: 'Automation Lab - Slot 1',
    custodian: 'Lead Automation Chemist',
    isActive: true,
  },
  {
    instrumentId: 'ROBOT-OT2-DEV-RND-01',
    name: 'OT2-DEV-RND-01',
    manufacturer: 'Opentrons',
    model: 'OT-2 Standard',
    serialNumber: 'OT2-SN-DEV-8812',
    instrumentType: 'LIQUID_HANDLER',
    classification: 'DEMO',
    calibrationStatus: 'VALID',
    lastCalibrationDate: '2026-09-01',
    nextCalibrationDate: '2027-03-01',
    calibrationCertificateReference: 'CAL-CERT-2026-OT2-DEV',
    calibrationTolerance: '±1.0 µL',
    location: 'Automation Lab - Slot 2',
    custodian: 'Lead Automation Chemist',
    isActive: true,
  },
];

/**
 * Returns all registered instruments (canonical reference/demo fixtures + user-registered instruments).
 */
export function getRegisteredInstruments(customRegistry?: InstrumentRecord[]): InstrumentRecord[] {
  const canonical = customRegistry || CANONICAL_LAB_INSTRUMENTS;
  let userInsts: InstrumentRecord[] = memoryUserInstruments;
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(USER_INSTRUMENTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) userInsts = parsed;
      }
    } catch (e) {}
  }
  return [...canonical, ...userInsts];
}

/**
 * Registers a genuine user laboratory instrument with explicit persistence and collision protection.
 */
export function registerUserInstrument(reg: UserInstrumentRegistration): { success: boolean; instrument?: InstrumentRecord; error?: string } {
  if (!reg.instrumentId || !reg.name || !reg.serialNumber || !reg.manufacturer || !reg.model) {
    return { success: false, error: 'Missing required instrument registration fields.' };
  }
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const lastCalibration = new Date(`${reg.lastCalibrationDate}T00:00:00Z`);
  const nextCalibration = new Date(`${reg.nextCalibrationDate}T00:00:00Z`);
  if (!datePattern.test(reg.lastCalibrationDate) || !datePattern.test(reg.nextCalibrationDate) ||
      Number.isNaN(lastCalibration.getTime()) || Number.isNaN(nextCalibration.getTime()) ||
      lastCalibration.toISOString().slice(0, 10) !== reg.lastCalibrationDate ||
      nextCalibration.toISOString().slice(0, 10) !== reg.nextCalibrationDate || nextCalibration <= lastCalibration) {
    return { success: false, error: 'Calibration dates must be valid YYYY-MM-DD dates, with next calibration after last calibration.' };
  }
  if (!reg.calibrationCertificateReference?.trim() || !reg.registeredBy?.trim()) {
    return { success: false, error: 'Calibration certificate reference and registering person are required.' };
  }

  // Prevent collision with reference/demo system fixtures
  if (CANONICAL_LAB_INSTRUMENTS.some(i => i.instrumentId === reg.instrumentId)) {
    return { success: false, error: `Instrument ID collision: '${reg.instrumentId}' is reserved for a system reference fixture.` };
  }

  const existingInsts = getRegisteredInstruments();
  if (existingInsts.some(i => i.instrumentId === reg.instrumentId)) {
    return { success: false, error: `Instrument ID '${reg.instrumentId}' is already registered.` };
  }

  const newInst: InstrumentRecord = {
    instrumentId: reg.instrumentId,
    name: reg.name,
    manufacturer: reg.manufacturer,
    model: reg.model,
    serialNumber: reg.serialNumber,
    instrumentType: reg.instrumentType,
    classification: 'USER_REGISTERED',
    calibrationStatus: evaluateInstrumentCalibration({ nextCalibrationDate: reg.nextCalibrationDate, isActive: true } as InstrumentRecord),
    lastCalibrationDate: reg.lastCalibrationDate,
    nextCalibrationDate: reg.nextCalibrationDate,
    calibrationCertificateReference: reg.calibrationCertificateReference,
    location: reg.location,
    custodian: reg.custodian,
    isActive: true,
  };

  const updated = [newInst, ...memoryUserInstruments];
  memoryUserInstruments = updated;

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(USER_INSTRUMENTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
  }

  return { success: true, instrument: newInst };
}

/**
 * Resets user instruments for test suites.
 */
export function resetUserInstrumentsForTest(): void {
  memoryUserInstruments = [];
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(USER_INSTRUMENTS_STORAGE_KEY);
    } catch (e) {}
  }
}

/**
 * Evaluates current calibration status of an instrument based on target evaluation date.
 */
export function evaluateInstrumentCalibration(
  instrument: InstrumentRecord,
  currentDateIso: string = new Date().toISOString().split('T')[0]
): InstrumentCalibrationStatus {
  if (!instrument.isActive) return 'EXPIRED';
  const nextCalDueDate = instrument.nextCalibrationDate || (instrument as any).nextCalibrationDueDate;
  if (!nextCalDueDate) return 'UNKNOWN';

  const today = new Date(currentDateIso).getTime();
  const nextCal = new Date(nextCalDueDate).getTime();

  if (isNaN(nextCal)) return 'UNKNOWN';

  const daysRemaining = (nextCal - today) / (1000 * 60 * 60 * 24);

  if (daysRemaining < 0) {
    return 'EXPIRED';
  } else if (daysRemaining <= 14) {
    return 'DUE';
  } else {
    return 'VALID';
  }
}

/**
 * Finds an instrument by ID and returns its real-time calibrated state.
 */
export function getInstrumentWithCurrentStatus(
  instrumentId: string,
  customRegistry?: InstrumentRecord[],
  currentDateIso?: string
): InstrumentRecord | undefined {
  const registry = getRegisteredInstruments(customRegistry);
  const inst = registry.find(i => i.instrumentId === instrumentId);
  if (!inst) return undefined;

  const currentStatus = evaluateInstrumentCalibration(inst, currentDateIso);
  return {
    ...inst,
    calibrationStatus: currentStatus,
  };
}

/**
 * Verifies if an instrument is authorized to produce validated evidence.
 * REFERENCE, DEMO, and SIMULATED instruments are STRICTLY BLOCKED.
 */
export function isInstrumentAuthorizedForValidation(
  instrument: InstrumentRecord | undefined
): boolean {
  if (!instrument) return false;
  if (
    instrument.classification === 'REFERENCE' ||
    instrument.classification === 'DEMO' ||
    instrument.classification === 'SIMULATED' ||
    !instrument.isActive
  ) {
    return false;
  }

  const status = evaluateInstrumentCalibration(instrument);
  return status === 'VALID' || status === 'DUE';
}

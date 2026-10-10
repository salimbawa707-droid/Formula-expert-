import React, { useState } from 'react';
import {
  Droplets,
  Zap,
  Shield,
  Activity,
  Layers,
  Scale,
  Sparkles,
  CheckCircle2,
  Clock,
  FileCheck
} from 'lucide-react';
import { CanonicalFormulaEvaluationResult } from '../../utils/orchestrator/types';
import { EvidenceBadge } from './EvidenceBadge';

interface PropertyDeepDivePanelProps {
  evaluationResult: CanonicalFormulaEvaluationResult;
}

export const PropertyDeepDivePanel: React.FC<PropertyDeepDivePanelProps> = ({ evaluationResult }) => {
  const [activeTab, setActiveTab] = useState<string>('ph');

  const {
    pHResult,
    activeMatterResult,
    hardnessResult,
    viscosityResult,
    cleaningResult,
    compatibilityResult,
    densityResult,
    stabilityResult,
    regulatoryResult,
    powderReport,
    aiGrade
  } = evaluationResult;

  const tabs = [
    { id: 'ph', label: '1. pH & Neutralization', icon: Droplets },
    { id: 'active', label: '2. Active Matter', icon: Zap },
    { id: 'chelation', label: '3. Chelation & Hardness', icon: Shield },
    { id: 'viscosity', label: '4. Viscosity & Rheology', icon: Activity },
    { id: 'cleaning', label: '5. Cleaning CPI', icon: Sparkles },
    { id: 'compatibility', label: '6. Compatibility', icon: Layers },
    { id: 'density', label: '7. Density & State', icon: Scale },
    { id: 'nvr', label: '8. NVR Residue', icon: FileCheck },
    { id: 'powder', label: '9. Powder Physics', icon: Layers },
    { id: 'stability', label: '10. Stability Screening', icon: Clock },
    { id: 'regulatory', label: '11. Regulatory', icon: Shield },
    { id: 'specification', label: '12. Specifications', icon: CheckCircle2 }
  ];

  return (
    <div className="space-y-6">
      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-thin">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold rounded-lg whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-950 text-cyan-200 border border-cyan-500/50 shadow-md shadow-cyan-950/40'
                  : 'bg-[#0e1629] text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS */}
      <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-5 space-y-4">
        {/* 1. pH & NEUTRALIZATION */}
        {activeTab === 'ph' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  1. pH EQUILIBRIUM & STOICHIOMETRIC NEUTRALIZATION
                </h3>
                <p className="text-xs text-slate-400">Authoritative Engine: PHEngineV2 & StoichiometricNeutralizationEngine</p>
              </div>
              <EvidenceBadge
                status={
                  evaluationResult.labEvidenceResult?.verifiedMeasurementsCount > 0
                    ? 'MEASURED_LAB'
                    : pHResult.solverConverged
                    ? 'AUTHORITATIVE_CALCULATED'
                    : 'ESTIMATED_HEURISTIC'
                }
                size="md"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Calculated Equilibrium pH</span>
                <div className="text-2xl font-mono font-extrabold text-cyan-300">{pHResult.ph.toFixed(2)}</div>
                <div className="text-[10px] text-slate-400">Ionic Strength: {pHResult.ionicStrength.toFixed(3)} M</div>
              </div>

              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Buffer Capacity (β)</span>
                <div className="text-xl font-mono font-bold text-white">{pHResult.bufferCapacity.toFixed(3)}</div>
                <div className="text-[10px] text-slate-400">Solver Status: {pHResult.solverConverged ? 'Converged' : 'Estimated'}</div>
              </div>

              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Measured Bench pH</span>
                <div className="text-xl font-mono font-bold text-amber-400">
                  {pHResult.measuredPH ? pHResult.measuredPH.toFixed(2) : 'UNTESTED'}
                </div>
                <div className="text-[10px] text-slate-400">Physical Electrode Verification</div>
              </div>
            </div>

            <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-2 text-xs">
              <span className="font-bold text-slate-300">Inputs & Intermediate States Consumed:</span>
              <p className="text-slate-400 text-[11px]">
                Consumed active ingredient acid pKas, caustic stoichiometry, total water dilution, ionic strength, and Newton-Raphson charge balance equations.
              </p>
            </div>
          </div>
        )}

        {/* 2. ACTIVE MATTER */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  2. ACTIVE MATTER & SURFACTANT BREAKDOWN
                </h3>
                <p className="text-xs text-slate-400">Authoritative Engine: ActiveMatterEngine</p>
              </div>
              <EvidenceBadge status="AUTHORITATIVE_CALCULATED" size="md" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Active Surfactants</span>
                <div className="text-2xl font-mono font-extrabold text-cyan-300">
                  {activeMatterResult.totalSurfactantActivePct.toFixed(2)}%
                </div>
                <div className="text-[10px] text-slate-400">Category Min: {activeMatterResult.categoryMinPct}%</div>
              </div>

              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Anionic</span>
                <div className="text-lg font-mono font-bold text-white">
                  {activeMatterResult.surfactantBreakdown.anionic.toFixed(2)}%
                </div>
              </div>

              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Nonionic</span>
                <div className="text-lg font-mono font-bold text-white">
                  {activeMatterResult.surfactantBreakdown.nonionic.toFixed(2)}%
                </div>
              </div>

              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Amphoteric / Cationic</span>
                <div className="text-lg font-mono font-bold text-white">
                  {(activeMatterResult.surfactantBreakdown.amphoteric + activeMatterResult.surfactantBreakdown.cationic).toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. CHELATION & HARDNESS */}
        {activeTab === 'chelation' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  3. CHELATION & WATER HARDNESS TOLERANCE
                </h3>
                <p className="text-xs text-slate-400">Authoritative Engine: chelatorEngine</p>
              </div>
              <EvidenceBadge status="AUTHORITATIVE_CALCULATED" size="md" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Wash Hardness</span>
                <div className="text-xl font-mono font-bold text-white">{hardnessResult.waterHardnessPpm} ppm</div>
              </div>
              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Max Supported Hardness</span>
                <div className="text-xl font-mono font-bold text-cyan-300">{hardnessResult.maxSupportedPpm} ppm</div>
              </div>
              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Sequestration Status</span>
                <div className="text-sm font-bold text-emerald-400">{hardnessResult.status}</div>
              </div>
            </div>
          </div>
        )}

        {/* 4. VISCOSITY */}
        {activeTab === 'viscosity' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  4. VISCOSITY & RHEOLOGY MODELING
                </h3>
                <p className="text-xs text-slate-400">Authoritative Engine: viscosityEngine</p>
              </div>
              <EvidenceBadge status="ESTIMATED_HEURISTIC" size="md" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Predicted Viscosity</span>
                <div className="text-xl font-mono font-bold text-cyan-300">
                  {viscosityResult.predictedViscosityCp ? `${viscosityResult.predictedViscosityCp} cP` : 'N/A'}
                </div>
              </div>
              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Flow Mechanism</span>
                <div className="text-sm font-bold text-white">{viscosityResult.flowMechanism}</div>
              </div>
              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Rating</span>
                <div className="text-sm font-bold text-slate-200">{viscosityResult.rating}</div>
              </div>
            </div>
          </div>
        )}

        {/* 5. CLEANING CPI */}
        {activeTab === 'cleaning' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  5. CLEANING CPI PERFORMANCE MODELING
                </h3>
                <p className="text-xs text-slate-400">Authoritative Engine: cleaningPerformanceEngine</p>
              </div>
              <EvidenceBadge status={cleaningResult.isMeasured ? 'MEASURED_LAB' : 'SCREENING_ONLY'} size="md" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Cleaning Power Index (CPI)</span>
                <div className="text-2xl font-mono font-extrabold text-cyan-300">{cleaningResult.cpi.toFixed(1)}</div>
              </div>
              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Degreasing Score</span>
                <div className="text-lg font-mono font-bold text-white">{cleaningResult.degreasingScore}</div>
              </div>
              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Particulate Soil Removal</span>
                <div className="text-lg font-mono font-bold text-white">{cleaningResult.particulateSoilRemoval}</div>
              </div>
            </div>
          </div>
        )}

        {/* 6. COMPATIBILITY */}
        {activeTab === 'compatibility' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  6. PHASE & INGREDIENT COMPATIBILITY
                </h3>
                <p className="text-xs text-slate-400">Authoritative Engine: compatibilityEngine</p>
              </div>
              <EvidenceBadge status={compatibilityResult.evidenceStatus || 'SCREENING_ONLY'} size="md" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Overall Compatibility</span>
                <div className={`text-lg font-bold ${compatibilityResult.compatible ? 'text-emerald-400' : 'text-red-400'}`}>
                  {compatibilityResult.compatible ? 'COMPATIBLE' : 'INCOMPATIBLE'}
                </div>
              </div>
              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Score</span>
                <div className="text-xl font-mono font-bold text-cyan-300">{compatibilityResult.compatibilityScore}%</div>
              </div>
              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Risk Level</span>
                <div className="text-sm font-bold text-white">{compatibilityResult.riskLevel}</div>
              </div>
            </div>
          </div>
        )}

        {/* 7. DENSITY */}
        {activeTab === 'density' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-cyan-400" />
                  7. DENSITY & SPECIFIC GRAVITY
                </h3>
                <p className="text-xs text-slate-400">Authoritative Engine: densityEngine</p>
              </div>
              <EvidenceBadge status="AUTHORITATIVE_CALCULATED" size="md" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Density</span>
                <div className="text-xl font-mono font-bold text-cyan-300">{densityResult.densityGPerCm3} g/cm³</div>
              </div>
              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Specific Gravity</span>
                <div className="text-xl font-mono font-bold text-white">{densityResult.specificGravity}</div>
              </div>
              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Batch Volume</span>
                <div className="text-xl font-mono font-bold text-slate-200">{densityResult.totalVolumeCm3} cm³</div>
              </div>
            </div>
          </div>
        )}

        {/* 8. NVR */}
        {activeTab === 'nvr' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-cyan-400" />
                  8. NON-VOLATILE RESIDUE (NVR)
                </h3>
                <p className="text-xs text-slate-400">Authoritative Engine: liquidNvrEngine</p>
              </div>
              <EvidenceBadge status="AUTHORITATIVE_CALCULATED" size="md" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">NVR Percentage</span>
                <div className="text-2xl font-mono font-extrabold text-cyan-300">{densityResult.nvrPercentage.toFixed(2)}%</div>
              </div>
              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Data Completeness</span>
                <div className="text-xl font-mono font-bold text-white">{densityResult.dataCompleteness}%</div>
              </div>
            </div>
          </div>
        )}

        {/* 9. POWDER */}
        {activeTab === 'powder' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  9. POWDER & GRANULAR PHYSICS
                </h3>
                <p className="text-xs text-slate-400">Authoritative Engine: powderEngine</p>
              </div>
              <EvidenceBadge status={powderReport ? 'MEASURED_LAB' : 'SCREENING_ONLY'} size="md" />
            </div>

            {powderReport ? (
              <pre className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 text-xs font-mono text-cyan-200 overflow-x-auto">
                {JSON.stringify(powderReport, null, 2)}
              </pre>
            ) : (
              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-4 text-xs text-slate-400">
                Powder physical properties engine is inactive for liquid formulations or unmeasured powder samples.
              </div>
            )}
          </div>
        )}

        {/* 10. STABILITY */}
        {activeTab === 'stability' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  10. STABILITY & SHELF-LIFE SCREENING
                </h3>
                <p className="text-xs text-slate-400">Authoritative Engine: stabilityEngine</p>
              </div>
              <EvidenceBadge
                status={stabilityResult.shelfLifeStatus === 'LAB_VALIDATED' ? 'MEASURED_LAB' : 'SCREENING_ONLY'}
                size="md"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Shelf Life (Months)</span>
                <div className="text-2xl font-mono font-extrabold text-cyan-300">
                  {stabilityResult.shelfLifeMonths !== null ? `${stabilityResult.shelfLifeMonths} Mo.` : 'UNKNOWN'}
                </div>
              </div>

              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Preservative System</span>
                <div className="text-sm font-bold text-white">{stabilityResult.preservativeStatus}</div>
              </div>

              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Syneresis / Phase Risk</span>
                <div className="text-sm font-bold text-slate-200">{stabilityResult.syneresisRisk}</div>
              </div>
            </div>
          </div>
        )}

        {/* 11. REGULATORY */}
        {activeTab === 'regulatory' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  11. REGULATORY & COMPLIANCE
                </h3>
                <p className="text-xs text-slate-400">Authoritative Engine: regulatoryEngine</p>
              </div>
              <EvidenceBadge status="AUTHORITATIVE_CALCULATED" size="md" />
            </div>

            <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300">Overall Regulatory Status:</span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                    regulatoryResult.compliant ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'
                  }`}
                >
                  {regulatoryResult.compliant ? 'COMPLIANT' : 'NON_COMPLIANT'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 12. SPECIFICATION */}
        {activeTab === 'specification' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  12. SPECIFICATION ALIGNMENT & QUALITY GATE
                </h3>
                <p className="text-xs text-slate-400">Authoritative Engine: specificationEngine & Quality Gate</p>
              </div>
              <EvidenceBadge status="AUTHORITATIVE_CALCULATED" size="md" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Specification Status</span>
                <div className="text-lg font-extrabold text-emerald-400">{evaluationResult.specificationStatus}</div>
              </div>
              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Formula Status</span>
                <div className="text-lg font-extrabold text-cyan-300">{evaluationResult.finalScientificStatus}</div>
              </div>
              <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-3 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Formulation Grade</span>
                <div className="text-xl font-mono font-extrabold text-yellow-400">{aiGrade.grade}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

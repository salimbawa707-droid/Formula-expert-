import React, { useState } from 'react';
import {
  Sparkles,
  DollarSign,
  Zap,
  AlertTriangle,
  Layers,
  ArrowRight,
  Check,
  Scale,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { FormulationIngredient } from '../../types';
import { normalizeProductCategory } from '../../domain/productTaxonomy';
import { isPowderCategory } from '../../utils/formulationEngineRouter';
import {
  runFormulationOptimization,
  ParetoCandidate,
  OptimizationProgress,
  OptimizationStrategy,
  OptimizerConfig,
  computeOptimizationBaselineKey,
  validateCandidateApplication,
} from '../../utils/optimization/multiObjectiveOptimizer';
import { FormulationConstraint } from '../../utils/optimization/formulationConstraintEngine';

interface FormulationOptimizationPanelProps {
  currentIngredients: FormulationIngredient[];
  productCategory: string;
  batchSizeKg?: number;
  waterHardnessPpm?: number;
  currentCostPerKg?: number;
  currentCpi?: number;
  currentPH?: number;
  onApplyCandidateFormula: (newIngredients: FormulationIngredient[], candidateName: string) => void;
}

export const FormulationOptimizationPanel: React.FC<FormulationOptimizationPanelProps> = ({
  currentIngredients,
  productCategory,
  currentCostPerKg,
  currentCpi,
  onApplyCandidateFormula
}) => {
  const categoryId = normalizeProductCategory(productCategory);
  const isPowder = isPowderCategory(categoryId);

  // Optimization Strategy
  const [strategy, setStrategy] = useState<OptimizationStrategy>('BALANCED');
  const populationSize = 20;
  const generations = 8;
  const [maxCostCeiling, setMaxCostCeiling] = useState<number>(currentCostPerKg ? Math.max(1, Number(currentCostPerKg.toFixed(2))) : 5.0);
  const [minCpiTarget, setMinCpiTarget] = useState<number>(75);

  // State
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState<OptimizationProgress | null>(null);
  const [candidates, setCandidates] = useState<ParetoCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<ParetoCandidate | null>(null);
  const [appliedCandidateId, setAppliedCandidateId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Baseline configuration tracking for stale candidate hard block
  const [optimizedBaselineKey, setOptimizedBaselineKey] = useState<string | null>(null);
  const currentBaselineKey = computeOptimizationBaselineKey(
    currentIngredients,
    productCategory,
    strategy,
    maxCostCeiling,
    minCpiTarget
  );
  const isCandidatesStale = Boolean(optimizedBaselineKey && candidates.length > 0 && currentBaselineKey !== optimizedBaselineKey);

  // Handlers
  const handleStartOptimization = async () => {
    setIsOptimizing(true);
    setProgress(null);
    setErrorMsg(null);
    setSelectedCandidate(null);
    setAppliedCandidateId(null);
    const baselineKeyToSet = computeOptimizationBaselineKey(
      currentIngredients,
      productCategory,
      strategy,
      maxCostCeiling,
      minCpiTarget
    );

    try {
      const customConstraints: Partial<FormulationConstraint>[] = [
        {
          id: 'OBJECTIVE_COST_CEILING',
          type: 'COST_CEILING',
          criticality: strategy === 'COST_FIRST' ? 'HARD' : 'SOFT',
          targetMax: maxCostCeiling,
          penaltyWeight: strategy === 'COST_FIRST' ? 50.0 : 25.0
        },
        {
          id: 'OBJECTIVE_CPI_MINIMUM',
          type: 'CPI_MINIMUM',
          criticality: strategy === 'PERFORMANCE_FIRST' ? 'HARD' : 'SOFT',
          targetMin: minCpiTarget,
          penaltyWeight: strategy === 'PERFORMANCE_FIRST' ? 60.0 : 30.0
        }
      ];

      const config: OptimizerConfig = {
        category: categoryId,
        populationSize,
        generations,
        mutationRate: 0.15,
        strategy,
        customConstraints
      };

      const result = await runFormulationOptimization(
        currentIngredients,
        config,
        (p) => setProgress(p)
      );

      const viableCandidates = result.paretoFront.length > 0
        ? result.paretoFront
        : result.candidates.filter(c => c.isFeasible);

      setCandidates(viableCandidates);
      setOptimizedBaselineKey(baselineKeyToSet);
      if (viableCandidates.length > 0) {
        setSelectedCandidate(viableCandidates[0]);
      }
    } catch (err: any) {
      console.error('[FormulationOptimization] Execution error:', err);
      setErrorMsg(err.message || 'Optimization failed to complete.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApply = (candidate: ParetoCandidate) => {
    // Hard block check: refuse application if candidate is stale relative to current baseline or configuration
    const validation = validateCandidateApplication(candidate, currentBaselineKey, optimizedBaselineKey);
    if (!validation.canApply) {
      setErrorMsg(validation.reason || 'HARD BLOCK: Stale candidate cannot be applied. Re-run optimization.');
      return;
    }
    setErrorMsg(null);
    onApplyCandidateFormula(candidate.ingredients, `Optimized ${candidate.candidateId} (${strategy})`);
    setAppliedCandidateId(candidate.candidateId);
  };

  return (
    <div className="bg-[#0e1629] border border-cyan-500/30 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 relative z-10">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-white tracking-wide flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            CONSTRAINED FORMULATION OPTIMIZER
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 uppercase">
              Phase 9 Pareto Front
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate alternative formula candidates through authoritative scientific engines with real trade-off analysis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-[#131d35] text-slate-300 px-3 py-1 rounded-full border border-slate-700">
            Form: {isPowder ? 'POWDER' : 'LIQUID'}
          </span>
          <span className="text-xs font-mono font-bold bg-[#131d35] text-cyan-300 px-3 py-1 rounded-full border border-slate-700">
            {currentIngredients.length} Active Ingredients
          </span>
        </div>
      </div>

      {/* Strategy Selector & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
        <div className="bg-[#131d35] border border-slate-700/80 rounded-xl p-3.5 space-y-2">
          <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            Optimization Objective
          </label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as OptimizationStrategy)}
            disabled={isOptimizing}
            className="w-full bg-[#0e1629] border border-slate-600 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-cyan-500 focus:outline-none cursor-pointer"
          >
            <option value="BALANCED">Balanced (Cost vs Performance)</option>
            <option value="COST_FIRST">Cost-First (Minimize Raw Material $/kg)</option>
            <option value="PERFORMANCE_FIRST">Performance-First (Maximize CPI Score)</option>
            <option value="CUSTOM">Custom Multi-Objective Weights</option>
          </select>
          <p className="text-[10px] text-slate-400">
            {strategy === 'BALANCED' && 'Explores non-dominated trade-offs between detergent power and economics.'}
            {strategy === 'COST_FIRST' && 'Strictly treats cost ceiling as hard constraint, pruning high-cost candidates.'}
            {strategy === 'PERFORMANCE_FIRST' && 'Prioritizes cleaning efficiency and builder sequestration tolerance.'}
            {strategy === 'CUSTOM' && 'Applies user-configured boundary limits across cost and detergency.'}
          </p>
        </div>

        <div className="bg-[#131d35] border border-slate-700/80 rounded-xl p-3.5 space-y-2">
          <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            Cost Ceiling Target ($/kg)
          </label>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
            <input
              type="number"
              step="0.1"
              min="0.5"
              max="50"
              value={maxCostCeiling}
              onChange={(e) => setMaxCostCeiling(Math.max(0.1, Number(e.target.value) || 0))}
              disabled={isOptimizing}
              className="w-full bg-[#0e1629] border border-slate-600 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <p className="text-[10px] text-slate-400">
            Baseline: {currentCostPerKg ? `$${currentCostPerKg.toFixed(2)}/kg` : 'Incomplete'}
          </p>
        </div>

        <div className="bg-[#131d35] border border-slate-700/80 rounded-xl p-3.5 space-y-2">
          <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            Min Cleaning Target (CPI)
          </label>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <input
              type="number"
              step="1"
              min="40"
              max="100"
              value={minCpiTarget}
              onChange={(e) => setMinCpiTarget(Math.max(30, Math.min(100, Number(e.target.value) || 0)))}
              disabled={isOptimizing}
              className="w-full bg-[#0e1629] border border-slate-600 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <p className="text-[10px] text-slate-400">
            Baseline: {currentCpi ? `${currentCpi.toFixed(1)} CPI` : 'N/A'}
          </p>
        </div>

        <div className="bg-[#131d35] border border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Search Parameters
            </label>
            <div className="text-xs text-slate-300 font-mono mt-1">
              Pop: {populationSize} • Gens: {generations}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Conserves Mass Balance = exactly 100.00%
            </div>
          </div>
          <button
            onClick={handleStartOptimization}
            disabled={isOptimizing || currentIngredients.length === 0}
            className={`w-full mt-2 py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition shadow-md ${
              isOptimizing
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white cursor-pointer active:scale-95'
            }`}
          >
            {isOptimizing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Exploring Pareto Space...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>Run Pareto Optimization</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      {isOptimizing && progress && (
        <div className="bg-[#131d35] border border-cyan-500/30 rounded-xl p-4 space-y-2 animate-pulse">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-cyan-300 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Generation {progress.generation} of {progress.totalGenerations} ({progress.percentComplete}%)
            </span>
            <span className="font-mono text-slate-300">
              Evaluated {progress.evaluationsCompleted} candidates ({progress.feasibleCandidatesCount} feasible)
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 transition-all duration-200"
              style={{ width: `${progress.percentComplete}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-rose-950/80 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Results Section */}
      {candidates.length > 0 && (
        <div className="space-y-4 pt-2">
          {/* Stale Baseline Protection Banner */}
          {isCandidatesStale && (
            <div className="p-3 bg-amber-950/70 border border-amber-500/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Formulation baseline modified.</strong> Displayed candidates were evaluated against the previous baseline formulation and are now stale. Re-run optimization to update alternatives.
                </span>
              </div>
              <button
                onClick={handleStartOptimization}
                disabled={isOptimizing}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shrink-0 cursor-pointer self-start sm:self-auto"
              >
                Re-optimize
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2 uppercase tracking-wide">
              <Layers className="w-4 h-4 text-cyan-400" />
              Pareto Optimal Candidates ({candidates.length} Non-Dominated Alternatives)
            </h4>
            <span className="text-[11px] font-mono font-semibold text-slate-400">
              Evidence: PREDICTED_ONLY (Requires bench validation prior to release)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {candidates.map((cand, idx) => {
              const isSelected = selectedCandidate?.candidateId === cand.candidateId;
              const isApplied = appliedCandidateId === cand.candidateId;
              const costDelta = currentCostPerKg && cand.metrics.costPerKg ? cand.metrics.costPerKg - currentCostPerKg : null;
              const cpiDelta = currentCpi ? cand.metrics.cpi - currentCpi : null;

              return (
                <div
                  key={cand.candidateId}
                  onClick={() => setSelectedCandidate(cand)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-[#152347] border-cyan-400 shadow-lg shadow-cyan-950/50'
                      : 'bg-[#131d35] border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        Candidate #{idx + 1} ({cand.candidateId})
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-extrabold ${
                        cand.isFeasible ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                      }`}>
                        {cand.isFeasible ? 'FEASIBLE' : 'VIOLATION'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-[#0e1629] p-2 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Cost / kg</span>
                        <span className="text-sm font-mono font-extrabold text-emerald-400">
                          {cand.metrics.costPerKg !== undefined ? `$${cand.metrics.costPerKg.toFixed(2)}` : 'Incomplete'}
                        </span>
                        {costDelta !== null && (
                          <span className={`text-[10px] font-mono block ${costDelta <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {costDelta <= 0 ? `${costDelta.toFixed(2)}` : `+${costDelta.toFixed(2)}`} vs base
                          </span>
                        )}
                      </div>

                      <div className="bg-[#0e1629] p-2 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Cleaning CPI</span>
                        <span className="text-sm font-mono font-extrabold text-cyan-400">
                          {cand.metrics.cpi.toFixed(1)}
                        </span>
                        {cpiDelta !== null && (
                          <span className={`text-[10px] font-mono block ${cpiDelta >= 0 ? 'text-cyan-400' : 'text-slate-400'}`}>
                            {cpiDelta >= 0 ? `+${cpiDelta.toFixed(1)}` : `${cpiDelta.toFixed(1)}`} vs base
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-300 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Calculated pH:</span>
                        <span className="font-mono font-bold text-white">{cand.metrics.pH.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Active Surfactant:</span>
                        <span className="font-mono font-bold text-white">{cand.metrics.activeSurfactantPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Hard Water Tol:</span>
                        <span className="font-mono font-bold text-white">{cand.metrics.waterHardnessCapacityPpm.toFixed(0)} ppm</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApply(cand);
                    }}
                    disabled={isApplied || isCandidatesStale}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                      isApplied
                        ? 'bg-emerald-600 text-white cursor-default'
                        : isCandidatesStale
                        ? 'bg-slate-800 text-slate-500 border border-slate-700/80 cursor-not-allowed opacity-60'
                        : 'bg-[#19284d] hover:bg-cyan-600 text-cyan-200 hover:text-white border border-cyan-500/30 cursor-pointer active:scale-95'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Applied to Working Draft</span>
                      </>
                    ) : isCandidatesStale ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Blocked (Re-optimization Required)</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Apply to Working Draft</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Deep Candidate Inspection Drawer */}
      {selectedCandidate && (
        <div className="bg-[#131d35] border border-cyan-500/40 rounded-xl p-5 space-y-4 mt-4">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
            <div>
              <h5 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-cyan-400" />
                Recipe & Trade-Off Breakdown: {selectedCandidate.candidateId}
              </h5>
              <p className="text-[11px] text-slate-400">
                Authoritative breakdown against physical chemistry constraints.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              Pareto Rank #{selectedCandidate.paretoRank}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ingredients Table */}
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-slate-300 uppercase block">
                Recipe Components (Mass Balance: 100.00%)
              </span>
              <div className="bg-[#0e1629] rounded-lg border border-slate-800 p-2 max-h-56 overflow-y-auto space-y-1">
                {selectedCandidate.ingredients.map((ing, i) => (
                  <div key={i} className="flex justify-between items-center text-xs py-1 px-2 border-b border-slate-800/60 last:border-0">
                    <span className="text-slate-200 truncate pr-2">{ing.name}</span>
                    <span className="font-mono font-extrabold text-cyan-300 shrink-0">
                      {Number(ing.percentage).toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Constraint Compliance */}
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-slate-300 uppercase block">
                Constraint Audit Status
              </span>
              <div className="bg-[#0e1629] rounded-lg border border-slate-800 p-2 max-h-56 overflow-y-auto space-y-1.5">
                {selectedCandidate.constraintsSummary.results.map((c, i) => (
                  <div key={i} className="flex items-start justify-between text-xs py-1 px-2 border-b border-slate-800/60 last:border-0">
                    <div>
                      <span className="font-bold text-slate-300 block">{c.name}</span>
                      <span className="text-[10px] text-slate-400">{c.message}</span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-extrabold shrink-0 ${
                      c.isSatisfied
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : c.criticality === 'HARD'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    }`}>
                      {c.isSatisfied ? 'PASS' : c.criticality}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

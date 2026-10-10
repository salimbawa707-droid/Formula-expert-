/**
 * ============================================================================
 * P2 — SCIENTIFIC UI COMPONENTS
 * ============================================================================
 */

import React from 'react';
import { ScientificMaturity, ScientificResult } from '../../domain/scientificCertainty/types';
import { ScientificCertaintyService } from '../../domain/scientificCertainty/ScientificCertaintyService';

export const ScientificBadge: React.FC<{ maturity: ScientificMaturity }> = ({ maturity }) => {
  const label = ScientificCertaintyService.getMaturityLabel(maturity);
  const explanation = ScientificCertaintyService.getMaturityExplanation(maturity);

  return (
    <span 
      className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-slate-800 text-slate-200 border border-slate-600 cursor-help"
      title={explanation}
    >
      {label}
    </span>
  );
};

export const ScientificResultCard: React.FC<{ result: ScientificResult<any>; title: string }> = ({ result, title }) => {
  return (
    <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-bold text-slate-100">{title}</h3>
        <ScientificBadge maturity={result.maturity} />
      </div>
      <div className="text-2xl font-mono font-bold text-white">
        {typeof result.value === 'number' ? result.value.toFixed(2) : result.value}
        <span className="text-sm text-slate-400 ml-1">{result.unit}</span>
      </div>
      {result.uncertainty && result.uncertainty.length > 0 && (
        <div className="text-xs text-slate-400 mt-2">
          Interval: {result.uncertainty[0].lowerBound?.toFixed(2)} - {result.uncertainty[0].upperBound?.toFixed(2)}
        </div>
      )}
    </div>
  );
};

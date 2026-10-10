import React from 'react';
import { FlaskConical, Cpu, Gauge, Search, AlertTriangle, HelpCircle } from 'lucide-react';
import { TraceEvidenceStatus } from '../../utils/orchestrator/types';

interface EvidenceBadgeProps {
  status?: TraceEvidenceStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({
  status = 'UNKNOWN',
  size = 'sm',
  showLabel = true
}) => {
  let badgeClass = 'bg-slate-800 text-slate-300 border-slate-700';
  let Icon = HelpCircle;
  let label = 'Unknown / Unverified';
  let tooltip = 'Data status is unverified or unknown.';

  switch (status) {
    case 'MEASURED_LAB':
    case 'LAB_VALIDATED':
    case 'MEASURED':
      badgeClass = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-emerald-900/20';
      Icon = FlaskConical;
      label = 'Measured Lab Data';
      tooltip = 'Derived directly from empirical laboratory measurement records.';
      break;

    case 'AUTHORITATIVE_CALCULATED':
    case 'CALCULATED':
    case 'COMPUTATIONAL_SCREENING':
      badgeClass = 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-cyan-900/20';
      Icon = Cpu;
      label = 'Authoritative Model';
      tooltip = 'Derived from fundamental chemical equations & thermodynamic models.';
      break;

    case 'ESTIMATED_HEURISTIC':
    case 'HEURISTIC':
    case 'ESTIMATED':
      badgeClass = 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-amber-900/20';
      Icon = Gauge;
      label = 'Heuristic Estimate';
      tooltip = 'Derived from physical chemistry heuristics and micellar packing assumptions.';
      break;

    case 'SCREENING_ONLY':
    case 'SCREENING':
      badgeClass = 'bg-purple-950/80 text-purple-300 border-purple-500/50 shadow-purple-900/20';
      Icon = Search;
      label = 'Screening Model';
      tooltip = 'Preliminary screening prediction. Requires bench testing validation.';
      break;

    case 'INSUFFICIENT_DATA':
    case 'MISSING':
      badgeClass = 'bg-orange-950/80 text-orange-300 border-orange-500/50 shadow-orange-900/20';
      Icon = AlertTriangle;
      label = 'Insufficient Data';
      tooltip = 'Incomplete formulation input or missing chemical parameters.';
      break;

    default:
      badgeClass = 'bg-slate-800 text-slate-400 border-slate-700';
      Icon = HelpCircle;
      label = 'Unknown / Unverified';
      tooltip = 'Data status is unverified or unknown.';
      break;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2'
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  }[size];

  return (
    <span
      className={`inline-flex items-center font-extrabold rounded-md border font-mono tracking-tight transition-all ${badgeClass} ${sizeClasses}`}
      title={tooltip}
    >
      <Icon className={`${iconSizes} shrink-0`} />
      {showLabel && <span>{label}</span>}
    </span>
  );
};

import React, { useState } from 'react';
import {
  Database,
  Search,
  ExternalLink,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { EvidenceRecord, VaultState } from '../../domain/vault/types';

interface EvidenceViewProps {
  state: VaultState;
  onSelectEvidence: (evidence: EvidenceRecord) => void;
  onAddEvidence?: () => void;
}

export const EvidenceView: React.FC<EvidenceViewProps> = ({
  state,
  onSelectEvidence,
  onAddEvidence,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [inspectionFilter, setInspectionFilter] = useState('ALL');
  const [downloadFilter, setDownloadFilter] = useState('ALL');

  const filteredEvidence = state.evidence.filter(ev => {
    const matchesSearch =
      ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.publisher.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.doi && ev.doi.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ev.evidenceType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'ALL' || ev.evidenceType === typeFilter;
    const matchesInspection =
      inspectionFilter === 'ALL' || ev.numericalInspectionStatus === inspectionFilter;
    const matchesDownload =
      downloadFilter === 'ALL' || ev.downloadStatus === downloadFilter;

    return matchesSearch && matchesType && matchesInspection && matchesDownload;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'EXPERIMENTAL':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
            EXPERIMENTAL
          </span>
        );
      case 'REFERENCE_DATABASE':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-950 text-blue-300 border border-blue-800">
            REFERENCE_DATABASE
          </span>
        );
      case 'THEORY':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-purple-950 text-purple-300 border border-purple-800">
            THEORY
          </span>
        );
      case 'SOFTWARE_TEST':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-950 text-amber-300 border border-amber-800">
            SOFTWARE_TEST
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
            {type}
          </span>
        );
    }
  };

  const getInspectionBadge = (status: string) => {
    switch (status) {
      case 'UNINSPECTED':
        return (
          <span className="text-[11px] font-mono text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60 flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-400" /> UNINSPECTED
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="text-[11px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" /> IN_PROGRESS
          </span>
        );
      case 'NUMERICALLY_INSPECTED':
        return (
          <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> INSPECTED
          </span>
        );
      default:
        return <span className="text-[11px] text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Evidence Vault Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Scientific Evidence Vault
              </h2>
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-blue-950 text-blue-300 border border-blue-800">
                {state.evidence.length} Evidence Leads Seeded
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Real scientific evidence records, peer-reviewed literature, raw repository archives, and reference databases.
            </p>
          </div>

          <button
            onClick={onAddEvidence}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer self-start sm:self-auto shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Register New Evidence Source
          </button>
        </div>

        {/* Lead Inspection Notice */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-amber-300">
              Mandatory Scientific Status Rule:
            </span>
            <p>
              All 11 seeded evidence sources are recorded strictly as{' '}
              <strong className="text-rose-400 font-mono">UNINSPECTED</strong> leads. A source lead does NOT imply
              that data has been downloaded, inspected, or validated until reproducible verification records are attached.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search evidence by title, DOI, publisher, or supported engine..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            aria-label="Filter by Evidence Type"
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Type: ALL</option>
            <option value="EXPERIMENTAL">EXPERIMENTAL</option>
            <option value="REFERENCE_DATABASE">REFERENCE_DATABASE</option>
            <option value="THEORY">THEORY</option>
            <option value="SOFTWARE_TEST">SOFTWARE_TEST</option>
          </select>

          <select
            value={inspectionFilter}
            onChange={e => setInspectionFilter(e.target.value)}
            aria-label="Filter by Inspection Status"
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Inspection: ALL</option>
            <option value="UNINSPECTED">UNINSPECTED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="NUMERICALLY_INSPECTED">NUMERICALLY_INSPECTED</option>
          </select>

          <select
            value={downloadFilter}
            onChange={e => setDownloadFilter(e.target.value)}
            aria-label="Filter by Download Status"
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Download: ALL</option>
            <option value="NOT_DOWNLOADED">NOT_DOWNLOADED</option>
            <option value="BLOCKED">BLOCKED</option>
            <option value="DOWNLOADED">DOWNLOADED</option>
          </select>
        </div>
      </div>

      {/* Evidence Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium">
              <tr>
                <th className="py-3 px-4">Evidence ID</th>
                <th className="py-3 px-4">Title &amp; Reference</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Inspection Status</th>
                <th className="py-3 px-4">Download / Access</th>
                <th className="py-3 px-4">Supported Engines</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEvidence.map(ev => (
                <tr
                  key={ev.id}
                  onClick={() => onSelectEvidence(ev)}
                  className="hover:bg-slate-800/40 transition cursor-pointer group"
                >
                  <td className="py-3 px-4 font-mono font-semibold text-blue-400 whitespace-nowrap">
                    {ev.id}
                  </td>
                  <td className="py-3 px-4 max-w-sm">
                    <div className="font-semibold text-slate-200 group-hover:text-blue-300 transition line-clamp-1">
                      {ev.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {ev.publisher} &bull; {ev.publicationDate}
                    </div>
                    {ev.doi && (
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        DOI: {ev.doi}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">{getTypeBadge(ev.evidenceType)}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {getInspectionBadge(ev.numericalInspectionStatus)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="space-y-0.5">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                          ev.downloadStatus === 'DOWNLOADED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : ev.downloadStatus === 'BLOCKED'
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {ev.downloadStatus}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex gap-1 flex-wrap">
                      {ev.supportedEngineIds.map(eId => (
                        <span
                          key={eId}
                          className="px-1.5 py-0.5 text-[10px] font-mono bg-cyan-950 text-cyan-300 rounded border border-cyan-800"
                        >
                          {eId}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={ev.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        aria-label={`Open source link for ${ev.title}`}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-blue-300 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <span className="text-[11px] text-slate-500 group-hover:text-blue-400 flex items-center gap-0.5">
                        Details <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

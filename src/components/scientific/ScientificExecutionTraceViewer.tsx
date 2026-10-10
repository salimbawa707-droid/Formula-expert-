import React, { useState, useMemo } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  Copy,
  Check,
  ChevronRight,
  Clock,
  Info
} from 'lucide-react';
import { ScientificExecutionTrace } from '../../utils/orchestrator/types';
import { EvidenceBadge } from './EvidenceBadge';

interface ScientificExecutionTraceViewerProps {
  trace?: ScientificExecutionTrace | null;
  onSelectNode?: (nodeId: string) => void;
}

export const ScientificExecutionTraceViewer: React.FC<ScientificExecutionTraceViewerProps> = ({
  trace,
  onSelectNode
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const selectedNode = useMemo(() => {
    if (!trace || !selectedNodeId) return null;
    return trace.nodeTraces[selectedNodeId] || null;
  }, [trace, selectedNodeId]);

  const filteredNodes = useMemo(() => {
    if (!trace) return [];
    return trace.executionOrder
      .map((id) => trace.nodeTraces[id])
      .filter((node) => {
        if (!node) return false;
        const matchesSearch =
          node.nodeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          node.engineName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === 'ALL' || node.executionStatus === statusFilter;
        return matchesSearch && matchesStatus;
      });
  }, [trace, searchTerm, statusFilter]);

  if (!trace) {
    return (
      <div className="bg-[#0b1324] border border-slate-800 rounded-xl p-8 text-center space-y-3">
        <Activity className="w-8 h-8 text-slate-500 mx-auto animate-pulse" />
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
          No Execution Trace Recorded
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Execute &ldquo;Check My Formula&rdquo; to generate a complete, deterministic scientific execution trace across all DAG engines.
        </p>
      </div>
    );
  }

  const handleCopyTraceId = () => {
    navigator.clipboard.writeText(trace.traceId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleDownloadTraceJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(trace, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `scientific_trace_${trace.traceId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-[#0e1629] border border-cyan-500/30 rounded-xl p-4 space-y-3 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-2">
                AUDITABLE SCIENTIFIC EXECUTION TRACE
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  {trace.summary.totalNodesExecuted} ENGINES EXECUTED
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Single Source of Truth (SSOT) DAG Trace ID: <span className="font-mono text-cyan-300">{trace.traceId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyTraceId}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold bg-[#131d35] hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg transition-colors"
              title="Copy Trace ID"
            >
              {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              {copiedId ? 'Copied' : 'Trace ID'}
            </button>

            <button
              onClick={handleDownloadTraceJson}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/40 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Export Trace (JSON)
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#0b1324] border border-slate-800/80 rounded-lg p-2.5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Execution Status</span>
            <div className="flex items-center gap-1.5 font-bold">
              {trace.overallStatus === 'SUCCESS' ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> SUCCESS
                </span>
              ) : trace.overallStatus === 'PARTIAL_SUCCESS' ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> PARTIAL SUCCESS
                </span>
              ) : (
                <span className="text-red-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> FAILED
                </span>
              )}
            </div>
          </div>

          <div className="bg-[#0b1324] border border-slate-800/80 rounded-lg p-2.5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Total DAG Duration</span>
            <div className="font-mono font-extrabold text-cyan-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {trace.totalDurationMs} ms
            </div>
          </div>

          <div className="bg-[#0b1324] border border-slate-800/80 rounded-lg p-2.5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Fingerprint</span>
            <div className="font-mono text-[10px] text-slate-300 truncate" title={trace.formulaFingerprint}>
              {trace.formulaFingerprint.substring(0, 16)}...
            </div>
          </div>

          <div className="bg-[#0b1324] border border-slate-800/80 rounded-lg p-2.5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Overall Evidence</span>
            <div>
              <EvidenceBadge status={trace.summary.overallEvidenceStatus} size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BAR & SEARCH */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0b1324] border border-slate-800 rounded-xl p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search scientific engine name or node ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0e1629] border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-bold">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0e1629] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Nodes</option>
            <option value="EXECUTED">Executed</option>
            <option value="SKIPPED">Skipped</option>
            <option value="BYPASSED">Bypassed</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* NODE LIST & INSPECTOR SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* NODE EXECUTION LIST */}
        <div className="lg:col-span-7 space-y-2">
          <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between">
            <span>Execution Sequence ({filteredNodes.length} Nodes)</span>
            <span className="text-[10px] text-slate-500 font-mono">Topologically Sorted</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredNodes.map((node, index) => {
              const isSelected = selectedNodeId === node.nodeId;
              const statusPill =
                node.executionStatus === 'EXECUTED' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    EXECUTED
                  </span>
                ) : node.executionStatus === 'SKIPPED' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/40">
                    SKIPPED
                  </span>
                ) : node.executionStatus === 'BYPASSED' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
                    BYPASSED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-500/40">
                    FAILED
                  </span>
                );

              return (
                <div
                  key={node.nodeId}
                  onClick={() => {
                    setSelectedNodeId(node.nodeId);
                    if (onSelectNode) onSelectNode(node.nodeId);
                  }}
                  className={`border rounded-xl p-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#121e3d] border-cyan-500 shadow-md shadow-cyan-950/40'
                      : 'bg-[#0e1629] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-500 font-bold w-6 text-right">
                        #{index + 1}
                      </span>
                      <span className="text-xs font-extrabold text-white">
                        {node.engineName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusPill}
                      <span className="font-mono text-[10px] text-slate-400">
                        {node.durationMs}ms
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/60">
                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      <span className="text-slate-500">ID: {node.nodeId}</span>
                      <span>•</span>
                      <EvidenceBadge status={node.evidenceStatus} size="sm" showLabel={false} />
                    </div>
                    <div className="flex items-center gap-1 text-cyan-400 text-[10px] font-bold">
                      Inspect <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* NODE INSPECTOR PANEL */}
        <div className="lg:col-span-5 bg-[#0e1629] border border-slate-800 rounded-xl p-4 space-y-4">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-start justify-between gap-2">
                <div>
                  <div className="text-[10px] font-mono text-cyan-400 font-extrabold uppercase tracking-wider">
                    {selectedNode.nodeType} ENGINE
                  </div>
                  <h4 className="text-sm font-extrabold text-white">
                    {selectedNode.engineName}
                  </h4>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    Node ID: {selectedNode.nodeId}
                  </div>
                </div>
                <EvidenceBadge status={selectedNode.evidenceStatus} size="sm" />
              </div>

              {/* EXECUTION DETAILS */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-2 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Status</span>
                  <div className="font-mono font-bold text-white">{selectedNode.executionStatus}</div>
                </div>
                <div className="bg-[#0b1324] border border-slate-800 rounded-lg p-2 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Duration</span>
                  <div className="font-mono font-bold text-cyan-300">{selectedNode.durationMs} ms</div>
                </div>
              </div>

              {selectedNode.skipReason && (
                <div className="bg-purple-950/40 border border-purple-500/40 rounded-lg p-2.5 text-xs text-purple-200">
                  <span className="font-bold">Skip / Bypass Reason:</span> {selectedNode.skipReason}
                </div>
              )}

              {/* UPSTREAM & DOWNSTREAM */}
              <div className="space-y-2 text-xs">
                <span className="font-extrabold text-slate-300 text-[11px] block">Upstream Dependencies</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.upstreamDependencies.length > 0 ? (
                    selectedNode.upstreamDependencies.map((dep) => (
                      <span
                        key={dep}
                        onClick={() => setSelectedNodeId(dep)}
                        className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#131d35] text-cyan-300 border border-slate-700 cursor-pointer hover:border-cyan-500"
                      >
                        {dep}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">None (Root Node)</span>
                  )}
                </div>

                <span className="font-extrabold text-slate-300 text-[11px] block pt-2">Downstream Consumers</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.downstreamConsumers.length > 0 ? (
                    selectedNode.downstreamConsumers.map((dc) => (
                      <span
                        key={dc}
                        onClick={() => setSelectedNodeId(dc)}
                        className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#131d35] text-cyan-300 border border-slate-700 cursor-pointer hover:border-cyan-500"
                      >
                        {dc}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">None (Terminal Node)</span>
                  )}
                </div>
              </div>

              {/* INPUTS CONSUMED */}
              <div className="space-y-1 text-xs">
                <span className="font-extrabold text-slate-300 text-[11px] block">Inputs Consumed</span>
                <pre className="bg-[#0b1324] border border-slate-800 rounded-lg p-2.5 text-[10px] font-mono text-cyan-200 overflow-x-auto max-h-36">
                  {JSON.stringify(selectedNode.inputsConsumed, null, 2)}
                </pre>
              </div>

              {/* INTERMEDIATE STATES CONSUMED */}
              <div className="space-y-1 text-xs">
                <span className="font-extrabold text-slate-300 text-[11px] block">Canonical States Consumed</span>
                <div className="flex flex-wrap gap-1 font-mono text-[10px] text-slate-300">
                  {selectedNode.intermediateStatesConsumed.map((st) => (
                    <span key={st} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {st}
                    </span>
                  ))}
                </div>
              </div>

              {/* OUTPUTS PRODUCED */}
              <div className="space-y-1 text-xs">
                <span className="font-extrabold text-slate-300 text-[11px] block">Outputs Produced</span>
                <pre className="bg-[#0b1324] border border-slate-800 rounded-lg p-2.5 text-[10px] font-mono text-emerald-300 overflow-x-auto max-h-36">
                  {JSON.stringify(selectedNode.outputsProduced, null, 2)}
                </pre>
              </div>

              {/* UNCERTAINTY NOTES */}
              {selectedNode.uncertaintyNotes.length > 0 && (
                <div className="space-y-1 bg-amber-950/30 border border-amber-500/40 rounded-lg p-2.5 text-xs text-amber-200">
                  <span className="font-bold flex items-center gap-1 text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Scientific Uncertainty & Risk Notes
                  </span>
                  <ul className="list-disc list-inside text-[10px] space-y-0.5 text-amber-200/90 pt-1">
                    {selectedNode.uncertaintyNotes.map((note, idx) => (
                      <li key={idx}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 space-y-2 text-slate-500">
              <Info className="w-6 h-6 mx-auto text-slate-600" />
              <p className="text-xs">Select any engine from the execution sequence on the left to inspect detailed scientific inputs, outputs, states, and evidence status.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

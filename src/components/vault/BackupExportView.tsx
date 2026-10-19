import React, { useState } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';
import { VaultState } from '../../domain/vault/types';
import { exportVaultToCSV, validateAndParseVaultJSON } from '../../utils/vault/vaultLogic';

interface BackupExportViewProps {
  state: VaultState;
  onExportJSON: () => void;
  onImportJSON: (importedState: VaultState) => void;
  onResetDefaults: () => void;
}

export const BackupExportView: React.FC<BackupExportViewProps> = ({
  state,
  onExportJSON,
  onImportJSON,
  onResetDefaults,
}) => {
  const [importJsonText, setImportJsonText] = useState('');
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: string[];
    parsed?: VaultState;
  } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleValidateInput = () => {
    if (!importJsonText.trim()) {
      setValidationResult({ valid: false, errors: ['JSON input cannot be empty.'] });
      return;
    }
    const res = validateAndParseVaultJSON(importJsonText);
    setValidationResult({
      valid: res.valid,
      errors: res.errors,
      parsed: res.parsedState,
    });
  };

  const handleApplyImport = () => {
    if (validationResult?.valid && validationResult.parsed) {
      onImportJSON(validationResult.parsed);
      setImportJsonText('');
      setValidationResult(null);
    }
  };

  const handleDownloadCSV = (category: 'engines' | 'evidence' | 'datasets' | 'audits') => {
    const csvContent = exportVaultToCSV(category, state);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `detergent_vault_${category}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base sm:text-lg font-bold text-slate-100">
            Backup, Data Provenance &amp; Export Center
          </h2>
          <span className="px-2 py-0.5 rounded text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
            Schema v{state.version}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          Export complete research vault state, validate incoming backup schemas, and generate CSV register extracts.
        </p>

        {/* Local-first Persistence Disclosure */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
          <HardDrive className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-cyan-300">
              Local-First Persistence Model Disclosure:
            </span>
            <p>
              This application operates locally without external AI APIs or paid cloud storage. Changes are
              persisted in local browser storage (<code className="text-slate-200 font-mono">localStorage</code>).
              Browser storage is not an external cloud backup; users must regularly download versioned JSON backups
              for archival preservation in git repositories.
            </p>
          </div>
        </div>
      </div>

      {/* Main Actions: JSON Export & CSV Exports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full JSON Backup */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Full Research Vault JSON Export</span>
            </div>
            <p className="text-xs text-slate-400">
              Downloads the complete serialized state including Phase 1 pricing integrity records, Phase 4B
              engine reconciliation claims, 11 evidence leads, physical dataset registers, and forensic audit logs.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onExportJSON}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download JSON Backup (.json)
            </button>
          </div>
        </div>

        {/* CSV Extract Generators */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Structured CSV Register Extracts</span>
          </div>
          <p className="text-xs text-slate-400">
            Export individual tabular registers for external spreadsheet review or statistical ingestion.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <button
              onClick={() => handleDownloadCSV('engines')}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-200 transition font-medium flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
              Engines CSV
            </button>
            <button
              onClick={() => handleDownloadCSV('evidence')}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-200 transition font-medium flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
              Evidence CSV
            </button>
            <button
              onClick={() => handleDownloadCSV('datasets')}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-200 transition font-medium flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-rose-400" />
              Datasets CSV
            </button>
            <button
              onClick={() => handleDownloadCSV('audits')}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-200 transition font-medium flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
              Audits CSV
            </button>
          </div>
        </div>
      </div>

      {/* JSON Import & Schema Validator Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Import &amp; Validate Backup JSON</span>
          </div>
          <p className="text-xs text-slate-400">
            Paste exported vault JSON or load from file. Previews record counts, validates schema integrity, and detects duplicate IDs.
          </p>
        </div>

        <div className="space-y-2">
          <textarea
            rows={5}
            placeholder="Paste raw backup JSON content here to validate..."
            value={importJsonText}
            onChange={e => {
              setImportJsonText(e.target.value);
              setValidationResult(null);
            }}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={handleValidateInput}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              Validate Schema
            </button>

            {validationResult?.valid && (
              <button
                onClick={handleApplyImport}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Apply Validated Import
              </button>
            )}
          </div>
        </div>

        {/* Validation Results Display */}
        {validationResult && (
          <div
            className={`p-3.5 rounded-lg border text-xs space-y-2 ${
              validationResult.valid
                ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-200'
                : 'bg-rose-950/20 border-rose-800/60 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              {validationResult.valid ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Validation Passed: Valid Detergent Vault Backup Schema</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Schema Validation Failed:</span>
                </>
              )}
            </div>

            {validationResult.valid && validationResult.parsed && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300 font-mono text-[11px] pt-1">
                <div>Engines: {validationResult.parsed.engines.length}</div>
                <div>Evidence Leads: {validationResult.parsed.evidence.length}</div>
                <div>Datasets: {validationResult.parsed.datasets.length}</div>
                <div>Audits: {validationResult.parsed.audits.length}</div>
              </div>
            )}

            {!validationResult.valid && (
              <ul className="list-disc pl-5 space-y-1 text-rose-300 text-[11px]">
                {validationResult.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Dangerous Operations: Reset Defaults */}
      <div className="bg-slate-900 border border-red-900/30 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h4 className="text-sm font-bold text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Reset State to Canonical Seed Defaults</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Restores the initial state with Phase 4B open, Phase 5 locked, 59 engine reconciliation notice, and 0 inspected datasets.
            </p>
          </div>

          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 transition cursor-pointer"
            >
              Reset to Defaults
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-300 font-medium">Are you sure?</span>
              <button
                onClick={() => {
                  onResetDefaults();
                  setShowResetConfirm(false);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition cursor-pointer"
              >
                Yes, Reset All
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

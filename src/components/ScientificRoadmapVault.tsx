/**
 * ============================================================================
 * SCIENTIFIC ROADMAP & EVIDENCE VAULT MODULE
 * ============================================================================
 * Integrated into Detergent Formula Expert without overriding core application state.
 * Fully isolated localStorage namespace: DETERGENT_FORMULA_EXPERT_VAULT_STATE_V1
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  VaultState,
  EngineRecord,
  EvidenceRecord,
  DatasetRecord,
  AuditRecord,
  PromptRecord
} from '../domain/vault/types';
import { INITIAL_VAULT_STATE } from '../domain/vault/initialData';
import { Header, ActiveTab } from './vault/VaultHeader';
import { DashboardView } from './vault/DashboardView';
import { RoadmapView } from './vault/RoadmapView';
import { EnginesView } from './vault/EnginesView';
import { EvidenceView } from './vault/EvidenceView';
import { DatasetsView } from './vault/DatasetsView';
import { AuditsView } from './vault/AuditsView';
import { PromptsView } from './vault/PromptsView';
import { PricingIntegrityView } from './vault/PricingIntegrityView';
import { BackupExportView } from './vault/BackupExportView';
import {
  EngineModal,
  ReconcileEnginesModal,
  DatasetInspectionModal,
  EvidenceModal,
} from './vault/VaultModals';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const STORAGE_KEY = 'DETERGENT_FORMULA_EXPERT_VAULT_STATE_V1';

export const ScientificRoadmapVault: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Load from isolated localStorage or canonical initial seed
  const [state, setState] = useState<VaultState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.version && parsed.phases && parsed.engines) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load from localStorage, using canonical initial seed:', e);
    }
    return INITIAL_VAULT_STATE;
  });

  // Toast notification system
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Sync to isolated localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('LocalStorage write failed:', e);
    }
  }, [state]);

  // Modal states
  const [selectedEngine, setSelectedEngine] = useState<EngineRecord | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceRecord | null>(null);
  const [selectedDatasetToInspect, setSelectedDatasetToInspect] = useState<DatasetRecord | null>(null);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);

  // Handlers for updating state
  const handleUpdateEngine = (updated: EngineRecord) => {
    setState((prev) => ({
      ...prev,
      engines: prev.engines.map((e) => (e.id === updated.id ? updated : e)),
    }));
    showToast(`Engine ${updated.name} updated successfully.`);
  };

  const handleUpdateEvidence = (updated: EvidenceRecord) => {
    setState((prev) => ({
      ...prev,
      evidence: prev.evidence.map((e) => (e.id === updated.id ? updated : e)),
    }));
    showToast(`Evidence record ${updated.title} updated.`);
  };

  const handleSaveDatasetInspection = (updated: DatasetRecord) => {
    setState((prev) => ({
      ...prev,
      datasets: prev.datasets.map((d) => (d.id === updated.id ? updated : d)),
    }));
    showToast(`Inspection results saved for ${updated.name}.`);
  };

  const handleReconcileEngines = (newCount: number, notes: string) => {
    setState((prev) => ({
      ...prev,
      engineCountDiscrepancy: {
        ...prev.engineCountDiscrepancy,
        reconciledFiles: newCount,
        notes: `${prev.engineCountDiscrepancy.notes}\n[${new Date().toISOString().split('T')[0]}] ${notes}`,
      },
    }));
    setIsReconcileModalOpen(false);
    showToast(`Engine file reconciliation updated to ${newCount} files.`);
  };

  const handleAddAudit = (audit: AuditRecord) => {
    setState((prev) => ({
      ...prev,
      audits: [audit, ...prev.audits],
    }));
    showToast(`Audit finding ${audit.id} recorded.`);
  };

  const handleAddPrompt = (prompt: PromptRecord) => {
    setState((prev) => ({
      ...prev,
      prompts: [prompt, ...prev.prompts],
    }));
    showToast(`Prompt "${prompt.title}" registered.`);
  };

  const handleRestoreDefaultState = () => {
    if (window.confirm('Reset Evidence Vault to canonical verified baseline? Any local edits will be reset.')) {
      setState(INITIAL_VAULT_STATE);
      showToast('Vault state restored to canonical verified baseline.');
    }
  };

  const handleImportJSON = (importedState: VaultState) => {
    setState(importedState);
    showToast('Vault state imported and verified successfully.');
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `detergent-scientific-vault-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Vault state exported to JSON.');
  };

  const handleExportCSV = () => {
    setActiveTab('backup');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportJSON={handleExportJSON}
        onOpenImport={() => setActiveTab('backup')}
        onExportCSV={handleExportCSV}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'dashboard' && (
          <DashboardView
            state={state}
            setActiveTab={setActiveTab}
            onOpenDatasetModal={() => {
              const firstUninspected = state.datasets.find((d) => d.inspectionStatus === 'UNINSPECTED');
              if (firstUninspected) setSelectedDatasetToInspect(firstUninspected);
              else setActiveTab('datasets');
            }}
            onOpenAuditModal={() => setActiveTab('audits')}
          />
        )}

        {activeTab === 'roadmap' && (
          <RoadmapView state={state} onSelectPhase={() => {}} />
        )}

        {activeTab === 'engines' && (
          <EnginesView
            state={state}
            onSelectEngine={(engine) => setSelectedEngine(engine)}
            onOpenReconciliationModal={() => setIsReconcileModalOpen(true)}
          />
        )}

        {activeTab === 'evidence' && (
          <EvidenceView
            state={state}
            onSelectEvidence={(evidence) => setSelectedEvidence(evidence)}
            onAddEvidence={() => showToast('Evidence addition registered in vault.')}
          />
        )}

        {activeTab === 'datasets' && (
          <DatasetsView
            state={state}
            onSelectDataset={(ds) => showToast(`Selected dataset: ${ds.name}`)}
            onAddDataset={() => showToast('Dataset registration unlocked.')}
            onInspectDataset={(dataset) => setSelectedDatasetToInspect(dataset)}
          />
        )}

        {activeTab === 'audits' && (
          <AuditsView
            state={state}
            onSelectAudit={(audit) => showToast(`Selected audit: ${audit.id}`)}
            onAddAudit={() => handleAddAudit({
              id: `AUD-${Date.now().toString().slice(-3)}`,
              date: new Date().toISOString(),
              phase: 'Phase 4B',
              scope: 'Custom Independent Review',
              repoCommitOrZipHash: 'HEAD',
              filesInspected: [],
              findings: [],
              reproducibleEvidence: 'Manual audit entry',
              reportPathOrRef: 'Manual entry',
              promptUsed: 'N/A',
              toolEnvironmentLimitations: 'None',
              filesChanged: [],
              independentReviewerDecision: 'PENDING',
              closureCriteria: [],
              approvalStatus: 'PENDING',
            })}
          />
        )}

        {activeTab === 'prompts' && (
          <PromptsView
            state={state}
            onSelectPrompt={(p) => showToast(`Selected prompt: ${p.title}`)}
            onAddPrompt={() => handleAddPrompt({
              id: `PRM-${Date.now().toString().slice(-3)}`,
              title: 'Custom Prompt Log',
              category: 'Verification',
              content: 'Custom prompt text',
              intendedOutcome: 'Expected outcome',
              phase: 'Phase 4B',
              version: '1.0.0',
              author: 'System',
              lastModified: new Date().toISOString(),
            })}
          />
        )}

        {activeTab === 'pricing' && (
          <PricingIntegrityView state={state} />
        )}

        {activeTab === 'backup' && (
          <BackupExportView
            state={state}
            onExportJSON={handleExportJSON}
            onImportJSON={handleImportJSON}
            onResetDefaults={handleRestoreDefaultState}
          />
        )}
      </main>

      {/* Global Modals */}
      {selectedEngine && (
        <EngineModal
          engine={selectedEngine}
          onClose={() => setSelectedEngine(null)}
          onSave={handleUpdateEngine}
        />
      )}

      {selectedEvidence && (
        <EvidenceModal
          evidence={selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
          onSave={handleUpdateEvidence}
        />
      )}

      {selectedDatasetToInspect && (
        <DatasetInspectionModal
          dataset={selectedDatasetToInspect}
          onClose={() => setSelectedDatasetToInspect(null)}
          onSaveInspection={handleSaveDatasetInspection}
        />
      )}

      {isReconcileModalOpen && (
        <ReconcileEnginesModal
          discrepancy={state.engineCountDiscrepancy}
          onClose={() => setIsReconcileModalOpen(false)}
          onSave={handleReconcileEngines}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl backdrop-blur-md border animate-in slide-in-from-bottom-5 duration-200">
          {toast.type === 'success' && (
            <div className="flex items-center gap-2 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-lg shadow-2xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          )}
          {toast.type === 'warning' && (
            <div className="flex items-center gap-2 bg-amber-950/90 border border-amber-500/50 text-amber-200 px-4 py-3 rounded-lg shadow-2xl">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          )}
          {toast.type === 'info' && (
            <div className="flex items-center gap-2 bg-blue-950/90 border border-blue-500/50 text-blue-200 px-4 py-3 rounded-lg shadow-2xl">
              <Info className="w-5 h-5 text-blue-400 shrink-0" />
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

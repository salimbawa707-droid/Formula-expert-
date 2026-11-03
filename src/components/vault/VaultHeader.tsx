import React from 'react';
import {
  ShieldAlert,
  GitBranch,
  Layers,
  Database,
  FileCheck2,
  Terminal,
  Download,
  Upload,
  FlaskConical,
  DollarSign,
  FileSpreadsheet,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'roadmap'
  | 'engines'
  | 'evidence'
  | 'datasets'
  | 'audits'
  | 'prompts'
  | 'pricing'
  | 'backup';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onExportJSON: () => void;
  onOpenImport: () => void;
  onExportCSV?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onExportJSON,
  onOpenImport,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Project Dashboard', icon: Layers },
    { id: 'roadmap', label: 'Phase Roadmap', icon: GitBranch, badge: 'Phase 4B' },
    { id: 'engines', label: 'Engine Registry', icon: FlaskConical, badge: '59 Files' },
    { id: 'evidence', label: 'Evidence Vault', icon: Database, badge: '11 Leads' },
    { id: 'datasets', label: 'Dataset Register', icon: FileSpreadsheet, badge: '0 Inspected' },
    { id: 'audits', label: 'Forensic Audit Log', icon: FileCheck2 },
    { id: 'prompts', label: 'Prompt Library', icon: Terminal },
    { id: 'pricing', label: 'Pricing Integrity', icon: DollarSign, badge: 'Null Rule' },
    { id: 'backup', label: 'Backup & Export', icon: Download },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md sticky top-0 z-30">
      {/* Top Banner: Scientific Integrity Warning */}
      <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-b border-amber-900/40 px-4 py-1.5 text-xs text-amber-300/90 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-semibold text-amber-200">Scientific Remediation Notice:</span>
          <span>
            Independent research-management vault for repository{' '}
            <code className="bg-amber-950/80 px-1.5 py-0.5 rounded text-amber-300 font-mono text-[11px] border border-amber-700/50">
              salimbawa707-droid/Formula-expert-
            </code>
            . Subject repo is read-only; never modified.
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Phase 4B Active (OPEN)
          </span>
          <span className="text-slate-500">|</span>
          <span className="inline-flex items-center gap-1 text-red-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            Phase 5 Gated &amp; Locked
          </span>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-950/50 text-white font-bold border border-cyan-400/30">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                Detergent Formula Expert
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-800 rounded font-semibold">
                Scientific Vault v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Roadmap, Engine Inventory, Evidence Vault, Forensic Audits &amp; Numerical Dataset Register
            </p>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onExportJSON}
            aria-label="Export complete vault JSON backup"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export JSON
          </button>
          <button
            onClick={onOpenImport}
            aria-label="Import vault JSON backup"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition shadow-sm cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            Import Backup
          </button>
          <a
            href="https://github.com/salimbawa707-droid/Formula-expert-.git"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open subject repository in new tab"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-200 border border-cyan-700/60 transition shadow-sm"
          >
            <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-[11px]">Formula-expert-</span>
          </a>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav
          className="flex space-x-1 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800"
          aria-label="Application sections"
        >
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      tab.id === 'roadmap'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                        : tab.id === 'datasets'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

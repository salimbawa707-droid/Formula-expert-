import React, { useState } from 'react';
import {
  Terminal,
  Copy,
  Check,
  Search,
  Plus,
  Edit3,
} from 'lucide-react';
import { PromptRecord, VaultState } from '../../domain/vault/types';

interface PromptsViewProps {
  state: VaultState;
  onSelectPrompt?: (prompt: PromptRecord) => void;
  onAddPrompt: () => void;
}

export const PromptsView: React.FC<PromptsViewProps> = ({
  state,
  onAddPrompt,
  onSelectPrompt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredPrompts = state.prompts.filter(p => {
    return (
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phase.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Auditor &amp; Engineer Prompt Library
              </h2>
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                {state.prompts.length} Versioned Directives
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Reusable, reproducible prompt directives for dataset retrieval, engine reconciliation, and independent peer audits.
            </p>
          </div>

          <button
            onClick={onAddPrompt}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer self-start sm:self-auto shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Prompt Directive
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search prompt title, category, phase, or directives..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Prompts Cards */}
      <div className="space-y-4">
        {filteredPrompts.map(prompt => {
          const isCopied = copiedId === prompt.id;

          return (
            <div
              key={prompt.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 space-y-3 transition shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-800">
                    {prompt.id}
                  </span>
                  <span className="text-xs font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                    {prompt.phase}
                  </span>
                  <span className="text-xs text-slate-400">
                    {prompt.category} &bull; v{prompt.version}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(prompt.id, prompt.content)}
                    aria-label={`Copy prompt ${prompt.title} to clipboard`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      isCopied
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-emerald-400" /> Copy Prompt
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onSelectPrompt?.(prompt)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                    aria-label={`Edit prompt ${prompt.title}`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-100">{prompt.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  <strong>Intended Outcome:</strong> {prompt.intendedOutcome}
                </p>
              </div>

              {/* Prompt Content Monospace Box */}
              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 leading-relaxed">
                {prompt.content}
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Author: {prompt.author}</span>
                <span>Last Modified: {prompt.lastModified}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

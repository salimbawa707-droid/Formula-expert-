import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  ShieldCheck,
  Activity,
  Copy,
  Check,
  UserCheck,
  History,
  Lock,
  Unlock,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  collaborationManager,
  CollaborationSessionState,
  ChemistParticipant,
  FormulationChangeEvent
} from '../../services/collaborationService';

interface CollaborativeFormulaRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CollaborativeFormulaRoomModal: React.FC<CollaborativeFormulaRoomModalProps> = ({
  isOpen,
  onClose
}) => {
  const [sessionState, setSessionState] = useState<CollaborationSessionState>(collaborationManager.getSessionState());
  const [localChemist, setLocalChemist] = useState<ChemistParticipant>(collaborationManager.getLocalChemist());
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(localChemist.displayName);
  const [newRole, setNewRole] = useState(localChemist.role);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const unsub = collaborationManager.subscribe((newState) => {
      setSessionState(newState);
      setLocalChemist(collaborationManager.getLocalChemist());
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    collaborationManager.setChemistIdentity(newName.trim(), newRole);
    setIsEditingName(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#0c1424] border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-900 via-[#111f38] to-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
              <Users size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Multi-Chemist Real-Time Collaboration Suite
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  LIVE DOCS SYNC
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Concurrent multi-analyst formulation workspace with presence & live conflict-free audit logs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Active Chemists Avatars & Room Info */}
          <div className="bg-[#121d36]/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Users size={14} /> Active Chemists in Session ({sessionState.chemists.length})
              </span>
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1 cursor-pointer transition"
              >
                {copiedLink ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedLink ? 'Invite Copied!' : 'Share Room Link'}</span>
              </button>
            </div>

            {/* Chemist Avatars Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
              {sessionState.chemists.map((c) => {
                const isMe = c.id === localChemist.id;
                return (
                  <div
                    key={c.id}
                    className={`p-3 rounded-xl border flex items-center gap-3 ${
                      isMe
                        ? 'bg-cyan-950/40 border-cyan-500/50 shadow-sm'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm text-white shadow-md relative shrink-0"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.avatarLetter}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950"></span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-200 truncate flex items-center gap-1">
                        <span>{c.displayName}</span>
                        {isMe && <span className="text-[10px] text-cyan-400 font-mono">(You)</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{c.role}</div>
                      {c.currentField && (
                        <div className="text-[9px] text-amber-300 font-mono truncate flex items-center gap-0.5 mt-0.5">
                          <Lock size={9} /> Editing {c.currentField}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Identity Editor */}
          <div className="bg-[#121d36]/70 border border-slate-800 rounded-xl p-4">
            {!isEditingName ? (
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Current Analyst Profile: </span>
                  <span className="font-bold text-white">{localChemist.displayName}</span>
                  <span className="text-slate-400"> • </span>
                  <span className="text-cyan-300 font-semibold">{localChemist.role}</span>
                </div>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded cursor-pointer transition"
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveIdentity} className="space-y-3">
                <div className="text-xs font-bold text-slate-300">Update Analyst Profile</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Chemist Name</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      placeholder="e.g. Dr. Rajesh Kumar"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Laboratory Role</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="Lead Formulator">Lead Formulator</option>
                      <option value="QC Specialist">QC Specialist</option>
                      <option value="Process Engineer">Process Engineer</option>
                      <option value="Safety Auditor">Safety Auditor</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Live Synchronized Change Stream */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <History size={14} className="text-cyan-400" />
                Live Formulation Change Log & Audit Stream
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {sessionState.changeLog.length} events logged
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {sessionState.changeLog.map((evt) => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/80 text-xs flex items-start gap-2.5"
                >
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: evt.chemistColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-200">{evt.chemistName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-slate-300 text-[11px] mt-0.5">{evt.description}</div>
                    {evt.oldValue !== undefined && evt.newValue !== undefined && (
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        <span className="line-through text-slate-500">{evt.oldValue}</span> →{' '}
                        <span className="text-emerald-400 font-bold">{evt.newValue}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Real-time channel active: synchronizing ingredient changes across chemist devices</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition"
          >
            Close Room
          </button>
        </div>

      </div>
    </div>
  );
};

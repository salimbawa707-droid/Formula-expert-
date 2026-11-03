import { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Trash2, 
  Check, 
  Sparkles
} from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import SubscriptionPaywallModal from './SubscriptionPaywallModal';

export default function TeamManagementPanel() {
  const { profile, createTeamWorkspace, inviteTeamMember, removeTeamMember } = useSettingsStore();
  const [teamNameInput, setTeamNameInput] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'chemist' | 'viewer'>('chemist');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  const team = profile.teamWorkspace;
  const isTeamPlan = profile.plan === 'team';

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamNameInput) return;
    try {
      await createTeamWorkspace(teamNameInput);
      setSuccess('Team workspace created!');
      setTeamNameInput('');
    } catch (err: any) {
      setError(err?.message || 'Failed to create team.');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setError(null);
    setSuccess(null);
    try {
      await inviteTeamMember(inviteEmail, inviteRole);
      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
    } catch (err: any) {
      setError(err?.message || 'Failed to invite member.');
    }
  };

  if (!isTeamPlan) {
    return (
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 text-purple-500/10 pointer-events-none">
          <Users className="w-48 h-48" />
        </div>

        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Team & Factory Plan Feature
          </div>

          <h3 className="text-xl font-extrabold text-white">Multi-User R&D Collaboration Workspace</h3>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Share formula recipes, collaborate on lab notes, and unify inventory stock across up to 5 laboratory chemists and factory technicians.
          </p>

          <div className="mt-6 space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-purple-400" /> Central Shared Formula Repository
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-purple-400" /> Role-Based Permissions (Owner, Chemist, Viewer)
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-purple-400" /> Real-time Cloud Sync across factory workstations
            </div>
          </div>

          <button
            onClick={() => setIsPaywallOpen(true)}
            className="mt-6 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
          >
            Upgrade to Team Plan ($149/yr)
          </button>
        </div>

        <SubscriptionPaywallModal
          isOpen={isPaywallOpen}
          onClose={() => setIsPaywallOpen(false)}
          highlightedFeature="Multi-User Team Collaboration"
        />
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white">{team ? team.name : 'Create Team Workspace'}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Up to 5 members can share recipes, lab notes & inventory logs.
          </p>
        </div>

        {team && (
          <span className="text-xs font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 px-3 py-1 rounded-full font-semibold">
            {team.members.length} / 5 Members
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-lg">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-lg">{success}</div>
      )}

      {!team ? (
        <form onSubmit={handleCreateTeam} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Team or Laboratory Name</label>
            <input
              type="text"
              required
              value={teamNameInput}
              onChange={(e) => setTeamNameInput(e.target.value)}
              placeholder="e.g. Apex Clean Tech R&D Lab"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all"
          >
            Create Team Workspace
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Invite Form */}
          {team.members.length < 5 && (
            <form onSubmit={handleInvite} className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-400" /> Invite Chemist or Technician
              </h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@factory-lab.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
                >
                  <option value="chemist">Chemist (Edit & Save)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-all"
                >
                  Send Invite
                </button>
              </div>
            </form>
          )}

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3">Member</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {team.members.map((member) => (
                  <tr key={member.email} className="hover:bg-slate-800/30">
                    <td className="p-3">
                      <div className="font-semibold text-white">{member.name || member.email}</div>
                      <div className="text-[10px] text-slate-400">{member.email}</div>
                    </td>
                    <td className="p-3 uppercase font-mono text-[10px] font-bold text-purple-300">
                      {member.role}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          member.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {member.role !== 'owner' && (
                        <button
                          onClick={() => removeTeamMember(member.email)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

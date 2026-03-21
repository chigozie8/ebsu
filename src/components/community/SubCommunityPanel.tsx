import React, { useEffect, useState } from 'react';
import { Plus, Users, Check, X, Hash } from 'lucide-react';
import { useSubCommunities, useSubCommunityActions, SubCommunity } from '../../hooks/useCommunity';

interface SubCommunityPanelProps {
  userId: string;
  userName: string;
  userAvatar?: string;
  onSelect: (sub: SubCommunity | null) => void;
  selectedId?: string;
}

const COLORS = [
  { label: 'Teal',    value: '#14b8a6' },
  { label: 'Blue',    value: '#3b82f6' },
  { label: 'Pink',    value: '#ec4899' },
  { label: 'Amber',   value: '#f59e0b' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Violet',  value: '#8b5cf6' },
];

const SubCommunityPanel: React.FC<SubCommunityPanelProps> = ({
  userId, userName, userAvatar, onSelect, selectedId,
}) => {
  const { subCommunities, loading } = useSubCommunities();
  const { joinSubCommunity, leaveSubCommunity, createSubCommunity, getUserMemberships } = useSubCommunityActions();

  const [memberships, setMemberships] = useState<string[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState('#14b8a6');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!userId) return;
    getUserMemberships(userId).then(setMemberships);
  }, [userId, getUserMemberships]);

  const handleJoinLeave = async (sub: SubCommunity) => {
    const isMember = memberships.includes(sub.id);
    if (isMember) {
      await leaveSubCommunity(sub.id, userId);
      setMemberships((p) => p.filter((id) => id !== sub.id));
      if (selectedId === sub.id) onSelect(null);
    } else {
      await joinSubCommunity(sub.id, userId, userName, userAvatar);
      setMemberships((p) => [...p, sub.id]);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createSubCommunity(newName.trim(), newDesc.trim(), newColor, 'General', userId);
      setNewName('');
      setNewDesc('');
      setNewColor('#14b8a6');
      setShowCreate(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-teal-500" />
          <span className="text-sm font-bold text-slate-800">Sub-communities</span>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 transition-colors"
          title="Create a sub-community"
        >
          <Plus className="w-4 h-4 text-teal-600" />
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="px-4 py-3 bg-teal-50 border-b border-teal-100 space-y-2">
          <p className="text-xs font-bold text-teal-700 mb-2">New Sub-community</p>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name (required)"
            className="w-full px-3 py-2 text-xs border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
          />
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Short description"
            className="w-full px-3 py-2 text-xs border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
          />
          {/* Color picker */}
          <div className="flex gap-1.5 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setNewColor(c.value)}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  newColor === c.value ? 'border-slate-800 scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="flex-1 py-1.5 bg-teal-500 text-white text-xs rounded-xl font-semibold hover:bg-teal-600 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs rounded-xl hover:bg-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
        {/* All (reset filter) */}
        <button
          onClick={() => onSelect(null)}
          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left ${
            !selectedId ? 'bg-teal-50' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center flex-shrink-0">
            <Hash className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">All Posts</p>
            <p className="text-xs text-slate-400">Browse the main feed</p>
          </div>
          {!selectedId && <Check className="w-4 h-4 text-teal-500 flex-shrink-0" />}
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : subCommunities.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-4">No sub-communities yet</p>
        ) : (
          subCommunities.map((sub) => {
            const isMember = memberships.includes(sub.id);
            const isSelected = selectedId === sub.id;
            return (
              <div
                key={sub.id}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${
                  isSelected ? 'bg-teal-50' : ''
                }`}
              >
                {/* Color dot */}
                <button
                  onClick={() => onSelect(isSelected ? null : sub)}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                  style={{ backgroundColor: sub.color }}
                >
                  {sub.name.charAt(0).toUpperCase()}
                </button>

                <button
                  onClick={() => onSelect(isSelected ? null : sub)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="text-sm font-semibold text-slate-800 truncate">{sub.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-400">{sub.member_count} members</span>
                  </div>
                </button>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isSelected && <Check className="w-4 h-4 text-teal-500" />}
                  <button
                    onClick={() => handleJoinLeave(sub)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                      isMember
                        ? 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600'
                        : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                    }`}
                  >
                    {isMember ? 'Leave' : 'Join'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SubCommunityPanel;

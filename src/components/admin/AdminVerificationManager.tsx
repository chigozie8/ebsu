import React, { useState, useMemo } from 'react';
import { Search, ShieldCheck, ShieldOff, Loader, RefreshCw, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useAllUserProfiles, useToggleVerification } from '../../hooks/useDirectMessages';
import VerifiedBadge from '../community/VerifiedBadge';
import toast from 'react-hot-toast';

const AVATAR_COLORS = [
  'from-teal-400 to-cyan-400',
  'from-blue-400 to-indigo-400',
  'from-pink-400 to-rose-400',
  'from-amber-400 to-orange-400',
  'from-emerald-400 to-teal-400',
];
function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

const AdminVerificationManager: React.FC = () => {
  const { profiles, loading, refetch } = useAllUserProfiles();
  const { toggle } = useToggleVerification();
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [communityFilter, setCommunityFilter] = useState<string>('all');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Build unique community list from all profiles
  const allCommunities = useMemo(() => {
    const map = new Map<string, string>();
    profiles.forEach((p) => {
      p.communities.forEach((c) => {
        if (!map.has(c.community_id)) map.set(c.community_id, c.community_name);
      });
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [profiles]);

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      const matchSearch =
        p.display_name.toLowerCase().includes(search.toLowerCase()) ||
        p.user_id.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === 'all' ||
        (filter === 'verified' && p.is_verified) ||
        (filter === 'unverified' && !p.is_verified);
      const matchCommunity =
        communityFilter === 'all' ||
        p.communities.some((c) => c.community_id === communityFilter);
      return matchSearch && matchFilter && matchCommunity;
    });
  }, [profiles, search, filter, communityFilter]);

  const handleToggle = async (userId: string, current: boolean) => {
    setToggling(userId);
    const ok = await toggle(userId, current);
    if (ok) {
      toast.success(current ? 'Verification removed.' : 'User verified!', {
        style: { background: current ? '#ef4444' : '#25D366', color: '#fff', fontWeight: '600' },
      });
      refetch();
    } else {
      toast.error('Failed to update verification.');
    }
    setToggling(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#53bdeb]" />
            Verification Manager
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Verify users who have joined any community.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{profiles.length} users synced</span>
          <button
            onClick={refetch}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or user ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366]"
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Verification filter */}
        <div className="flex gap-1.5">
          {(['all', 'verified', 'unverified'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all capitalize ${
                filter === f
                  ? 'bg-[#25D366] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Community filter */}
        <div className="flex-1">
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <select
              value={communityFilter}
              onChange={(e) => setCommunityFilter(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366] bg-white appearance-none"
            >
              <option value="all">All Communities</option>
              {allCommunities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
          <p className="text-xl font-bold text-gray-900">{profiles.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Users</p>
        </div>
        <div className="bg-[#f0fdf4] rounded-xl p-3 text-center border border-[#25D366]/20">
          <p className="text-xl font-bold text-[#128C7E]">{profiles.filter((p) => p.is_verified).length}</p>
          <p className="text-xs text-[#128C7E] mt-0.5">Verified</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
          <p className="text-xl font-bold text-gray-600">{profiles.filter((p) => !p.is_verified).length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Unverified</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader className="w-6 h-6 animate-spin text-[#25D366]" />
            <p className="text-sm text-gray-500">Loading profiles…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <ShieldCheck className="w-10 h-10 text-gray-200" />
            <p className="text-sm text-gray-500">No profiles found.</p>
            <p className="text-xs text-gray-400">
              {communityFilter !== 'all'
                ? 'No users have joined this community yet.'
                : 'Users appear here once they log into the community.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-5">User</div>
              <div className="col-span-2 hidden sm:block">Status</div>
              <div className="col-span-3 hidden sm:block">Communities</div>
              <div className="col-span-4 sm:col-span-2 text-right">Action</div>
            </div>

            {filtered.map((profile) => {
              const gradient = getAvatarColor(profile.display_name);
              const initials = getInitials(profile.display_name);
              const isExpanded = expandedUser === profile.user_id;

              return (
                <div key={profile.user_id} className="divide-y divide-gray-50">
                  <div className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-gray-50/80 transition-colors">
                    {/* User */}
                    <div className="col-span-5 flex items-center gap-3 min-w-0">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.display_name}
                          crossOrigin="anonymous"
                          className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-2 ring-gray-100`}>
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-gray-900 truncate">{profile.display_name}</p>
                          {profile.is_verified && <VerifiedBadge size="sm" />}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-xs text-gray-400 truncate">{profile.user_id.slice(0, 14)}…</p>
                          {/* Communities count badge — visible on mobile */}
                          {profile.communities.length > 0 && (
                            <button
                              onClick={() => setExpandedUser(isExpanded ? null : profile.user_id)}
                              className="sm:hidden flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-semibold"
                            >
                              <Users className="w-2.5 h-2.5" />
                              {profile.communities.length}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status — desktop */}
                    <div className="col-span-2 hidden sm:block">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        profile.is_verified
                          ? 'bg-[#e8f8f0] text-[#128C7E]'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {profile.is_verified ? (
                          <><ShieldCheck className="w-3 h-3" /> Verified</>
                        ) : (
                          <><ShieldOff className="w-3 h-3" /> None</>
                        )}
                      </span>
                    </div>

                    {/* Communities — desktop */}
                    <div className="col-span-3 hidden sm:flex items-center gap-1 flex-wrap">
                      {profile.communities.length === 0 ? (
                        <span className="text-xs text-gray-400 italic">No communities</span>
                      ) : (
                        <>
                          {profile.communities.slice(0, 2).map((c) => (
                            <span
                              key={c.community_id}
                              className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-semibold truncate max-w-[80px]"
                              title={c.community_name}
                            >
                              {c.community_name}
                            </span>
                          ))}
                          {profile.communities.length > 2 && (
                            <button
                              onClick={() => setExpandedUser(isExpanded ? null : profile.user_id)}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-semibold hover:bg-gray-200 transition-colors"
                            >
                              +{profile.communities.length - 2}
                              {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                            </button>
                          )}
                          {profile.communities.length <= 2 && profile.communities.length > 0 && (
                            <button
                              onClick={() => setExpandedUser(isExpanded ? null : profile.user_id)}
                              className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Action */}
                    <div className="col-span-4 sm:col-span-2 flex justify-end">
                      <button
                        onClick={() => handleToggle(profile.user_id, profile.is_verified)}
                        disabled={toggling === profile.user_id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${
                          profile.is_verified
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                            : 'bg-[#f0fdf4] text-[#128C7E] hover:bg-[#dcf8c6] border border-[#25D366]/30'
                        }`}
                      >
                        {toggling === profile.user_id ? (
                          <Loader className="w-3.5 h-3.5 animate-spin" />
                        ) : profile.is_verified ? (
                          <><ShieldOff className="w-3.5 h-3.5" /> Revoke</>
                        ) : (
                          <><ShieldCheck className="w-3.5 h-3.5" /> Verify</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded community details */}
                  {isExpanded && profile.communities.length > 0 && (
                    <div className="px-5 py-3 bg-blue-50/40">
                      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                        Joined Communities ({profile.communities.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {profile.communities.map((c) => (
                          <div
                            key={c.community_id}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-lg border border-blue-100 shadow-sm"
                          >
                            <Users className="w-3 h-3 text-blue-500 flex-shrink-0" />
                            <span className="text-xs font-semibold text-gray-800">{c.community_name}</span>
                            <span className="text-[10px] text-gray-400">
                              · {new Date(c.joined_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVerificationManager;

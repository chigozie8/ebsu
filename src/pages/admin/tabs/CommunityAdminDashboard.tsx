import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users, MessageSquare, Shield, ShieldCheck, ShieldOff, Search, Trash2,
  Pin, Eye, EyeOff, RefreshCw, Loader2, Bell, BellOff, UserCheck, UserX,
  Mail, Send, ChevronDown, ChevronUp, Settings, AlertTriangle, Ban,
} from 'lucide-react';
import {
  collection, query, getDocs, doc, updateDoc, deleteDoc, where,
  onSnapshot, orderBy, serverTimestamp, addDoc, writeBatch,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import toast from 'react-hot-toast';
import VerifiedBadge from '../../../components/community/VerifiedBadge';

// Types
interface CommunityMember {
  id: string;
  user_id: string;
  community_id: string;
  community_name?: string;
  joined_at: string;
  user_name?: string;
  user_avatar?: string;
  is_verified?: boolean;
}

interface CommunityMessage {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  message: string;
  community_id: string;
  created_at: string;
  is_pinned: boolean;
  is_deleted: boolean;
  reply_count: number;
  likes_count: number;
}

interface UserProfile {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  is_verified: boolean;
  online_status: string;
  last_seen: string;
}

interface CommunityGroup {
  id: string;
  name: string;
  slug: string;
  member_count: number;
  post_count: number;
  is_active: boolean;
}

// Avatar helpers
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
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// Subcomponents
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number; color: string }> = ({ icon, label, value, color }) => (
  <div className={`rounded-2xl p-4 border ${color}`}>
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-white/80">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  </div>
);

const CommunityAdminDashboard: React.FC = () => {
  // State
  const [activeSection, setActiveSection] = useState<'overview' | 'members' | 'posts' | 'verification' | 'broadcast'>('overview');
  const [loading, setLoading] = useState(true);
  const [communities, setCommunities] = useState<CommunityGroup[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string>('all');
  
  // Search and filters
  const [memberSearch, setMemberSearch] = useState('');
  const [postSearch, setPostSearch] = useState('');
  const [verifySearch, setVerifySearch] = useState('');
  const [verifyFilter, setVerifyFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  
  // Action states
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTitle, setBroadcastTitle] = useState('');

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load communities
      const commSnap = await getDocs(collection(db, 'communities'));
      const comms = commSnap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityGroup));
      setCommunities(comms);

      // Load all memberships
      const membSnap = await getDocs(collection(db, 'community_memberships'));
      const mems = membSnap.docs.map(d => {
        const data = d.data();
        const comm = comms.find(c => c.id === data.community_id);
        return {
          id: d.id,
          user_id: data.user_id,
          community_id: data.community_id,
          community_name: comm?.name,
          joined_at: data.joined_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as CommunityMember;
      });
      setMembers(mems);

      // Load all messages (limit to recent 500)
      const msgSnap = await getDocs(query(
        collection(db, 'community_messages'),
        orderBy('created_at', 'desc')
      ));
      const msgs = msgSnap.docs.slice(0, 500).map(d => {
        const data = d.data();
        return {
          id: d.id,
          user_id: data.user_id,
          user_name: data.user_name || 'Unknown',
          user_avatar: data.user_avatar,
          message: data.message || '',
          community_id: data.community_id,
          created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          is_pinned: data.is_pinned || false,
          is_deleted: data.is_deleted || false,
          reply_count: data.reply_count || 0,
          likes_count: data.likes_count || 0,
        } as CommunityMessage;
      });
      setMessages(msgs);

      // Load user profiles for verification
      const profSnap = await getDocs(collection(db, 'user_verification'));
      const profs = profSnap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          user_id: data.user_id,
          user_name: data.user_name || 'Unknown',
          user_avatar: data.user_avatar,
          is_verified: data.is_verified || false,
          online_status: data.online_status || 'offline',
          last_seen: data.last_seen?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as UserProfile;
      });
      setProfiles(profs);
    } catch (err) {
      console.error('[CommunityAdminDashboard] load error:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Computed stats
  const stats = useMemo(() => ({
    totalCommunities: communities.length,
    totalMembers: members.length,
    uniqueMembers: new Set(members.map(m => m.user_id)).size,
    totalPosts: messages.filter(m => !m.is_deleted).length,
    pinnedPosts: messages.filter(m => m.is_pinned).length,
    verifiedUsers: profiles.filter(p => p.is_verified).length,
    onlineUsers: profiles.filter(p => p.online_status === 'online').length,
  }), [communities, members, messages, profiles]);

  // Filtered data
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchSearch = memberSearch 
        ? m.user_id.toLowerCase().includes(memberSearch.toLowerCase()) ||
          m.community_name?.toLowerCase().includes(memberSearch.toLowerCase())
        : true;
      const matchCommunity = selectedCommunity === 'all' || m.community_id === selectedCommunity;
      return matchSearch && matchCommunity;
    });
  }, [members, memberSearch, selectedCommunity]);

  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      const matchSearch = postSearch 
        ? m.message.toLowerCase().includes(postSearch.toLowerCase()) ||
          m.user_name.toLowerCase().includes(postSearch.toLowerCase())
        : true;
      const matchCommunity = selectedCommunity === 'all' || m.community_id === selectedCommunity;
      return matchSearch && matchCommunity && !m.is_deleted;
    });
  }, [messages, postSearch, selectedCommunity]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      const matchSearch = verifySearch 
        ? p.user_name.toLowerCase().includes(verifySearch.toLowerCase()) ||
          p.user_id.toLowerCase().includes(verifySearch.toLowerCase())
        : true;
      const matchFilter = verifyFilter === 'all' ||
        (verifyFilter === 'verified' && p.is_verified) ||
        (verifyFilter === 'unverified' && !p.is_verified);
      return matchSearch && matchFilter;
    });
  }, [profiles, verifySearch, verifyFilter]);

  // Actions
  const toggleVerification = async (userId: string, current: boolean) => {
    setToggling(userId);
    try {
      const q = query(collection(db, 'user_verification'), where('user_id', '==', userId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, {
          is_verified: !current,
          updated_at: serverTimestamp(),
        });
        setProfiles(prev => prev.map(p => 
          p.user_id === userId ? { ...p, is_verified: !current } : p
        ));
        toast.success(current ? 'Verification removed' : 'User verified!');
      }
    } catch (err) {
      console.error('[toggleVerification] error:', err);
      toast.error('Failed to update verification');
    } finally {
      setToggling(null);
    }
  };

  const deletePost = async (postId: string) => {
    setDeleting(postId);
    try {
      await updateDoc(doc(db, 'community_messages', postId), {
        is_deleted: true,
        updated_at: serverTimestamp(),
      });
      setMessages(prev => prev.map(m => 
        m.id === postId ? { ...m, is_deleted: true } : m
      ));
      toast.success('Post deleted');
    } catch (err) {
      console.error('[deletePost] error:', err);
      toast.error('Failed to delete post');
    } finally {
      setDeleting(null);
    }
  };

  const togglePin = async (postId: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'community_messages', postId), {
        is_pinned: !current,
        updated_at: serverTimestamp(),
      });
      setMessages(prev => prev.map(m => 
        m.id === postId ? { ...m, is_pinned: !current } : m
      ));
      toast.success(current ? 'Post unpinned' : 'Post pinned');
    } catch (err) {
      console.error('[togglePin] error:', err);
      toast.error('Failed to update pin status');
    }
  };

  const removeMember = async (membershipId: string, userId: string, communityId: string) => {
    setDeleting(membershipId);
    try {
      await deleteDoc(doc(db, 'community_memberships', membershipId));
      // Update community member count
      const commRef = doc(db, 'communities', communityId);
      const comm = communities.find(c => c.id === communityId);
      if (comm) {
        await updateDoc(commRef, { member_count: Math.max(0, comm.member_count - 1) });
      }
      setMembers(prev => prev.filter(m => m.id !== membershipId));
      toast.success('Member removed');
    } catch (err) {
      console.error('[removeMember] error:', err);
      toast.error('Failed to remove member');
    } finally {
      setDeleting(null);
    }
  };

  const sendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error('Please enter title and message');
      return;
    }
    setBroadcasting(true);
    try {
      // Get all unique user IDs from memberships
      const targetCommunity = selectedCommunity === 'all' ? null : selectedCommunity;
      const targetMembers = targetCommunity 
        ? members.filter(m => m.community_id === targetCommunity)
        : members;
      const uniqueUserIds = [...new Set(targetMembers.map(m => m.user_id))];

      // Create notifications for all users
      const batch = writeBatch(db);
      for (const userId of uniqueUserIds) {
        const notifRef = doc(collection(db, 'notifications'));
        batch.set(notifRef, {
          userId,
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          type: 'info',
          createdAt: serverTimestamp(),
          read: false,
          link: '/u/community',
        });
      }
      await batch.commit();
      
      toast.success(`Broadcast sent to ${uniqueUserIds.length} users!`);
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch (err) {
      console.error('[sendBroadcast] error:', err);
      toast.error('Failed to send broadcast');
    } finally {
      setBroadcasting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
        <p className="text-gray-500 text-sm">Loading community data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#075E54]" />
            Community Admin Dashboard
          </h2>
          <p className="text-sm text-gray-500 mt-1">Full control over all community activities</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-[#075E54] text-white rounded-xl text-sm font-semibold hover:bg-[#064d45] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </button>
      </div>

      {/* Community Filter */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
          Filter by Community
        </label>
        <select
          value={selectedCommunity}
          onChange={(e) => setSelectedCommunity(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366] bg-white"
        >
          <option value="all">All Communities</option>
          {communities.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.member_count} members)</option>
          ))}
        </select>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { key: 'overview', label: 'Overview', icon: Eye },
          { key: 'members', label: 'Members', icon: Users },
          { key: 'posts', label: 'Posts', icon: MessageSquare },
          { key: 'verification', label: 'Verification', icon: ShieldCheck },
          { key: 'broadcast', label: 'Broadcast', icon: Bell },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key as typeof activeSection)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              activeSection === tab.key
                ? 'bg-[#25D366] text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW SECTION */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              icon={<Users className="w-5 h-5 text-blue-600" />}
              label="Total Members"
              value={stats.uniqueMembers}
              color="bg-blue-50 border-blue-200"
            />
            <StatCard
              icon={<MessageSquare className="w-5 h-5 text-green-600" />}
              label="Total Posts"
              value={stats.totalPosts}
              color="bg-green-50 border-green-200"
            />
            <StatCard
              icon={<ShieldCheck className="w-5 h-5 text-teal-600" />}
              label="Verified Users"
              value={stats.verifiedUsers}
              color="bg-teal-50 border-teal-200"
            />
            <StatCard
              icon={<Pin className="w-5 h-5 text-amber-600" />}
              label="Pinned Posts"
              value={stats.pinnedPosts}
              color="bg-amber-50 border-amber-200"
            />
          </div>

          {/* Community breakdown */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Community Breakdown</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {communities.map(comm => {
                const commMembers = members.filter(m => m.community_id === comm.id).length;
                const commPosts = messages.filter(m => m.community_id === comm.id && !m.is_deleted).length;
                return (
                  <div key={comm.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-900">{comm.name}</p>
                      <p className="text-xs text-gray-500">/{comm.slug}</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Users className="w-4 h-4" />
                        {commMembers}
                      </span>
                      <span className="flex items-center gap-1 text-gray-600">
                        <MessageSquare className="w-4 h-4" />
                        {commPosts}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MEMBERS SECTION */}
      {activeSection === 'members' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user ID or community..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40"
            />
          </div>

          {/* Members list */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Members ({filteredMembers.length})</h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100">
              {filteredMembers.length === 0 ? (
                <div className="px-5 py-10 text-center text-gray-500">No members found</div>
              ) : (
                filteredMembers.slice(0, 100).map(member => (
                  <div key={member.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(member.user_id)} flex items-center justify-center text-white text-xs font-bold`}>
                        {getInitials(member.user_id)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{member.user_id.slice(0, 20)}...</p>
                        <p className="text-xs text-gray-500">{member.community_name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeMember(member.id, member.user_id, member.community_id)}
                      disabled={deleting === member.id}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deleting === member.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserX className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* POSTS SECTION */}
      {activeSection === 'posts' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts by content or author..."
              value={postSearch}
              onChange={(e) => setPostSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40"
            />
          </div>

          {/* Posts list */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Posts ({filteredMessages.length})</h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100">
              {filteredMessages.length === 0 ? (
                <div className="px-5 py-10 text-center text-gray-500">No posts found</div>
              ) : (
                filteredMessages.slice(0, 50).map(msg => (
                  <div key={msg.id} className="px-5 py-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {msg.user_avatar ? (
                          <img src={msg.user_avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(msg.user_name)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {getInitials(msg.user_name)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900">{msg.user_name}</p>
                            {msg.is_pinned && <Pin className="w-3 h-3 text-amber-500" />}
                          </div>
                          <p className="text-sm text-gray-700 mt-0.5 line-clamp-2">{msg.message}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                            <span>{new Date(msg.created_at).toLocaleDateString()}</span>
                            <span>{msg.reply_count} replies</span>
                            <span>{msg.likes_count} likes</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => togglePin(msg.id, msg.is_pinned)}
                          className={`p-2 rounded-lg transition-colors ${msg.is_pinned ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:bg-gray-100'}`}
                        >
                          <Pin className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deletePost(msg.id)}
                          disabled={deleting === msg.id}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deleting === msg.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* VERIFICATION SECTION */}
      {activeSection === 'verification' && (
        <div className="space-y-4">
          {/* Search and filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={verifySearch}
                onChange={(e) => setVerifySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'verified', 'unverified'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setVerifyFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                    verifyFilter === f
                      ? 'bg-[#25D366] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <p className="text-xl font-bold text-gray-900">{profiles.length}</p>
              <p className="text-xs text-gray-500">Total Users</p>
            </div>
            <div className="bg-[#f0fdf4] rounded-xl p-3 text-center border border-[#25D366]/20">
              <p className="text-xl font-bold text-[#128C7E]">{stats.verifiedUsers}</p>
              <p className="text-xs text-[#128C7E]">Verified</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <p className="text-xl font-bold text-gray-600">{profiles.length - stats.verifiedUsers}</p>
              <p className="text-xs text-gray-500">Unverified</p>
            </div>
          </div>

          {/* Users list */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Users ({filteredProfiles.length})</h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100">
              {filteredProfiles.length === 0 ? (
                <div className="px-5 py-10 text-center text-gray-500">No users found</div>
              ) : (
                filteredProfiles.map(profile => (
                  <div key={profile.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      {profile.user_avatar ? (
                        <img src={profile.user_avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(profile.user_name)} flex items-center justify-center text-white text-sm font-bold`}>
                          {getInitials(profile.user_name)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-gray-900">{profile.user_name}</p>
                          {profile.is_verified && <VerifiedBadge size="sm" />}
                        </div>
                        <p className="text-xs text-gray-500">{profile.user_id.slice(0, 20)}...</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleVerification(profile.user_id, profile.is_verified)}
                      disabled={toggling === profile.user_id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${
                        profile.is_verified
                          ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                          : 'bg-[#f0fdf4] text-[#128C7E] hover:bg-[#dcf8c6] border border-[#25D366]/30'
                      }`}
                    >
                      {toggling === profile.user_id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : profile.is_verified ? (
                        <><ShieldOff className="w-3.5 h-3.5" /> Revoke</>
                      ) : (
                        <><ShieldCheck className="w-3.5 h-3.5" /> Verify</>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* BROADCAST SECTION */}
      {activeSection === 'broadcast' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-[#f0fdf4]">
                <Bell className="w-5 h-5 text-[#25D366]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Send Broadcast Notification</h3>
                <p className="text-sm text-gray-500">
                  {selectedCommunity === 'all' 
                    ? `Notify all ${stats.uniqueMembers} community members`
                    : `Notify members of selected community`
                  }
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Title</label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="Notification title..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Message</label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 resize-none"
                />
              </div>
              <button
                onClick={sendBroadcast}
                disabled={broadcasting || !broadcastTitle.trim() || !broadcastMessage.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-xl font-semibold hover:bg-[#1da855] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {broadcasting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Broadcast
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Important</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Broadcasts are sent as push notifications to all users. Use this feature responsibly to avoid spamming users.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityAdminDashboard;

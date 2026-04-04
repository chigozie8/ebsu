import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import {
  collection, query, orderBy, getDocs, getDoc,
  doc, updateDoc, addDoc, deleteDoc, where, onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import {
  MessageCircle, Trash2, Search, Edit2, Send, Check, Pin,
  Users, Shield, ShieldCheck, ShieldOff, RefreshCw, Loader2,
  AlertTriangle, X, CheckCircle2, Hash, Plus, Settings,
  ChevronDown, ChevronUp, Eye, EyeOff, BadgeCheck,
} from 'lucide-react';
import { CommunityGroup } from '../../../hooks/useCommunities';
import { Community } from '../../../hooks/useCommunities';
import {
  useAllUserProfiles, useToggleVerification,
  UserVerification, useVerifyByEmail,
} from '../../../hooks/usePrivateChat';
import VerifiedBadge from '../../../components/community/VerifiedBadge';

// ── helpers ────────────────────────────────────────────────────────────────

function toStr(ts: unknown): string {
  if (!ts) return new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (ts as any).toDate === 'function') return (ts as any).toDate().toISOString();
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

const AVATAR_COLORS = [
  'from-teal-400 to-cyan-500',
  'from-blue-400 to-indigo-500',
  'from-pink-400 to-rose-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-violet-400 to-purple-500',
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
}

function Avatar({ name, src, size = 36 }: { name: string; src?: string; size?: number }) {
  const [err, setErr] = useState(false);
  const g = avatarColor(name);
  const ini = initials(name);
  return (
    <div
      className="flex-shrink-0 rounded-full overflow-hidden"
      style={{ width: size, height: size }}
    >
      {src && !err ? (
        <img src={src} alt={name} crossOrigin="anonymous" className="w-full h-full object-cover" onError={() => setErr(true)} />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${g} flex items-center justify-center text-white font-bold`} style={{ fontSize: size * 0.36 }}>
          {ini}
        </div>
      )}
    </div>
  );
}

// ── Tabs ───────────────────────────────────────────────────────────────────

type AdminTab = 'communities' | 'messages' | 'verification';

// ─────────────────────────────────────────────────────────────────────────────
// COMMUNITY GROUPS MANAGER
// ─────────────────────────────────────────────────────────────────────────────

function CommunitiesManager() {
  const [communities, setCommunities] = useState<CommunityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', slug: '', description: '', icon: '💬', color: '#075E54',
  });

  const loadCommunities = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'communities'));
      const groups: CommunityGroup[] = snap.docs.map((d) => ({
        id: d.id,
        name: (d.data().name as string) || '',
        slug: (d.data().slug as string) || '',
        description: (d.data().description as string) || '',
        icon: (d.data().icon as string) || '💬',
        color: (d.data().color as string) || '#075E54',
        banner_url: d.data().banner_url as string | undefined,
        member_count: (d.data().member_count as number) || 0,
        post_count: (d.data().post_count as number) || 0,
        is_active: (d.data().is_active as boolean) ?? true,
        created_at: toStr(d.data().created_at),
        updated_at: toStr(d.data().updated_at),
      }));
      groups.sort((a, b) => a.name.localeCompare(b.name));
      setCommunities(groups);
    } catch {
      toast.error('Failed to load communities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCommunities(); }, [loadCommunities]);

  const openNew = () => {
    setEditingId(null);
    setForm({ name: '', slug: '', description: '', icon: '💬', color: '#075E54' });
    setShowForm(true);
  };

  const openEdit = (c: CommunityGroup) => {
    setEditingId(c.id);
    setForm({ name: c.name, slug: c.slug, description: c.description, icon: c.icon, color: c.color });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.slug.trim()) { toast.error('Name and slug are required'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'communities', editingId), {
          name: form.name.trim(),
          slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
          description: form.description.trim(),
          icon: form.icon,
          color: form.color,
          updated_at: serverTimestamp(),
        });
        toast.success('Community updated!');
      } else {
        await addDoc(collection(db, 'communities'), {
          name: form.name.trim(),
          slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
          description: form.description.trim(),
          icon: form.icon,
          color: form.color,
          member_count: 0,
          post_count: 0,
          is_active: true,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        toast.success('Community created!');
      }
      setShowForm(false);
      loadCommunities();
    } catch {
      toast.error('Failed to save community');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: CommunityGroup) => {
    try {
      await updateDoc(doc(db, 'communities', c.id), { is_active: !c.is_active, updated_at: serverTimestamp() });
      toast.success(c.is_active ? 'Community hidden' : 'Community visible');
      loadCommunities();
    } catch {
      toast.error('Failed to update');
    }
  };

  const deleteCommunity = async (id: string) => {
    if (!window.confirm('Delete this community and all its messages? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      // Delete all messages in this community
      const msgs = await getDocs(query(collection(db, 'community_messages'), where('community_id', '==', id)));
      await Promise.all(msgs.docs.map((d) => deleteDoc(d.ref)));
      // Delete memberships
      const mems = await getDocs(query(collection(db, 'community_memberships'), where('community_id', '==', id)));
      await Promise.all(mems.docs.map((d) => deleteDoc(d.ref)));
      await deleteDoc(doc(db, 'communities', id));
      toast.success('Community deleted');
      loadCommunities();
    } catch {
      toast.error('Failed to delete community');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-gray-900">Community Groups</h3>
          <p className="text-xs text-gray-500 mt-0.5">Create, edit, and manage all community channels</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
          style={{ background: '#075E54' }}
        >
          <Plus className="w-4 h-4" />
          New Community
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-[#f0fdf4] border border-[#25D366]/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 text-sm">
              {editingId ? 'Edit Community' : 'New Community'}
            </h4>
            <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Academics"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Slug *</label>
              <input
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                placeholder="e.g. academics"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="What is this community about?"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#25D366]/40"
                rows={2}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Icon (emoji)</label>
              <input
                value={form.icon}
                onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
                placeholder="💬"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                />
                <span className="text-sm text-gray-600 font-mono">{form.color}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-colors"
              style={{ background: '#075E54' }}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Community list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#25D366]" />
        </div>
      ) : communities.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">No communities found.</div>
      ) : (
        <div className="space-y-3">
          {communities.map((c) => (
            <div
              key={c.id}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                c.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'
              }`}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: c.color + '22' }}
              >
                {c.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-[15px] truncate">{c.name}</span>
                  {!c.is_active && (
                    <span className="text-[10px] font-bold bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">HIDDEN</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {c.member_count}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {c.post_count}
                  </span>
                  <span className="text-xs font-mono text-gray-400">/{c.slug}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(c)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  title={c.is_active ? 'Hide community' : 'Show community'}
                >
                  {c.is_active ? <Eye className="w-4 h-4 text-gray-500" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                </button>
                <button
                  onClick={() => openEdit(c)}
                  className="p-2 rounded-xl hover:bg-blue-50 transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4 text-blue-500" />
                </button>
                <button
                  onClick={() => deleteCommunity(c.id)}
                  disabled={deletingId === c.id}
                  className="p-2 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Delete community"
                >
                  {deletingId === c.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-red-400" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGES MANAGER
// ─────────────────────────────────────────────────────────────────────────────

function MessagesManager() {
  const [communities, setCommunities] = useState<CommunityGroup[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string>('all');
  const [messages, setMessages] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [posting, setPosting] = useState(false);
  const [pinnedOnly, setPinnedOnly] = useState(false);

  // Load communities for the filter dropdown
  useEffect(() => {
    getDocs(collection(db, 'communities')).then((snap) => {
      const groups = snap.docs.map((d) => ({
        id: d.id,
        name: (d.data().name as string) || '',
        slug: (d.data().slug as string) || '',
        description: '', icon: '💬', color: '#075E54',
        banner_url: undefined,
        member_count: (d.data().member_count as number) || 0,
        post_count: (d.data().post_count as number) || 0,
        is_active: true,
        created_at: '', updated_at: '',
      } as CommunityGroup));
      groups.sort((a, b) => a.name.localeCompare(b.name));
      setCommunities(groups);
    });
  }, []);

  // Real-time listener for messages
  useEffect(() => {
    setLoading(true);
    const ref = collection(db, 'community_messages');
    const q = selectedCommunity === 'all'
      ? query(ref, orderBy('created_at', 'desc'))
      : query(ref, where('community_id', '==', selectedCommunity), orderBy('created_at', 'desc'));

    const unsub = onSnapshot(q, (snap) => {
      const msgs: Community[] = snap.docs.map((d) => ({
        id: d.id,
        user_id: (d.data().user_id as string) || '',
        user_name: (d.data().user_name as string) || 'Unknown',
        user_avatar: d.data().user_avatar as string | undefined,
        message: (d.data().message as string) || '',
        topic: (d.data().topic as string) || 'General',
        community_id: d.data().community_id as string | undefined,
        image_urls: d.data().image_urls as string[] | undefined,
        sticker_url: d.data().sticker_url as string | undefined,
        created_at: toStr(d.data().created_at),
        updated_at: toStr(d.data().updated_at),
        likes_count: (d.data().likes_count as number) || 0,
        reply_count: (d.data().reply_count as number) || 0,
        is_pinned: (d.data().is_pinned as boolean) || false,
        is_edited: (d.data().is_edited as boolean) || false,
        is_deleted: (d.data().is_deleted as boolean) || false,
      }));
      setMessages(msgs.filter((m) => !m.is_deleted));
      setLoading(false);
    });

    return () => unsub();
  }, [selectedCommunity]);

  const deleteMsg = async (id: string) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await updateDoc(doc(db, 'community_messages', id), {
        is_deleted: true, updated_at: serverTimestamp(),
      });
      toast.success('Message deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const saveEdit = async (id: string) => {
    if (!editText.trim()) return;
    try {
      await updateDoc(doc(db, 'community_messages', id), {
        message: editText.trim(), is_edited: true, updated_at: serverTimestamp(),
      });
      setEditingId(null);
      setEditText('');
      toast.success('Message updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  const togglePin = async (id: string, pinned: boolean) => {
    try {
      await updateDoc(doc(db, 'community_messages', id), {
        is_pinned: !pinned, updated_at: serverTimestamp(),
      });
      toast.success(!pinned ? 'Message pinned' : 'Message unpinned');
    } catch {
      toast.error('Failed to update pin');
    }
  };

  const postAdminMsg = async () => {
    if (!newMessage.trim()) return;
    if (selectedCommunity === 'all') { toast.error('Please select a specific community first'); return; }
    setPosting(true);
    try {
      await addDoc(collection(db, 'community_messages'), {
        user_id: 'admin',
        user_name: 'Admin',
        user_avatar: null,
        message: newMessage.trim(),
        topic: 'General',
        community_id: selectedCommunity,
        is_edited: false, is_deleted: false, is_pinned: false,
        likes_count: 0, reply_count: 0,
        created_at: serverTimestamp(), updated_at: serverTimestamp(),
      });
      setNewMessage('');
      toast.success('Admin message posted!');
    } catch {
      toast.error('Failed to post message');
    } finally {
      setPosting(false);
    }
  };

  const filtered = messages.filter((m) => {
    const matchSearch = m.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.user_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPin = !pinnedOnly || m.is_pinned;
    return matchSearch && matchPin;
  });

  const commName = (id?: string) => {
    if (!id) return 'Unknown';
    return communities.find((c) => c.id === id)?.name || id;
  };

  return (
    <div className="space-y-5">
      {/* Admin Composer */}
      <div className="bg-[#e8f8f0] border border-[#25D366]/30 rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-gray-900 text-[15px] flex items-center gap-2">
          <Send className="w-4 h-4 text-[#128C7E]" />
          Post as Admin
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={selectedCommunity}
            onChange={(e) => setSelectedCommunity(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#25D366]/40"
          >
            <option value="all">All Communities (view only)</option>
            {communities.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
          <div className="sm:col-span-2 flex gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={selectedCommunity === 'all' ? 'Select a community to post...' : 'Write admin announcement...'}
              disabled={selectedCommunity === 'all'}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 disabled:bg-gray-100 disabled:text-gray-400"
              rows={2}
            />
            <button
              onClick={postAdminMsg}
              disabled={posting || !newMessage.trim() || selectedCommunity === 'all'}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-colors self-end"
              style={{ background: '#075E54' }}
            >
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Post
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40"
          />
        </div>
        <button
          onClick={() => setPinnedOnly(!pinnedOnly)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
            pinnedOnly ? 'bg-amber-50 border-amber-200 text-amber-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Pin className="w-3.5 h-3.5" />
          Pinned only
        </button>
        <span className="text-xs text-gray-500 ml-auto">{filtered.length} messages</span>
      </div>

      {/* Messages */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#25D366]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">No messages found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((msg) => (
            <div
              key={msg.id}
              className={`bg-white rounded-2xl border p-4 ${msg.is_pinned ? 'border-amber-200 bg-amber-50/40' : 'border-gray-200'}`}
            >
              <div className="flex items-start gap-3">
                <Avatar name={msg.user_name} src={msg.user_avatar} size={38} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{msg.user_name}</span>
                    {msg.user_id === 'admin' && (
                      <span className="text-[10px] font-bold bg-[#075E54] text-white px-2 py-0.5 rounded-full">ADMIN</span>
                    )}
                    {msg.is_pinned && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Pin className="w-2.5 h-2.5" /> Pinned
                      </span>
                    )}
                    {msg.community_id && selectedCommunity === 'all' && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Hash className="w-2.5 h-2.5" />{commName(msg.community_id)}
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400 ml-auto">{fmtDate(msg.created_at)}</span>
                  </div>
                  {editingId === msg.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full border border-[#25D366] rounded-xl p-2 text-sm resize-none focus:outline-none"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(msg.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                          style={{ background: '#25D366' }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setEditText(''); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 leading-relaxed break-words">{msg.message}</p>
                  )}
                  {msg.image_urls && msg.image_urls.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {msg.image_urls.map((url, i) => (
                        <img key={i} src={url} alt={`img-${i}`} className="h-20 w-20 rounded-xl object-cover border border-gray-200" />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-400">{msg.likes_count} likes · {msg.reply_count} replies</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    onClick={() => togglePin(msg.id, msg.is_pinned)}
                    className="p-2 rounded-xl hover:bg-amber-50 transition-colors"
                    title={msg.is_pinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${msg.is_pinned ? 'text-amber-500' : 'text-gray-400'}`} />
                  </button>
                  <button
                    onClick={() => { setEditingId(msg.id); setEditText(msg.message); }}
                    className="p-2 rounded-xl hover:bg-blue-50 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                  <button
                    onClick={() => deleteMsg(msg.id)}
                    className="p-2 rounded-xl hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFICATION MANAGER (Full rebuild — reads from userInfo + user_verification)
// ─────────────────────────────────────────────────────────────────────────────

function VerificationManager() {
  const { profiles, loading, refetch } = useAllUserProfiles();
  const { toggle, } = useToggleVerification();
  const { findByEmail, verifyUser, revokeVerification, searching, verifying } = useVerifyByEmail();

  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [emailSearch, setEmailSearch] = useState('');
  const [foundUser, setFoundUser] = useState<Awaited<ReturnType<typeof findByEmail>>>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const filtered = profiles.filter((p) => {
    const matchSearch = p.user_name.toLowerCase().includes(search.toLowerCase()) ||
      p.user_id.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ||
      (filter === 'verified' && p.is_verified) ||
      (filter === 'unverified' && !p.is_verified);
    return matchSearch && matchFilter;
  });

  const handleToggle = async (p: UserVerification) => {
    setToggling(p.user_id);
    const ok = await toggle(p.user_id, p.is_verified);
    if (ok) {
      toast.success(p.is_verified ? 'Verification removed' : 'User verified!', {
        style: { background: p.is_verified ? '#ef4444' : '#25D366', color: '#fff', fontWeight: '600' },
      });
      refetch();
    } else {
      toast.error('Failed to update verification');
    }
    setToggling(null);
  };

  const handleEmailSearch = async () => {
    if (!emailSearch.trim()) return;
    const result = await findByEmail(emailSearch.trim());
    if (!result) {
      toast.error('No user found with that email');
      setFoundUser(null);
    } else {
      setFoundUser(result);
    }
  };

  const handleGrantVerification = async () => {
    if (!foundUser) return;
    const ok = await verifyUser(foundUser, 'admin');
    if (ok) {
      toast.success(`${foundUser.userName} has been verified!`, {
        style: { background: '#25D366', color: '#fff', fontWeight: '600' },
      });
      setFoundUser(null);
      setEmailSearch('');
      setShowEmailForm(false);
      refetch();
    } else {
      toast.error('Failed to grant verification');
    }
  };

  const handleRevokeVerification = async () => {
    if (!foundUser) return;
    const ok = await revokeVerification(foundUser.userId);
    if (ok) {
      toast.success('Verification revoked');
      setFoundUser(null);
      setEmailSearch('');
      setShowEmailForm(false);
      refetch();
    } else {
      toast.error('Failed to revoke verification');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-[#53bdeb]" />
            Verification Manager
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Grant or revoke the verified badge for any user</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmailForm(!showEmailForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: '#075E54' }}
          >
            <Shield className="w-4 h-4" />
            Verify by Email
          </button>
          <button
            onClick={refetch}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Email lookup form */}
      {showEmailForm && (
        <div className="bg-[#e8f8f0] border border-[#25D366]/30 rounded-2xl p-5 space-y-4">
          <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#128C7E]" />
            Grant Verification by Email
          </h4>
          <div className="flex gap-2">
            <input
              type="email"
              value={emailSearch}
              onChange={(e) => setEmailSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleEmailSearch(); }}
              placeholder="Enter student email address..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#25D366]/40"
            />
            <button
              onClick={handleEmailSearch}
              disabled={searching || !emailSearch.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-colors"
              style={{ background: '#128C7E' }}
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Find
            </button>
          </div>

          {foundUser && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <Avatar name={foundUser.userName} src={foundUser.userAvatar} size={48} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{foundUser.userName}</span>
                  {foundUser.is_verified && <VerifiedBadge size="sm" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{foundUser.email}</p>
                {foundUser.is_verified ? (
                  <span className="text-xs font-semibold text-[#25D366]">Already verified</span>
                ) : (
                  <span className="text-xs text-gray-400">Not yet verified</span>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {foundUser.is_verified ? (
                  <button
                    onClick={handleRevokeVerification}
                    disabled={verifying}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 disabled:opacity-50 transition-colors"
                  >
                    {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldOff className="w-3.5 h-3.5" />}
                    Revoke
                  </button>
                ) : (
                  <button
                    onClick={handleGrantVerification}
                    disabled={verifying}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50 transition-colors"
                    style={{ background: '#25D366' }}
                  >
                    {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    Verify Now
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{profiles.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Users</p>
        </div>
        <div className="bg-[#e8f8f0] rounded-2xl border border-[#25D366]/20 p-4 text-center">
          <p className="text-2xl font-bold text-[#128C7E]">{profiles.filter((p) => p.is_verified).length}</p>
          <p className="text-xs text-[#128C7E] mt-0.5">Verified</p>
        </div>
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-600">{profiles.filter((p) => !p.is_verified).length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Unverified</p>
        </div>
      </div>

      {/* Search & filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or user ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'verified', 'unverified'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
                filter === f ? 'bg-[#25D366] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Users list */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#25D366]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <ShieldCheck className="w-10 h-10 text-gray-200" />
            <p className="text-sm text-gray-500">No users found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-6">User</div>
              <div className="col-span-2 hidden sm:block">Status</div>
              <div className="col-span-2 hidden sm:block">Last Seen</div>
              <div className="col-span-4 sm:col-span-2 text-right">Action</div>
            </div>

            {filtered.map((profile) => (
              <div key={profile.user_id} className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-gray-50/80 transition-colors">
                {/* User */}
                <div className="col-span-6 flex items-center gap-3 min-w-0">
                  <Avatar name={profile.user_name} src={profile.user_avatar} size={38} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-gray-900 truncate">{profile.user_name}</p>
                      {profile.is_verified && <VerifiedBadge size="sm" />}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{profile.user_id.slice(0, 16)}…</p>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2 hidden sm:block">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    profile.is_verified ? 'bg-[#e8f8f0] text-[#128C7E]' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {profile.is_verified
                      ? <><ShieldCheck className="w-3 h-3" /> Verified</>
                      : <><ShieldOff className="w-3 h-3" /> None</>
                    }
                  </span>
                </div>

                {/* Last seen */}
                <div className="col-span-2 hidden sm:block">
                  <span className="text-xs text-gray-400">{fmtShort(profile.last_seen)}</span>
                </div>

                {/* Action */}
                <div className="col-span-4 sm:col-span-2 flex justify-end">
                  <button
                    onClick={() => handleToggle(profile)}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT — CommunityMonitor
// ─────────────────────────────────────────────────────────────────────────────

const CommunityMonitor: React.FC = () => {
  const [tab, setTab] = useState<AdminTab>('communities');

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
    { key: 'communities', label: 'Communities', icon: <Hash className="w-4 h-4" /> },
    { key: 'messages', label: 'Messages', icon: <MessageCircle className="w-4 h-4" /> },
    { key: 'verification', label: 'Verification', icon: <BadgeCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key
                ? 'bg-white text-[#128C7E] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'communities' && <CommunitiesManager />}
      {tab === 'messages' && <MessagesManager />}
      {tab === 'verification' && <VerificationManager />}
    </div>
  );
};

export default CommunityMonitor;

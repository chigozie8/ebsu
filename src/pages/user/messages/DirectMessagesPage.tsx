import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MessageSquare, Users, ArrowLeft, CheckCheck, Check,
  Circle, Loader2, RefreshCw, UserCircle2, X,
} from 'lucide-react';
import { useGetUserInfo } from '../../../hooks/auth/useGetUserInfo';
import {
  useMyChats,
  useGetOrCreateChat,
  useAllUserProfiles,
  UserVerification,
  PrivateChat,
} from '../../../hooks/usePrivateChat';
import VerifiedBadge from '../../../components/community/VerifiedBadge';
import toast from 'react-hot-toast';

// ── helpers ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'from-teal-400 to-cyan-500',
  'from-blue-400 to-indigo-500',
  'from-pink-400 to-rose-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-violet-400 to-purple-500',
  'from-cyan-400 to-blue-500',
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

// ── Avatar component ───────────────────────────────────────────────────────

function Avatar({ name, src, size = 44, online }: { name: string; src?: string; size?: number; online?: boolean }) {
  const [err, setErr] = useState(false);
  const g = avatarColor(name);
  const ini = initials(name);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {src && !err ? (
        <img
          src={src}
          alt={name}
          crossOrigin="anonymous"
          className="rounded-full object-cover w-full h-full"
          onError={() => setErr(true)}
        />
      ) : (
        <div
          className={`rounded-full bg-gradient-to-br ${g} flex items-center justify-center text-white font-bold w-full h-full`}
          style={{ fontSize: size * 0.36 }}
        >
          {ini}
        </div>
      )}
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2 border-white ${online ? 'bg-[#25D366]' : 'bg-gray-300'}`}
          style={{ width: size * 0.3, height: size * 0.3 }}
        />
      )}
    </div>
  );
}

// ── Chat row component ─────────────────────────────────────────────────────

function ChatRow({
  chat,
  myId,
  onClick,
}: {
  chat: PrivateChat;
  myId: string;
  onClick: () => void;
}) {
  const isP1 = chat.participant_1 === myId;
  const otherName = isP1 ? chat.participant_2_name : chat.participant_1_name;
  const otherAvatar = isP1 ? chat.participant_2_avatar : chat.participant_1_avatar;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f5f6f7] active:bg-[#edf0f2] transition-colors text-left"
    >
      <Avatar name={otherName} src={otherAvatar} size={48} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[#111b21] text-[15px] truncate">{otherName}</span>
          <span className="text-[11px] text-[#8696a0] flex-shrink-0 ml-2">{fmtTime(chat.last_message_at)}</span>
        </div>
        <p className="text-[13px] text-[#667781] truncate mt-0.5">
          {chat.last_message || 'Start a conversation'}
        </p>
      </div>
    </button>
  );
}

// ── User card component ────────────────────────────────────────────────────

function UserCard({
  profile,
  onClick,
  loading,
}: {
  profile: UserVerification;
  onClick: () => void;
  loading: boolean;
}) {
  const isOnline = profile.online_status === 'online';

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f5f6f7] active:bg-[#edf0f2] transition-colors text-left disabled:opacity-60"
    >
      <Avatar name={profile.user_name} src={profile.user_avatar} size={48} online={isOnline} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-[#111b21] text-[15px] truncate">{profile.user_name}</span>
          {profile.is_verified && <VerifiedBadge size="sm" />}
        </div>
        <p className="text-[12px] mt-0.5 flex items-center gap-1">
          <Circle className={`w-2 h-2 flex-shrink-0 ${isOnline ? 'fill-[#25D366] text-[#25D366]' : 'fill-gray-300 text-gray-300'}`} />
          <span className={isOnline ? 'text-[#25D366]' : 'text-[#8696a0]'}>
            {isOnline ? 'Online' : profile.bio ? profile.bio.slice(0, 40) : 'Offline'}
          </span>
        </p>
      </div>
      {loading ? (
        <Loader2 className="w-4 h-4 text-[#8696a0] animate-spin flex-shrink-0" />
      ) : (
        <MessageSquare className="w-4 h-4 text-[#8696a0] flex-shrink-0" />
      )}
    </button>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

type ActiveTab = 'chats' | 'people';

export default function DirectMessagesPage() {
  const navigate = useNavigate();
  const { studentDetails } = useGetUserInfo();
  const myId = studentDetails?.userID || '';
  const myName = studentDetails ? `${studentDetails.firstName} ${studentDetails.lastName}`.trim() : 'Me';
  const myAvatar = studentDetails?.profileImageURL || undefined;

  const { chats, loading: chatsLoading } = useMyChats(myId);
  const { profiles, loading: profilesLoading, refetch: refetchProfiles } = useAllUserProfiles();
  const { getOrCreate, loading: creating } = useGetOrCreateChat();

  const [tab, setTab] = useState<ActiveTab>('chats');
  const [search, setSearch] = useState('');
  const [startingChatFor, setStartingChatFor] = useState<string | null>(null);

  // Derive other participants from my chats for "existing" badge
  const existingChatPartners = new Set(
    chats.map((c) => (c.participant_1 === myId ? c.participant_2 : c.participant_1))
  );

  // Filter profiles: exclude self, apply search
  const filteredProfiles = profiles.filter((p) => {
    if (p.user_id === myId) return false;
    if (!search.trim()) return true;
    return p.user_name.toLowerCase().includes(search.toLowerCase());
  });

  // Filter chats by search
  const filteredChats = chats.filter((c) => {
    if (!search.trim()) return true;
    const otherName = c.participant_1 === myId ? c.participant_2_name : c.participant_1_name;
    return otherName.toLowerCase().includes(search.toLowerCase());
  });

  const startChat = useCallback(async (profile: UserVerification) => {
    if (!myId) { toast.error('Please log in first.'); return; }
    setStartingChatFor(profile.user_id);
    try {
      const chatId = await getOrCreate(myId, myName, myAvatar, profile.user_id, profile.user_name, profile.user_avatar);
      navigate(`/u/chat?chatId=${chatId}&otherId=${profile.user_id}&otherName=${encodeURIComponent(profile.user_name)}&otherAvatar=${encodeURIComponent(profile.user_avatar || '')}`);
    } catch {
      toast.error('Could not start chat. Please try again.');
    } finally {
      setStartingChatFor(null);
    }
  }, [myId, myName, myAvatar, getOrCreate, navigate]);

  const openExistingChat = useCallback((chat: PrivateChat) => {
    const isP1 = chat.participant_1 === myId;
    const otherId = isP1 ? chat.participant_2 : chat.participant_1;
    const otherName = isP1 ? chat.participant_2_name : chat.participant_1_name;
    const otherAvatar = isP1 ? chat.participant_2_avatar : chat.participant_1_avatar;
    navigate(`/u/chat?chatId=${chat.id}&otherId=${otherId}&otherName=${encodeURIComponent(otherName)}&otherAvatar=${encodeURIComponent(otherAvatar || '')}`);
  }, [myId, navigate]);

  return (
    <div
      className="flex flex-col font-sans bg-[#f0f2f5]"
      style={{ minHeight: '100dvh', paddingTop: 64 }}
    >
      {/* Header */}
      <header
        className="sticky top-16 z-30 flex items-center gap-3 px-4 py-3 shadow-sm"
        style={{ background: '#075e54' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-semibold text-[17px] flex-1">Messages</h1>
        <button
          onClick={refetchProfiles}
          className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors flex-shrink-0"
          title="Refresh users"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      {/* Search bar */}
      <div className="px-3 py-2 bg-white border-b border-gray-100 sticky top-[calc(64px+52px)] z-20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8696a0]" />
          <input
            type="text"
            placeholder="Search people or conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#f0f2f5] rounded-full pl-9 pr-9 py-2 text-[14px] text-[#111b21] placeholder-[#8696a0] focus:outline-none focus:ring-2 focus:ring-[#25D366]/30"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8696a0] hover:text-[#111b21] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 flex sticky top-[calc(64px+52px+48px)] z-20">
        <button
          onClick={() => setTab('chats')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-semibold border-b-2 transition-colors ${
            tab === 'chats'
              ? 'border-[#25D366] text-[#128C7E]'
              : 'border-transparent text-[#8696a0] hover:text-[#111b21]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Chats
          {chats.length > 0 && (
            <span className="bg-[#25D366] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {chats.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('people')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-semibold border-b-2 transition-colors ${
            tab === 'people'
              ? 'border-[#25D366] text-[#128C7E]'
              : 'border-transparent text-[#8696a0] hover:text-[#111b21]'
          }`}
        >
          <Users className="w-4 h-4" />
          All People
          {profiles.length > 0 && (
            <span className="bg-gray-200 text-gray-600 text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {profiles.length - 1}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white">
        {/* CHATS TAB */}
        {tab === 'chats' && (
          <>
            {chatsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-[#25D366]" />
                <p className="text-sm text-[#8696a0]">Loading your chats...</p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 px-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[#f0f2f5] flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-[#8696a0]" />
                </div>
                <div>
                  <p className="font-semibold text-[#111b21] text-[15px]">
                    {search ? 'No chats found' : 'No conversations yet'}
                  </p>
                  <p className="text-sm text-[#8696a0] mt-1">
                    {search ? 'Try a different name' : 'Go to "All People" to start messaging someone'}
                  </p>
                </div>
                <button
                  onClick={() => setTab('people')}
                  className="mt-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold transition-colors"
                  style={{ background: '#25D366' }}
                >
                  Find People
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#f0f2f5]">
                {filteredChats.map((chat) => (
                  <ChatRow
                    key={chat.id}
                    chat={chat}
                    myId={myId}
                    onClick={() => openExistingChat(chat)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* PEOPLE TAB */}
        {tab === 'people' && (
          <>
            {profilesLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-[#25D366]" />
                <p className="text-sm text-[#8696a0]">Loading all users...</p>
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 px-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[#f0f2f5] flex items-center justify-center">
                  <UserCircle2 className="w-8 h-8 text-[#8696a0]" />
                </div>
                <div>
                  <p className="font-semibold text-[#111b21] text-[15px]">
                    {search ? 'No users found' : 'No other users yet'}
                  </p>
                  <p className="text-sm text-[#8696a0] mt-1">
                    {search ? `No one matching "${search}"` : 'Users appear here once they log in'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Section header */}
                <div className="px-4 py-2 bg-[#f0f2f5]">
                  <p className="text-[11px] font-semibold text-[#8696a0] uppercase tracking-wide">
                    {filteredProfiles.length} {filteredProfiles.length === 1 ? 'user' : 'users'} registered
                  </p>
                </div>
                <div className="divide-y divide-[#f0f2f5]">
                  {filteredProfiles.map((profile) => (
                    <div key={profile.user_id} className="relative">
                      <UserCard
                        profile={profile}
                        onClick={() => startChat(profile)}
                        loading={startingChatFor === profile.user_id}
                      />
                      {existingChatPartners.has(profile.user_id) && (
                        <span className="absolute right-12 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#25D366] bg-[#e8f8f0] px-2 py-0.5 rounded-full pointer-events-none">
                          Active chat
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

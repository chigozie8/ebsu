import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, MessageSquare, RefreshCw, MessageCircle,
  Search, X, CheckCheck, Clock,
} from 'lucide-react';
import { useCommunities, CommunityGroup } from '../../../hooks/useCommunities';
import { useGetUserInfo } from '../../../hooks/auth/useGetUserInfo';
import { useMyChats, useGetOrCreateChat, PrivateChat } from '../../../hooks/usePrivateChat';

// ─── Skeleton loaders ────────────────────────────────────────────────────────

const CommunitySkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100 animate-pulse">
    <div className="w-14 h-14 rounded-2xl bg-gray-200 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-32" />
      <div className="h-3 bg-gray-100 rounded w-48" />
      <div className="flex gap-3">
        <div className="h-3 bg-gray-100 rounded w-16" />
        <div className="h-3 bg-gray-100 rounded w-16" />
      </div>
    </div>
    <div className="w-20 h-8 bg-gray-200 rounded-full flex-shrink-0" />
  </div>
);

const ChatSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
    <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
    <div className="flex-1 space-y-2 min-w-0">
      <div className="flex justify-between">
        <div className="h-3.5 bg-gray-200 rounded w-28" />
        <div className="h-3 bg-gray-100 rounded w-12" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-44" />
    </div>
  </div>
);

// ─── Avatar helpers ──────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#25D366', '#075E54', '#128C7E', '#34B7F1',
  '#EF4444', '#F59E0B', '#8B5CF6', '#3B82F6',
];

function avatarColor(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

function initials(name: string) {
  const parts = name.trim().split(' ');
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

// ─── Avatar component ────────────────────────────────────────────────────────

function Avatar({ name, src, size = 12 }: { name: string; src?: string; size?: number }) {
  const [err, setErr] = useState(false);
  const color = avatarColor(name);
  const px = size * 4;

  if (src && !err) {
    return (
      <img
        src={src}
        alt={name}
        crossOrigin="anonymous"
        style={{ width: px, height: px }}
        className="rounded-full object-cover flex-shrink-0"
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
      style={{ width: px, height: px, background: color }}
    >
      {initials(name)}
    </div>
  );
}

// ─── Community card ──────────────────────────────────────────────────────────

const CommunityCard: React.FC<{
  community: CommunityGroup;
  userId: string;
  onEnter: (c: CommunityGroup) => void;
}> = ({ community, onEnter }) => (
  <button
    onClick={() => onEnter(community)}
    className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100
               hover:border-[#25D366]/40 hover:shadow-md active:scale-[0.98] transition-all text-left"
  >
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl shadow-sm"
      style={{ background: `${community.color}18`, border: `2px solid ${community.color}30` }}
    >
      {community.icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-bold text-[#111b21] text-[15px] leading-tight truncate">{community.name}</p>
      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 leading-snug">{community.description}</p>
      <div className="flex items-center gap-3 mt-1.5">
        <span className="flex items-center gap-1 text-[11px] text-gray-400">
          <Users className="w-3 h-3" />
          {community.member_count.toLocaleString()} members
        </span>
        <span className="flex items-center gap-1 text-[11px] text-gray-400">
          <MessageSquare className="w-3 h-3" />
          {community.post_count.toLocaleString()} posts
        </span>
      </div>
    </div>
    <div
      className="flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-bold text-white"
      style={{ background: community.color }}
    >
      Open
    </div>
  </button>
);

// ─── Chat row ────────────────────────────────────────────────────────────────

const ChatRow: React.FC<{
  chat: PrivateChat;
  myId: string;
  onClick: () => void;
}> = ({ chat, myId, onClick }) => {
  const isP1 = chat.participant_1 === myId;
  const otherName   = isP1 ? chat.participant_2_name   : chat.participant_1_name;
  const otherAvatar = isP1 ? chat.participant_2_avatar : chat.participant_1_avatar;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#f0f2f5] active:bg-[#e9ecef]
                 transition-colors text-left border-b border-gray-100 last:border-0"
    >
      <div className="relative flex-shrink-0">
        <Avatar name={otherName || 'User'} src={otherAvatar} size={12} />
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] border-2 border-white rounded-full" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-[#111b21] text-[15px] truncate">{otherName || 'User'}</span>
          <span className="text-[11px] text-gray-400 flex-shrink-0 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {fmtTime(chat.last_message_at)}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {isP1 && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] flex-shrink-0" />}
          <p className="text-sm text-gray-500 truncate">
            {chat.last_message || 'Start a conversation'}
          </p>
        </div>
      </div>
    </button>
  );
};

// ─── Main page ─────────────────────────────────────────────────────────────��─

type Tab = 'communities' | 'messages';

const CommunitiesListPage: React.FC = () => {
  const navigate = useNavigate();
  const { communities, loading: loadingComm, error: commError, refetch } = useCommunities();
  const { studentDetails, userID } = useGetUserInfo();
  const userId   = userID ?? '';
  const userName = studentDetails
    ? `${studentDetails.firstName} ${studentDetails.lastName}`.trim()
    : '';
  const userAvatar = studentDetails?.profileImageURL ?? undefined;

  const { chats, loading: loadingChats } = useMyChats(userId);
  const { getOrCreate } = useGetOrCreateChat();

  const [tab, setTab] = useState<Tab>('communities');
  const [dmSearch, setDmSearch] = useState('');

  const handleEnter = (community: CommunityGroup) => {
    navigate(`/u/community/${community.slug}`, { state: { community } });
  };

  const handleOpenChat = async (chat: PrivateChat) => {
    const isP1     = chat.participant_1 === userId;
    const otherId  = isP1 ? chat.participant_2 : chat.participant_1;
    const otherName  = isP1 ? chat.participant_2_name   : chat.participant_1_name;
    const otherAvatar = isP1 ? chat.participant_2_avatar : chat.participant_1_avatar;

    // Reuse existing chat — getOrCreate returns the same chatId
    const chatId = await getOrCreate(userId, userName, userAvatar, otherId, otherName, otherAvatar ?? undefined);
    const params = new URLSearchParams({
      chatId,
      otherId,
      otherName,
      ...(otherAvatar ? { otherAvatar } : {}),
    });
    navigate(`/u/chat?${params.toString()}`);
  };

  const filteredChats = dmSearch.trim()
    ? chats.filter((c) => {
        const isP1 = c.participant_1 === userId;
        const name = (isP1 ? c.participant_2_name : c.participant_1_name).toLowerCase();
        return name.includes(dmSearch.toLowerCase());
      })
    : chats;

  return (
    <div className="flex flex-col bg-[#f0f2f5]" style={{ height: '100dvh', paddingTop: '64px' }}>

      {/* ── Header ── */}
      <header className="flex-shrink-0 z-20 shadow-md" style={{ background: '#075E54' }}>
        <div className="flex items-center h-14 px-3 gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors text-white flex-shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-[16px] leading-tight">
              {tab === 'communities' ? 'Communities' : 'Messages'}
            </p>
            <p className="text-[#a8edbc] text-xs leading-tight">
              {tab === 'communities'
                ? loadingComm ? 'Loading...' : `${communities.length} communities`
                : loadingChats ? 'Loading...' : `${chats.length} conversation${chats.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex border-t border-white/10">
          <button
            onClick={() => setTab('communities')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors
              ${tab === 'communities'
                ? 'text-white border-b-2 border-white'
                : 'text-white/60 hover:text-white/90'}`}
          >
            <Users className="w-4 h-4" />
            Communities
          </button>
          <button
            onClick={() => setTab('messages')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors relative
              ${tab === 'messages'
                ? 'text-white border-b-2 border-white'
                : 'text-white/60 hover:text-white/90'}`}
          >
            <MessageCircle className="w-4 h-4" />
            Messages
            {chats.length > 0 && (
              <span className="absolute top-1.5 right-[calc(50%-30px)] bg-[#25D366] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {chats.length > 9 ? '9+' : chats.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── COMMUNITIES TAB ── */}
        {tab === 'communities' && (
          <div className="px-4 py-4 space-y-3 max-w-2xl mx-auto">
            <div className="rounded-2xl p-4 text-center" style={{ background: '#075E54' }}>
              <div className="text-3xl mb-2">🎓</div>
              <p className="text-white font-bold text-base">EBSU Student Communities</p>
              <p className="text-[#a8edbc] text-[13px] mt-1 leading-snug">
                Join a community, meet your coursemates and share ideas with fellow EBSU students.
              </p>
            </div>

            {loadingComm && (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => <CommunitySkeleton key={i} />)}
              </div>
            )}

            {commError && !loadingComm && (
              <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-red-100">
                <p className="text-red-500 text-sm font-medium mb-3">{commError}</p>
                <button
                  onClick={refetch}
                  className="flex items-center gap-2 mx-auto px-4 py-2 rounded-full text-sm font-semibold text-white"
                  style={{ background: '#25D366' }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Try again
                </button>
              </div>
            )}

            {!loadingComm && !commError && communities.map((c) => (
              <CommunityCard
                key={c.id}
                community={c}
                userId={userId}
                onEnter={handleEnter}
              />
            ))}

            {!loadingComm && !commError && communities.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 text-sm">No communities yet. Check back soon.</p>
              </div>
            )}
            <div className="pb-6" />
          </div>
        )}

        {/* ── MESSAGES TAB ── */}
        {tab === 'messages' && (
          <div className="flex flex-col h-full">

            {/* Search bar */}
            <div className="flex-shrink-0 px-4 py-2.5 bg-white border-b border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 bg-[#f0f2f5] rounded-full px-3.5 py-2">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  value={dmSearch}
                  onChange={(e) => setDmSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="flex-1 bg-transparent outline-none text-sm text-[#111b21] placeholder:text-gray-400"
                />
                {dmSearch && (
                  <button onClick={() => setDmSearch('')}>
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Chat list */}
            <div className="flex-1 bg-white overflow-y-auto">

              {loadingChats && (
                <div className="divide-y divide-gray-100">
                  {[...Array(7)].map((_, i) => <ChatSkeleton key={i} />)}
                </div>
              )}

              {!loadingChats && filteredChats.length > 0 && (
                <div>
                  {filteredChats.map((chat) => (
                    <ChatRow
                      key={chat.id}
                      chat={chat}
                      myId={userId}
                      onClick={() => handleOpenChat(chat)}
                    />
                  ))}
                </div>
              )}

              {!loadingChats && chats.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-20 gap-4 px-6 text-center">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background: '#075E5418' }}
                  >
                    <MessageCircle className="w-9 h-9" style={{ color: '#075E54' }} />
                  </div>
                  <div>
                    <p className="font-bold text-[#111b21] text-base">No messages yet</p>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      Go to any community, tap a member&apos;s avatar, and send them a private message.
                    </p>
                  </div>
                </div>
              )}

              {!loadingChats && chats.length > 0 && filteredChats.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
                  <Search className="w-10 h-10 text-gray-300" />
                  <p className="text-gray-500 text-sm">No conversations match &quot;{dmSearch}&quot;</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunitiesListPage;

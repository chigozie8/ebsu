import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useGetUserInfo } from '../../../hooks/auth/useGetUserInfo';
import { useCommunityMessages, usePostMessage, useDeleteMessage, useEditMessage } from '../../../hooks/useCommunity';
import { useCommunityMessageEnhanced, useImageUpload } from '../../../hooks/useCommunityFeatures';
import { useUpsertUserProfile } from '../../../hooks/useDirectMessages';
import MessageCard from '../../../components/community/MessageCard';
import GuidelinesBanner from '../../../components/community/GuidelinesBanner';
import ThreadViewer from '../../../components/community/ThreadViewer';
import ProfileModal from '../../../components/community/ProfileModal';
import { SubcategoryFilter } from '../../../components/community/SubcategoryFilter';
import { StickerPicker } from '../../../components/community/StickerPicker';
import {
  Send, Search, MessageSquare, ArrowLeft, Users,
  Smile, X, Loader2, Paperclip,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { playSound } from '../../../hooks/useSound';

const TOPICS = ['All', 'General', 'Academics', 'Campus Life', 'Tech', 'Events'];

function fmtDateChip(date: string) {
  const d = new Date(date);
  const now = new Date();
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString())  return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

type Community = import('../../../lib/supabase').Community;
function groupByDate(msgs: Community[]) {
  const groups: { date: string; items: Community[] }[] = [];
  for (const m of msgs) {
    const chip = fmtDateChip(m.created_at);
    const last = groups[groups.length - 1];
    if (last && last.date === chip) last.items.push(m);
    else groups.push({ date: chip, items: [m] });
  }
  return groups;
}

interface ProfileState {
  userId: string;
  userName: string;
  userAvatar?: string;
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
const MessageSkeleton: React.FC<{ idx: number }> = ({ idx }) => (
  <div
    className="flex gap-3 px-4 py-3 bg-white"
    style={{ animationDelay: `${idx * 70}ms` }}
  >
    <div className="w-10 h-10 rounded-full flex-shrink-0 wa-skeleton" />
    <div className="flex-1 space-y-2 pt-0.5">
      <div className="flex gap-2 items-center">
        <div className="h-3 w-28 rounded wa-skeleton" />
        <div className="h-3 w-12 rounded wa-skeleton" />
      </div>
      <div className="h-3 w-full rounded wa-skeleton" />
      <div className="h-3 w-4/5 rounded wa-skeleton" />
      <div className="h-3 w-2/3 rounded wa-skeleton" />
    </div>
  </div>
);


const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('All');
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>();
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [profileModal, setProfileModal] = useState<ProfileState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const { studentDetails, gettingStudentDetails } = useGetUserInfo();
  const userId = studentDetails?.userID || 'anonymous';
  const userName = studentDetails?.firstName && studentDetails?.lastName
    ? `${studentDetails.firstName} ${studentDetails.lastName}`
    : 'Student User';
  const userAvatar = studentDetails?.profileImageURL || undefined;

  const { messages, loading } = useCommunityMessages(topic === 'All' ? undefined : topic);
  const { postMessage, posting } = usePostMessage();
  const { deleteMessage } = useDeleteMessage();
  const { editMessage } = useEditMessage();
  const { imageUrls, addImageUrl, removeImageUrl, clearImages } = useCommunityMessageEnhanced();
  const { uploading, uploadImage } = useImageUpload();
  const { upsert: upsertProfile } = useUpsertUserProfile();

  // Upsert profile on mount
  useEffect(() => {
    if (studentDetails?.userID) {
      upsertProfile(studentDetails.userID, userName, studentDetails.profileImageURL || undefined);
    }
  }, [studentDetails?.userID]);

  // Sound on new messages
  const prevCountRef = useRef<number | null>(null);
  useEffect(() => {
    if (loading) return;
    if (prevCountRef.current !== null && messages.length > prevCountRef.current) {
      const latest = messages[0];
      if (latest && latest.user_id !== userId) playSound('message');
    }
    prevCountRef.current = messages.length;
  }, [messages, loading, userId]);

  // Realtime subscription
  useEffect(() => {
    const ch = supabase
      .channel('community_messages_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'community_messages' }, () => {})
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, []);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  };

  const filteredMessages = messages.filter((m) =>
    m.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const pinnedMessages  = filteredMessages.filter((m) => m.is_pinned);
  const regularMessages = filteredMessages.filter((m) => !m.is_pinned);

  const handlePost = async () => {
    if (!newMessage.trim() && imageUrls.length === 0) return;
    if (!studentDetails?.userID) {
      toast.error('Still loading your profile — please wait a moment.');
      return;
    }
    try {
      await postMessage(userId, userName, newMessage, topic === 'All' ? 'General' : topic, userAvatar, imageUrls, selectedSubcategory);
      setNewMessage('');
      clearImages();
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      toast.success('Posted!', {
        duration: 1800,
        style: { background: '#25D366', color: '#fff', borderRadius: '12px', fontWeight: '600' },
        iconTheme: { primary: '#fff', secondary: '#25D366' },
      });
    } catch {
      toast.error('Failed to post. Tap to retry.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;
    for (let i = 0; i < files.length && imageUrls.length < 4; i++) {
      const url = await uploadImage(files[i], userId);
      if (url) addImageUrl(url);
    }
    e.currentTarget.value = '';
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handlePost();
  };

  const canPost = !posting && (newMessage.trim().length > 0 || imageUrls.length > 0) && !gettingStudentDetails;

  // Avatar initials + gradient
  const initials = userName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const GRADS = [['#00897b','#26a69a'],['#1976d2','#42a5f5'],['#e91e63','#f06292'],['#f57c00','#ffb74d'],['#388e3c','#66bb6a'],['#7b1fa2','#ba68c8']];
  let h = 0; for (const c of userId) h += c.charCodeAt(0);
  const [g0, g1] = GRADS[h % GRADS.length];

  return (
    <>
      {selectedThreadId && (
        <ThreadViewer
          messageId={selectedThreadId}
          onClose={() => setSelectedThreadId(null)}
          userId={userId}
          userName={userName}
          userAvatar={userAvatar}
        />
      )}

      <StickerPicker
        userId={userId}
        isOpen={showStickerPicker}
        onClose={() => setShowStickerPicker(false)}
        onSelectSticker={(s) => {
          setNewMessage((p) => p + ` ${s.image_url} `);
          setShowStickerPicker(false);
        }}
      />

      {profileModal && (
        <ProfileModal
          targetUserId={profileModal.userId}
          targetUserName={profileModal.userName}
          targetUserAvatar={profileModal.userAvatar}
          currentUserId={userId}
          onClose={() => setProfileModal(null)}
          onMessageClick={(id, name) => {
            setProfileModal(null);
            navigate(`/u/messages?with=${id}&name=${encodeURIComponent(name)}`);
          }}
        />
      )}

      {/* ── ROOT ────────────────────────────────────────────────────── */}
      <div className="flex flex-col h-screen bg-[#f0f2f5] overflow-hidden">

        {/* ══ HEADER ══════════════════════════════════════════════════ */}
        <header className="flex-shrink-0 z-30 shadow-md" style={{ background: '#075E54' }}>

          {/* Top row */}
          <div className="flex items-center h-14 px-3 gap-2.5">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors text-white flex-shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Icon + title */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#25D366]/30 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-[15px] leading-tight truncate">Student Community</p>
                <p className="text-[#25D366] text-xs leading-tight font-normal">
                  {loading ? 'loading…' : `${messages.length} discussions`}
                </p>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={() => setSearchVisible((v) => !v)}
                className="p-2.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors text-white"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/u/messages')}
                className="p-2.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors text-white"
                aria-label="Direct messages"
              >
                <Users className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search bar slide-down */}
          <div
            className="transition-all duration-300 overflow-hidden"
            style={{ maxHeight: searchVisible ? '56px' : '0', opacity: searchVisible ? 1 : 0 }}
          >
            <div className="px-3 pb-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                <input
                  autoFocus={searchVisible}
                  type="text"
                  placeholder="Search discussions…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-9 rounded-lg bg-white/15 text-white placeholder-white/50 border border-white/10 focus:outline-none focus:bg-white/20 text-sm transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Topic tabs */}
          <div
            className="flex gap-2 px-3 pb-2.5 overflow-x-auto"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {TOPICS.map((t) => {
              const active = topic === t;
              return (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className="flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 border"
                  style={
                    active
                      ? { background: '#25D366', color: '#fff', borderColor: '#25D366' }
                      : { background: 'transparent', color: 'rgba(255,255,255,0.75)', borderColor: 'rgba(255,255,255,0.25)' }
                  }
                >
                  {t}
                </button>
              );
            })}
          </div>
        </header>

        {/* ══ BODY ════════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-hidden flex flex-col">

          {/* Feed — WhatsApp chat background */}
          <div
            ref={feedRef}
            className="flex-1 overflow-y-auto wa-scroll"
            style={{
              background: '#e5ddd5',
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          >
            {/* Guidelines banner */}
            <GuidelinesBanner />

            {/* Pinned date chip + pinned bubbles */}
            {pinnedMessages.length > 0 && (
              <div className="pt-2">
                <div className="flex justify-center mb-1">
                  <span className="text-[11px] font-medium px-3 py-1 rounded-lg shadow-sm" style={{ background: 'rgba(225,245,254,0.9)', color: '#54656f' }}>
                    Pinned
                  </span>
                </div>
                {pinnedMessages.map((msg, idx) => (
                  <MessageCard
                    key={msg.id}
                    message={msg}
                    isOwn={msg.user_id === userId}
                    onDelete={deleteMessage}
                    onEdit={editMessage}
                    onThreadClick={setSelectedThreadId}
                    onProfileClick={(uid, uName, uAv) => setProfileModal({ userId: uid, userName: uName, userAvatar: uAv })}
                    prevSameUser={idx > 0 && pinnedMessages[idx - 1].user_id === msg.user_id}
                    nextSameUser={idx < pinnedMessages.length - 1 && pinnedMessages[idx + 1].user_id === msg.user_id}
                  />
                ))}
              </div>
            )}

            {/* Main feed */}
            {loading ? (
              <div className="pt-4 space-y-1">
                {[false, true, false, false, true, false].map((r, i) => (
                  <div key={i} className={`flex items-end gap-1.5 px-3 ${r ? 'flex-row-reverse' : ''}`}>
                    {!r && <div className="w-8 h-8 rounded-full wa-skeleton flex-shrink-0" />}
                    <div className={`wa-skeleton rounded-2xl h-12 ${r ? 'w-48 rounded-br-none' : 'w-56 rounded-bl-none'}`} />
                  </div>
                ))}
              </div>
            ) : regularMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                <div
                  className="w-18 h-18 w-[72px] h-[72px] rounded-full flex items-center justify-center mb-3 shadow"
                  style={{ background: 'rgba(255,255,255,0.85)' }}
                >
                  <MessageSquare className="w-8 h-8" style={{ color: '#25D366' }} />
                </div>
                <p className="font-semibold text-[15px]" style={{ color: '#54656f' }}>
                  {searchQuery ? 'No results found' : 'No discussions yet'}
                </p>
                <p className="text-[13px] mt-1" style={{ color: '#8696a0' }}>
                  {searchQuery ? `Nothing matched "${searchQuery}"` : 'Be the first to post!'}
                </p>
              </div>
            ) : (
              <div className="pt-2 pb-3">
                {groupByDate(regularMessages).map((group) => (
                  <div key={group.date}>
                    {/* Date chip */}
                    <div className="flex justify-center my-2">
                      <span
                        className="text-[11px] font-medium px-3 py-1 rounded-lg shadow-sm"
                        style={{ background: 'rgba(225,245,254,0.9)', color: '#54656f' }}
                      >
                        {group.date}
                      </span>
                    </div>
                    {group.items.map((msg, idx) => (
                      <MessageCard
                        key={msg.id}
                        message={msg}
                        isOwn={msg.user_id === userId}
                        onDelete={deleteMessage}
                        onEdit={editMessage}
                        onThreadClick={setSelectedThreadId}
                        onProfileClick={(uid, uName, uAv) => setProfileModal({ userId: uid, userName: uName, userAvatar: uAv })}
                        prevSameUser={idx > 0 && group.items[idx - 1].user_id === msg.user_id}
                        nextSameUser={idx < group.items.length - 1 && group.items[idx + 1].user_id === msg.user_id}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ══ COMPOSER ═══════════════════════════════════════════════ */}
          <div className="flex-shrink-0" style={{ background: '#f0f2f5' }}>

            {/* Image previews row */}
            {imageUrls.length > 0 && (
              <div className="flex gap-2 px-3 pt-2 pb-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 border-[#25D366]/30 shadow-sm group">
                    <img
                      src={url}
                      alt=""
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }}
                    />
                    <button
                      onClick={() => removeImageUrl(i)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-[#111b21]/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input bar — exact WhatsApp style */}
            <div className="flex items-end gap-2 px-2 py-2">
              {/* My avatar */}
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  crossOrigin="anonymous"
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0 self-end mb-0.5"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold self-end mb-0.5"
                  style={{ background: `linear-gradient(135deg, ${g0}, ${g1})` }}
                >
                  {initials}
                </div>
              )}

              {/* Text input capsule */}
              <div
                className="flex-1 flex items-end gap-1 rounded-3xl px-2 py-1.5 min-h-[42px] shadow-sm"
                style={{ background: '#fff' }}
              >
                {/* Emoji */}
                <button
                  onClick={() => setShowStickerPicker(true)}
                  className="p-1.5 rounded-full hover:bg-[#f0f2f5] transition-colors flex-shrink-0 self-end mb-0.5"
                  aria-label="Stickers"
                >
                  <Smile className="w-5 h-5" style={{ color: '#8696a0' }} />
                </button>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => { setNewMessage(e.target.value); autoResize(); }}
                  onKeyDown={onKeyDown}
                  placeholder="Message"
                  className="flex-1 bg-transparent resize-none outline-none text-[15px] leading-relaxed py-1 self-end"
                  style={{
                    color: '#111b21',
                    minHeight: '24px',
                    maxHeight: '140px',
                    overflowY: 'auto',
                  }}
                  rows={1}
                />

                {/* Attach */}
                <div className="flex items-center gap-0.5 flex-shrink-0 self-end mb-0.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading || imageUrls.length >= 4}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || imageUrls.length >= 4}
                    className="p-1.5 rounded-full hover:bg-[#f0f2f5] transition-colors disabled:opacity-40"
                    aria-label="Attach image"
                  >
                    {uploading
                      ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#8696a0' }} />
                      : <Paperclip className="w-5 h-5" style={{ color: '#8696a0' }} />
                    }
                  </button>
                </div>
              </div>

              {/* Send / topic button */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0 self-end">
                <button
                  onClick={canPost ? handlePost : undefined}
                  disabled={!canPost}
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95"
                  style={{
                    background: canPost ? '#25D366' : '#aebbc1',
                    boxShadow: canPost ? '0 2px 10px rgba(37,211,102,0.5)' : 'none',
                  }}
                  aria-label="Post message"
                >
                  {posting
                    ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                    : <Send className="w-5 h-5 text-white" style={{ marginLeft: '1px' }} />
                  }
                </button>
              </div>
            </div>

            {/* Topic picker pill */}
            <div className="flex items-center gap-2 px-3 pb-2 pt-0">
              <span className="text-xs text-[#8696a0]">Topic:</span>
              <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {TOPICS.filter((t) => t !== 'All').map((t) => (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className="flex-shrink-0 px-3 py-0.5 rounded-full text-[11px] font-semibold transition-all border"
                    style={
                      topic === t
                        ? { background: '#25D366', color: '#fff', borderColor: '#25D366' }
                        : { background: '#f0f2f5', color: '#667781', borderColor: 'transparent' }
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommunityPage;

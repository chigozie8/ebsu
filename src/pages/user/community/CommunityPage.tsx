import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Send, Search, Smile, X, Loader2, Paperclip, Users,
  MessageSquare, RefreshCw,
} from 'lucide-react';
import { useGetUserInfo } from '../../../hooks/auth/useGetUserInfo';
import {
  useCommunityBySlug, useCommunityMembership,
  useCommunityPosts, usePostToCommunity,
} from '../../../hooks/useCommunities';
import { useDeleteMessage, useEditMessage } from '../../../hooks/useCommunity';
import { useImageUpload } from '../../../hooks/useCommunityFeatures';
import { useGetOrCreateChat, useUserVerification } from '../../../hooks/usePrivateChat';
import MessageCard from '../../../components/community/MessageCard';
import ThreadViewer from '../../../components/community/ThreadViewer';
import ProfileModal from '../../../components/community/ProfileModal';
import { StickerPicker } from '../../../components/community/StickerPicker';
import { playSound } from '../../../hooks/useSound';
import { CommunityGroup } from '../../../lib/supabase';

// ── helpers ───────────────────────────────────────────────────────────────
function fmtDateChip(date: string) {
  const d = new Date(date);
  const now = new Date();
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

type CommunityMsg = import('../../../lib/supabase').Community;
function groupByDate(msgs: CommunityMsg[]) {
  const groups: { date: string; items: CommunityMsg[] }[] = [];
  for (const m of msgs) {
    const chip = fmtDateChip(m.created_at);
    const last = groups[groups.length - 1];
    if (last && last.date === chip) last.items.push(m);
    else groups.push({ date: chip, items: [m] });
  }
  return groups;
}

const GRADS = [
  ['#00897b', '#26a69a'], ['#1976d2', '#42a5f5'], ['#e91e63', '#f06292'],
  ['#f57c00', '#ffb74d'], ['#388e3c', '#66bb6a'], ['#7b1fa2', '#ba68c8'],
];

const PostSkeleton: React.FC<{ idx: number }> = ({ idx }) => (
  <div className="flex gap-2 px-3 py-1.5" style={{ animationDelay: `${idx * 70}ms` }}>
    <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3.5 bg-gray-200 animate-pulse rounded w-24" />
      <div className="h-12 bg-gray-200 animate-pulse rounded-2xl rounded-tl-none w-4/5" />
    </div>
  </div>
);

// ── Page ──────────────────────────────────────────────────────────────────
const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();

  // Pre-loaded community from navigation state (avoids extra fetch flicker)
  const stateComm = location.state?.community as CommunityGroup | undefined;

  const { community, loading: loadingComm } = useCommunityBySlug(slug ?? '');
  const comm = stateComm || community;

  const { studentDetails, gettingStudentDetails } = useGetUserInfo();
  const userId = studentDetails?.userID || 'anonymous';
  const userName = studentDetails?.firstName && studentDetails?.lastName
    ? `${studentDetails.firstName} ${studentDetails.lastName}` : 'Student';
  const userAvatar = studentDetails?.profileImageURL || undefined;

  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [profileTarget, setProfileTarget] = useState<{ userId: string; userName: string; userAvatar?: string } | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { isMember, toggling, toggle } = useCommunityMembership(comm?.id ?? '', userId);
  const { posts, loading: loadingPosts, error: postsError } = useCommunityPosts(comm?.id ?? null);
  const { post, posting } = usePostToCommunity();
  const { deleteMessage } = useDeleteMessage();
  const { editMessage } = useEditMessage();
  const { uploading, uploadImage } = useImageUpload();
  const { getOrCreate } = useGetOrCreateChat();
  const { upsertVerification, setOnlineStatus } = useUserVerification(userId);

  // Upsert user verification on mount
  useEffect(() => {
    if (userId && userId !== 'anonymous' && userName !== 'Student') {
      upsertVerification(userId, userName, userAvatar);
      setOnlineStatus(userId, 'online');
    }
    return () => { if (userId && userId !== 'anonymous') setOnlineStatus(userId, 'offline'); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userName]);

  // Sound on new posts
  const prevCount = useRef<number | null>(null);
  useEffect(() => {
    if (loadingPosts) return;
    if (prevCount.current !== null && posts.length > prevCount.current) {
      const latest = posts[0];
      if (latest && latest.user_id !== userId) playSound('message');
    }
    prevCount.current = posts.length;
  }, [posts, loadingPosts, userId]);

  // Auto-scroll to newest on initial load
  useEffect(() => {
    if (!loadingPosts && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [loadingPosts]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  };

  const handlePost = async () => {
    if (!comm?.id || (!newMessage.trim() && imageUrls.length === 0)) return;
    if (!studentDetails?.userID) {
      toast.error('Still loading your profile — wait a moment.');
      return;
    }
    const text = newMessage.trim();
    const imgs = [...imageUrls];
    setNewMessage('');
    setImageUrls([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    try {
      await post({ communityId: comm.id, userId, userName, userAvatar, message: text, imageUrls: imgs });
    } catch {
      toast.error('Failed to post. Please try again.');
      // Restore on failure
      setNewMessage(text);
      setImageUrls(imgs);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;
    for (let i = 0; i < files.length && imageUrls.length < 4; i++) {
      const url = await uploadImage(files[i], userId);
      if (url) setImageUrls((prev) => [...prev, url]);
    }
    e.currentTarget.value = '';
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handlePost();
  };

  const handleAvatarClick = useCallback((uid: string, uName: string, uAvatar?: string) => {
    setProfileTarget({ userId: uid, userName: uName, userAvatar: uAvatar });
  }, []);

  const handleMessageUser = useCallback(async () => {
    if (!profileTarget || !studentDetails?.userID) return;
    try {
      const chatId = await getOrCreate(
        userId, userName, userAvatar,
        profileTarget.userId, profileTarget.userName, profileTarget.userAvatar,
      );
      setProfileTarget(null);
      navigate(`/u/chat?chatId=${chatId}&otherId=${profileTarget.userId}&otherName=${encodeURIComponent(profileTarget.userName)}&otherAvatar=${encodeURIComponent(profileTarget.userAvatar ?? '')}`);
    } catch {
      toast.error('Could not open chat. Try again.');
    }
  }, [profileTarget, userId, userName, userAvatar, getOrCreate, navigate, studentDetails]);

  const canPost = !posting && (newMessage.trim().length > 0 || imageUrls.length > 0) && !gettingStudentDetails;

  // Avatar gradient
  let h = 0; for (const c of userId) h += c.charCodeAt(0);
  const [g0, g1] = GRADS[h % GRADS.length];
  const initials = userName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  const filteredPosts = searchQuery
    ? posts.filter((p) =>
        p.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.user_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : posts;

  const pinnedPosts = filteredPosts.filter((p) => p.is_pinned);
  const regularPosts = filteredPosts.filter((p) => !p.is_pinned);
  const grouped = groupByDate([...pinnedPosts, ...regularPosts].slice().reverse());

  const communityColor = comm?.color || '#075E54';

  return (
    <>
      {/* Thread viewer is replaced by PostDetailPage navigation */}

      {/* Sticker picker */}
      <StickerPicker
        userId={userId}
        isOpen={showStickerPicker}
        onClose={() => setShowStickerPicker(false)}
        onSelectSticker={(s) => {
          setNewMessage((p) => p + ` ${s.image_url} `);
          setShowStickerPicker(false);
        }}
      />

      {/* Profile modal */}
      {profileTarget && (
        <ProfileModal
          targetUserId={profileTarget.userId}
          targetUserName={profileTarget.userName}
          targetUserAvatar={profileTarget.userAvatar}
          viewerUserId={userId}
          onMessage={handleMessageUser}
          onClose={() => setProfileTarget(null)}
        />
      )}

      {/* ROOT */}
      <div className="flex flex-col overflow-hidden" style={{ height: '100dvh', background: '#f0f2f5' }}>

        {/* HEADER */}
        <header className="flex-shrink-0 z-20 shadow-md" style={{ background: communityColor }}>
          <div className="flex items-center h-14 px-3 gap-2.5">
            <button
              onClick={() => navigate('/u/community')}
              className="p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors text-white flex-shrink-0"
              aria-label="Back to communities"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Community icon + name */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                {loadingComm ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : (comm?.icon || '💬')}
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold text-[15px] leading-tight truncate">
                  {comm?.name || (loadingComm ? 'Loading...' : 'Community')}
                </p>
                <p className="text-white/70 text-xs leading-tight">
                  {loadingPosts ? 'loading...' : `${posts.length} post${posts.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setSearchVisible((v) => !v)}
                className="p-2.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors text-white"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              {/* Members */}
              <button
                onClick={() => navigate('/u/community')}
                className="p-2.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors text-white"
                aria-label="All communities"
              >
                <Users className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Join / Leave pill */}
          {comm && (
            <div className="flex items-center justify-between px-3 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-white/80 text-xs">
                  <Users className="w-3 h-3" />
                  {comm.member_count.toLocaleString()} members
                </span>
              </div>
              <button
                onClick={toggle}
                disabled={toggling || userId === 'anonymous'}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95 disabled:opacity-60"
                style={
                  isMember
                    ? { background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }
                    : { background: '#fff', color: communityColor }
                }
              >
                {toggling ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                {isMember ? 'Joined' : 'Join'}
              </button>
            </div>
          )}

          {/* Search bar */}
          <div
            className="transition-all duration-300 overflow-hidden"
            style={{ maxHeight: searchVisible ? '52px' : '0', opacity: searchVisible ? 1 : 0 }}
          >
            <div className="px-3 pb-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                <input
                  autoFocus={searchVisible}
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-9 rounded-lg bg-white/15 text-white placeholder-white/50 border border-white/10 focus:outline-none focus:bg-white/20 text-sm"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* BODY */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">

          {/* COMPOSER — top of feed */}
          <div className="flex-shrink-0" style={{ background: '#f0f2f5' }}>
            {/* Image previews */}
            {imageUrls.length > 0 && (
              <div className="flex gap-2 px-3 pt-2 pb-1 overflow-x-auto scrollbar-hide">
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 border-[#25D366]/30 shadow-sm group">
                    <img src={url} alt="" crossOrigin="anonymous" className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }} />
                    <button
                      onClick={() => setImageUrls((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input bar */}
            <div className="flex items-end gap-2 px-2 py-2">
              {/* Avatar */}
              {userAvatar ? (
                <img src={userAvatar} alt={userName} crossOrigin="anonymous"
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0 self-end mb-0.5"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold self-end mb-0.5"
                  style={{ background: `linear-gradient(135deg, ${g0}, ${g1})` }}
                >
                  {initials}
                </div>
              )}

              {/* Capsule */}
              <div className="flex-1 flex items-end gap-1 rounded-3xl px-2 py-1.5 min-h-[42px] shadow-sm bg-white">
                <button
                  onClick={() => setShowStickerPicker(true)}
                  className="p-1.5 rounded-full hover:bg-[#f0f2f5] transition-colors flex-shrink-0 self-end mb-0.5"
                  aria-label="Stickers"
                >
                  <Smile className="w-5 h-5 text-[#8696a0]" />
                </button>
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => { setNewMessage(e.target.value); autoResize(); }}
                  onKeyDown={onKeyDown}
                  placeholder={comm ? `Post to ${comm.name}...` : 'Share something...'}
                  className="flex-1 bg-transparent resize-none outline-none text-[15px] leading-relaxed py-1 self-end text-[#111b21] placeholder-[#8696a0]"
                  style={{ minHeight: '24px', maxHeight: '140px', overflowY: 'auto' }}
                  rows={1}
                />
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
                      ? <Loader2 className="w-5 h-5 animate-spin text-[#8696a0]" />
                      : <Paperclip className="w-5 h-5 text-[#8696a0]" />
                    }
                  </button>
                </div>
              </div>

              {/* Send button */}
              <button
                onClick={handlePost}
                disabled={!canPost}
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 self-end transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
                style={{
                  background: canPost ? '#25D366' : '#aebbc1',
                  boxShadow: canPost ? '0 2px 10px rgba(37,211,102,0.45)' : 'none',
                }}
                aria-label="Post"
              >
                {posting
                  ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                  : <Send className="w-5 h-5 text-white" style={{ marginLeft: '2px' }} />
                }
              </button>
            </div>
          </div>

          {/* FEED */}
          <div
            ref={feedRef}
            className="flex-1 overflow-y-auto"
            style={{
              background: '#e5ddd5',
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          >
            <div className="py-2">
              {/* Loading */}
              {loadingPosts && (
                <div className="space-y-1">
                  {[...Array(6)].map((_, i) => <PostSkeleton key={i} idx={i} />)}
                </div>
              )}

              {/* Error */}
              {postsError && !loadingPosts && (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <div className="bg-white rounded-2xl p-6 text-center shadow-sm w-full max-w-xs">
                    <p className="text-red-500 text-sm mb-3">{postsError}</p>
                    <button onClick={() => window.location.reload()}
                      className="flex items-center gap-2 mx-auto px-4 py-2 rounded-full text-sm font-semibold text-white"
                      style={{ background: '#25D366' }}>
                      <RefreshCw className="w-4 h-4" /> Retry
                    </button>
                  </div>
                </div>
              )}

              {/* Empty */}
              {!loadingPosts && !postsError && posts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 px-6">
                  <div className="bg-white/80 backdrop-blur rounded-2xl p-8 text-center shadow-sm w-full max-w-xs">
                    <div className="text-4xl mb-3">{comm?.icon || '💬'}</div>
                    <p className="font-bold text-[#111b21] mb-1">No posts yet</p>
                    <p className="text-sm text-gray-500">Be the first to post in {comm?.name || 'this community'}!</p>
                  </div>
                </div>
              )}

              {/* Posts grouped by date */}
              {!loadingPosts && !postsError && grouped.map(({ date, items }) => (
                <div key={date}>
                  {/* Date chip */}
                  <div className="flex justify-center my-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold shadow-sm text-[#111b21]"
                      style={{ background: 'rgba(255,255,255,0.85)' }}>
                      {date}
                    </span>
                  </div>
                  {items.map((msg, idx) => {
                    const prevMsg = idx > 0 ? items[idx - 1] : null;
                    const isGrouped = prevMsg?.user_id === msg.user_id &&
                      (new Date(msg.created_at).getTime() - new Date(prevMsg!.created_at).getTime()) < 5 * 60 * 1000;
                    return (
                      <MessageCard
                        key={msg.id}
                        message={msg}
                        isOwn={msg.user_id === userId}
                        prevSameUser={isGrouped}
                        onThreadClick={() => navigate(`/u/community/${slug}/post/${msg.id}`)}
                        onDelete={() => deleteMessage(msg.id)}
                        onEdit={(id, text) => editMessage(id, text)}
                        onAvatarClick={handleAvatarClick}
                        onProfileClick={handleAvatarClick}
                      />
                    );
                  })}
                </div>
              ))}

              <div className="h-3" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommunityPage;

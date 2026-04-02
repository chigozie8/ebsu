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
  Send, Search, MessageSquare, ArrowLeft, Users, TrendingUp,
  Flame, Image, Smile, X, Loader2, ChevronDown,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { playSound } from '../../../hooks/useSound';

const TOPICS = ['All', 'General', 'Academics', 'Campus Life', 'Tech', 'Events'];

const TOPIC_META: Record<string, { icon: string; color: string; activeColor: string; ring: string }> = {
  All:           { icon: '🔥', color: 'text-[#128C7E] bg-[#f0fdf4] border-[#25D366]/30',  activeColor: 'bg-[#25D366] text-white border-[#25D366] shadow-lg shadow-green-200/60', ring: '#25D366' },
  General:       { icon: '💬', color: 'text-slate-600 bg-white border-slate-200',          activeColor: 'bg-slate-700 text-white border-slate-700 shadow-lg',                       ring: '#64748b' },
  Academics:     { icon: '📚', color: 'text-blue-600 bg-blue-50 border-blue-200',          activeColor: 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200/60',       ring: '#2563eb' },
  'Campus Life': { icon: '🏫', color: 'text-pink-600 bg-pink-50 border-pink-200',          activeColor: 'bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-200/60',       ring: '#ec4899' },
  Tech:          { icon: '💻', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', activeColor: 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200/60', ring: '#059669' },
  Events:        { icon: '📅', color: 'text-amber-600 bg-amber-50 border-amber-200',       activeColor: 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-200/60',    ring: '#f59e0b' },
};

// Skeleton card
const MessageSkeleton: React.FC<{ idx?: number }> = ({ idx = 0 }) => (
  <div
    className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm"
    style={{ animationDelay: `${idx * 80}ms` }}
  >
    <div className="flex gap-3.5">
      <div className="w-11 h-11 rounded-full wa-skeleton flex-shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="flex items-center gap-2.5">
          <div className="wa-skeleton h-3.5 w-32 rounded-full" />
          <div className="wa-skeleton h-3 w-16 rounded-full" />
        </div>
        <div className="wa-skeleton h-3.5 w-full rounded-full" />
        <div className="wa-skeleton h-3.5 w-5/6 rounded-full" />
        <div className="wa-skeleton h-3.5 w-2/3 rounded-full" />
        <div className="flex gap-2 pt-1">
          <div className="wa-skeleton h-6 w-24 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

interface ProfileState {
  userId: string;
  userName: string;
  userAvatar?: string;
}

const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState<string>('All');
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>();
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [profileModal, setProfileModal] = useState<ProfileState | null>(null);
  const [showSubcategories, setShowSubcategories] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { studentDetails, gettingStudentDetails } = useGetUserInfo();
  const userId   = studentDetails?.userID || 'anonymous';
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

  useEffect(() => {
    if (studentDetails?.userID) {
      upsertProfile(
        studentDetails.userID,
        userName,
        studentDetails.profileImageURL || undefined,
      );
    }
  }, [studentDetails?.userID]);

  const prevMessageCountRef = useRef<number | null>(null);
  useEffect(() => {
    if (loading) return;
    if (prevMessageCountRef.current !== null && messages.length > prevMessageCountRef.current) {
      const latest = messages[0];
      if (latest && latest.user_id !== userId) playSound('message');
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, loading, userId]);

  useEffect(() => {
    const channel = supabase
      .channel('community_messages_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'community_messages' }, () => {})
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, []);

  // Auto-resize textarea
  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  const filteredMessages = messages.filter(
    (msg) =>
      msg.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedMessages  = filteredMessages.filter((m) => m.is_pinned);
  const regularMessages = filteredMessages.filter((m) => !m.is_pinned);

  const handlePostMessage = async () => {
    if (!newMessage.trim() && imageUrls.length === 0) return;
    if (!studentDetails?.userID) {
      toast.error('Loading your profile… please try again.');
      return;
    }
    try {
      await postMessage(userId, userName, newMessage, topic === 'All' ? 'General' : topic, userAvatar, imageUrls, selectedSubcategory);
      setNewMessage('');
      clearImages();
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      toast.success('Posted!', {
        duration: 2000,
        style: { background: '#25D366', color: '#fff', borderRadius: '12px', fontWeight: '600', fontSize: '14px' },
        iconTheme: { primary: '#fff', secondary: '#25D366' },
      });
    } catch {
      toast.error('Failed to post. Please try again.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;
    for (let i = 0; i < files.length && imageUrls.length < 3; i++) {
      const url = await uploadImage(files[i], userId);
      if (url) addImageUrl(url);
    }
    e.currentTarget.value = '';
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handlePostMessage();
  };

  const handleProfileClick = (uid: string, uName: string, uAvatar?: string) => {
    setProfileModal({ userId: uid, userName: uName, userAvatar: uAvatar });
  };

  const canPost = !posting && (newMessage.trim().length > 0 || imageUrls.length > 0) && !gettingStudentDetails;

  const avatarInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      {/* Thread viewer modal */}
      {selectedThreadId && (
        <ThreadViewer
          messageId={selectedThreadId}
          onClose={() => setSelectedThreadId(null)}
          userId={userId}
          userName={userName}
          userAvatar={userAvatar}
        />
      )}

      {/* Sticker picker */}
      <StickerPicker
        userId={userId}
        isOpen={showStickerPicker}
        onClose={() => setShowStickerPicker(false)}
        onSelectSticker={(sticker) => {
          setNewMessage((prev) => prev + ` ${sticker.image_url} `);
          setShowStickerPicker(false);
        }}
      />

      {/* Profile modal */}
      {profileModal && (
        <ProfileModal
          targetUserId={profileModal.userId}
          targetUserName={profileModal.userName}
          targetUserAvatar={profileModal.userAvatar}
          currentUserId={userId}
          onClose={() => setProfileModal(null)}
          onMessageClick={(targetId, targetName) => {
            setProfileModal(null);
            navigate(`/u/messages?with=${targetId}&name=${encodeURIComponent(targetName)}`);
          }}
        />
      )}

      <div className="min-h-screen bg-[#f0f2f5]">

        {/* ── HEADER ──────────────────────────────────────────────── */}
        <header
          className="sticky top-0 z-30"
          style={{ background: 'linear-gradient(135deg, #075E54 0%, #128C7E 50%, #25D366 100%)' }}
        >
          {/* Top bar */}
          <div className="flex items-center gap-3 px-4 py-3 max-w-5xl mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors text-white flex-shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Title area */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-white font-bold text-base leading-tight truncate">Student Community</h1>
                <p className="text-green-100 text-xs leading-tight truncate">
                  {loading ? 'Loading…' : `${messages.length} discussions`}
                </p>
              </div>
            </div>

            {/* Stats pills — desktop only */}
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
                <Users className="w-3.5 h-3.5 text-white" />
                <span className="text-white text-xs font-semibold">{messages.length}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-white" />
                <span className="text-white text-xs font-semibold">{TOPICS.length - 1} topics</span>
              </div>
            </div>

            {/* Search toggle */}
            <button
              onClick={() => setSearchVisible((v) => !v)}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors text-white flex-shrink-0"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar — slides down */}
          <div
            className="overflow-hidden transition-all duration-300"
            style={{ maxHeight: searchVisible ? '64px' : '0', opacity: searchVisible ? 1 : 0 }}
          >
            <div className="px-4 pb-3 max-w-5xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-200 pointer-events-none" />
                <input
                  type="text"
                  autoFocus={searchVisible}
                  placeholder="Search messages or students…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/20 text-white placeholder-green-200 border border-white/25 focus:outline-none focus:bg-white/30 text-sm transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-green-200 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Topic tabs */}
          <div className="px-4 pb-3 max-w-5xl mx-auto">
            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
              {TOPICS.map((t) => {
                const meta = TOPIC_META[t];
                const isActive = topic === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all duration-200 flex-shrink-0 ${
                      isActive ? meta.activeColor : 'bg-white/15 text-white border-white/20 hover:bg-white/25'
                    }`}
                    style={isActive ? {} : {}}
                  >
                    <span className="text-sm leading-none">{meta.icon}</span>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
        <main className="max-w-5xl mx-auto px-4 py-4 pb-10">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-start">

            {/* ── LEFT SIDEBAR ─────────────────────────────────────── */}
            <aside className="lg:w-[340px] xl:w-[360px] flex-shrink-0 space-y-3">

              {/* ── COMPOSER ──────────────────────────────────────── */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Composer header */}
                <div
                  className="px-4 py-3 flex items-center gap-3"
                  style={{ background: 'linear-gradient(135deg, #075E54 0%, #128C7E 100%)' }}
                >
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName}
                      crossOrigin="anonymous"
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-white/40 flex-shrink-0"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold ring-2 ring-white/30">
                      {avatarInitial}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm leading-tight truncate">{userName}</p>
                    <p className="text-green-100 text-xs leading-tight">Share with your community</p>
                  </div>
                </div>

                {/* Textarea */}
                <div className="px-4 pt-3">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => { setNewMessage(e.target.value); autoResize(); }}
                    onKeyDown={onKeyDown}
                    placeholder="What's on your mind? (Ctrl+Enter to post)"
                    className="w-full text-sm text-slate-800 placeholder-slate-400 bg-transparent resize-none outline-none leading-relaxed min-h-[56px]"
                    rows={2}
                    style={{ maxHeight: '160px', overflowY: 'auto' }}
                  />

                  {/* Image previews */}
                  {imageUrls.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap pb-2">
                      {imageUrls.map((url, idx) => (
                        <div key={idx} className="relative group w-20 h-20 flex-shrink-0">
                          <img
                            src={url}
                            alt={`preview-${idx}`}
                            crossOrigin="anonymous"
                            className="w-full h-full object-cover rounded-xl border border-slate-200"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                          <button
                            onClick={() => removeImageUrl(idx)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            aria-label="Remove image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="mx-4 border-t border-slate-100" />

                {/* Toolbar */}
                <div className="px-3 py-2.5 flex items-center gap-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading || imageUrls.length >= 3}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || imageUrls.length >= 3}
                    className="p-2 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-slate-500 hover:text-[#128C7E]"
                    title="Add images (max 3)"
                  >
                    {uploading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Image className="w-4.5 h-4.5" />}
                  </button>
                  <button
                    onClick={() => setShowStickerPicker(true)}
                    className="p-2 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors text-slate-500 hover:text-[#128C7E]"
                    title="Add sticker"
                  >
                    <Smile className="w-4.5 h-4.5" />
                  </button>

                  {/* Topic selector */}
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="flex-1 mx-1 px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366] bg-slate-50 text-slate-700 font-medium cursor-pointer"
                  >
                    {TOPICS.map((t) => (
                      <option key={t} value={t}>{t === 'All' ? 'General' : t}</option>
                    ))}
                  </select>

                  {/* Post button */}
                  <button
                    onClick={handlePostMessage}
                    disabled={!canPost}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex-shrink-0 ${
                      canPost
                        ? 'text-white shadow-md shadow-green-200/50 active:scale-95'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                    style={canPost ? { background: 'linear-gradient(135deg, #128C7E 0%, #25D366 100%)' } : {}}
                  >
                    {posting
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Send className="w-3.5 h-3.5" />
                    }
                    <span>Post</span>
                  </button>
                </div>
              </div>

              {/* ── SUBCATEGORY FILTER (collapsible) ─────────────── */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <button
                  onClick={() => setShowSubcategories((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Filter by Category</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showSubcategories ? 'rotate-180' : ''}`}
                  />
                </button>
                {showSubcategories && (
                  <div className="px-4 pb-4 border-t border-slate-100">
                    <div className="pt-3">
                      <SubcategoryFilter
                        selectedCategory={selectedSubcategory}
                        onCategoryChange={setSelectedSubcategory}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Guidelines */}
              <GuidelinesBanner />
            </aside>

            {/* ── FEED ─────────────────────────────────────────────── */}
            <section className="flex-1 min-w-0 space-y-3">

              {/* Active filter bar */}
              {(searchQuery || selectedSubcategory) && (
                <div className="flex items-center gap-2 flex-wrap">
                  {searchQuery && (
                    <span className="flex items-center gap-1.5 bg-white text-slate-600 border border-slate-200 rounded-full px-3 py-1 text-xs font-medium shadow-sm">
                      Search: &ldquo;{searchQuery}&rdquo;
                      <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedSubcategory && (
                    <span className="flex items-center gap-1.5 bg-white text-[#128C7E] border border-[#25D366]/30 rounded-full px-3 py-1 text-xs font-medium shadow-sm">
                      {selectedSubcategory}
                      <button onClick={() => setSelectedSubcategory(undefined)} className="text-[#25D366] hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  <span className="text-xs text-slate-400 ml-1">
                    {filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {loading ? (
                /* Skeleton feed */
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => <MessageSkeleton key={i} idx={i} />)}
                </div>

              ) : filteredMessages.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcf8c6 100%)' }}
                  >
                    <MessageSquare className="w-8 h-8 text-[#25D366]" />
                  </div>
                  <p className="text-slate-700 font-bold text-base">No messages yet</p>
                  <p className="text-slate-400 text-sm mt-1.5 text-center max-w-xs px-4">
                    {searchQuery ? `No results for "${searchQuery}"` : 'Be the first to start a discussion!'}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-4 text-[#128C7E] text-sm font-semibold hover:underline"
                    >
                      Clear search
                    </button>
                  )}
                </div>

              ) : (
                <div className="space-y-3">

                  {/* Pinned messages */}
                  {pinnedMessages.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <div className="w-4 h-4 bg-amber-400 rounded flex items-center justify-center flex-shrink-0">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-1.429 5.951 1.429a1 1 0 001.169-1.409l-7-14z" />
                          </svg>
                        </div>
                        <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">Pinned</span>
                      </div>
                      <div className="space-y-3">
                        {pinnedMessages.map((message) => (
                          <div
                            key={message.id}
                            className="rounded-2xl overflow-hidden border-2 border-amber-200/70 bg-white shadow-sm relative"
                            style={{ boxShadow: '0 0 0 2px rgba(251,191,36,0.2), 0 2px 8px rgba(0,0,0,0.06)' }}
                          >
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-300" />
                            <MessageCard
                              message={message}
                              isOwn={message.user_id === userId}
                              onDelete={() => deleteMessage(message.id)}
                              onEdit={(id, text) => editMessage(id, text)}
                              onProfileClick={handleProfileClick}
                              isAdmin={message.user_id === userId}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Regular messages */}
                  {regularMessages.map((message, idx) => (
                    <div
                      key={message.id}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-[#25D366]/20 transition-all duration-200 wa-msg-in"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <MessageCard
                        message={message}
                        isOwn={message.user_id === userId}
                        onDelete={() => deleteMessage(message.id)}
                        onEdit={(id, text) => editMessage(id, text)}
                        onThreadClick={setSelectedThreadId}
                        onProfileClick={handleProfileClick}
                        isAdmin={message.user_id === userId}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export default CommunityPage;

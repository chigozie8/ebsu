import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useGetUserInfo } from '../../../hooks/auth/useGetUserInfo';
import { useCommunityMessages, usePostMessage, useDeleteMessage, useEditMessage } from '../../../hooks/useCommunity';
import { useCommunityMessageEnhanced, useImageUpload } from '../../../hooks/useCommunityFeatures';
import MessageCard from '../../../components/community/MessageCard';
import GuidelinesBanner from '../../../components/community/GuidelinesBanner';
import ThreadViewer from '../../../components/community/ThreadViewer';
import { SubcategoryFilter } from '../../../components/community/SubcategoryFilter';
import { StickerPicker } from '../../../components/community/StickerPicker';
import {
  Send, Search, MessageSquare, ArrowLeft, Users, TrendingUp, Flame,
  Image, Smile, X, Check, Pin
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { playSound } from '../../../hooks/useSound';

const TOPICS = ['All', 'General', 'Academics', 'Campus Life', 'Tech', 'Events'];

const TOPIC_META: Record<string, { color: string; dot: string }> = {
  All:           { color: 'bg-[#25D366] text-white shadow-[#25D366]/30', dot: 'bg-[#25D366]' },
  General:       { color: 'bg-slate-100 text-slate-700 border border-slate-200', dot: 'bg-slate-400' },
  Academics:     { color: 'bg-blue-100 text-blue-700 border border-blue-200', dot: 'bg-blue-500' },
  'Campus Life': { color: 'bg-pink-100 text-pink-700 border border-pink-200', dot: 'bg-pink-500' },
  Tech:          { color: 'bg-emerald-100 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
  Events:        { color: 'bg-amber-100 text-amber-700 border border-amber-200', dot: 'bg-amber-500' },
};

/* ── Skeleton loaders ── */
const MessageSkeleton: React.FC<{ isOwn?: boolean }> = ({ isOwn = false }) => (
  <div className={`flex gap-3 px-4 py-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
    <div className="w-10 h-10 rounded-full skeleton-shimmer flex-shrink-0" />
    <div className={`flex flex-col gap-2 max-w-[60%] ${isOwn ? 'items-end' : 'items-start'}`}>
      <div className="h-3 w-24 skeleton-shimmer rounded-full" />
      <div className="h-14 w-56 skeleton-shimmer rounded-2xl" />
      <div className="h-2 w-12 skeleton-shimmer rounded-full" />
    </div>
  </div>
);

const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState<string>('All');
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>();
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [composerFocused, setComposerFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const feedEndRef   = useRef<HTMLDivElement>(null);

  const { studentDetails, gettingStudentDetails } = useGetUserInfo();
  const userId    = studentDetails?.userID || 'anonymous';
  const userName  = studentDetails?.firstName && studentDetails?.lastName
    ? `${studentDetails.firstName} ${studentDetails.lastName}`
    : 'Student User';
  const userAvatar = studentDetails?.profileImageURL || undefined;

  const { messages, loading } = useCommunityMessages(topic === 'All' ? undefined : topic);
  const { postMessage, posting } = usePostMessage();
  const { deleteMessage } = useDeleteMessage();
  const { editMessage } = useEditMessage();
  const { imageUrls, addImageUrl, removeImageUrl, clearImages } = useCommunityMessageEnhanced();
  const { uploading, uploadImage } = useImageUpload();

  const prevMessageCountRef = useRef<number | null>(null);
  useEffect(() => {
    if (loading) return;
    if (prevMessageCountRef.current !== null && messages.length > prevMessageCountRef.current) {
      const latest = messages[0];
      if (latest && latest.user_id !== userId) playSound('message');
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, loading, userId]);

  // Realtime subscription for updates
  useEffect(() => {
    const channel = supabase
      .channel('community_messages_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'community_messages' }, () => {})
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, []);

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
      toast.error('Loading your profile… Please try again.');
      return;
    }
    // Optimistic: blur textarea immediately
    textareaRef.current?.blur();
    try {
      await postMessage(
        userId, userName, newMessage,
        topic === 'All' ? 'General' : topic,
        userAvatar, imageUrls, selectedSubcategory
      );
      setNewMessage('');
      clearImages();
      setComposerFocused(false);
      toast.success('Message posted!', {
        duration: 2500,
        position: 'top-right',
        style: {
          background: '#25D366',
          color: 'white',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: '600',
        },
        icon: <Check className="w-4 h-4" />,
      });
    } catch (err) {
      console.error('[community] post failed:', err);
      toast.error('Failed to post. Please try again.', { duration: 4000 });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;
    for (let i = 0; i < files.length && imageUrls.length < 3; i++) {
      const url = await uploadImage(files[i], userId);
      if (url) addImageUrl(url);
    }
    // Reset input so same file can be re-selected
    e.currentTarget.value = '';
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handlePostMessage();
  };

  const canPost = !posting && !gettingStudentDetails && (newMessage.trim().length > 0 || imageUrls.length > 0);

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
        onSelectSticker={(sticker) => {
          setNewMessage((prev) => prev + ` ${sticker.image_url} `);
          setShowStickerPicker(false);
        }}
      />

      <div className="min-h-screen bg-slate-50 pb-16">

        {/* ── Sticky Header ── */}
        <div className="sticky top-0 z-30 bg-[#075E54] shadow-lg">
          <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-white/15 hover:bg-white/25 rounded-full transition-colors text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-white font-bold text-base leading-tight truncate">Student Community</h1>
                <p className="text-white/65 text-[11px]">
                  {loading ? 'Loading…' : `${messages.length} post${messages.length === 1 ? '' : 's'}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowSearch((s) => !s)}
                className="p-2 bg-white/15 hover:bg-white/25 rounded-full transition-colors text-white"
                title="Search"
              >
                <Search className="w-4.5 h-4.5" />
              </button>
              <div className="hidden sm:flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
                <Users className="w-3.5 h-3.5 text-white/80" />
                <span className="text-white/90 text-xs font-semibold">{TOPICS.length - 1} topics</span>
              </div>
            </div>
          </div>

          {/* Search bar (slides down) */}
          {showSearch && (
            <div className="border-t border-white/10 px-4 py-2.5 bg-[#075E54]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  type="text"
                  placeholder="Search messages or students…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-9 py-2 rounded-xl bg-white/15 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-white/50 text-sm"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 mt-4">

          {/* ── Topic Filters ── */}
          <div className="overflow-x-auto pb-1 -mx-4 sm:mx-0 px-4 sm:px-0 mb-4">
            <div className="flex gap-2 min-w-max">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap ${
                    topic === t
                      ? TOPIC_META[t]?.color + ' shadow-md scale-105'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-[#25D366]/40 hover:text-[#25D366] hover:shadow-sm'
                  }`}
                >
                  {t !== 'All' && (
                    <span className={`w-2 h-2 rounded-full ${TOPIC_META[t]?.dot ?? 'bg-gray-400'}`} />
                  )}
                  {t === 'All' && <Flame className="w-3.5 h-3.5" />}
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* ── Two-column layout ── */}
          <div className="flex flex-col lg:flex-row gap-5">

            {/* LEFT — Composer + guidelines */}
            <div className="lg:w-[380px] xl:w-[420px] flex-shrink-0 space-y-4">

              {/* Subcategories */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <p className="text-[11px] font-bold text-slate-500 mb-3 uppercase tracking-wider">Filter by category</p>
                <SubcategoryFilter
                  selectedCategory={selectedSubcategory}
                  onCategoryChange={setSelectedSubcategory}
                />
              </div>

              {/* Composer Card */}
              <div className={`bg-white rounded-2xl shadow-sm border transition-all ${composerFocused ? 'border-[#25D366]/40 shadow-[#25D366]/10 shadow-md' : 'border-slate-100'} overflow-hidden`}>
                <div className="bg-[#075E54] px-5 py-3.5">
                  <p className="text-white font-bold text-sm">New Post</p>
                  <p className="text-white/65 text-[11px] mt-0.5">Share with the community</p>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="flex gap-3 items-start">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userName}
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-[#25D366]/30"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=25D366&color=fff`; }}
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center flex-shrink-0 text-white text-sm font-bold ring-2 ring-[#25D366]/20">
                        {userName.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 mb-1.5">{userName}</p>
                      <textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={onKeyDown}
                        onFocus={() => setComposerFocused(true)}
                        onBlur={() => setComposerFocused(false)}
                        placeholder="What's on your mind? (Ctrl+Enter to post)"
                        className="w-full p-3 text-sm border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366]/30 transition-all bg-slate-50 placeholder-slate-400 wa-input leading-relaxed"
                        rows={3}
                      />

                      {/* Image Previews */}
                      {imageUrls.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {imageUrls.map((url, idx) => (
                            <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200">
                              <img
                                src={url}
                                alt={`preview-${idx}`}
                                className="w-full h-20 object-cover"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg?height=80&width=80'; }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                              <button
                                onClick={() => removeImageUrl(idx)}
                                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload progress */}
                      {uploading && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-[#25D366]">
                          <div className="w-3 h-3 border-2 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin" />
                          Uploading image…
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Toolbar */}
                  <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100">
                    <div className="flex gap-1.5">
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
                        className="p-2 hover:bg-[#25D366]/10 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-slate-500 hover:text-[#25D366]"
                        title={`Add images (${imageUrls.length}/3)`}
                      >
                        <Image className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowStickerPicker(true)}
                        className="p-2 hover:bg-[#25D366]/10 rounded-lg transition-colors text-slate-500 hover:text-[#25D366]"
                        title="Add sticker"
                      >
                        <Smile className="w-4 h-4" />
                      </button>
                      <select
                        value={topic === 'All' ? 'General' : topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 bg-white text-slate-700 font-semibold"
                      >
                        {TOPICS.filter((t) => t !== 'All').map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handlePostMessage}
                      disabled={!canPost}
                      className={`flex items-center gap-2 px-5 py-2 text-white text-sm rounded-xl font-bold transition-all ${
                        canPost
                          ? 'bg-[#25D366] hover:bg-[#128C7E] shadow-md hover:shadow-lg active:scale-95'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {posting
                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <Send className="w-4 h-4" style={{ transform: 'rotate(45deg)' }} />
                      }
                      Post
                    </button>
                  </div>
                </div>
              </div>

              {/* Guidelines */}
              <GuidelinesBanner />
            </div>

            {/* RIGHT — Messages feed */}
            <div className="flex-1 min-w-0">

              {/* Feed wrapper with WhatsApp-style background */}
              <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                {loading ? (
                  <div className="chat-bg">
                    <div className="py-2">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <MessageSkeleton key={i} isOwn={i % 3 === 0} />
                      ))}
                    </div>
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="chat-bg flex flex-col items-center justify-center py-24">
                    <div className="w-16 h-16 bg-white/80 backdrop-blur rounded-full flex items-center justify-center mb-4 shadow-sm">
                      <MessageSquare className="w-8 h-8 text-[#25D366]" />
                    </div>
                    <p className="text-slate-700 font-bold text-base">
                      {searchQuery ? 'No results found' : 'No messages yet'}
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                      {searchQuery ? 'Try a different search term.' : 'Be the first to start a discussion!'}
                    </p>
                  </div>
                ) : (
                  <div className="chat-bg">

                    {/* Pinned Messages */}
                    {pinnedMessages.length > 0 && (
                      <div className="px-4 pt-3 pb-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Pin className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wide">Pinned</span>
                        </div>
                        <div className="space-y-0.5 bg-amber-50/80 rounded-2xl border-2 border-amber-200/60 overflow-hidden">
                          {pinnedMessages.map((message) => (
                            <MessageCard
                              key={message.id}
                              message={message}
                              isOwn={message.user_id === userId}
                              userId={userId}
                              onDelete={() => deleteMessage(message.id)}
                              onEdit={(id, text) => editMessage(id, text)}
                              onThreadClick={setSelectedThreadId}
                              isAdmin={message.user_id === userId}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Regular Messages */}
                    <div className="py-2">
                      {regularMessages.map((message) => (
                        <MessageCard
                          key={message.id}
                          message={message}
                          isOwn={message.user_id === userId}
                          userId={userId}
                          onDelete={() => deleteMessage(message.id)}
                          onEdit={(id, text) => editMessage(id, text)}
                          onThreadClick={setSelectedThreadId}
                          isAdmin={message.user_id === userId}
                        />
                      ))}
                    </div>

                    <div ref={feedEndRef} className="h-4" />
                  </div>
                )}
              </div>

              {/* Stats bar */}
              <div className="mt-3 flex items-center gap-4 px-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{messages.length} post{messages.length === 1 ? '' : 's'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                  <Users className="w-3.5 h-3.5" />
                  <span>{TOPICS.length - 1} topics</span>
                </div>
                {searchQuery && (
                  <div className="flex items-center gap-1.5 text-[#25D366] text-xs font-semibold">
                    <Search className="w-3.5 h-3.5" />
                    <span>{filteredMessages.length} result{filteredMessages.length === 1 ? '' : 's'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommunityPage;

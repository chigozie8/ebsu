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
import { Send, Search, MessageSquare, Check, ArrowLeft, Users, TrendingUp, Flame, Image, Smile, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { playSound } from '../../../hooks/useSound';

const TOPICS = ['All', 'General', 'Academics', 'Campus Life', 'Tech', 'Events'];

const TOPIC_META: Record<string, { color: string; dot: string }> = {
  All:         { color: 'bg-teal-500 text-white shadow-teal-200',          dot: 'bg-teal-400' },
  General:     { color: 'bg-slate-100 text-slate-700 border border-slate-200', dot: 'bg-slate-400' },
  Academics:   { color: 'bg-blue-100 text-blue-700 border border-blue-200',    dot: 'bg-blue-500' },
  'Campus Life':{ color: 'bg-pink-100 text-pink-700 border border-pink-200',   dot: 'bg-pink-500' },
  Tech:        { color: 'bg-emerald-100 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
  Events:      { color: 'bg-amber-100 text-amber-700 border border-amber-200',  dot: 'bg-amber-500' },
};

const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState<string>('All');
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>();
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    try {
      await postMessage(userId, userName, newMessage, topic === 'All' ? 'General' : topic, userAvatar, imageUrls, selectedSubcategory);
      setNewMessage('');
      clearImages();
      toast.success('Message posted!', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: 'linear-gradient(135deg,#14b8a6 0%,#06b6d4 100%)',
          color: 'white',
          borderRadius: '10px',
          padding: '14px 18px',
          fontSize: '14px',
          fontWeight: '500',
        },
        icon: <Check className="w-4 h-4" />,
      });
    } catch (err) {
      console.error('[community] post failed:', err);
      toast.error('Failed to post message. Please try again.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    for (let i = 0; i < files.length && imageUrls.length < 3; i++) {
      const url = await uploadImage(files[i], userId);
      if (url) addImageUrl(url);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handlePostMessage();
  };

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

      {/* Sticker Picker Modal */}
      <StickerPicker
        userId={userId}
        isOpen={showStickerPicker}
        onClose={() => setShowStickerPicker(false)}
        onSelectSticker={(sticker) => {
          setNewMessage((prev) => prev + ` ${sticker.image_url} `);
          setShowStickerPicker(false);
        }}
      />

      <div className="min-h-screen bg-slate-50 pb-12">

        {/* ── Hero Header ─────────────────────────────────────────── */}
        <div className="relative bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-400 overflow-hidden">
          {/* subtle grid texture */}
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          />
          <div className="relative w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => navigate(-1)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors text-white"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                    Student Community
                  </h1>
                </div>
                <p className="text-teal-100 text-sm sm:text-base max-w-lg">
                  Ask questions, share ideas, and connect with fellow EBSU students.
                </p>
              </div>

              {/* Quick stats */}
              <div className="flex gap-3 flex-shrink-0">
                <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-2.5 text-center">
                  <div className="flex items-center gap-1.5 text-white">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-semibold">{messages.length}</span>
                  </div>
                  <p className="text-teal-100 text-xs mt-0.5">Posts</p>
                </div>
                <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-2.5 text-center">
                  <div className="flex items-center gap-1.5 text-white">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-semibold">{TOPICS.length - 1}</span>
                  </div>
                  <p className="text-teal-100 text-xs mt-0.5">Topics</p>
                </div>
              </div>
            </div>

            {/* Search bar sitting on the hero */}
            <div className="mt-6 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-300" />
              <input
                type="text"
                placeholder="Search messages or students…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/20 text-white placeholder-teal-200 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm backdrop-blur"
              />
            </div>
          </div>
        </div>

        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">

          {/* ── Topic Filters ───────────────────────────────────────── */}
          <div className="overflow-x-auto pb-1 -mx-4 sm:mx-0 px-4 sm:px-0 mb-6">
            <div className="flex gap-2 min-w-max">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                    topic === t
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-200 scale-105'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-300 hover:text-teal-600 hover:shadow-sm'
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

          {/* ── Subcategories Filter ────────────────────────────────── */}
          <div className="mb-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <p className="text-xs font-semibold text-slate-600 mb-3 uppercase">Filter by category</p>
            <SubcategoryFilter
              selectedCategory={selectedSubcategory}
              onCategoryChange={setSelectedSubcategory}
            />
          </div>

          {/* ── Two-column layout (composer + content) ─────────────── */}
          <div className="flex flex-col lg:flex-row gap-6">

            {/* LEFT — post composer + guidelines */}
            <div className="lg:w-[380px] xl:w-[420px] flex-shrink-0 space-y-4">

              {/* Composer Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-3.5">
                  <p className="text-white font-semibold text-sm">Start a discussion</p>
                  <p className="text-teal-100 text-xs mt-0.5">Share what's on your mind</p>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="flex gap-3 items-start">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userName}
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-teal-200"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold ring-2 ring-teal-100">
                        {userName.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 mb-1.5">{userName}</p>
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="What's on your mind? (Ctrl+Enter to post)"
                        className="w-full p-3 text-sm border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all bg-slate-50 placeholder-slate-400"
                        rows={3}
                      />

                      {/* Image Preview */}
                      {imageUrls.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {imageUrls.map((url, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={url}
                                alt={`preview-${idx}`}
                                className="w-full h-20 object-cover rounded-lg border border-slate-200"
                              />
                              <button
                                onClick={() => removeImageUrl(idx)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100">
                    <div className="flex gap-2">
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
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
                        title="Add images (max 3)"
                      >
                        <Image className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowStickerPicker(true)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                        title="Add sticker"
                      >
                        <Smile className="w-4 h-4" />
                      </button>
                    </div>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-slate-700 font-medium"
                    >
                      {TOPICS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button
                      onClick={handlePostMessage}
                      disabled={posting || (!newMessage.trim() && imageUrls.length === 0) || gettingStudentDetails}
                      className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm rounded-lg font-semibold hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-teal-100"
                    >
                      <Send className="w-4 h-4" />
                      Post
                    </button>
                  </div>
                </div>
              </div>

              {/* Guidelines Banner */}
              <GuidelinesBanner />
            </div>

            {/* RIGHT — messages feed */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-12 h-12 rounded-full border-4 border-teal-100 border-t-teal-500 animate-spin mb-4" />
                  <p className="text-slate-500 text-sm">Loading discussions…</p>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
                  <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-teal-400" />
                  </div>
                  <p className="text-slate-700 font-semibold text-base">No messages yet</p>
                  <p className="text-slate-400 text-sm mt-1">Be the first to start a discussion!</p>
                </div>
              ) : (
                <div className="space-y-4">

                  {/* Pinned Messages */}
                  {pinnedMessages.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 bg-amber-400 rounded flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-1.429 5.951 1.429a1 1 0 001.169-1.409l-7-14z" />
                          </svg>
                        </div>
                        <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">Pinned</span>
                      </div>
                      <div className="space-y-3">
                        {pinnedMessages.map((message) => (
                          <div
                            key={message.id}
                            className="rounded-2xl overflow-hidden border-2 border-amber-200 bg-amber-50 shadow-sm hover:shadow-md transition-shadow relative"
                          >
                            <div className="absolute top-3 right-3 bg-amber-400 text-white px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 z-10">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-1.429 5.951 1.429a1 1 0 001.169-1.409l-7-14z" />
                              </svg>
                              Pinned
                            </div>
                            <MessageCard
                              message={message}
                              isOwn={message.user_id === userId}
                              onDelete={() => deleteMessage(message.id)}
                              onEdit={(id, text) => editMessage(id, text)}
                              isAdmin={message.user_id === userId}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Regular Messages */}
                  {regularMessages.map((message) => (
                    <div
                      key={message.id}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-200 transition-all"
                    >
                      <MessageCard
                        message={message}
                        isOwn={message.user_id === userId}
                        onDelete={() => deleteMessage(message.id)}
                        onEdit={(id, text) => editMessage(id, text)}
                        onThreadClick={setSelectedThreadId}
                        isAdmin={message.user_id === userId}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommunityPage;

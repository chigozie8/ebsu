import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useGetUserInfo } from '../../../hooks/auth/useGetUserInfo';
import { useCommunityMessages, usePostMessage, useDeleteMessage, useEditMessage, useTypingIndicator } from '../../../hooks/useCommunity';
import { useCommunityMessageEnhanced, useImageUpload } from '../../../hooks/useCommunityFeatures';
import MessageCard from '../../../components/community/MessageCard';
import GuidelinesBanner from '../../../components/community/GuidelinesBanner';
import ThreadViewer from '../../../components/community/ThreadViewer';
import { SubcategoryFilter } from '../../../components/community/SubcategoryFilter';
import { StickerPicker } from '../../../components/community/StickerPicker';
import ChatList from '../../../components/community/ChatList';
import DateDivider from '../../../components/community/DateDivider';
import TypingIndicator from '../../../components/community/TypingIndicator';
import { Send, MessageSquare, ArrowLeft, Image, Smile, X, Hash, Pin, Loader } from 'lucide-react';
import { playSound } from '../../../hooks/useSound';

const TOPICS = ['All', 'General', 'Academics', 'Campus Life', 'Tech', 'Events'];

const CHANNEL_COLORS: Record<string, string> = {
  All:          'bg-teal-500',
  General:      'bg-slate-400',
  Academics:    'bg-blue-500',
  'Campus Life':'bg-pink-500',
  Tech:         'bg-emerald-500',
  Events:       'bg-amber-500',
};

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear()
    && da.getMonth() === db.getMonth()
    && da.getDate() === db.getDate();
}

const CommunityPage: React.FC = () => {
  const navigate = useNavigate();

  // Active channel & mobile view state
  const [activeChannel, setActiveChannel] = useState<string>('General');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);

  // Composer state
  const [newMessage, setNewMessage] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>();
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showSubcategories, setShowSubcategories] = useState(false);
  const [listSearch, setListSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // User info
  const { studentDetails, gettingStudentDetails } = useGetUserInfo();
  const userId = studentDetails?.userID || 'anonymous';
  const userName = studentDetails?.firstName && studentDetails?.lastName
    ? `${studentDetails.firstName} ${studentDetails.lastName}`
    : 'Student User';
  const userAvatar = studentDetails?.profileImageURL || undefined;

  // Data hooks
  const { messages, loading } = useCommunityMessages(activeChannel === 'All' ? undefined : activeChannel);
  const { postMessage, posting } = usePostMessage();
  const { deleteMessage } = useDeleteMessage();
  const { editMessage } = useEditMessage();
  const { imageUrls, addImageUrl, removeImageUrl, clearImages } = useCommunityMessageEnhanced();
  const { uploading, uploadImage } = useImageUpload();
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(
    `community-${activeChannel}`,
    userId,
    userName
  );

  // All messages (for ChatList sidebar last-message preview)
  const { messages: allMessages } = useCommunityMessages(undefined, 50);

  // Sound on new message
  const prevCountRef = useRef<number | null>(null);
  useEffect(() => {
    if (loading) return;
    if (prevCountRef.current !== null && messages.length > prevCountRef.current) {
      const latest = messages[0];
      if (latest && latest.user_id !== userId) playSound('message');
    }
    prevCountRef.current = messages.length;
  }, [messages, loading, userId]);

  // Auto-scroll to bottom when messages arrive
  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  // Scroll on typing
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [typingUsers]);

  // Sorted messages: oldest first for chat-style display
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const pinnedMessages = sortedMessages.filter((m) => m.is_pinned);
  const regularMessages = sortedMessages.filter((m) => !m.is_pinned);
  const displayMessages = [...pinnedMessages, ...regularMessages];

  const handleChannelSelect = (topic: string) => {
    setActiveChannel(topic);
    setMobileView('chat');
    setSelectedSubcategory(undefined);
  };

  const handlePostMessage = async () => {
    if (!newMessage.trim() && imageUrls.length === 0) return;
    if (!studentDetails?.userID) {
      toast.error('Loading your profile… Please try again.');
      return;
    }
    stopTyping();
    try {
      await postMessage(
        userId,
        userName,
        newMessage,
        activeChannel === 'All' ? 'General' : activeChannel,
        userAvatar,
        imageUrls,
        selectedSubcategory
      );
      setNewMessage('');
      clearImages();
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePostMessage();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    if (e.target.value.trim()) startTyping();
  };

  const channelIconColor = CHANNEL_COLORS[activeChannel] ?? 'bg-teal-500';

  return (
    <>
      {/* Thread panel — modal overlay */}
      {selectedThreadId && (
        <ThreadViewer
          messageId={selectedThreadId}
          onClose={() => setSelectedThreadId(null)}
          userId={userId}
          userName={userName}
          userAvatar={userAvatar}
          asModal
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

      {/* Guidelines modal */}
      {showGuidelinesModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowGuidelinesModal(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">Community Guidelines</h2>
              <button onClick={() => setShowGuidelinesModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-5">
              <GuidelinesBanner />
            </div>
          </div>
        </div>
      )}

      {/* ── Full-height WhatsApp-style shell ─────────────────────────── */}
      <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">

        {/* Top nav bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-teal-600 text-white flex-shrink-0 shadow-md">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-base leading-tight">Student Community</h1>
            <p className="text-teal-200 text-xs">EBSU Student Hub</p>
          </div>
          {/* Mobile: back-to-list button in chat view */}
          {mobileView === 'chat' && (
            <button
              onClick={() => setMobileView('list')}
              className="lg:hidden p-1.5 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"
            >
              Chats
            </button>
          )}
        </div>

        {/* ── Body: sidebar + chat window ─────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT SIDEBAR — channel list */}
          <div
            className={`
              w-full lg:w-[300px] xl:w-[320px] flex-shrink-0
              ${mobileView === 'chat' ? 'hidden lg:flex' : 'flex'}
              flex-col h-full border-r border-slate-200
            `}
          >
            <ChatList
              topics={TOPICS}
              activeChannel={activeChannel}
              messages={allMessages}
              onChannelSelect={handleChannelSelect}
              searchQuery={listSearch}
              onSearchChange={setListSearch}
              onGuidelinesClick={() => setShowGuidelinesModal(true)}
            />
          </div>

          {/* RIGHT PANEL — chat window */}
          <div
            className={`
              flex-1 flex flex-col h-full overflow-hidden
              ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'}
            `}
          >
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0 shadow-sm">
              {/* Mobile back button */}
              <button
                onClick={() => setMobileView('list')}
                className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
              </button>

              <div className={`w-9 h-9 ${channelIconColor} rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0`}>
                <Hash className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-slate-800 text-sm">{activeChannel}</h2>
                <p className="text-xs text-slate-400">
                  {loading ? 'Loading…' : `${messages.length} messages`}
                </p>
              </div>

              {/* Pinned messages indicator */}
              {pinnedMessages.length > 0 && (
                <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full">
                  <Pin className="w-3 h-3 text-amber-500" />
                  <span className="text-xs font-semibold text-amber-600">{pinnedMessages.length} pinned</span>
                </div>
              )}

              {/* Subcategory toggle */}
              <button
                onClick={() => setShowSubcategories(!showSubcategories)}
                className={`p-1.5 rounded-lg transition-colors text-xs font-medium ${showSubcategories ? 'bg-teal-100 text-teal-700' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                Filter
              </button>
            </div>

            {/* Subcategory filter (collapsible) */}
            {showSubcategories && (
              <div className="px-4 py-3 bg-white border-b border-slate-100">
                <SubcategoryFilter
                  selectedCategory={selectedSubcategory}
                  onCategoryChange={setSelectedSubcategory}
                />
              </div>
            )}

            {/* Messages area */}
            <div
              className="flex-1 overflow-y-auto py-2"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                backgroundColor: '#f1f5f9',
              }}
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader className="w-8 h-8 text-teal-500 animate-spin mb-3" />
                  <p className="text-slate-400 text-sm">Loading messages…</p>
                </div>
              ) : displayMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                    <MessageSquare className="w-8 h-8 text-teal-300" />
                  </div>
                  <p className="text-slate-700 font-semibold">No messages yet</p>
                  <p className="text-slate-400 text-sm mt-1">Be the first to start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {displayMessages.map((message, index) => {
                    const prev = displayMessages[index - 1];
                    const showDate = index === 0 || !isSameDay(prev.created_at, message.created_at);

                    return (
                      <React.Fragment key={message.id}>
                        {showDate && <DateDivider date={message.created_at} />}
                        <MessageCard
                          message={message}
                          isOwn={message.user_id === userId}
                          onDelete={() => deleteMessage(message.id)}
                          onEdit={(id, text) => editMessage(id, text)}
                          onThreadClick={setSelectedThreadId}
                          isAdmin={message.user_id === userId}
                          currentUserId={userId}
                        />
                      </React.Fragment>
                    );
                  })}

                  {/* Typing indicator */}
                  <TypingIndicator typingUsers={typingUsers} />
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* Image preview strip */}
            {imageUrls.length > 0 && (
              <div className="flex gap-2 px-4 py-2 bg-white border-t border-slate-100">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={url}
                      alt={`preview-${idx}`}
                      className="w-16 h-16 object-cover rounded-xl border border-slate-200"
                    />
                    <button
                      onClick={() => removeImageUrl(idx)}
                      className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Composer / input bar */}
            <div className="px-3 py-3 bg-white border-t border-slate-200 flex-shrink-0">
              <div className="flex items-end gap-2">
                {/* User avatar */}
                <div className="flex-shrink-0 mb-0.5">
                  {userAvatar ? (
                    <img src={userAvatar} alt={userName} className="w-9 h-9 rounded-full object-cover ring-2 ring-teal-200" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center text-white text-sm font-bold ring-2 ring-teal-100">
                      {userName.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Input container */}
                <div className="flex-1 flex items-end gap-2 bg-slate-100 rounded-2xl px-3 py-2.5">
                  {/* Attachments */}
                  <div className="flex gap-1 flex-shrink-0">
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
                      className="p-1 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-40 text-slate-500"
                      title="Attach image"
                    >
                      {uploading ? <Loader className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setShowStickerPicker(true)}
                      className="p-1 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
                      title="Sticker"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={handleTextChange}
                    onKeyDown={onKeyDown}
                    onBlur={stopTyping}
                    placeholder={`Message #${activeChannel}…`}
                    className="flex-1 bg-transparent resize-none focus:outline-none text-sm text-slate-800 placeholder-slate-400 max-h-32 min-h-[1.5rem] leading-relaxed"
                    rows={1}
                  />
                </div>

                {/* Send button */}
                <button
                  onClick={handlePostMessage}
                  disabled={posting || (!newMessage.trim() && imageUrls.length === 0) || gettingStudentDetails}
                  className="flex-shrink-0 w-10 h-10 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors shadow-md mb-0.5"
                >
                  {posting
                    ? <Loader className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Empty state for desktop when no channel selected (shouldn't happen with default) */}
        </div>
      </div>
    </>
  );
};

export default CommunityPage;

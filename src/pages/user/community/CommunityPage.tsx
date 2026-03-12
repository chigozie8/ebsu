import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useGetUserInfo } from '../../../hooks/auth/useGetUserInfo';
import { useCommunityMessages, usePostMessage, useDeleteMessage, useEditMessage } from '../../../hooks/useCommunity';
import MessageCard from '../../../components/community/MessageCard';
import GuidelinesBanner from '../../../components/community/GuidelinesBanner';
import ThreadViewer from '../../../components/community/ThreadViewer';
import { Send, Search, MessageSquare, Check } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const CommunityPage: React.FC = () => {
  const [topic, setTopic] = useState<string>('All');
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  // Get current user from useGetUserInfo hook
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

  const topics = ['All', 'General', 'Academics', 'Campus Life', 'Tech', 'Events'];

  // Subscribe to message updates
  useEffect(() => {
    const channel = supabase
      .channel('community_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'community_messages',
        },
        () => {
          // Message was updated (likes_count changed), the component will re-render with new data from the hook
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const filteredMessages = messages.filter((msg) =>
    msg.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate pinned and regular messages
  const pinnedMessages = filteredMessages.filter((msg) => msg.is_pinned);
  const regularMessages = filteredMessages.filter((msg) => !msg.is_pinned);

  const handlePostMessage = async () => {
    if (!newMessage.trim()) return;

    // Check if user info is loaded
    if (!studentDetails || !studentDetails.userID) {
      toast.error('Loading your profile... Please try again in a moment.');
      return;
    }

    try {
      await postMessage(userId, userName, newMessage, topic === 'All' ? 'General' : topic, userAvatar);
      setNewMessage('');
      toast.success('Message posted successfully!', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)',
          color: 'white',
          borderRadius: '8px',
          padding: '16px',
          fontSize: '14px',
          fontWeight: '500',
        },
        icon: <Check className="w-5 h-5" />,
      });
    } catch (err) {
      console.error('[v0] Failed to post message:', err);
      toast.error('Failed to post message. Please try again.');
    }
  };

  return (
    <>
      {/* Thread Viewer Modal */}
      {selectedThreadId && (
        <ThreadViewer
          messageId={selectedThreadId}
          onClose={() => setSelectedThreadId(null)}
          userId={userId}
          userName={userName}
          userAvatar={userAvatar}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 pb-6 sm:pb-8 lg:pb-10">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur shadow-sm border-b border-gray-200">
        <div className="w-full max-w-[1720px] mx-auto px-3 xxss:px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg p-2 sm:p-2.5">
              <MessageSquare className="w-5 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">Student Community</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Ask questions, share ideas, and connect</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1720px] mx-auto px-3 xxss:px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6 lg:mt-8">
        {/* Search Bar */}
        <div className="mb-4 sm:mb-5 lg:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 sm:top-3 w-4 sm:w-5 h-4 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages or users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Topic Filter - Horizontal Scroll on Mobile */}
        <div className="mb-4 sm:mb-5 lg:mb-6 overflow-x-auto pb-2 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8">
          <div className="flex gap-2 min-w-max">
            {topics.map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  topic === t
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* New Message Composer */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-3 sm:p-4 lg:p-5 mb-4 sm:mb-5 lg:mb-6">
          <div className="flex gap-2 sm:gap-3">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="w-9 sm:w-10 h-9 sm:h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center flex-shrink-0 text-white text-xs sm:text-sm font-bold">
                {userName.charAt(0)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full p-2 sm:p-3 text-sm sm:text-base border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows={2}
              />
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-between items-stretch sm:items-center mt-2 sm:mt-3">
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {topics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handlePostMessage}
                  disabled={posting || !newMessage.trim() || gettingStudentDetails}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm sm:text-base rounded-lg font-medium hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Post</span>
                  <span className="sm:hidden">Post</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Community Guidelines Banner */}
        <GuidelinesBanner />

        {/* Messages */}
        {loading ? (
          <div className="text-center py-12 sm:py-16">
            <div className="animate-spin rounded-full h-10 sm:h-12 w-10 sm:w-12 border-b-2 border-teal-500 mx-auto mb-3 sm:mb-4"></div>
            <p className="text-sm sm:text-base text-gray-600">Loading discussions...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-white rounded-xl border border-gray-100">
            <MessageSquare className="w-10 sm:w-12 h-10 sm:h-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-600">No messages yet. Be the first to ask something!</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4 lg:space-y-5">
            {/* Pinned Messages Section */}
            {pinnedMessages.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-1.429 5.951 1.429a1 1 0 001.169-1.409l-7-14z" />
                  </svg>
                  <h2 className="text-sm font-semibold text-gray-900">Pinned Messages</h2>
                </div>
                <div className="space-y-3 sm:space-y-4 mb-6">
                  {pinnedMessages.map((message) => (
                    <div key={message.id} className="bg-amber-50 rounded-xl shadow-md border-2 border-amber-200 overflow-hidden hover:shadow-lg transition-shadow relative">
                      <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
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
                        userId={userId}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Messages */}
            {regularMessages.length > 0 && (
              <div className="space-y-3 sm:space-y-4 lg:space-y-5">
                {regularMessages.map((message) => (
                  <div key={message.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                    <MessageCard
                      message={message}
                      isOwn={message.user_id === userId}
                      onDelete={() => deleteMessage(message.id)}
                      onEdit={(id, text) => editMessage(id, text)}
                      userId={userId}
                      onThreadClick={setSelectedThreadId}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default CommunityPage;

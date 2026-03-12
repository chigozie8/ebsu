import React, { useState, useEffect } from 'react';
import { useCommunityMessages, usePostMessage, useLikeMessage, useDeleteMessage, useEditMessage, useCommunityReplies, usePostReply, useDeleteReply, useEditReply } from '../../../hooks/useCommunity';
import MessageCard from '../../../components/community/MessageCard';
import ReplyCard from '../../../components/community/ReplyCard';
import { Send, Search, X, MessageSquare, ChevronDown } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const CommunityPage: React.FC = () => {
  const [topic, setTopic] = useState<string>('All');
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());
  const [likedReplies, setLikedReplies] = useState<Set<string>>(new Set());

  // Get current user from localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.id || 'anonymous';
  const userName = user?.displayName || user?.name || 'Anonymous';
  const userAvatar = user?.photoURL || user?.avatar || undefined;

  const { messages, loading } = useCommunityMessages(topic === 'All' ? undefined : topic);
  const { postMessage, posting } = usePostMessage();
  const { likeMessage, unlikeMessage, liking } = useLikeMessage();
  const { deleteMessage } = useDeleteMessage();
  const { editMessage } = useEditMessage();
  const { postReply, posting: postingReply } = usePostReply();
  const { deleteReply } = useDeleteReply();
  const { editReply } = useEditReply();

  const topics = ['All', 'General', 'Academics', 'Campus Life', 'Tech', 'Events'];

  // Fetch user likes for messages
  useEffect(() => {
    const fetchLikes = async () => {
      if (!userId || userId === 'anonymous') return;

      try {
        const { data } = await supabase
          .from('community_likes')
          .select('message_id')
          .eq('user_id', userId);

        if (data) {
          setLikedMessages(new Set(data.map((like) => like.message_id)));
        }
      } catch (err) {
        console.error('Failed to fetch likes:', err);
      }
    };

    fetchLikes();

    const channel = supabase
      .channel(`likes:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_likes',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLikedMessages((prev) => new Set([...prev, payload.new.message_id]));
          } else if (payload.eventType === 'DELETE') {
            setLikedMessages((prev) => {
              const next = new Set(prev);
              next.delete(payload.old.message_id);
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  const filteredMessages = messages.filter((msg) =>
    msg.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePostMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await postMessage(userId, userName, newMessage, topic === 'All' ? 'General' : topic, userAvatar);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to post message:', err);
    }
  };

  const handleLike = async (messageId: string) => {
    try {
      if (likedMessages.has(messageId)) {
        await unlikeMessage(messageId, userId);
      } else {
        await likeMessage(messageId, userId);
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handlePostReply = async (messageId: string) => {
    const text = replyText[messageId]?.trim();
    if (!text) return;

    try {
      await postReply(messageId, userId, userName, text, userAvatar);
      setReplyText({ ...replyText, [messageId]: '' });
    } catch (err) {
      console.error('Failed to post reply:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-6 h-6 text-teal-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Student Community</h1>
          </div>
          <p className="text-gray-600">Ask questions, share ideas, and connect with your classmates</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Topic Filter */}
        <div className="mb-6 overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            {topics.map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className={`px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap ${
                  topic === t
                    ? 'bg-teal-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-teal-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* New Message Composer */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 mb-6">
          <div className="flex gap-3">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center flex-shrink-0 text-white font-bold">
                {userName.charAt(0)}
              </div>
            )}

            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows={3}
              />
              <div className="flex gap-2 justify-between items-center mt-3">
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {topics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handlePostMessage}
                  disabled={posting || !newMessage.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading discussions...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No messages yet. Be the first to ask something!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <div key={message.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <MessageCard
                  message={message}
                  isOwn={message.user_id === userId}
                  onReply={() => setExpandedMessage(expandedMessage === message.id ? null : message.id)}
                  onLike={() => handleLike(message.id)}
                  onUnlike={() => handleLike(message.id)}
                  onDelete={() => deleteMessage(message.id)}
                  onEdit={(id, text) => editMessage(id, text)}
                  isLiked={likedMessages.has(message.id)}
                  liking={liking}
                />

                {/* Expanded Thread */}
                {expandedMessage === message.id && (
                  <ExpandedThread
                    messageId={message.id}
                    userId={userId}
                    userName={userName}
                    userAvatar={userAvatar}
                    replyText={replyText[message.id] || ''}
                    setReplyText={(text) =>
                      setReplyText({ ...replyText, [message.id]: text })
                    }
                    onPostReply={() => handlePostReply(message.id)}
                    onDeleteReply={deleteReply}
                    onEditReply={editReply}
                    postingReply={postingReply}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface ExpandedThreadProps {
  messageId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  replyText: string;
  setReplyText: (text: string) => void;
  onPostReply: () => void;
  onDeleteReply: (replyId: string) => void;
  onEditReply: (replyId: string, newReply: string) => void;
  postingReply: boolean;
}

const ExpandedThread: React.FC<ExpandedThreadProps> = ({
  messageId,
  userId,
  userName,
  userAvatar,
  replyText,
  setReplyText,
  onPostReply,
  onDeleteReply,
  onEditReply,
  postingReply,
}) => {
  const { replies, loading } = useCommunityReplies(messageId);

  return (
    <div className="border-t border-gray-100 bg-gray-50 p-4">
      {/* Existing Replies */}
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500 mx-auto"></div>
        </div>
      ) : replies.length > 0 ? (
        <div className="space-y-3 mb-4">
          {replies.map((reply) => (
            <ReplyCard
              key={reply.id}
              reply={reply}
              isOwn={reply.user_id === userId}
              onDelete={onDeleteReply}
              onEdit={onEditReply}
            />
          ))}
        </div>
      ) : null}

      {/* Reply Composer */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        {userAvatar ? (
          <img
            src={userAvatar}
            alt={userName}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
            {userName.charAt(0)}
          </div>
        )}

        <div className="flex-1">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="w-full p-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            rows={2}
          />
          <button
            onClick={onPostReply}
            disabled={postingReply || !replyText.trim()}
            className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            Reply
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;

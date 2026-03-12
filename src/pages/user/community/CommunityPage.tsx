import React, { useState, useCallback, useEffect } from 'react';
import { useCommunityMessages, usePostMessage, useLikeMessage, useDeleteMessage, useEditMessage, useCommunityReplies } from '../../../hooks/useCommunity';
import MessageCard from '../../../components/community/MessageCard';
import { Send, Search, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const CommunityPage: React.FC = () => {
  const [topic, setTopic] = useState<string>('All');
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());
  
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
  const { replies } = useCommunityReplies(selectedMessage || '');

  const topics = ['All', 'General', 'Academics', 'Campus Life', 'Tech', 'Events'];

  const topicColors: Record<string, string> = {
    'General': 'bg-purple-100 text-purple-700',
    'Academics': 'bg-blue-100 text-blue-700',
    'Campus Life': 'bg-pink-100 text-pink-700',
    'Tech': 'bg-green-100 text-green-700',
    'Events': 'bg-amber-100 text-amber-700',
  };

  // Fetch user likes
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

    // Subscribe to like changes
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
      console.error('Failed to like message:', err);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await deleteMessage(messageId);
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const handleEdit = async (messageId: string, newMessage: string) => {
    try {
      await editMessage(messageId, newMessage);
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Student Community</h1>
          <p className="text-gray-600">Ask questions, share knowledge, and connect with fellow students</p>
        </div>

        {/* Post Message Box */}
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-md border border-gray-200">
          <div className="flex gap-3 mb-4">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center text-white font-bold">
                {userName.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500">Posting as yourself</p>
            </div>
          </div>

          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="What's on your mind? Ask a question or share an insight..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent mb-3 resize-none"
            rows={4}
          />

          <div className="flex items-center justify-between">
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            >
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <button
              onClick={handlePostMessage}
              disabled={!newMessage.trim() || posting}
              className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-2 rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <Send className="w-4 h-4" />
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Topic Badges */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {topics.map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                topic === t
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-teal-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Messages Feed */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-xl" />
                ))}
              </div>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500 text-lg">
                {searchQuery ? 'No messages match your search' : 'No messages yet. Be the first to start a discussion!'}
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <MessageCard
                key={msg.id}
                message={msg}
                isOwn={msg.user_id === userId}
                onReply={() => setSelectedMessage(msg.id)}
                onLike={() => handleLike(msg.id)}
                onUnlike={() => handleLike(msg.id)}
                onDelete={() => handleDelete(msg.id)}
                onEdit={(id, text) => handleEdit(id, text)}
                isLiked={likedMessages.has(msg.id)}
                liking={liking}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;

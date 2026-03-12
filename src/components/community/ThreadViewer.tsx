import React, { useState, useEffect } from 'react';
import { X, Send, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase, CommunityReply } from '../../lib/supabase';

interface ThreadViewerProps {
  messageId: string;
  onClose: () => void;
  userId: string;
  userName: string;
  userAvatar?: string;
}

const ThreadViewer: React.FC<ThreadViewerProps> = ({
  messageId,
  onClose,
  userId,
  userName,
  userAvatar,
}) => {
  const [replies, setReplies] = useState<CommunityReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchReplies();

    // Subscribe to reply changes
    const channel = supabase
      .channel(`thread:${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_replies',
          filter: `message_id=eq.${messageId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReplies((prev) => [...prev, payload.new as CommunityReply]);
          } else if (payload.eventType === 'DELETE') {
            setReplies((prev) => prev.filter((r) => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [messageId]);

  const fetchReplies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('community_replies')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setReplies(data || []);
    } catch (err) {
      console.error('[v0] Failed to fetch replies:', err);
      toast.error('Failed to load replies');
    } finally {
      setLoading(false);
    }
  };

  const handlePostReply = async () => {
    if (!replyText.trim()) return;

    setPosting(true);
    try {
      const { error } = await supabase.from('community_replies').insert([
        {
          message_id: messageId,
          user_id: userId,
          user_name: userName,
          user_avatar: userAvatar,
          reply_text: replyText,
          created_at: new Date().toISOString(),
          is_edited: false,
          is_deleted: false,
        },
      ]);

      if (error) throw error;

      setReplyText('');
      toast.success('Reply posted!', { duration: 2000 });
    } catch (err) {
      console.error('[v0] Failed to post reply:', err);
      toast.error('Failed to post reply');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Thread Replies</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Replies Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 text-teal-500 animate-spin" />
            </div>
          ) : replies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No replies yet. Be the first to respond!</p>
            </div>
          ) : (
            replies.map((reply) => (
              <div key={reply.id} className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                <div className="flex gap-3">
                  {reply.user_avatar ? (
                    <img
                      src={reply.user_avatar}
                      alt={reply.user_name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                      {reply.user_name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{reply.user_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(reply.created_at).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-gray-700 text-sm mt-1">{reply.reply}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reply Composer */}
        <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
          <div className="space-y-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              rows={2}
            />
            <button
              onClick={handlePostReply}
              disabled={posting || !replyText.trim()}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-medium hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all w-full sm:w-auto"
            >
              <Send className="w-4 h-4" />
              Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreadViewer;

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase, CommunityReply } from '../../lib/supabase';

interface ThreadViewerProps {
  messageId: string;
  onClose: () => void;
  userId: string;
  userName: string;
  userAvatar?: string;
}

const AVATAR_COLORS = [
  'from-teal-400 to-cyan-400',
  'from-blue-400 to-indigo-400',
  'from-pink-400 to-rose-400',
  'from-amber-400 to-orange-400',
  'from-emerald-400 to-teal-400',
];
function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}
function formatTime(date: string) {
  return new Date(date).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const ThreadViewer: React.FC<ThreadViewerProps> = ({
  messageId, onClose, userId, userName, userAvatar,
}) => {
  const [replies,  setReplies]  = useState<CommunityReply[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [replyText, setReplyText] = useState('');
  const [posting,  setPosting]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReplies();
    const channel = supabase
      .channel(`thread:${messageId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_replies', filter: `message_id=eq.${messageId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') setReplies((p) => [...p, payload.new as CommunityReply]);
          if (payload.eventType === 'DELETE')  setReplies((p) => p.filter((r) => r.id !== payload.old.id));
        }
      )
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [messageId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies]);

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
      console.error('[community] fetch replies failed:', err);
      toast.error('Failed to load replies');
    } finally {
      setLoading(false);
    }
  };

  const handlePostReply = async () => {
    if (!replyText.trim()) return;
    setPosting(true);
    try {
      const { error } = await supabase.from('community_replies').insert([{
        message_id: messageId,
        user_id: userId,
        user_name: userName,
        user_avatar: userAvatar,
        reply: replyText,
        created_at: new Date().toISOString(),
        is_edited: false,
        is_deleted: false,
      }]);
      if (error) throw error;
      setReplyText('');
      toast.success('Reply posted!', { duration: 2000 });
    } catch (err) {
      console.error('[community] post reply failed:', err);
      toast.error('Failed to post reply');
    } finally {
      setPosting(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handlePostReply();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-teal-500 to-cyan-500">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-white/25 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">Thread Replies</h2>
              <p className="text-teal-100 text-xs">{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Replies list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 text-teal-500 animate-spin" />
            </div>
          ) : replies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mb-3">
                <MessageCircle className="w-6 h-6 text-teal-300" />
              </div>
              <p className="text-slate-600 font-semibold text-sm">No replies yet</p>
              <p className="text-slate-400 text-xs mt-1">Be the first to respond!</p>
            </div>
          ) : (
            replies.map((reply) => {
              const gradient = getAvatarColor(reply.user_name);
              const initials = getInitials(reply.user_name);
              const isMe = reply.user_id === userId;
              return (
                <div key={reply.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                  {reply.user_avatar ? (
                    <img
                      src={reply.user_avatar}
                      alt={reply.user_name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-slate-100"
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ring-2 ring-slate-100`}>
                      {initials}
                    </div>
                  )}
                  <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-tr-sm'
                        : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                    }`}>
                      {reply.reply}
                    </div>
                    <div className={`flex items-center gap-1.5 mt-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs font-semibold text-slate-600">{isMe ? 'You' : reply.user_name}</span>
                      <span className="text-xs text-slate-400">{formatTime(reply.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50">
          {userAvatar ? (
            <div className="flex gap-3 items-start">
              <img src={userAvatar} alt={userName} className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-teal-200" />
              <ReplyInput replyText={replyText} setReplyText={setReplyText} onKeyDown={onKeyDown} posting={posting} onPost={handlePostReply} />
            </div>
          ) : (
            <div className="flex gap-3 items-start">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(userName)} flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ring-2 ring-teal-100`}>
                {getInitials(userName)}
              </div>
              <ReplyInput replyText={replyText} setReplyText={setReplyText} onKeyDown={onKeyDown} posting={posting} onPost={handlePostReply} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ReplyInputProps {
  replyText: string;
  setReplyText: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  posting: boolean;
  onPost: () => void;
}
const ReplyInput: React.FC<ReplyInputProps> = ({ replyText, setReplyText, onKeyDown, posting, onPost }) => (
  <div className="flex-1">
    <textarea
      value={replyText}
      onChange={(e) => setReplyText(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder="Write a reply… (Ctrl+Enter to send)"
      className="w-full p-3 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm bg-white placeholder-slate-400"
      rows={2}
    />
    <div className="flex justify-end mt-2">
      <button
        onClick={onPost}
        disabled={posting || !replyText.trim()}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm rounded-lg font-semibold hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {posting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Send
      </button>
    </div>
  </div>
);

export default ThreadViewer;

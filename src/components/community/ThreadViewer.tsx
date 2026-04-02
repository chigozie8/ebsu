import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader, MessageCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase, CommunityReply } from '../../lib/supabase';
import { useTypingIndicator } from '../../hooks/useCommunity';
import TypingIndicator from './TypingIndicator';
import DateDivider from './DateDivider';

interface ThreadViewerProps {
  messageId: string;
  onClose: () => void;
  userId: string;
  userName: string;
  userAvatar?: string;
  /** When true, renders as a modal overlay; false = embedded panel */
  asModal?: boolean;
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
  return new Date(date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear()
    && da.getMonth() === db.getMonth()
    && da.getDate() === db.getDate();
}

const ThreadViewer: React.FC<ThreadViewerProps> = ({
  messageId,
  onClose,
  userId,
  userName,
  userAvatar,
  asModal = true,
}) => {
  const [replies, setReplies] = useState<CommunityReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [posting, setPosting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(
    `thread-${messageId}`,
    userId,
    userName
  );

  useEffect(() => {
    fetchReplies();
    const channel = supabase
      .channel(`thread:${messageId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_replies', filter: `message_id=eq.${messageId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') setReplies((p) => [...p, payload.new as CommunityReply]);
          if (payload.eventType === 'DELETE') setReplies((p) => p.filter((r) => r.id !== payload.old.id));
        }
      )
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [messageId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies, typingUsers]);

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
    stopTyping();
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePostReply();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyText(e.target.value);
    startTyping();
  };

  const content = (
    <div className={`flex flex-col h-full overflow-hidden ${asModal ? 'bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh]' : 'bg-white'}`}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex-shrink-0"
          title={asModal ? 'Close' : 'Back to main chat'}
        >
          {asModal ? (
            <X className="w-4 h-4 text-white" />
          ) : (
            <ArrowLeft className="w-4 h-4 text-white" />
          )}
        </button>
        <div className="w-7 h-7 bg-white/25 rounded-lg flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-bold text-sm leading-tight">Thread Replies</h2>
          <p className="text-teal-100 text-xs">
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </p>
        </div>
      </div>

      {/* Replies list */}
      <div className="flex-1 overflow-y-auto py-3 space-y-1 bg-slate-50">
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
          replies.map((reply, index) => {
            const gradient = getAvatarColor(reply.user_name);
            const initials = getInitials(reply.user_name);
            const isMe = reply.user_id === userId;
            const showDateDivider = index === 0
              || !isSameDay(replies[index - 1].created_at, reply.created_at);

            return (
              <React.Fragment key={reply.id}>
                {showDateDivider && <DateDivider date={reply.created_at} />}
                <div className={`flex items-end gap-2 px-3 py-1 group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  {!isMe && (
                    <div className="flex-shrink-0 mb-1">
                      {reply.user_avatar ? (
                        <img
                          src={reply.user_avatar}
                          alt={reply.user_name}
                          className="w-7 h-7 rounded-full object-cover ring-2 ring-white shadow-sm"
                        />
                      ) : (
                        <div
                          className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm`}
                        >
                          {initials}
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[72%] ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && (
                      <span className="text-xs font-semibold text-slate-500 mb-0.5 ml-1">{reply.user_name}</span>
                    )}
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                        isMe
                          ? 'bg-teal-500 text-white rounded-br-sm'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{reply.reply}</p>
                      <div className={`flex items-center gap-1 mt-1 justify-end`}>
                        {reply.is_edited && (
                          <span className={`text-xs italic ${isMe ? 'text-white/60' : 'text-slate-400'}`}>edited</span>
                        )}
                        <span className={`text-xs ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                          {formatTime(reply.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}

        {/* Typing indicator */}
        <TypingIndicator typingUsers={typingUsers} />
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-slate-200 bg-white px-3 py-3 flex-shrink-0">
        <div className="flex items-end gap-2">
          {/* Avatar */}
          <div className="flex-shrink-0 mb-0.5">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-8 h-8 rounded-full object-cover ring-2 ring-teal-200" />
            ) : (
              <div
                className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(userName)} flex items-center justify-center text-white text-xs font-bold ring-2 ring-teal-100`}
              >
                {getInitials(userName)}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex-1 flex items-end gap-2 bg-slate-100 rounded-2xl px-3 py-2">
            <textarea
              ref={textareaRef}
              value={replyText}
              onChange={handleTextChange}
              onKeyDown={onKeyDown}
              onBlur={stopTyping}
              placeholder="Reply… (Enter to send)"
              className="flex-1 bg-transparent resize-none focus:outline-none text-sm text-slate-800 placeholder-slate-400 max-h-28 min-h-[1.5rem] leading-relaxed"
              rows={1}
            />
            <button
              onClick={handlePostReply}
              disabled={posting || !replyText.trim()}
              className="flex-shrink-0 w-8 h-8 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
            >
              {posting
                ? <Loader className="w-3.5 h-3.5 animate-spin" />
                : <Send className="w-3.5 h-3.5" />
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!asModal) return content;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {content}
    </div>
  );
};

export default ThreadViewer;

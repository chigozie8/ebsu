import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader, MessageCircle, CheckCheck } from 'lucide-react';
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
function formatTimestamp(date: string) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function formatDateLabel(date: string) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const ThreadViewer: React.FC<ThreadViewerProps> = ({
  messageId, onClose, userId, userName, userAvatar,
}) => {
  const [replies,   setReplies]   = useState<CommunityReply[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [replyText, setReplyText] = useState('');
  const [posting,   setPosting]   = useState(false);
  const [typing,    setTyping]    = useState(false);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setReplies(data || []);
    } catch (err) {
      console.error('[community] fetch replies failed:', err);
      toast.error('Failed to load replies. Tap to retry.');
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
    } catch (err) {
      console.error('[community] post reply failed:', err);
      toast.error('Failed to send. Please try again.');
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

  // Group replies by date
  type DateGroup = { label: string; replies: CommunityReply[] };
  const dateGroups: DateGroup[] = [];
  replies.forEach((reply) => {
    const label = formatDateLabel(reply.created_at);
    const last = dateGroups[dateGroups.length - 1];
    if (!last || last.label !== label) {
      dateGroups.push({ label, replies: [reply] });
    } else {
      last.replies.push(reply);
    }
  });

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-enter bg-white w-full sm:rounded-2xl shadow-2xl sm:max-w-xl flex flex-col overflow-hidden"
        style={{ height: '92dvh', maxHeight: '680px' }}>

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 py-3.5 bg-[#075E54] flex-shrink-0">
          <button
            onClick={onClose}
            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-sm leading-tight">Thread</h2>
            <p className="text-white/70 text-[11px]">{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</p>
          </div>
        </div>

        {/* ── Messages area (scrollable) ── */}
        <div className="flex-1 overflow-y-auto chat-bg px-4 py-4 space-y-1">
          {loading ? (
            <div className="space-y-4 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                  <div className="w-8 h-8 rounded-full skeleton-shimmer flex-shrink-0" />
                  <div className={`space-y-1.5 ${i % 2 === 0 ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className="h-3 w-20 skeleton-shimmer rounded-full" />
                    <div className="h-10 w-48 skeleton-shimmer rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : replies.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <MessageCircle className="w-8 h-8 text-[#25D366]" />
              </div>
              <p className="text-slate-600 font-semibold text-sm">No replies yet</p>
              <p className="text-slate-400 text-xs mt-1">Be the first to respond!</p>
            </div>
          ) : (
            dateGroups.map((group) => (
              <div key={group.label}>
                {/* Date divider */}
                <div className="flex items-center justify-center my-3">
                  <span className="bg-white/80 backdrop-blur-sm text-slate-500 text-[11px] font-semibold px-3 py-1 rounded-full shadow-sm">
                    {group.label}
                  </span>
                </div>

                {group.replies.map((reply) => {
                  const gradient = getAvatarColor(reply.user_name);
                  const initials = getInitials(reply.user_name);
                  const isMe = reply.user_id === userId;
                  return (
                    <div key={reply.id} className={`flex gap-2 mb-1 message-bubble-enter ${isMe ? 'flex-row-reverse' : ''}`}>
                      {reply.user_avatar ? (
                        <img
                          src={reply.user_avatar}
                          alt={reply.user_name}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow-sm self-end"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.user_name)}&background=25D366&color=fff`; }}
                        />
                      ) : (
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ring-2 ring-white shadow-sm self-end`}>
                          {initials}
                        </div>
                      )}
                      <div className={`flex flex-col max-w-[72%] ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && (
                          <span className="text-[11px] font-semibold text-[#075E54] mb-0.5 ml-1">{reply.user_name}</span>
                        )}
                        <div className={isMe ? 'bubble-out' : 'bubble-in'} style={{ padding: '8px 12px' }}>
                          <p className="text-[13.5px] leading-relaxed text-slate-800 whitespace-pre-wrap break-words">
                            {reply.reply}
                          </p>
                          <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[10px] text-slate-400 tabular-nums">{formatTimestamp(reply.created_at)}</span>
                            {isMe && <CheckCheck className="w-3 h-3 text-[#53bdeb]" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Input bar ── */}
        <div className="flex-shrink-0 bg-[#f0f0f0] px-3 py-2.5 flex items-end gap-2 border-t border-black/5">
          {userAvatar ? (
            <img src={userAvatar} alt={userName} className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow-sm self-end"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=25D366&color=fff`; }} />
          ) : (
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(userName)} flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ring-2 ring-white shadow-sm self-end`}>
              {getInitials(userName)}
            </div>
          )}

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={replyText}
              onChange={(e) => {
                setReplyText(e.target.value);
                setTyping(e.target.value.length > 0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Type a reply…"
              rows={1}
              className="w-full px-4 py-2.5 bg-white rounded-2xl text-[14px] text-slate-800 placeholder-slate-400 resize-none wa-input border border-transparent focus:border-[#25D366]/20 shadow-sm max-h-28 overflow-y-auto leading-relaxed"
              style={{ minHeight: '42px' }}
            />
          </div>

          <button
            onClick={handlePostReply}
            disabled={posting || !replyText.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
              replyText.trim()
                ? 'bg-[#25D366] hover:bg-[#128C7E] shadow-md hover:shadow-lg active:scale-95 send-btn-pulse'
                : 'bg-slate-300'
            }`}
          >
            {posting
              ? <Loader className="w-4 h-4 text-white animate-spin" />
              : <Send className="w-4 h-4 text-white" style={{ transform: 'rotate(45deg)' }} />
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThreadViewer;

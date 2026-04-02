import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Loader, MessageCircle, Check, CheckCheck, Smile } from 'lucide-react';
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

function formatMessageTime(date: string) {
  return new Date(date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDateChip(date: string) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupByDate(replies: CommunityReply[]) {
  const groups: { date: string; items: CommunityReply[] }[] = [];
  for (const reply of replies) {
    const chip = formatDateChip(reply.created_at);
    const last = groups[groups.length - 1];
    if (last && last.date === chip) {
      last.items.push(reply);
    } else {
      groups.push({ date: chip, items: [reply] });
    }
  }
  return groups;
}

// ── Tick component ─────────────────────────────────────────────────────────
const Ticks: React.FC<{ seen?: boolean; delivered?: boolean }> = ({ seen, delivered }) => {
  if (seen) return (
    <span className="inline-flex items-center ml-1" title="Seen">
      <CheckCheck className="w-3.5 h-3.5" style={{ color: '#53bdeb' }} />
    </span>
  );
  if (delivered) return (
    <span className="inline-flex items-center ml-1 wa-tick" title="Delivered">
      <CheckCheck className="w-3.5 h-3.5" />
    </span>
  );
  return (
    <span className="inline-flex items-center ml-1 wa-tick" title="Sent">
      <Check className="w-3.5 h-3.5" />
    </span>
  );
};

// ── Typing indicator ────────────────────────────────────────────────────────
const TypingIndicator: React.FC = () => (
  <div className="flex items-end gap-2 mb-1">
    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
      <Smile className="w-4 h-4 text-gray-400" />
    </div>
    <div className="wa-bubble-in px-4 py-3 max-w-[80px]">
      <div className="flex gap-1 items-center h-4">
        <div className="wa-typing-dot" />
        <div className="wa-typing-dot" />
        <div className="wa-typing-dot" />
      </div>
    </div>
  </div>
);

const ThreadViewer: React.FC<ThreadViewerProps> = ({
  messageId, onClose, userId, userName, userAvatar,
}) => {
  const [replies,    setReplies]   = useState<CommunityReply[]>([]);
  const [loading,    setLoading]   = useState(true);
  const [replyText,  setReplyText] = useState('');
  const [posting,    setPosting]   = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const broadcastRef   = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  useEffect(() => {
    fetchReplies();

    // Data channel
    const dataChannel = supabase
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

    // Typing broadcast channel
    broadcastRef.current = supabase.channel(`typing:thread:${messageId}`, {
      config: { broadcast: { self: false } },
    });
    broadcastRef.current
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== userId) {
          setOtherTyping(true);
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => setOtherTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      dataChannel.unsubscribe();
      broadcastRef.current?.unsubscribe();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [messageId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies, otherTyping]);

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
      toast.error('Failed to load replies');
    } finally {
      setLoading(false);
    }
  };

  const handlePostReply = useCallback(async () => {
    if (!replyText.trim()) return;
    setPosting(true);
    try {
      const { error } = await supabase.from('community_replies').insert([{
        message_id: messageId,
        user_id: userId,
        user_name: userName,
        user_avatar: userAvatar,
        reply: replyText.trim(),
        created_at: new Date().toISOString(),
        is_edited: false,
        is_deleted: false,
      }]);
      if (error) throw error;
      setReplyText('');
      if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
    } catch (err) {
      toast.error('Failed to post reply');
    } finally {
      setPosting(false);
    }
  }, [replyText, messageId, userId, userName, userAvatar]);

  const handleTyping = () => {
    broadcastRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId },
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePostReply();
    }
  };

  const groups = groupByDate(replies);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="wa-modal bg-white w-full sm:max-w-xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ height: '90vh', maxHeight: '720px' }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #128C7E 0%, #25D366 100%)' }}>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-sm leading-tight">Thread Replies</h2>
            <p className="text-green-100 text-xs">{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</p>
          </div>
        </div>

        {/* ── Messages area ─────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 wa-scroll wa-chat-bg">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? '' : 'flex-row-reverse'} gap-2`}>
                  <div className="w-7 h-7 rounded-full wa-skeleton flex-shrink-0" />
                  <div className={`wa-skeleton rounded-xl h-10 ${i % 2 === 0 ? 'w-48' : 'w-40'}`} />
                </div>
              ))}
            </div>
          ) : replies.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-14 h-14 bg-white/80 rounded-full flex items-center justify-center mb-3 shadow-sm">
                <MessageCircle className="w-7 h-7 text-[#25D366]" />
              </div>
              <p className="text-[#54656f] font-semibold text-sm">No replies yet</p>
              <p className="text-[#8696a0] text-xs mt-1">Be the first to respond!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {groups.map((group) => (
                <div key={group.date}>
                  {/* Date chip */}
                  <div className="flex justify-center my-3">
                    <span className="wa-date-chip">{group.date}</span>
                  </div>

                  {group.items.map((reply, idx) => {
                    const isMe = reply.user_id === userId;
                    const gradient = getAvatarColor(reply.user_name);
                    const initials = getInitials(reply.user_name);
                    const prevSame = idx > 0 && group.items[idx - 1].user_id === reply.user_id;
                    const nextSame = idx < group.items.length - 1 && group.items[idx + 1].user_id === reply.user_id;

                    return (
                      <div
                        key={reply.id}
                        className={`flex items-end gap-1.5 mb-0.5 ${isMe ? 'flex-row-reverse' : ''} ${isMe ? 'wa-msg-out' : 'wa-msg-in'}`}
                      >
                        {/* Avatar — only on last message in a group */}
                        <div className="w-7 flex-shrink-0 self-end mb-0.5">
                          {!nextSame && !isMe && (
                            reply.user_avatar ? (
                              <img
                                src={reply.user_avatar}
                                alt={reply.user_name}
                                crossOrigin="anonymous"
                                className="w-7 h-7 rounded-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : (
                              <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-[9px] font-bold`}>
                                {initials}
                              </div>
                            )
                          )}
                        </div>

                        {/* Bubble */}
                        <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          {/* Sender name (only on first in group for incoming) */}
                          {!isMe && !prevSame && (
                            <span className="text-[11px] font-bold px-3 pb-0.5" style={{ color: '#128C7E' }}>
                              {reply.user_name}
                            </span>
                          )}

                          <div className={`px-3 py-2 shadow-sm text-sm leading-relaxed ${isMe ? 'wa-bubble-out' : 'wa-bubble-in'} ${
                            isMe
                              ? nextSame ? 'rounded-br-sm' : ''
                              : nextSame ? 'rounded-bl-sm' : ''
                          }`}>
                            <p className="break-words whitespace-pre-wrap">{reply.reply}</p>
                            {/* Time + ticks */}
                            <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-[10px]" style={{ color: isMe ? '#667781' : '#8696a0' }}>
                                {formatMessageTime(reply.created_at)}
                              </span>
                              {isMe && <Ticks delivered={true} seen={false} />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Typing indicator */}
              {otherTyping && <TypingIndicator />}

              <div ref={bottomRef} className="h-1" />
            </div>
          )}
        </div>

        {/* ── Composer ──────────────────────────────────────────── */}
        <div className="flex-shrink-0 bg-[#f0f2f5] px-3 py-2.5 flex items-end gap-2">
          {/* My avatar */}
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              crossOrigin="anonymous"
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(userName)} flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold`}>
              {getInitials(userName)}
            </div>
          )}

          {/* Input */}
          <div className="flex-1 bg-white rounded-2xl px-3 py-2 flex items-end gap-2 min-h-[40px]">
            <textarea
              ref={textareaRef}
              value={replyText}
              onChange={(e) => { setReplyText(e.target.value); autoResize(); handleTyping(); }}
              onKeyDown={onKeyDown}
              placeholder="Type a reply…"
              className="flex-1 text-sm bg-transparent outline-none resize-none placeholder-gray-400 leading-relaxed"
              style={{ minHeight: '20px', maxHeight: '120px', overflowY: 'auto' }}
              rows={1}
            />
          </div>

          {/* Send button */}
          <button
            onClick={handlePostReply}
            disabled={posting || !replyText.trim()}
            className="wa-send-btn wa-send-pulse"
            style={{ background: (!posting && replyText.trim()) ? '#25D366' : '#ccc' }}
          >
            {posting ? <Loader className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThreadViewer;

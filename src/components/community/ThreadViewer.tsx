import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Loader2, MessageCircle, Check, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase, CommunityReply } from '../../lib/supabase';

interface ThreadViewerProps {
  messageId: string;
  onClose: () => void;
  userId: string;
  userName: string;
  userAvatar?: string;
}

const AVATAR_GRADIENTS = [
  ['#00897b', '#26a69a'],
  ['#1976d2', '#42a5f5'],
  ['#e91e63', '#f06292'],
  ['#f57c00', '#ffb74d'],
  ['#388e3c', '#66bb6a'],
  ['#7b1fa2', '#ba68c8'],
];
function getGradient(name: string): [string, string] {
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length] as [string, string];
}
function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}
function formatTime(date: string) {
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
  for (const r of replies) {
    const chip = formatDateChip(r.created_at);
    const last = groups[groups.length - 1];
    if (last && last.date === chip) last.items.push(r);
    else groups.push({ date: chip, items: [r] });
  }
  return groups;
}

// ── Seen ticks ─────────────────────────────────────────────────────────────
const Ticks: React.FC<{ seen?: boolean }> = ({ seen }) => (
  seen
    ? <CheckCheck className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#53bdeb' }} />
    : <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#8696a0' }} />
);

// ── Typing dots ────────────────────────────────────────────────────────────
const TypingBubble: React.FC<{ name: string }> = ({ name }) => (
  <div className="flex items-end gap-2 px-4 py-1 wa-msg-in">
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
      style={{ background: `linear-gradient(135deg, ${getGradient(name)[0]}, ${getGradient(name)[1]})` }}
    >
      {getInitials(name)}
    </div>
    <div className="wa-bubble-in px-3 py-2.5 max-w-[72px] flex items-center gap-1">
      <div className="wa-typing-dot" />
      <div className="wa-typing-dot" />
      <div className="wa-typing-dot" />
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
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const bottomRef     = useRef<HTMLDivElement>(null);
  const textareaRef   = useRef<HTMLTextAreaElement>(null);
  const typingTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const broadcastRef  = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Auto-resize textarea
  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  useEffect(() => {
    fetchReplies();

    // Realtime data
    const dataChannel = supabase
      .channel(`thread-data:${messageId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'community_replies', filter: `message_id=eq.${messageId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') setReplies((p) => [...p, payload.new as CommunityReply]);
        if (payload.eventType === 'DELETE')  setReplies((p) => p.filter((r) => r.id !== payload.old.id));
      })
      .subscribe();

    // Typing broadcast
    broadcastRef.current = supabase.channel(`thread-typing:${messageId}`, {
      config: { broadcast: { self: false } },
    });
    broadcastRef.current
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== userId) {
          setTypingUser(payload.userName || 'Someone');
          if (typingTimer.current) clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setTypingUser(null), 3000);
        }
      })
      .subscribe();

    return () => {
      dataChannel.unsubscribe();
      broadcastRef.current?.unsubscribe();
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, [messageId]);

  // Scroll to bottom on new messages / typing
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: replies.length <= 1 ? 'auto' : 'smooth' });
  }, [replies, typingUser]);

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
    } catch {
      toast.error('Failed to load replies');
    } finally {
      setLoading(false);
    }
  };

  const handlePostReply = useCallback(async () => {
    const text = replyText.trim();
    if (!text) return;
    setPosting(true);
    // Optimistic
    const optimistic: CommunityReply = {
      id: `opt-${Date.now()}`,
      message_id: messageId,
      user_id: userId,
      user_name: userName,
      user_avatar: userAvatar,
      reply: text,
      created_at: new Date().toISOString(),
      is_edited: false,
      is_deleted: false,
    };
    setReplies((p) => [...p, optimistic]);
    setReplyText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const { error } = await supabase.from('community_replies').insert([{
        message_id: messageId,
        user_id: userId,
        user_name: userName,
        user_avatar: userAvatar,
        reply: text,
        created_at: optimistic.created_at,
        is_edited: false,
        is_deleted: false,
      }]);
      if (error) throw error;
      // Remove optimistic on success — realtime will add the real one
      setReplies((p) => p.filter((r) => r.id !== optimistic.id));
    } catch {
      toast.error('Failed to send. Please retry.');
      // Revert
      setReplies((p) => p.filter((r) => r.id !== optimistic.id));
      setReplyText(text);
    } finally {
      setPosting(false);
    }
  }, [replyText, messageId, userId, userName, userAvatar]);

  const handleTyping = () => {
    broadcastRef.current?.send({
      type: 'broadcast', event: 'typing', payload: { userId, userName },
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostReply(); }
  };

  const groups = groupByDate(replies);
  const [myG0, myG1] = getGradient(userName);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="wa-modal w-full sm:max-w-lg sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl"
        style={{ height: '92dvh', maxHeight: '740px', background: '#fff' }}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #075E54 0%, #128C7E 60%, #25D366 100%)' }}
        >
          <button
            onClick={onClose}
            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-xl transition-colors flex-shrink-0"
            aria-label="Close thread"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-sm leading-tight">Thread</h2>
            <p className="text-green-100 text-xs leading-tight">
              {loading ? '…' : `${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
            </p>
          </div>
        </div>

        {/* ── Messages ─────────────────────────────────────────────── */}
        <div
          className="flex-1 overflow-y-auto py-3 wa-scroll relative"
          style={{
            background: '#e5ddd5',
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23b2bec3' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        >

          {loading ? (
            <div className="flex flex-col gap-3 px-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`flex items-end gap-2 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                  <div className="w-7 h-7 rounded-full wa-skeleton flex-shrink-0" />
                  <div className={`wa-skeleton rounded-2xl h-11 ${i % 2 === 0 ? 'w-44' : 'w-36'}`} />
                </div>
              ))}
            </div>

          ) : replies.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 px-8">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-sm"
                style={{ background: 'rgba(255,255,255,0.8)' }}
              >
                <MessageCircle className="w-8 h-8 text-[#25D366]" />
              </div>
              <p className="font-bold text-sm" style={{ color: '#54656f' }}>No replies yet</p>
              <p className="text-xs mt-1" style={{ color: '#8696a0' }}>Be the first to respond!</p>
            </div>

          ) : (
            <div className="space-y-0.5">
              {groups.map((group) => (
                <div key={group.date}>
                  {/* Date chip */}
                  <div className="flex justify-center my-3">
                    <span
                      className="text-xs font-medium px-3 py-1 rounded-lg shadow-sm"
                      style={{ background: 'rgba(225,245,254,0.92)', color: '#54656f' }}
                    >
                      {group.date}
                    </span>
                  </div>

                  {group.items.map((reply, idx) => {
                    const isMe = reply.user_id === userId;
                    const [rg0, rg1] = getGradient(reply.user_name);
                    const ri = getInitials(reply.user_name);
                    const prevSame = idx > 0 && group.items[idx - 1].user_id === reply.user_id;
                    const nextSame = idx < group.items.length - 1 && group.items[idx + 1].user_id === reply.user_id;
                    const isOptimistic = reply.id.startsWith('opt-');

                    return (
                      <div
                        key={reply.id}
                        className={`flex items-end gap-1.5 px-3 ${isMe ? 'flex-row-reverse' : ''} ${isMe ? 'wa-msg-out' : 'wa-msg-in'} ${prevSame ? 'mt-0.5' : 'mt-2'}`}
                        style={{ opacity: isOptimistic ? 0.7 : 1 }}
                      >
                        {/* Avatar (only for last in group, incoming) */}
                        <div className="w-7 flex-shrink-0 self-end mb-0.5">
                          {!isMe && !nextSame && (
                            reply.user_avatar ? (
                              <img
                                src={reply.user_avatar}
                                alt={reply.user_name}
                                crossOrigin="anonymous"
                                className="w-7 h-7 rounded-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : (
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                                style={{ background: `linear-gradient(135deg, ${rg0}, ${rg1})` }}
                              >
                                {ri}
                              </div>
                            )
                          )}
                        </div>

                        {/* Bubble */}
                        <div className={`max-w-[72%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          {/* Sender name — first in incoming group */}
                          {!isMe && !prevSame && (
                            <span className="text-[11px] font-bold px-3 pb-0.5 leading-tight" style={{ color: rg0 }}>
                              {reply.user_name}
                            </span>
                          )}

                          <div
                            className={`relative px-3 py-2 shadow-sm text-sm leading-relaxed ${isMe ? 'wa-bubble-out' : 'wa-bubble-in'}`}
                            style={{
                              borderRadius: isMe
                                ? nextSame ? '12px 2px 12px 12px' : '12px 0 12px 12px'
                                : nextSame ? '2px 12px 12px 12px' : '0 12px 12px 12px',
                            }}
                          >
                            <p className="break-words whitespace-pre-wrap" style={{ color: '#111b21' }}>
                              {reply.reply}
                            </p>
                            {/* Time + tick */}
                            <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-[10px] leading-none" style={{ color: isMe ? '#667781' : '#8696a0' }}>
                                {formatTime(reply.created_at)}
                              </span>
                              {isMe && <Ticks seen={false} />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Typing indicator */}
              {typingUser && <TypingBubble name={typingUser} />}

              <div ref={bottomRef} className="h-2" />
            </div>
          )}
        </div>

        {/* ── Composer ─────────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 flex items-end gap-2 px-3 py-2.5"
          style={{ background: '#f0f2f5' }}
        >
          {/* My avatar */}
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              crossOrigin="anonymous"
              className="w-8 h-8 rounded-full object-cover flex-shrink-0 self-end mb-0.5"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold self-end mb-0.5"
              style={{ background: `linear-gradient(135deg, ${myG0}, ${myG1})` }}
            >
              {getInitials(userName)}
            </div>
          )}

          {/* Input bubble */}
          <div className="flex-1 bg-white rounded-2xl px-3 py-2 flex items-end gap-2 min-h-[42px] shadow-sm">
            <textarea
              ref={textareaRef}
              value={replyText}
              onChange={(e) => { setReplyText(e.target.value); autoResize(); handleTyping(); }}
              onKeyDown={onKeyDown}
              placeholder="Type a reply…"
              className="flex-1 text-sm bg-transparent outline-none resize-none leading-relaxed placeholder-[#8696a0]"
              style={{ minHeight: '22px', maxHeight: '120px', overflowY: 'auto', color: '#111b21' }}
              rows={1}
            />
          </div>

          {/* Send button */}
          <button
            onClick={handlePostReply}
            disabled={posting || !replyText.trim()}
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95 disabled:cursor-not-allowed"
            style={{
              background: (!posting && replyText.trim()) ? '#25D366' : '#ccc',
              boxShadow: replyText.trim() ? '0 2px 8px rgba(37,211,102,0.4)' : 'none',
            }}
            aria-label="Send reply"
          >
            {posting
              ? <Loader2 className="w-4.5 h-4.5 text-white animate-spin" />
              : <Send className="w-4.5 h-4.5 text-white" style={{ marginLeft: '1px' }} />
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThreadViewer;

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Community } from '../../hooks/useCommunities';
import {
  MoreVertical, Trash2, Edit2, MessageCircle, Pin, CheckCheck, Reply, Forward,
} from 'lucide-react';
import {
  doc, updateDoc, arrayUnion, arrayRemove, getDoc,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { usePinMessage } from '../../hooks/useCommunity';
import { useAnyUserVerification } from '../../hooks/usePrivateChat';
import VerifiedBadge from './VerifiedBadge';
import { playSound } from '../../hooks/useSound';

interface MessageCardProps {
  message: Community;
  isOwn: boolean;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, newMessage: string) => void;
  onThreadClick?: (messageId: string) => void;
  onProfileClick?: (userId: string, userName: string, userAvatar?: string) => void;
  isAdmin?: boolean;
  onAvatarClick?: (userId: string, userName: string, userAvatar?: string) => void;
  prevSameUser?: boolean;
  nextSameUser?: boolean;
  onForward?: (message: Community) => void;
  onReply?: (message: Community) => void;
}

const TOPIC_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  General:       { bg: 'rgba(134,150,160,0.15)', text: '#54656f',  dot: '#8696a0' },
  Academics:     { bg: 'rgba(26,115,232,0.12)',   text: '#1a73e8',  dot: '#1a73e8' },
  'Campus Life': { bg: 'rgba(233,30,99,0.12)',    text: '#c2185b',  dot: '#e91e63' },
  Tech:          { bg: 'rgba(46,125,50,0.12)',    text: '#2e7d32',  dot: '#43a047' },
  Events:        { bg: 'rgba(245,124,0,0.12)',    text: '#e65100',  dot: '#ffa726' },
};

const GRADS = [
  ['#00897b', '#26a69a'],
  ['#1976d2', '#42a5f5'],
  ['#e91e63', '#f06292'],
  ['#f57c00', '#ffb74d'],
  ['#388e3c', '#66bb6a'],
  ['#7b1fa2', '#ba68c8'],
];

function getGrad(name: string): [string, string] {
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return GRADS[h % GRADS.length] as [string, string];
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
}

function timeAgo(date: string) {
  return new Date(date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Reaction emojis
const REACTION_EMOJIS = ['❤️', '😂', '👍', '😮', '😢', '🙏'];

// Reaction summary — e.g. { '❤️': ['uid1','uid2'], '😂': ['uid3'] }
type Reactions = Record<string, string[]>;

function parseReactions(raw: unknown): Reactions {
  if (!raw || typeof raw !== 'object') return {};
  return raw as Reactions;
}

// Image component with fallback
const SafeImage: React.FC<{
  src: string; alt: string; className?: string; style?: React.CSSProperties;
}> = ({ src, alt, className, style }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  if (error) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 ${className}`} style={style}>
        <span className="text-xs text-slate-400">Image unavailable</span>
      </div>
    );
  }
  return (
    <div className="relative">
      {loading && <div className={`absolute inset-0 wa-skeleton ${className}`} style={style} />}
      <img
        src={src} alt={alt} crossOrigin="anonymous"
        className={className}
        style={{ ...style, opacity: loading ? 0 : 1 }}
        onLoad={() => setLoading(false)}
        onError={() => { setError(true); setLoading(false); }}
      />
    </div>
  );
};

const MessageCard: React.FC<MessageCardProps> = ({
  message,
  isOwn,
  onDelete,
  onEdit,
  onThreadClick,
  onProfileClick,
  isAdmin = false,
  onAvatarClick,
  prevSameUser = false,
  nextSameUser = false,
  onForward,
  onReply,
}) => {
  const [showMenu, setShowMenu]     = useState(false);
  const [showReact, setShowReact]   = useState(false);
  const [editing, setEditing]       = useState(false);
  const [editText, setEditText]     = useState(message.message);
  const [reactions, setReactions]   = useState<Reactions>({});
  const menuRef  = useRef<HTMLDivElement>(null);
  const reactRef = useRef<HTMLDivElement>(null);

  const { togglePin } = usePinMessage();
  const { verification } = useAnyUserVerification(message.user_id);
  const isVerified = verification?.is_verified;

  // Load reactions
  useEffect(() => {
    const loadReactions = async () => {
      try {
        const snap = await getDoc(doc(db, 'community_messages', message.id));
        if (snap.exists()) {
          setReactions(parseReactions(snap.data()?.reactions));
        }
      } catch { /* non-critical */ }
    };
    loadReactions();
  }, [message.id]);

  // Play sound on incoming new messages
  useEffect(() => {
    if (!isOwn) {
      const age = Date.now() - new Date(message.created_at).getTime();
      if (age < 5000) playSound('message');
    }
  }, [message.id, isOwn, message.created_at]);

  // Close menus on outside click
  useEffect(() => {
    if (!showMenu && !showReact) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
      if (reactRef.current && !reactRef.current.contains(e.target as Node)) setShowReact(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu, showReact]);

  const handleSave = () => {
    if (editText.trim() && editText !== message.message) onEdit(message.id, editText);
    setEditing(false);
  };

  const toggleReaction = useCallback(async (emoji: string, userId: string) => {
    try {
      const msgRef = doc(db, 'community_messages', message.id);
      const field  = `reactions.${emoji}`;
      const current = reactions[emoji] ?? [];
      if (current.includes(userId)) {
        await updateDoc(msgRef, { [field]: arrayRemove(userId) });
        setReactions((prev) => ({ ...prev, [emoji]: prev[emoji]?.filter((u) => u !== userId) ?? [] }));
      } else {
        await updateDoc(msgRef, { [field]: arrayUnion(userId) });
        setReactions((prev) => ({ ...prev, [emoji]: [...(prev[emoji] ?? []), userId] }));
        playSound('message');
      }
    } catch (err) {
      console.error('[v0] reaction error:', err);
    }
    setShowReact(false);
  }, [message.id, reactions]);

  const [g0, g1] = getGrad(message.user_name);
  const inits = getInitials(message.user_name);
  const tc = TOPIC_COLORS[message.topic || ''] ?? TOPIC_COLORS['General'];
  const imageUrls = (message as Community & { image_urls?: string[] }).image_urls;

  const bubbleRadius = isOwn
    ? nextSameUser ? '16px 4px 16px 16px' : '16px 0px 16px 16px'
    : nextSameUser ? '4px 16px 16px 16px' : '0px 16px 16px 16px';

  const mtClass = prevSameUser ? 'mt-0.5' : 'mt-2';

  // Aggregate reactions for display
  const reactionSummary = Object.entries(reactions)
    .filter(([, users]) => users.length > 0)
    .map(([emoji, users]) => ({ emoji, count: users.length }));

  // We need the current user id for reactions — passed implicitly via onForward/onReply context
  // Use a placeholder; real user id will come from message isOwn logic
  const currentUserId = isOwn ? message.user_id : '';

  return (
    <div className={`flex gap-2 px-3 ${mtClass} ${isOwn ? 'flex-row-reverse' : ''} group`}>
      {/* Avatar */}
      <div className="w-8 flex-shrink-0 self-end">
        {!isOwn && !nextSameUser && (
          <button
            type="button"
            onClick={() => onAvatarClick?.(message.user_id, message.user_name, message.user_avatar)}
            className="focus:outline-none"
          >
            {message.user_avatar ? (
              <img
                src={message.user_avatar}
                alt={message.user_name}
                crossOrigin="anonymous"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm hover:ring-[#25D366] transition-all"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white shadow-sm hover:ring-[#25D366] transition-all"
                style={{ background: `linear-gradient(135deg, ${g0}, ${g1})` }}
              >
                {inits}
              </div>
            )}
          </button>
        )}
      </div>

      {/* Bubble container */}
      <div
        className={`max-w-[78%] sm:max-w-[65%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
        style={{ minWidth: 0 }}
      >
        {/* Sender name */}
        {!isOwn && !prevSameUser && (
          <button
            onClick={(e) => { e.stopPropagation(); onProfileClick?.(message.user_id, message.user_name, message.user_avatar); }}
            className="px-1 pb-0.5 focus:outline-none"
          >
            <span className="text-[12px] font-bold leading-tight flex items-center gap-1" style={{ color: g0 }}>
              {message.user_name}
              {isVerified && <VerifiedBadge size="sm" />}
              {message.is_pinned && <Pin className="w-3 h-3 text-amber-500" />}
            </span>
          </button>
        )}

        {/* Bubble */}
        <div className="relative">
          {/* 3-dot menu — always visible on mobile, hover on desktop */}
          <div
            ref={menuRef}
            className={`absolute top-1 ${isOwn ? 'left-1' : 'right-1'} z-10`}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); setShowReact(false); }}
              className="p-1 rounded-full bg-black/5 hover:bg-black/10 active:bg-black/15 transition-colors"
              aria-label="Message options"
            >
              <MoreVertical className="w-3.5 h-3.5 text-[#667781]" />
            </button>

            {showMenu && (
              <div
                className={`absolute top-full ${isOwn ? 'right-0' : 'right-0'} mt-1 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 min-w-[160px]`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* React */}
                <button
                  onClick={() => { setShowReact(true); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-[#111b21] hover:bg-[#f5f5f5] transition-colors"
                >
                  <span className="text-base">😊</span>
                  React
                </button>
                {/* Reply */}
                <button
                  onClick={() => { onReply?.(message); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-[#111b21] hover:bg-[#f5f5f5] transition-colors"
                >
                  <Reply className="w-3.5 h-3.5 text-[#667781]" />
                  Reply
                </button>
                {/* Forward */}
                <button
                  onClick={() => { onForward?.(message); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-[#111b21] hover:bg-[#f5f5f5] transition-colors"
                >
                  <Forward className="w-3.5 h-3.5 text-[#667781]" />
                  Forward
                </button>
                {/* Thread */}
                <button
                  onClick={() => { onThreadClick?.(message.id); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-[#111b21] hover:bg-[#f5f5f5] transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#667781]" />
                  Open thread
                </button>
                {isOwn && (
                  <button
                    onClick={() => { setEditing(true); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-[#111b21] hover:bg-[#f5f5f5] transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#667781]" />
                    Edit
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => { togglePin(message.id, message.is_pinned || false); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-[#f57c00] hover:bg-amber-50 transition-colors"
                  >
                    <Pin className="w-3.5 h-3.5" />
                    {message.is_pinned ? 'Unpin' : 'Pin'}
                  </button>
                )}
                {(isOwn || isAdmin) && (
                  <>
                    <div className="h-px mx-3 bg-[#f0f2f5]" />
                    <button
                      onClick={() => { onDelete(message.id); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-[#ea4335] hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Reaction picker popover */}
          {showReact && (
            <div
              ref={reactRef}
              className={`absolute ${isOwn ? 'right-0' : 'left-0'} -top-12 bg-white rounded-full shadow-xl border border-slate-100 px-2 py-1.5 flex gap-1 z-50`}
              onClick={(e) => e.stopPropagation()}
            >
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => toggleReaction(emoji, currentUserId || message.user_id)}
                  className="text-xl hover:scale-125 active:scale-110 transition-transform px-1"
                  style={{ lineHeight: 1 }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <div
            onClick={() => { if (!editing) onThreadClick?.(message.id); }}
            className="cursor-pointer shadow-sm active:opacity-90 transition-opacity"
            style={{
              background: isOwn ? '#dcf8c6' : '#ffffff',
              borderRadius: bubbleRadius,
              padding: '8px 12px 6px 12px',
              maxWidth: '100%',
            }}
          >
            {/* Topic chip */}
            {message.topic && message.topic !== 'General' && !prevSameUser && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1.5"
                style={{ background: tc.bg, color: tc.text }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: tc.dot }} />
                {message.topic}
              </span>
            )}

            {/* Edit mode */}
            {editing ? (
              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full p-2 rounded-xl text-[14px] leading-relaxed resize-none focus:outline-none"
                  style={{
                    border: '2px solid #25D366',
                    background: '#f0fdf4',
                    color: '#111b21',
                    minHeight: '64px',
                    minWidth: '180px',
                  }}
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-white"
                    style={{ background: '#25D366' }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setEditing(false); setEditText(message.message); }}
                    className="px-3 py-1 rounded-lg text-xs font-medium"
                    style={{ background: '#f0f2f5', color: '#667781' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Message text — add right padding so it doesn't overlap 3-dot */}
                <p
                  className="text-[14px] leading-relaxed whitespace-pre-wrap break-words"
                  style={{ color: '#111b21', paddingRight: isOwn ? 0 : '20px', paddingLeft: isOwn ? '20px' : 0 }}
                >
                  {message.message}
                  {message.is_edited && (
                    <span className="text-[10px] ml-1 italic" style={{ color: '#8696a0' }}>(edited)</span>
                  )}
                </p>

                {/* Images */}
                {imageUrls && imageUrls.length > 0 && (
                  <div
                    className={`mt-1.5 grid gap-1 rounded-xl overflow-hidden ${imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {imageUrls.slice(0, 4).map((url, i) => (
                      <div
                        key={i}
                        className="relative bg-[#f0f2f5] overflow-hidden rounded-lg"
                        style={{ aspectRatio: imageUrls.length === 1 ? '16/9' : '1/1' }}
                      >
                        <SafeImage src={url} alt="" className="w-full h-full object-cover" />
                        {i === 3 && imageUrls.length > 4 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-lg font-bold">+{imageUrls.length - 4}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Time + ticks + reply count */}
            {!editing && (
              <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'justify-end' : 'justify-between'}`}>
                {/* Reply count — always show if > 0 */}
                {onThreadClick && (message.reply_count > 0 || !isOwn) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onThreadClick(message.id); }}
                    className="flex items-center gap-1 group"
                  >
                    <MessageCircle
                      className="w-3.5 h-3.5 transition-colors"
                      style={{ color: message.reply_count > 0 ? '#25D366' : '#d0d7db' }}
                    />
                    {message.reply_count > 0 && (
                      <span className="text-[11px] font-semibold" style={{ color: '#25D366' }}>
                        {message.reply_count}
                      </span>
                    )}
                  </button>
                )}

                <div className="flex items-center gap-1 ml-auto">
                  <span className="text-[10px] leading-none" style={{ color: '#8696a0' }}>
                    {timeAgo(message.created_at)}
                  </span>
                  {isOwn && <CheckCheck className="w-3.5 h-3.5" style={{ color: '#53bdeb' }} />}
                </div>
              </div>
            )}
          </div>

          {/* Reaction badges below bubble */}
          {reactionSummary.length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {reactionSummary.map(({ emoji, count }) => (
                <button
                  key={emoji}
                  onClick={() => toggleReaction(emoji, currentUserId || message.user_id)}
                  className="flex items-center gap-0.5 bg-white rounded-full px-2 py-0.5 shadow-sm border border-slate-100 text-sm hover:bg-slate-50 active:scale-90 transition-all"
                  style={{ lineHeight: 1 }}
                >
                  <span>{emoji}</span>
                  {count > 1 && <span className="text-[11px] text-slate-500 font-medium ml-0.5">{count}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageCard;

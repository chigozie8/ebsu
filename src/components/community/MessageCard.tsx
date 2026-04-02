import React, { useState, useRef, useEffect } from 'react';
import { Community } from '../../lib/supabase';
import { MoreHorizontal, Trash2, Edit2, MessageCircle, Pin, Check, CheckCheck } from 'lucide-react';
import { usePinMessage, useAddReaction, useReactions } from '../../hooks/useCommunity';

interface MessageCardProps {
  message: Community;
  isOwn: boolean;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, newMessage: string) => void;
  onThreadClick?: (messageId: string) => void;
  onAvatarClick?: (userId: string) => void;
  isAdmin?: boolean;
  userId?: string;
}

const TOPIC_BADGE: Record<string, string> = {
  General:       'bg-slate-100 text-slate-600',
  Academics:     'bg-blue-100 text-blue-700',
  'Campus Life': 'bg-pink-100 text-pink-700',
  Tech:          'bg-emerald-100 text-emerald-700',
  Events:        'bg-amber-100 text-amber-700',
};

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

function getTimeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60)    return 'just now';
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatTimestamp(date: string) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ── Resilient image with fade-in + fallback ── */
const ResilientImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [retries, setRetries] = useState(0);
  const MAX_RETRIES = 2;

  const handleLoad  = () => setStatus('loaded');
  const handleError = () => {
    if (retries < MAX_RETRIES) {
      setRetries((r) => r + 1);
      setStatus('loading');
    } else {
      setStatus('error');
    }
  };

  if (status === 'error') {
    return (
      <div className={`flex items-center justify-center bg-slate-100 rounded-xl border border-slate-200 ${className}`}>
        <div className="text-center p-3">
          <div className="text-2xl mb-1">🖼️</div>
          <p className="text-xs text-slate-400">Image unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      {status === 'loading' && (
        <div className="absolute inset-0 skeleton-shimmer rounded-xl" />
      )}
      <img
        key={retries}
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

/* ── Reaction summary bar ── */
const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const ReactionBar: React.FC<{ messageId: string; userId: string }> = ({ messageId, userId }) => {
  const { reactions } = useReactions(messageId);
  const { addReaction } = useAddReaction();
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Group reactions by emoji
  const grouped: Record<string, { count: number; byMe: boolean }> = {};
  reactions.forEach((r) => {
    if (!grouped[r.reaction_emoji]) grouped[r.reaction_emoji] = { count: 0, byMe: false };
    grouped[r.reaction_emoji].count++;
    if (r.user_id === userId) grouped[r.reaction_emoji].byMe = true;
  });

  const hasReactions = Object.keys(grouped).length > 0;

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
      {/* Existing reactions */}
      {Object.entries(grouped).map(([emoji, { count, byMe }]) => (
        <button
          key={emoji}
          onClick={() => addReaction(messageId, userId, emoji)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border transition-all reaction-pop ${
            byMe
              ? 'bg-[#25D366]/15 border-[#25D366]/40 text-slate-700'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          <span>{emoji}</span>
          <span>{count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setShowPicker((s) => !s)}
          className={`flex items-center justify-center w-6 h-6 rounded-full border text-xs transition-all ${
            hasReactions
              ? 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
              : 'bg-white/0 border-transparent text-slate-300 hover:text-slate-500 hover:border-slate-200 hover:bg-white'
          }`}
          title="Add reaction"
        >
          +
        </button>

        {showPicker && (
          <div className="absolute bottom-full left-0 mb-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 flex gap-1 z-30 modal-enter">
            {QUICK_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => { addReaction(messageId, userId, e); setShowPicker(false); }}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-base transition-all hover:scale-125"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Main MessageCard ── */
const MessageCard: React.FC<MessageCardProps> = ({
  message,
  isOwn,
  onDelete,
  onEdit,
  onThreadClick,
  onAvatarClick,
  isAdmin = false,
  userId = '',
}) => {
  const [showMenu, setShowMenu]   = useState(false);
  const [editing,  setEditing]    = useState(false);
  const [editText, setEditText]   = useState(message.message);
  const menuRef = useRef<HTMLDivElement>(null);
  const { togglePin } = usePinMessage();

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleEditSubmit = () => {
    if (editText.trim() && editText !== message.message) {
      onEdit(message.id, editText);
      setEditing(false);
    }
  };

  const gradientClass = getAvatarColor(message.user_name);
  const initials = message.user_name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Parse image_urls from the message (stored as JSON array or space-separated URLs)
  let imageUrls: string[] = [];
  const raw = (message as Record<string, unknown>).image_urls;
  if (Array.isArray(raw)) {
    imageUrls = raw as string[];
  } else if (typeof raw === 'string' && raw.trim()) {
    try { imageUrls = JSON.parse(raw); }
    catch { imageUrls = raw.split(' ').filter(Boolean); }
  }

  // Detect sticker URLs embedded in the message text
  const stickerPattern = /(https?:\/\/\S+\.(gif|png|webp|svg)(\?\S*)?)/gi;
  const stickerMatches = message.message.match(stickerPattern) || [];
  const cleanMessage = message.message.replace(stickerPattern, '').trim();

  return (
    <div className={`flex gap-3 sm:gap-4 px-4 py-3 group message-bubble-enter ${isOwn ? 'flex-row-reverse' : ''}`}>

      {/* Avatar */}
      <button
        type="button"
        onClick={() => onAvatarClick?.(message.user_id)}
        className="flex-shrink-0 focus:outline-none"
        title={message.user_name}
      >
        {message.user_avatar ? (
          <img
            src={message.user_avatar}
            alt={message.user_name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm hover:ring-[#25D366]/50 transition-all"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(message.user_name)}&background=25D366&color=fff`; }}
          />
        ) : (
          <div
            className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm hover:ring-[#25D366]/50 transition-all`}
          >
            {initials}
          </div>
        )}
      </button>

      {/* Bubble + meta */}
      <div className={`flex flex-col max-w-[75%] sm:max-w-[68%] ${isOwn ? 'items-end' : 'items-start'}`}>

        {/* Name + topic badge */}
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-800 text-[13px] leading-tight">{message.user_name}</span>
            {message.topic && message.topic !== 'General' && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${TOPIC_BADGE[message.topic] ?? 'bg-slate-100 text-slate-600'}`}>
                {message.topic}
              </span>
            )}
          </div>
        )}

        {/* Bubble */}
        <div className={`relative ${isOwn ? 'bubble-out' : 'bubble-in'} px-3.5 py-2.5 shadow-sm max-w-full`}>

          {/* Subcategory tag */}
          {(message as Record<string, unknown>).subcategory && (
            <span className="inline-block mb-1.5 px-2 py-0.5 bg-[#25D366]/15 text-[#128C7E] text-[10px] font-semibold rounded-full">
              {(message as Record<string, unknown>).subcategory as string}
            </span>
          )}

          {/* Edit mode */}
          {editing ? (
            <div className="space-y-2 min-w-[220px]">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-2.5 border border-[#25D366]/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 text-sm bg-white/80 resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEditSubmit}
                  className="px-3 py-1.5 bg-[#25D366] text-white text-xs rounded-lg hover:bg-[#128C7E] transition-colors font-semibold"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditing(false); setEditText(message.message); }}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Message text */}
              {cleanMessage && (
                <p className="text-[14px] leading-relaxed text-slate-800 whitespace-pre-wrap break-words">
                  {cleanMessage}
                </p>
              )}

              {/* Sticker images */}
              {stickerMatches.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {stickerMatches.map((url, i) => (
                    <ResilientImage key={i} src={url} alt="sticker" className="w-24 h-24" />
                  ))}
                </div>
              )}

              {/* Attached images */}
              {imageUrls.length > 0 && (
                <div className={`mt-2 grid gap-1.5 ${imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {imageUrls.map((url, idx) => (
                    <ResilientImage
                      key={idx}
                      src={url}
                      alt={`image-${idx}`}
                      className={`rounded-xl border border-black/5 ${imageUrls.length === 1 ? 'max-h-64' : 'h-32'}`}
                    />
                  ))}
                </div>
              )}

              {/* Timestamp + status */}
              <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                {message.is_edited && (
                  <span className="text-[10px] text-slate-400 italic mr-1">edited</span>
                )}
                <span className="text-[10px] text-slate-400 tabular-nums">{formatTimestamp(message.created_at)}</span>
                {isOwn && (
                  <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                )}
              </div>
            </>
          )}
        </div>

        {/* Reactions */}
        {!editing && userId && (
          <ReactionBar messageId={message.id} userId={userId} />
        )}

        {/* Thread + menu row */}
        {!editing && (
          <div className={`flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'flex-row-reverse' : ''}`}>
            {onThreadClick && (
              <button
                onClick={() => onThreadClick(message.id)}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#25D366] hover:text-[#128C7E] bg-white hover:bg-[#25D366]/10 px-2.5 py-1 rounded-full border border-[#25D366]/30 hover:border-[#25D366]/60 transition-all"
              >
                <MessageCircle className="w-3 h-3" />
                {message.reply_count > 0 ? `${message.reply_count} repl${message.reply_count === 1 ? 'y' : 'ies'}` : 'Reply'}
              </button>
            )}

            {/* Contextual menu — own messages & admin */}
            {(isOwn || isAdmin) && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4 text-slate-400" />
                </button>
                {showMenu && (
                  <div className={`absolute bottom-full mb-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 min-w-[140px] overflow-hidden modal-enter ${isOwn ? 'right-0' : 'left-0'}`}>
                    {isOwn && (
                      <button
                        onClick={() => { setEditing(true); setShowMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        Edit
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => { togglePin(message.id, message.is_pinned || false); setShowMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2 border-t border-slate-100"
                      >
                        <Pin className="w-3.5 h-3.5" />
                        {message.is_pinned ? 'Unpin' : 'Pin'}
                      </button>
                    )}
                    {(isOwn || isAdmin) && (
                      <button
                        onClick={() => { onDelete(message.id); setShowMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageCard;

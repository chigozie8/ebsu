import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Community } from '../../hooks/useCommunities';
import {
  MoreVertical, Trash2, Edit2, MessageCircle, Pin, CheckCheck, Reply, Forward,
  X, ChevronLeft, ChevronRight, ZoomIn, Heart,
} from 'lucide-react';
import {
  doc, updateDoc, arrayUnion, arrayRemove, getDoc, onSnapshot,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { usePinMessage } from '../../hooks/useCommunity';
import { useAnyUserVerification } from '../../hooks/usePrivateChat';
import VerifiedBadge from './VerifiedBadge';
import { playSound } from '../../hooks/useSound';

interface MessageCardProps {
  message: Community;
  isOwn: boolean;
  viewerUserId?: string;
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

const REACTION_EMOJIS = ['❤️', '😂', '👍', '😮', '😢', '🙏'];
type Reactions = Record<string, string[]>;

function parseReactions(raw: unknown): Reactions {
  if (!raw || typeof raw !== 'object') return {};
  return raw as Reactions;
}

// ── Full-screen image lightbox ──────────────────────────────────────────────
const ImageLightbox: React.FC<{
  images: string[];
  startIndex: number;
  onClose: () => void;
}> = ({ images, startIndex, onClose }) => {
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(images.length - 1, i + 1));
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [images.length, onClose]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black" onClick={onClose}>
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white/70 text-sm font-medium">
          {images.length > 1 ? `${idx + 1} / ${images.length}` : ''}
        </span>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div
        className="flex-1 flex items-center justify-center overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[idx]}
          alt=""
          crossOrigin="anonymous"
          className="max-w-full max-h-full object-contain select-none"
          draggable={false}
        />
      </div>

      {images.length > 1 && (
        <div
          className="flex-shrink-0 flex items-center justify-between px-4 py-3"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="w-2 h-2 rounded-full transition-all"
                style={{ background: i === idx ? '#25D366' : 'rgba(255,255,255,0.4)' }}
              />
            ))}
          </div>
          <button
            onClick={() => setIdx((i) => Math.min(images.length - 1, i + 1))}
            disabled={idx === images.length - 1}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>
      )}
    </div>
  );
};

// ── Simple image grid — NO stats overlay, just clean photos ────────────────
const ImageGrid: React.FC<{
  urls: string[];
  onPreview: (index: number) => void;
}> = ({ urls, onPreview }) => {
  const count = Math.min(urls.length, 4);

  if (count === 1) {
    return (
      <div
        className="mt-1.5 rounded-xl overflow-hidden cursor-pointer relative group"
        style={{ maxWidth: '260px' }}
        onClick={(e) => { e.stopPropagation(); onPreview(0); }}
      >
        <img
          src={urls[0]}
          alt=""
          crossOrigin="anonymous"
          className="w-full object-contain rounded-xl"
          style={{ maxHeight: '280px', display: 'block' }}
          onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl flex items-center justify-center">
          <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-80 transition-opacity" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="mt-1.5 rounded-xl overflow-hidden cursor-pointer"
      style={{ maxWidth: '240px' }}
      onClick={(e) => e.stopPropagation()}
    >
      {count === 3 ? (
        <div className="grid grid-cols-2 gap-0.5">
          <div className="col-span-2 relative" onClick={() => onPreview(0)}>
            <img
              src={urls[0]}
              alt=""
              crossOrigin="anonymous"
              className="w-full object-cover"
              style={{ height: '140px' }}
              onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }}
            />
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="relative" onClick={() => onPreview(i)}>
              <img
                src={urls[i]}
                alt=""
                crossOrigin="anonymous"
                className="w-full object-cover"
                style={{ height: '100px' }}
                onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-0.5">
          {urls.slice(0, 4).map((url, i) => (
            <div
              key={i}
              className="relative overflow-hidden"
              style={{ height: count === 2 ? '120px' : '100px' }}
              onClick={() => onPreview(i)}
            >
              <img
                src={url}
                alt=""
                crossOrigin="anonymous"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }}
              />
              {i === 3 && urls.length > 4 && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">+{urls.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Floating portal menu — renders at fixed screen coords to avoid clip ─────
const PortalMenu: React.FC<{
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  isOwn: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ anchorRef, isOwn, onClose, children }) => {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const menuWidth = 190;
    const menuHeight = 280; // estimated

    let top = rect.bottom + 4;
    let left = isOwn ? rect.right - menuWidth : rect.left;

    // Clamp to viewport
    if (top + menuHeight > window.innerHeight - 16) {
      top = rect.top - menuHeight - 4;
    }
    if (left < 8) left = 8;
    if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;

    setPos({ top, left });
  }, [anchorRef, isOwn]);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (anchorRef.current && anchorRef.current.contains(e.target as Node)) return;
      onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [anchorRef, onClose]);

  return createPortal(
    <div
      className="fixed z-[9998] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
      style={{ top: pos.top, left: pos.left, minWidth: 190 }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
};

// ── Message card ────────────────────────────────────────────────────────────
const MessageCard: React.FC<MessageCardProps> = ({
  message,
  isOwn,
  viewerUserId,
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
  const [showMenu, setShowMenu]         = useState(false);
  const [showReact, setShowReact]       = useState(false);
  const [editing, setEditing]           = useState(false);
  const [editText, setEditText]         = useState(message.message);
  const [reactions, setReactions]       = useState<Reactions>({});
  const [lightboxIdx, setLightboxIdx]   = useState<number | null>(null);
  // Local like state derived from Firebase reactions (❤️ emoji)
  const [localLikes, setLocalLikes]     = useState<number>(message.likes_count || 0);
  const [isLiked, setIsLiked]           = useState(false);
  // Live reply count — updated by onSnapshot so it increments immediately when someone comments
  const [liveReplyCount, setLiveReplyCount] = useState<number>(message.reply_count || 0);

  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const reactRef   = useRef<HTMLDivElement>(null);

  const { togglePin } = usePinMessage();
  const { verification } = useAnyUserVerification(message.user_id);
  const isVerified = verification?.is_verified;

  const currentUserId = viewerUserId || (isOwn ? message.user_id : '');

  // Live subscription to the message doc — keeps reactions AND reply_count in sync
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'community_messages', message.id),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        // Reactions
        const r = parseReactions(data?.reactions);
        setReactions(r);
        const heartUsers = r['❤️'] ?? [];
        setLocalLikes(heartUsers.length || 0);
        setIsLiked(currentUserId ? heartUsers.includes(currentUserId) : false);
        // Live reply count
        setLiveReplyCount((data?.reply_count as number) || 0);
      },
      () => { /* non-critical — keep showing last known values */ }
    );
    return () => unsub();
  }, [message.id, currentUserId]);

  // Close reaction picker on outside click
  useEffect(() => {
    if (!showReact) return;
    const handler = (e: MouseEvent) => {
      if (reactRef.current && !reactRef.current.contains(e.target as Node)) setShowReact(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showReact]);

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
        if (emoji === '❤️') { setLocalLikes((n) => Math.max(0, n - 1)); setIsLiked(false); }
      } else {
        await updateDoc(msgRef, { [field]: arrayUnion(userId) });
        setReactions((prev) => ({ ...prev, [emoji]: [...(prev[emoji] ?? []), userId] }));
        if (emoji === '❤️') { setLocalLikes((n) => n + 1); setIsLiked(true); }
        playSound('message');
      }
    } catch (err) {
      console.error('[MessageCard] reaction error:', err);
    }
    setShowReact(false);
  }, [message.id, reactions]);

  // Quick like via heart icon in footer
  const handleQuickLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) return;
    toggleReaction('❤️', currentUserId);
  }, [toggleReaction, currentUserId]);

  const [g0, g1] = getGrad(message.user_name);
  const inits = getInitials(message.user_name);
  const tc = TOPIC_COLORS[message.topic || ''] ?? TOPIC_COLORS['General'];
  const imageUrls: string[] = (message as Community & { image_urls?: string[] }).image_urls ?? [];

  const bubbleRadius = isOwn
    ? nextSameUser ? '16px 4px 16px 16px' : '16px 0px 16px 16px'
    : nextSameUser ? '4px 16px 16px 16px' : '0px 16px 16px 16px';

  const mtClass = prevSameUser ? 'mt-0.5' : 'mt-2';

  const reactionSummary = Object.entries(reactions)
    .filter(([emoji, users]) => users.length > 0 && emoji !== '❤️') // ❤️ shown in footer
    .map(([emoji, users]) => ({ emoji, count: users.length }));

  // liveReplyCount is kept fresh via onSnapshot — always shows the real-time comment count
  const replyCount = liveReplyCount;

  return (
    <>
      {lightboxIdx !== null && imageUrls.length > 0 && (
        <ImageLightbox
          images={imageUrls}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}

      {showMenu && (
        <PortalMenu anchorRef={menuBtnRef} isOwn={isOwn} onClose={() => setShowMenu(false)}>
          <button
            onClick={() => { setShowReact(true); setShowMenu(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-[#111b21] hover:bg-[#f5f5f5] transition-colors"
          >
            <span className="text-base">😊</span>
            React
          </button>
          <button
            onClick={() => { onReply?.(message); setShowMenu(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-[#111b21] hover:bg-[#f5f5f5] transition-colors"
          >
            <Reply className="w-4 h-4 text-[#667781]" />
            Reply
          </button>
          <button
            onClick={() => { onForward?.(message); setShowMenu(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-[#111b21] hover:bg-[#f5f5f5] transition-colors"
          >
            <Forward className="w-4 h-4 text-[#667781]" />
            Forward
          </button>
          <button
            onClick={() => { onThreadClick?.(message.id); setShowMenu(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-[#111b21] hover:bg-[#f5f5f5] transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-[#667781]" />
            View thread
          </button>
          {isOwn && (
            <button
              onClick={() => { setEditing(true); setShowMenu(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-[#111b21] hover:bg-[#f5f5f5] transition-colors"
            >
              <Edit2 className="w-4 h-4 text-[#667781]" />
              Edit
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => { togglePin(message.id, message.is_pinned || false); setShowMenu(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-[#f57c00] hover:bg-amber-50 transition-colors"
            >
              <Pin className="w-4 h-4" />
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
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </>
          )}
        </PortalMenu>
      )}

      <div className={`flex gap-1.5 px-2 ${mtClass} ${isOwn ? 'flex-row-reverse' : ''}`}>
        {/* Avatar column */}
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
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${g0}, ${g1})` }}
                >
                  {inits}
                </div>
              )}
            </button>
          )}
        </div>

        {/* Bubble + 3-dot row */}
        <div
          className={`flex items-end gap-1 ${isOwn ? 'flex-row-reverse' : ''}`}
          style={{ maxWidth: 'calc(100% - 40px)' }}
        >
          {/* Bubble column */}
          <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} min-w-0`}>
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

            {/* Reaction picker popover */}
            {showReact && (
              <div
                ref={reactRef}
                className={`mb-1 bg-white rounded-full shadow-xl border border-slate-100 px-2 py-1.5 flex gap-1 z-50 ${isOwn ? 'self-end' : 'self-start'}`}
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

            {/* Bubble */}
            <div
              onClick={() => { if (!editing) onThreadClick?.(message.id); }}
              className="cursor-pointer shadow-sm active:opacity-90 transition-opacity"
              style={{
                background: isOwn ? '#dcf8c6' : '#ffffff',
                borderRadius: bubbleRadius,
                padding: '8px 10px 6px 10px',
                maxWidth: '100%',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
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
                  {/* Message text */}
                  {message.message && message.message.trim() && message.message.trim() !== ' ' && (
                    <p
                      className="text-[14px] leading-relaxed whitespace-pre-wrap"
                      style={{ color: '#111b21', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                    >
                      {message.message}
                      {message.is_edited && (
                        <span className="text-[10px] ml-1 italic" style={{ color: '#8696a0' }}>(edited)</span>
                      )}
                    </p>
                  )}

                  {/* Images — clean, no overlays */}
                  {imageUrls.length > 0 && (
                    <ImageGrid
                      urls={imageUrls}
                      onPreview={(i) => setLightboxIdx(i)}
                    />
                  )}
                </>
              )}

              {/* ── Footer bar: likes · comments · time · ticks ── */}
              {!editing && (
                <div
                  className={`flex items-center mt-1.5 gap-2 ${isOwn ? 'justify-end' : 'justify-between'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Left: likes + comments */}
                  <div className="flex items-center gap-2">
                    {/* Like button */}
                    <button
                      onClick={handleQuickLike}
                      className="flex items-center gap-0.5 group"
                      aria-label="Like"
                    >
                      <Heart
                        className="w-3.5 h-3.5 transition-all"
                        style={{
                          color: isLiked ? '#e91e63' : '#8696a0',
                          fill: isLiked ? '#e91e63' : 'none',
                        }}
                      />
                      {localLikes > 0 && (
                        <span
                          className="text-[11px] font-semibold leading-none"
                          style={{ color: isLiked ? '#e91e63' : '#8696a0' }}
                        >
                          {localLikes}
                        </span>
                      )}
                    </button>

                    {/* Comment/thread count — always visible, increments live */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onThreadClick?.(message.id); }}
                      className="flex items-center gap-0.5 group"
                      aria-label={`${replyCount} comment${replyCount !== 1 ? 's' : ''}`}
                    >
                      <MessageCircle
                        className="w-3.5 h-3.5 transition-colors group-active:scale-90"
                        style={{ color: replyCount > 0 ? '#25D366' : '#8696a0' }}
                      />
                      <span
                        className="text-[11px] font-semibold leading-none tabular-nums"
                        style={{ color: replyCount > 0 ? '#25D366' : '#8696a0' }}
                      >
                        {replyCount}
                      </span>
                    </button>
                  </div>

                  {/* Right: timestamp + ticks */}
                  <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                    <span className="text-[10px] leading-none" style={{ color: '#8696a0' }}>
                      {timeAgo(message.created_at)}
                    </span>
                    {isOwn && <CheckCheck className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#53bdeb' }} />}
                  </div>
                </div>
              )}
            </div>

            {/* Other emoji reaction badges below bubble (excluding ❤️ which is in footer) */}
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

          {/* 3-dot button — portal menu avoids feed overflow clipping */}
          <div className="flex-shrink-0 self-center">
            <button
              ref={menuBtnRef}
              onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); setShowReact(false); }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/70 hover:bg-white active:bg-white shadow-sm border border-black/5 transition-colors"
              aria-label="Message options"
            >
              <MoreVertical className="w-4 h-4 text-[#667781]" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MessageCard;

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
import { usePinMessage, useDeleteMessage } from '../../hooks/useCommunity';
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
// Strategy: keep a ref on the menu container AND the trigger button.
// The outside-click handler checks if the click lands inside EITHER element —
// if so, we leave the menu open so that button clicks inside it register first.
const PortalMenu: React.FC<{
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  isOwn: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ anchorRef, isOwn, onClose, children }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  // Position the menu relative to the trigger button
  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const MENU_W = 200;
    const MENU_H = 320;

    let top = rect.bottom + 6;
    let left = isOwn ? rect.right - MENU_W : rect.left;

    if (top + MENU_H > window.innerHeight - 12) top = Math.max(8, rect.top - MENU_H - 6);
    if (left < 8) left = 8;
    if (left + MENU_W > window.innerWidth - 8) left = window.innerWidth - MENU_W - 8;

    setPos({ top, left });
  }, [anchorRef, isOwn]);

  // Outside-click / outside-touch handler
  // We attach it on the NEXT frame so the same tap that opened the menu
  // isn't immediately treated as an outside click.
  useEffect(() => {
    let rafId: number;
    let active = false;

    function handleOutside(e: MouseEvent | TouchEvent) {
      if (!active) return;
      const target = e.target as Node;
      // If the click is inside the menu itself OR on the trigger button — do nothing.
      if (menuRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    }

    rafId = requestAnimationFrame(() => {
      active = true;
      document.addEventListener('mousedown', handleOutside, true);
      document.addEventListener('touchstart', handleOutside, true);
    });

    return () => {
      cancelAnimationFrame(rafId);
      active = false;
      document.removeEventListener('mousedown', handleOutside, true);
      document.removeEventListener('touchstart', handleOutside, true);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);          // intentionally empty — we never want this to re-run

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-[9998] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
      style={{ top: pos.top, left: pos.left, minWidth: 200 }}
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
  const [showMenu, setShowMenu]             = useState(false);
  const [showReact, setShowReact]           = useState(false);
  const [editing, setEditing]               = useState(false);
  const [editText, setEditText]             = useState(message.message);
  const [reactions, setReactions]           = useState<Reactions>({});
  const [lightboxIdx, setLightboxIdx]       = useState<number | null>(null);
  const [localLikes, setLocalLikes]         = useState<number>(message.likes_count || 0);
  const [isLiked, setIsLiked]               = useState(false);
  const [liveReplyCount, setLiveReplyCount] = useState<number>(message.reply_count || 0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const reactRef   = useRef<HTMLDivElement>(null);

  const { togglePin }               = usePinMessage();
  const { deleteMessage, deleting } = useDeleteMessage();
  const { verification }            = useAnyUserVerification(message.user_id);
  const isVerified                  = verification?.is_verified;

  const currentUserId = viewerUserId || message.user_id;

  // Live subscription — keeps reactions + reply_count in sync
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'community_messages', message.id),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        const r = parseReactions(data?.reactions);
        setReactions(r);
        const heartUsers = r['❤️'] ?? [];
        setLocalLikes(heartUsers.length || 0);
        setIsLiked(currentUserId ? heartUsers.includes(currentUserId) : false);
        setLiveReplyCount((data?.reply_count as number) || 0);
      },
      () => {}
    );
    return () => unsub();
  }, [message.id, currentUserId]);

  // Close emoji picker on outside click
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
      const msgRef  = doc(db, 'community_messages', message.id);
      const field   = `reactions.${emoji}`;
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

  const handleQuickLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) return;
    toggleReaction('❤️', currentUserId);
  }, [toggleReaction, currentUserId]);

  const [g0, g1]   = getGrad(message.user_name);
  const inits       = getInitials(message.user_name);
  const tc          = TOPIC_COLORS[message.topic || ''] ?? TOPIC_COLORS['General'];
  const imageUrls   = (message as Community & { image_urls?: string[] }).image_urls ?? [];
  const replyCount  = liveReplyCount;

  // Reactions excluding ❤️ (shown in footer as the "like")
  const reactionSummary = Object.entries(reactions)
    .filter(([emoji, users]) => users.length > 0 && emoji !== '❤️')
    .map(([emoji, users]) => ({ emoji, count: users.length }));

  // ── Premium bubble corner shaping ──────────────────────────────────────
  // Own:   tail on top-right, rounded on bottom-right
  // Other: tail on top-left, rounded on bottom-left
  const ownRadius   = nextSameUser ? '18px 4px 18px 18px'  : '18px 4px 18px 18px';
  const otherRadius = nextSameUser ? '4px 18px 18px 18px'  : '4px 18px 18px 18px';
  const bubbleRadius = isOwn ? ownRadius : otherRadius;

  // Vertical spacing — tighter when consecutive same-user messages
  const mtClass = prevSameUser ? 'mt-0.5' : 'mt-3';

  // Avatar element (shared between own and other)
  const AvatarEl = (
    <button
      type="button"
      onClick={() => onAvatarClick?.(message.user_id, message.user_name, message.user_avatar)}
      className="focus:outline-none flex-shrink-0"
      tabIndex={-1}
    >
      {message.user_avatar ? (
        <img
          src={message.user_avatar}
          alt={message.user_name}
          crossOrigin="anonymous"
          className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-md"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ) : (
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold ring-2 ring-white shadow-md select-none"
          style={{ background: `linear-gradient(135deg, ${g0}, ${g1})` }}
        >
          {inits}
        </div>
      )}
    </button>
  );

  return (
    <>
      {/* ── Delete confirmation modal ─────────────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[10000] px-4">
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-[320px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-[16px] font-bold text-center text-[#111b21] mb-1">Delete message?</h3>
            <p className="text-[13px] text-center text-[#8696a0] mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-[#111b21] bg-[#f0f2f5] hover:bg-[#e8eaed] active:bg-[#dfe2e5] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await deleteMessage(message.id);
                    onDelete(message.id);
                    setShowDeleteConfirm(false);
                  } catch (err) {
                    console.error('[MessageCard] Delete error:', err);
                  }
                }}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-[#ea4335] hover:bg-[#d33527] active:bg-[#bf2718] transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      {lightboxIdx !== null && imageUrls.length > 0 && (
        <ImageLightbox
          images={imageUrls}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}

      {/* ── Context menu (portal) ─────────────────────────────────────────── */}
      {showMenu && (
        <PortalMenu anchorRef={menuBtnRef} isOwn={isOwn} onClose={() => setShowMenu(false)}>
          {/* React */}
          <button
            type="button" role="menuitem"
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => { setShowMenu(false); setTimeout(() => setShowReact(true), 0); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-[13.5px] font-medium text-[#1a1a2e] hover:bg-[#f7f9fc] active:bg-[#eef1f6] transition-colors"
          >
            <span className="text-[17px] leading-none">😊</span>
            <span>React</span>
          </button>

          <div className="h-px mx-4 bg-[#f0f2f5]" />

          {/* Reply */}
          <button
            type="button" role="menuitem"
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => { setShowMenu(false); onReply?.(message); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-[13.5px] font-medium text-[#1a1a2e] hover:bg-[#f7f9fc] active:bg-[#eef1f6] transition-colors"
          >
            <span className="w-6 flex justify-center">
              <Reply className="w-4 h-4 text-[#5b6b79]" />
            </span>
            <span>Reply</span>
          </button>

          {/* Forward */}
          <button
            type="button" role="menuitem"
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => { setShowMenu(false); onForward?.(message); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-[13.5px] font-medium text-[#1a1a2e] hover:bg-[#f7f9fc] active:bg-[#eef1f6] transition-colors"
          >
            <span className="w-6 flex justify-center">
              <Forward className="w-4 h-4 text-[#5b6b79]" />
            </span>
            <span>Forward</span>
          </button>

          {/* View thread */}
          <button
            type="button" role="menuitem"
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => { setShowMenu(false); onThreadClick?.(message.id); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-[13.5px] font-medium text-[#1a1a2e] hover:bg-[#f7f9fc] active:bg-[#eef1f6] transition-colors"
          >
            <span className="w-6 flex justify-center">
              <MessageCircle className="w-4 h-4 text-[#5b6b79]" />
            </span>
            <span>View thread</span>
          </button>

          {/* Edit (own only) */}
          {isOwn && (
            <button
              type="button" role="menuitem"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => { setShowMenu(false); setEditing(true); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-[13.5px] font-medium text-[#1a1a2e] hover:bg-[#f7f9fc] active:bg-[#eef1f6] transition-colors"
            >
              <span className="w-6 flex justify-center">
                <Edit2 className="w-4 h-4 text-[#5b6b79]" />
              </span>
              <span>Edit</span>
            </button>
          )}

          {/* Pin (admin only) */}
          {isAdmin && (
            <button
              type="button" role="menuitem"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => { setShowMenu(false); togglePin(message.id, message.is_pinned || false); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-[13.5px] font-medium text-[#f57c00] hover:bg-amber-50 active:bg-amber-100 transition-colors"
            >
              <span className="w-6 flex justify-center">
                <Pin className="w-4 h-4" />
              </span>
              <span>{message.is_pinned ? 'Unpin' : 'Pin'}</span>
            </button>
          )}

          {/* Delete (own or admin) */}
          {(isOwn || isAdmin) && (
            <>
              <div className="h-px mx-4 bg-[#f0f2f5]" />
              <button
                type="button" role="menuitem"
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
                disabled={deleting}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-[13.5px] font-medium text-[#ea4335] hover:bg-red-50 active:bg-red-100 transition-colors disabled:opacity-50"
              >
                <span className="w-6 flex justify-center">
                  <Trash2 className="w-4 h-4" />
                </span>
                <span>{deleting ? 'Deleting…' : 'Delete'}</span>
              </button>
            </>
          )}
        </PortalMenu>
      )}

      {/* ── Row ──────────────────────────────────────────────────────────── */}
      <div className={`flex items-end gap-2 px-3 ${mtClass} ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>

        {/* Left avatar (other users) — hidden when consecutive */}
        <div className="w-9 flex-shrink-0">
          {!isOwn && !nextSameUser ? AvatarEl : null}
        </div>

        {/* Centre: bubble stack */}
        <div
          className={`flex flex-col gap-0 min-w-0 ${isOwn ? 'items-end' : 'items-start'}`}
          style={{ maxWidth: 'min(72%, 340px)' }}
        >
          {/* Sender name (other, first in group) */}
          {!isOwn && !prevSameUser && (
            <button
              type="button"
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

          {/* Emoji reaction picker */}
          {showReact && (
            <div
              ref={reactRef}
              className={`mb-1.5 bg-white rounded-full shadow-xl border border-slate-100/80 px-2.5 py-2 flex gap-0.5 z-50 ${isOwn ? 'self-end' : 'self-start'}`}
              onClick={(e) => e.stopPropagation()}
            >
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => toggleReaction(emoji, currentUserId || message.user_id)}
                  className="text-[22px] hover:scale-125 active:scale-105 transition-transform px-1"
                  style={{ lineHeight: 1 }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* ── Bubble ─────────────────────────────────────────────────── */}
          <div
            onClick={() => { if (!editing) onThreadClick?.(message.id); }}
            className="relative cursor-pointer w-full"
            style={{
              background: isOwn ? '#d9f7be' : '#ffffff',
              borderRadius: bubbleRadius,
              padding: '10px 12px 8px 12px',
              boxShadow: isOwn
                ? '0 1px 3px rgba(0,0,0,0.10), 0 0 0 0.5px rgba(0,0,0,0.04)'
                : '0 1px 4px rgba(0,0,0,0.09), 0 0 0 0.5px rgba(0,0,0,0.05)',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
            }}
          >
            {/* Topic pill */}
            {message.topic && message.topic !== 'General' && !prevSameUser && (
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full mb-2"
                style={{ background: tc.bg, color: tc.text }}
              >
                {message.topic}
              </span>
            )}

            {/* Edit textarea */}
            {editing ? (
              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-[14px] leading-relaxed resize-none focus:outline-none"
                  style={{
                    border: '2px solid #25D366',
                    background: '#f0fdf4',
                    color: '#111b21',
                    minHeight: '72px',
                    minWidth: '180px',
                  }}
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-4 py-1.5 rounded-xl text-[12px] font-bold text-white transition-colors active:opacity-80"
                    style={{ background: '#25D366' }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditing(false); setEditText(message.message); }}
                    className="px-4 py-1.5 rounded-xl text-[12px] font-semibold transition-colors active:opacity-80"
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
                    className="text-[14.5px] leading-[1.55] whitespace-pre-wrap"
                    style={{ color: '#1a1a2e', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                  >
                    {message.message}
                    {message.is_edited && (
                      <span className="text-[10px] ml-1.5 italic" style={{ color: '#aab4be' }}>(edited)</span>
                    )}
                  </p>
                )}

                {/* Image grid */}
                {imageUrls.length > 0 && (
                  <ImageGrid
                    urls={imageUrls}
                    onPreview={(i) => setLightboxIdx(i)}
                  />
                )}
              </>
            )}

            {/* ── Footer ───────────────────────────────────────────────── */}
            {!editing && (
              <div
                className="flex items-center gap-2 mt-2"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Like */}
                <button
                  type="button"
                  onClick={handleQuickLike}
                  className="flex items-center gap-1 active:scale-90 transition-transform"
                  aria-label={isLiked ? 'Unlike' : 'Like'}
                >
                  <Heart
                    className="w-[14px] h-[14px] transition-all duration-150"
                    style={{
                      color: isLiked ? '#e91e63' : '#9eaab4',
                      fill:  isLiked ? '#e91e63' : 'none',
                      strokeWidth: 2,
                    }}
                  />
                  <span
                    className="text-[11.5px] font-semibold tabular-nums leading-none"
                    style={{ color: isLiked ? '#e91e63' : '#9eaab4' }}
                  >
                    {localLikes > 0 ? localLikes : ''}
                  </span>
                </button>

                {/* Comments */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onThreadClick?.(message.id); }}
                  className="flex items-center gap-1 active:scale-90 transition-transform"
                  aria-label={`${replyCount} comment${replyCount !== 1 ? 's' : ''}`}
                >
                  <MessageCircle
                    className="w-[14px] h-[14px]"
                    style={{ color: replyCount > 0 ? '#1a73e8' : '#9eaab4', strokeWidth: 2 }}
                  />
                  <span
                    className="text-[11.5px] font-semibold tabular-nums leading-none"
                    style={{ color: replyCount > 0 ? '#1a73e8' : '#9eaab4' }}
                  >
                    {replyCount}
                  </span>
                </button>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Timestamp + ticks */}
                <span
                  className="text-[10.5px] leading-none font-medium"
                  style={{ color: '#aab4be' }}
                >
                  {timeAgo(message.created_at)}
                </span>
                {isOwn && (
                  <CheckCheck
                    className="w-[13px] h-[13px] flex-shrink-0"
                    style={{ color: '#53bdeb', strokeWidth: 2.5 }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Other emoji reaction badges */}
          {reactionSummary.length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {reactionSummary.map(({ emoji, count }) => (
                <button
                  key={emoji}
                  type="button"
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => toggleReaction(emoji, currentUserId || message.user_id)}
                  className="flex items-center gap-0.5 bg-white rounded-full px-2 py-0.5 shadow-sm border border-slate-100 text-sm hover:bg-slate-50 active:scale-90 transition-all"
                >
                  <span>{emoji}</span>
                  {count > 1 && (
                    <span className="text-[11px] text-slate-500 font-semibold ml-0.5">{count}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: 3-dot trigger + own avatar stacked */}
        <div className={`flex flex-col items-center gap-1 flex-shrink-0 ${isOwn ? 'order-first mr-0' : ''}`}>
          {/* 3-dot button */}
          <button
            ref={menuBtnRef}
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); setShowReact(false); }}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/80 hover:bg-white active:bg-white shadow-sm border border-black/[0.06] transition-all duration-150"
            aria-label="Message options"
            aria-expanded={showMenu}
            aria-haspopup="menu"
          >
            <MoreVertical className="w-3.5 h-3.5 text-[#7a8a99]" />
          </button>

          {/* Own avatar overlaps bottom of bubble */}
          {isOwn && !nextSameUser && (
            <div className="-mt-1">
              {AvatarEl}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MessageCard;

import React, { useState, useRef, useEffect } from 'react';
import { Community } from '../../lib/supabase';
import { MoreVertical, Trash2, Edit2, MessageCircle, Pin, Check, CheckCheck } from 'lucide-react';
import { usePinMessage } from '../../hooks/useCommunity';
import VerifiedBadge from './VerifiedBadge';

interface MessageCardProps {
  message: Community;
  isOwn: boolean;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, newMessage: string) => void;
  onThreadClick?: (messageId: string) => void;
  onProfileClick?: (userId: string, userName: string, userAvatar?: string) => void;
  isAdmin?: boolean;
  isVerified?: boolean;
  /** Whether the previous post was by the same user (for bubble grouping) */
  prevSameUser?: boolean;
  /** Whether the next post is by the same user (for bubble grouping) */
  nextSameUser?: boolean;
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
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60)     return new Date(date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
  if (s < 3600)   return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)  return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const MessageCard: React.FC<MessageCardProps> = ({
  message, isOwn, onDelete, onEdit, onThreadClick, onProfileClick,
  isAdmin = false, isVerified = false,
  prevSameUser = false, nextSameUser = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [editing,  setEditing]  = useState(false);
  const [editText, setEditText] = useState(message.message);
  const menuRef = useRef<HTMLDivElement>(null);
  const { togglePin } = usePinMessage();

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const handleSave = () => {
    if (editText.trim() && editText !== message.message) onEdit(message.id, editText);
    setEditing(false);
  };

  const [g0, g1] = getGrad(message.user_name);
  const inits     = getInitials(message.user_name);
  const tc        = TOPIC_COLORS[message.topic || ''] ?? TOPIC_COLORS['General'];
  const imageUrls = (message as Community & { image_urls?: string[] }).image_urls;

  // WhatsApp-style border radius based on bubble grouping
  const bubbleRadius = isOwn
    ? nextSameUser ? '16px 4px 16px 16px' : '16px 0px 16px 16px'
    : nextSameUser ? '4px 16px 16px 16px' : '0px 16px 16px 16px';

  const mtClass = prevSameUser ? 'mt-0.5' : 'mt-2';

  return (
    <div
      className={`flex items-end gap-1.5 px-3 ${isOwn ? 'flex-row-reverse' : ''} ${mtClass} ${isOwn ? 'wa-msg-out' : 'wa-msg-in'}`}
    >
      {/* ── Avatar — only show on last bubble of incoming group ───── */}
      <div className="w-8 flex-shrink-0 self-end mb-0.5">
        {!isOwn && !nextSameUser ? (
          <button
            onClick={(e) => { e.stopPropagation(); onProfileClick?.(message.user_id, message.user_name, message.user_avatar); }}
            className="focus:outline-none"
            aria-label={`${message.user_name}'s profile`}
          >
            {message.user_avatar ? (
              <img
                src={message.user_avatar}
                alt={message.user_name}
                crossOrigin="anonymous"
                className="w-8 h-8 rounded-full object-cover shadow-sm"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  const fb = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement;
                  if (fb) fb.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${g0}, ${g1})`,
                display: message.user_avatar ? 'none' : 'flex',
              }}
            >
              {inits}
            </div>
          </button>
        ) : null}
      </div>

      {/* ── Bubble ─────────────────────────────────────────────────── */}
      <div
        className={`max-w-[78%] sm:max-w-[65%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
        style={{ minWidth: 0 }}
      >
        {/* Sender name — first of incoming group */}
        {!isOwn && !prevSameUser && (
          <button
            onClick={(e) => { e.stopPropagation(); onProfileClick?.(message.user_id, message.user_name, message.user_avatar); }}
            className="px-1 pb-0.5 focus:outline-none"
          >
            <span
              className="text-[12px] font-bold leading-tight flex items-center gap-1"
              style={{ color: g0 }}
            >
              {message.user_name}
              {isVerified && <VerifiedBadge size="sm" />}
              {message.is_pinned && <Pin className="w-3 h-3 text-amber-500" />}
            </span>
          </button>
        )}

        {/* Bubble body */}
        <div
          onClick={() => { if (!editing) onThreadClick?.(message.id); }}
          className="relative cursor-pointer shadow-sm active:opacity-90 transition-opacity"
          style={{
            background: isOwn ? '#dcf8c6' : '#ffffff',
            borderRadius: bubbleRadius,
            padding: '8px 12px 6px 12px',
            maxWidth: '100%',
          }}
        >
          {/* Topic chip inside bubble */}
          {message.topic && message.topic !== 'General' && !prevSameUser && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1.5"
              style={{ background: tc.bg, color: tc.text }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: tc.dot }} />
              {message.topic}
            </span>
          )}

          {/* Menu button (own messages) */}
          {(isOwn || isAdmin) && !editing && (
            <div
              className="absolute top-1 right-1"
              ref={menuRef}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
                aria-label="Options"
              >
                <MoreVertical className="w-3.5 h-3.5" style={{ color: isOwn ? '#667781' : '#aebbc1' }} />
              </button>
              {showMenu && (
                <div
                  className="absolute right-0 top-full mt-1 z-30 min-w-[148px] rounded-2xl overflow-hidden"
                  style={{ background: '#fff', boxShadow: '0 6px 28px rgba(0,0,0,0.18)', border: '1px solid #f0f2f5' }}
                >
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
                  <div className="h-px mx-3 bg-[#f0f2f5]" />
                  <button
                    onClick={() => { onDelete(message.id); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-[#ea4335] hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
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
            <p
              className="text-[14px] leading-relaxed whitespace-pre-wrap break-words pr-4"
              style={{ color: '#111b21' }}
            >
              {message.message}
              {message.is_edited && (
                <span className="text-[10px] ml-1 italic" style={{ color: '#8696a0' }}>(edited)</span>
              )}
            </p>
          )}

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
                  <img
                    src={url}
                    alt=""
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }}
                  />
                  {i === 3 && imageUrls.length > 4 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-lg font-bold">+{imageUrls.length - 4}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Time + ticks + reply count row */}
          {!editing && (
            <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'justify-end' : 'justify-between'}`}>
              {/* Reply button (incoming side) */}
              {!isOwn && onThreadClick && (
                <button
                  onClick={(e) => { e.stopPropagation(); onThreadClick(message.id); }}
                  className="flex items-center gap-1 group"
                >
                  <MessageCircle
                    className="w-3.5 h-3.5 transition-colors"
                    style={{ color: message.reply_count > 0 ? '#25D366' : '#aebbc1' }}
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
                {isOwn && (
                  <CheckCheck className="w-3.5 h-3.5" style={{ color: '#8696a0' }} />
                )}
              </div>

              {/* Reply count on own message */}
              {isOwn && onThreadClick && message.reply_count > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); onThreadClick(message.id); }}
                  className="flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" style={{ color: '#25D366' }} />
                  <span className="text-[11px] font-semibold" style={{ color: '#25D366' }}>
                    {message.reply_count}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageCard;

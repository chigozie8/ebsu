import React, { useState, useRef, useEffect } from 'react';
import { Community } from '../../lib/supabase';
import { MoreVertical, Trash2, Edit2, MessageCircle, Pin, Check } from 'lucide-react';
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
}

const TOPIC_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  General:       { bg: '#f0f2f5', text: '#667781',  dot: '#8696a0' },
  Academics:     { bg: '#e8f4fd', text: '#1a73e8',  dot: '#1a73e8' },
  'Campus Life': { bg: '#fce4ec', text: '#e91e63',  dot: '#e91e63' },
  Tech:          { bg: '#e8f5e9', text: '#2e7d32',  dot: '#43a047' },
  Events:        { bg: '#fff8e1', text: '#f57c00',  dot: '#ffa726' },
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
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const MessageCard: React.FC<MessageCardProps> = ({
  message, isOwn, onDelete, onEdit, onThreadClick, onProfileClick,
  isAdmin = false, isVerified = false,
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
  const initials  = getInitials(message.user_name);
  const tc        = TOPIC_COLORS[message.topic || ''] ?? TOPIC_COLORS['General'];
  const imageUrls = (message as Community & { image_urls?: string[] }).image_urls;

  return (
    <div
      className="flex gap-3 px-4 py-3.5 hover:bg-[#f9f9f9] active:bg-[#f5f5f5] transition-colors duration-100 cursor-pointer"
      onClick={(e) => {
        // Only open thread on main body click (not on buttons)
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('textarea')) return;
        onThreadClick?.(message.id);
      }}
    >
      {/* ── Avatar ─────────────────────────────────────────────────── */}
      <button
        onClick={(e) => { e.stopPropagation(); onProfileClick?.(message.user_id, message.user_name, message.user_avatar); }}
        className="flex-shrink-0 self-start focus:outline-none mt-0.5"
        aria-label={`${message.user_name}'s profile`}
        tabIndex={onProfileClick ? 0 : -1}
      >
        {message.user_avatar ? (
          <img
            src={message.user_avatar}
            alt={message.user_name}
            crossOrigin="anonymous"
            className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-white"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fb = e.currentTarget.nextElementSibling as HTMLElement;
              if (fb) fb.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-bold shadow-sm ring-2 ring-white"
          style={{
            background: `linear-gradient(135deg, ${g0}, ${g1})`,
            display: message.user_avatar ? 'none' : 'flex',
          }}
        >
          {initials}
        </div>
      </button>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">

        {/* Header row */}
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              onClick={(e) => { e.stopPropagation(); onProfileClick?.(message.user_id, message.user_name, message.user_avatar); }}
              className="font-semibold text-[#111b21] text-[15px] leading-tight hover:text-[#128C7E] transition-colors truncate max-w-[160px] sm:max-w-[240px] focus:outline-none"
            >
              {message.user_name}
            </button>
            {isVerified && <VerifiedBadge size="sm" />}
            {message.is_pinned && (
              <Pin className="w-3 h-3 text-amber-500 flex-shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[12px]" style={{ color: '#8696a0' }}>
              {timeAgo(message.created_at)}
            </span>
            {(isOwn || isAdmin) && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#f0f2f5] transition-colors"
                  aria-label="Options"
                >
                  <MoreVertical className="w-4 h-4" style={{ color: '#8696a0' }} />
                </button>
                {showMenu && (
                  <div
                    className="absolute right-0 top-full mt-1 z-30 min-w-[150px] rounded-xl overflow-hidden"
                    style={{ background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.16)', border: '1px solid #f0f2f5' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isOwn && (
                      <button
                        onClick={() => { setEditing(true); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#111b21] hover:bg-[#f5f5f5] transition-colors"
                      >
                        <Edit2 className="w-4 h-4" style={{ color: '#667781' }} />
                        Edit message
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => { togglePin(message.id, message.is_pinned || false); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#f57c00] hover:bg-amber-50 transition-colors"
                      >
                        <Pin className="w-4 h-4" />
                        {message.is_pinned ? 'Unpin' : 'Pin message'}
                      </button>
                    )}
                    <div className="h-px mx-3" style={{ background: '#f0f2f5' }} />
                    <button
                      onClick={() => { onDelete(message.id); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#ea4335] hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Topic chip */}
        {message.topic && message.topic !== 'General' && (
          <div className="mb-1.5">
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: tc.bg, color: tc.text }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: tc.dot }}
              />
              {message.topic}
            </span>
          </div>
        )}

        {/* Message text / edit mode */}
        {editing ? (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-3 rounded-xl text-sm leading-relaxed resize-none focus:outline-none transition-shadow"
              style={{
                border: '2px solid #25D366',
                background: '#f0fdf4',
                color: '#111b21',
                minHeight: '72px',
              }}
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors"
                style={{ background: '#25D366' }}
              >
                Save
              </button>
              <button
                onClick={() => { setEditing(false); setEditText(message.message); }}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{ background: '#f0f2f5', color: '#667781' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p
            className="text-[14px] leading-relaxed whitespace-pre-wrap break-words"
            style={{ color: '#111b21' }}
          >
            {message.message}
            {message.is_edited && (
              <span className="text-[11px] ml-1.5 italic" style={{ color: '#8696a0' }}>(edited)</span>
            )}
          </p>
        )}

        {/* Images */}
        {imageUrls && imageUrls.length > 0 && (
          <div
            className={`mt-2 grid gap-1 rounded-xl overflow-hidden ${imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {imageUrls.slice(0, 4).map((url, i) => (
              <div key={i} className="relative bg-[#f0f2f5] overflow-hidden" style={{ aspectRatio: imageUrls.length === 1 ? '16/9' : '4/3' }}>
                <img
                  src={url}
                  alt=""
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }}
                />
                {i === 3 && imageUrls.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">+{imageUrls.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer row: reply count */}
        {onThreadClick && !editing && (
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); onThreadClick(message.id); }}
              className="flex items-center gap-1.5 group"
            >
              <MessageCircle
                className="w-4 h-4 transition-colors group-hover:text-[#25D366]"
                style={{ color: message.reply_count > 0 ? '#25D366' : '#aebbc1' }}
              />
              <span
                className="text-[13px] font-medium transition-colors group-hover:text-[#25D366]"
                style={{ color: message.reply_count > 0 ? '#128C7E' : '#aebbc1' }}
              >
                {message.reply_count > 0 ? `${message.reply_count} ${message.reply_count === 1 ? 'reply' : 'replies'}` : 'Reply'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageCard;

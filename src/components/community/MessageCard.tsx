import React, { useState, useRef, useEffect } from 'react';
import { Community } from '../../lib/supabase';
import { MoreVertical, Trash2, Edit2, MessageCircle, Pin } from 'lucide-react';
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

const TOPIC_BADGE: Record<string, { bg: string; text: string }> = {
  General:       { bg: 'bg-slate-100',    text: 'text-slate-500' },
  Academics:     { bg: 'bg-blue-50',      text: 'text-blue-600' },
  'Campus Life': { bg: 'bg-pink-50',      text: 'text-pink-600' },
  Tech:          { bg: 'bg-emerald-50',   text: 'text-emerald-600' },
  Events:        { bg: 'bg-amber-50',     text: 'text-amber-600' },
};

const AVATAR_GRADIENTS = [
  ['#00897b', '#26a69a'],
  ['#1976d2', '#42a5f5'],
  ['#e91e63', '#f06292'],
  ['#f57c00', '#ffb74d'],
  ['#388e3c', '#66bb6a'],
  ['#7b1fa2', '#ba68c8'],
];
function getAvatarGradient(name: string): [string, string] {
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}
function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function getTimeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
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

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const handleEditSubmit = () => {
    if (editText.trim() && editText !== message.message) {
      onEdit(message.id, editText);
    }
    setEditing(false);
  };

  const [g0, g1] = getAvatarGradient(message.user_name);
  const initials = getInitials(message.user_name);
  const topicStyle = TOPIC_BADGE[message.topic || ''] ?? { bg: 'bg-slate-100', text: 'text-slate-500' };

  const handleAvatarClick = () => {
    onProfileClick?.(message.user_id, message.user_name, message.user_avatar);
  };

  const imageUrls = (message as Community & { image_urls?: string[] }).image_urls;

  return (
    <article className="px-4 py-4 sm:px-5 sm:py-4.5">
      <div className="flex gap-3 sm:gap-3.5">

        {/* ── Avatar ────────────────────────────────────────────── */}
        <button
          onClick={handleAvatarClick}
          className="flex-shrink-0 self-start focus:outline-none rounded-full focus-visible:ring-2 focus-visible:ring-[#25D366]"
          tabIndex={onProfileClick ? 0 : -1}
          aria-label={`View ${message.user_name}'s profile`}
        >
          {message.user_avatar ? (
            <img
              src={message.user_avatar}
              alt={message.user_name}
              crossOrigin="anonymous"
              className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm transition-transform hover:scale-105"
              onError={(e) => {
                const t = e.currentTarget;
                t.onerror = null;
                // Swap to initials fallback
                const parent = t.parentElement;
                if (parent) {
                  t.style.display = 'none';
                  const div = document.createElement('div');
                  div.className = 'w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-white shadow-sm';
                  div.style.background = `linear-gradient(135deg, ${g0}, ${g1})`;
                  div.textContent = initials;
                  parent.appendChild(div);
                }
              }}
            />
          ) : (
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-white shadow-sm transition-transform hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${g0}, ${g1})` }}
            >
              {initials}
            </div>
          )}
        </button>

        {/* ── Content ───────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Header row */}
          <div className="flex items-start gap-2 justify-between mb-1.5">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <button
                onClick={handleAvatarClick}
                className="font-bold text-slate-900 text-sm hover:text-[#128C7E] transition-colors focus:outline-none leading-tight"
              >
                {message.user_name}
              </button>
              {isVerified && <VerifiedBadge size="sm" />}
              {message.is_edited && (
                <span className="text-[11px] text-slate-400 italic leading-tight">edited</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[11px] text-slate-400 leading-tight whitespace-nowrap">
                {getTimeAgo(message.created_at)}
              </span>
              {(isOwn || isAdmin) && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu((v) => !v)}
                    className="w-7 h-7 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors flex items-center justify-center"
                    aria-label="Message options"
                  >
                    <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-20 min-w-[140px] overflow-hidden py-1">
                      {isOwn && (
                        <button
                          onClick={() => { setEditing(true); setShowMenu(false); }}
                          className="w-full text-left px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                          Edit
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => { togglePin(message.id, message.is_pinned || false); setShowMenu(false); }}
                          className="w-full text-left px-3.5 py-2.5 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2.5 transition-colors"
                        >
                          <Pin className="w-3.5 h-3.5" />
                          {message.is_pinned ? 'Unpin' : 'Pin'}
                        </button>
                      )}
                      <div className="my-1 mx-2 border-t border-slate-100" />
                      <button
                        onClick={() => { onDelete(message.id); setShowMenu(false); }}
                        className="w-full text-left px-3.5 py-2.5 text-sm text-rose-500 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Topic badge */}
          {message.topic && message.topic !== 'General' && (
            <div className="mb-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${topicStyle.bg} ${topicStyle.text}`}>
                {message.topic}
              </span>
            </div>
          )}

          {/* Message body / edit mode */}
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-3 border-2 border-[#25D366] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 text-sm bg-[#f0fdf4] resize-none leading-relaxed transition-shadow"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEditSubmit}
                  className="px-4 py-1.5 bg-[#25D366] text-white text-sm rounded-lg hover:bg-[#128C7E] transition-colors font-semibold shadow-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditing(false); setEditText(message.message); }}
                  className="px-4 py-1.5 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.message}
            </p>
          )}

          {/* Attached images */}
          {imageUrls && imageUrls.length > 0 && (
            <div className={`mt-2.5 grid gap-1.5 ${imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {imageUrls.map((url, idx) => (
                <div key={idx} className="relative overflow-hidden rounded-xl bg-slate-100">
                  <img
                    src={url}
                    alt={`attachment-${idx}`}
                    crossOrigin="anonymous"
                    className="w-full object-cover max-h-52 rounded-xl hover:opacity-95 transition-opacity cursor-pointer"
                    style={{ aspectRatio: imageUrls.length === 1 ? '16/9' : '4/3' }}
                    onError={(e) => {
                      e.currentTarget.parentElement!.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Thread / reply row */}
          {onThreadClick && !editing && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => onThreadClick(message.id)}
                className="group flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#128C7E] transition-colors"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 group-hover:bg-[#f0fdf4] transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" />
                </div>
                {message.reply_count > 0
                  ? <span>{message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}</span>
                  : <span className="text-slate-400 group-hover:text-[#128C7E] transition-colors">Reply</span>
                }
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default MessageCard;

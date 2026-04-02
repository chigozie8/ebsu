import React, { useState, useRef, useEffect } from 'react';
import { Community } from '../../lib/supabase';
import { Trash2, Edit2, Pin, Check, CheckCheck, MoreVertical, MessageCircle } from 'lucide-react';
import { usePinMessage, useReactions, useAddReaction } from '../../hooks/useCommunity';
import ReactionBar from './ReactionBar';

interface MessageCardProps {
  message: Community;
  isOwn: boolean;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, newMessage: string) => void;
  onThreadClick?: (messageId: string) => void;
  isAdmin?: boolean;
  currentUserId: string;
}

const TOPIC_BADGE: Record<string, string> = {
  General:      'bg-slate-100 text-slate-600',
  Academics:    'bg-blue-100 text-blue-700',
  'Campus Life':'bg-pink-100 text-pink-700',
  Tech:         'bg-emerald-100 text-emerald-700',
  Events:       'bg-amber-100 text-amber-700',
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

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatBubbleTime(date: string) {
  return new Date(date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

const MessageCard: React.FC<MessageCardProps> = ({
  message,
  isOwn,
  onDelete,
  onEdit,
  onThreadClick,
  isAdmin = false,
  currentUserId,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.message);
  const menuRef = useRef<HTMLDivElement>(null);
  const { togglePin } = usePinMessage();
  const { reactions } = useReactions(message.id);
  const { addReaction } = useAddReaction();

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const handleEditSubmit = () => {
    if (editText.trim() && editText !== message.message) {
      onEdit(message.id, editText);
      setEditing(false);
    }
  };

  const gradientClass = getAvatarColor(message.user_name);
  const initials = getInitials(message.user_name);

  // Detect if message contains only image URLs (sticker/image-only messages)
  const isImageOnly = !message.message.trim() || message.message.startsWith('http');

  return (
    <div className={`flex items-end gap-2 px-3 py-1 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>

      {/* Avatar — only shown for others */}
      {!isOwn && (
        <div className="flex-shrink-0 mb-1">
          {message.user_avatar ? (
            <img
              src={message.user_avatar}
              alt={message.user_name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
            />
          ) : (
            <div
              className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm`}
            >
              {initials}
            </div>
          )}
        </div>
      )}

      {/* Bubble wrapper */}
      <div className={`flex flex-col max-w-[72%] sm:max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>

        {/* Sender name (others only) */}
        {!isOwn && (
          <span className="text-xs font-semibold text-slate-500 mb-1 ml-1">{message.user_name}</span>
        )}

        {/* Pinned badge */}
        {message.is_pinned && (
          <div className={`flex items-center gap-1 text-xs font-semibold text-amber-600 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
            <Pin className="w-3 h-3" />
            <span>Pinned</span>
          </div>
        )}

        <div className="flex items-end gap-1.5">
          {/* Context menu button — appears on hover, before bubble for own messages */}
          {isOwn && (
            <div className="relative self-center opacity-0 group-hover:opacity-100 transition-opacity" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-slate-200 rounded-full transition-colors"
              >
                <MoreVertical className="w-3.5 h-3.5 text-slate-500" />
              </button>
              {showMenu && (
                <div className="absolute right-full mr-1 bottom-0 bg-white border border-slate-200 rounded-xl shadow-xl z-30 min-w-[140px] overflow-hidden">
                  <button
                    onClick={() => { setEditing(true); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    Edit
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => { togglePin(message.id, message.is_pinned || false); setShowMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2 border-t border-slate-100"
                    >
                      <Pin className="w-3.5 h-3.5" />
                      {message.is_pinned ? 'Unpin' : 'Pin'}
                    </button>
                  )}
                  <button
                    onClick={() => { onDelete(message.id); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}

          {/* The bubble itself */}
          {editing ? (
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-3 border border-teal-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-teal-50 resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setEditing(false); setEditText(message.message); }}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  className="px-3 py-1.5 bg-teal-500 text-white text-xs rounded-lg hover:bg-teal-600 transition-colors font-semibold"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`relative px-3.5 py-2.5 shadow-sm ${
                isOwn
                  ? 'bg-teal-500 text-white rounded-2xl rounded-br-sm'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-bl-sm'
              }`}
            >
              {/* Topic badge inside bubble (non-general) */}
              {message.topic && message.topic !== 'General' && (
                <span
                  className={`inline-block mb-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isOwn ? 'bg-white/20 text-white/90' : (TOPIC_BADGE[message.topic] ?? 'bg-slate-100 text-slate-600')
                  }`}
                >
                  {message.topic}
                </span>
              )}

              {/* Message text */}
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.message}
              </p>

              {/* Subcategory tag */}
              {(message as any).subcategory && (
                <span className={`mt-1 inline-block text-xs font-medium ${isOwn ? 'text-white/70' : 'text-slate-400'}`}>
                  #{(message as any).subcategory}
                </span>
              )}

              {/* Time + ticks row */}
              <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-end'}`}>
                {message.is_edited && (
                  <span className={`text-xs italic ${isOwn ? 'text-white/60' : 'text-slate-400'}`}>edited</span>
                )}
                <span className={`text-xs ${isOwn ? 'text-white/70' : 'text-slate-400'}`}>
                  {formatBubbleTime(message.created_at)}
                </span>
                {isOwn && (
                  <CheckCheck className="w-3.5 h-3.5 text-white/70 flex-shrink-0" />
                )}
              </div>
            </div>
          )}

          {/* Context menu for others' messages */}
          {!isOwn && (
            <div className="relative self-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-slate-200 rounded-full transition-colors"
              >
                <MoreVertical className="w-3.5 h-3.5 text-slate-500" />
              </button>
              {showMenu && (
                <div className="absolute left-full ml-1 bottom-0 bg-white border border-slate-200 rounded-xl shadow-xl z-30 min-w-[100px] overflow-hidden">
                  <button
                    onClick={() => { onThreadClick?.(message.id); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-teal-600 hover:bg-teal-50 flex items-center gap-2"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Reply
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Image attachments */}
        {(message as any).image_urls && (message as any).image_urls.length > 0 && (
          <div className={`grid gap-1 mt-1 ${(message as any).image_urls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} max-w-[240px]`}>
            {(message as any).image_urls.map((url: string, idx: number) => (
              <img
                key={idx}
                src={url}
                alt={`attachment-${idx}`}
                className="rounded-xl object-cover w-full h-36 border border-slate-200"
              />
            ))}
          </div>
        )}

        {/* Reaction bar */}
        {!editing && (
          <ReactionBar
            reactions={reactions}
            currentUserId={currentUserId}
            onReact={(emoji) => addReaction(message.id, currentUserId, emoji)}
            isOwn={isOwn}
          />
        )}

        {/* Reply-in-thread button for own messages */}
        {isOwn && onThreadClick && !editing && (
          <button
            onClick={() => onThreadClick(message.id)}
            className="flex items-center gap-1 mt-0.5 text-xs text-slate-400 hover:text-teal-600 transition-colors"
          >
            <MessageCircle className="w-3 h-3" />
            {message.reply_count > 0 ? `${message.reply_count} replies` : 'Reply'}
          </button>
        )}

        {/* Reply count for others' messages */}
        {!isOwn && onThreadClick && !editing && message.reply_count > 0 && (
          <button
            onClick={() => onThreadClick(message.id)}
            className="flex items-center gap-1 mt-0.5 ml-1 text-xs text-teal-600 hover:text-teal-700 transition-colors font-medium"
          >
            <MessageCircle className="w-3 h-3" />
            {message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageCard;

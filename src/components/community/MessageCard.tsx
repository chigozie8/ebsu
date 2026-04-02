import React, { useState } from 'react';
import { Community } from '../../lib/supabase';
import { MoreHorizontal, Trash2, Edit2, MessageCircle, Pin, Clock, CheckCircle } from 'lucide-react';
import { usePinMessage } from '../../hooks/useCommunity';
import { useAnyUserVerification } from '../../hooks/usePrivateChat';

interface MessageCardProps {
  message: Community;
  isOwn: boolean;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, newMessage: string) => void;
  onThreadClick?: (messageId: string) => void;
  isAdmin?: boolean;
  /** Called when the user's avatar or name is clicked */
  onAvatarClick?: (userId: string, userName: string, userAvatar?: string) => void;
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

function getTimeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60)   return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const MessageCard: React.FC<MessageCardProps> = ({
  message,
  isOwn,
  onDelete,
  onEdit,
  onThreadClick,
  isAdmin = false,
  onAvatarClick,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [editing,  setEditing]  = useState(false);
  const [editText, setEditText] = useState(message.message);
  const { togglePin } = usePinMessage();
  const { verification } = useAnyUserVerification(message.user_id);

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

  return (
    <div className="p-4 sm:p-5">
      <div className="flex gap-3 sm:gap-4">

        {/* Avatar (clickable) */}
        <button
          type="button"
          onClick={() => onAvatarClick?.(message.user_id, message.user_name, message.user_avatar)}
          className="flex-shrink-0 focus:outline-none group"
          title={`View ${message.user_name}'s profile`}
        >
          {message.user_avatar ? (
            <img
              src={message.user_avatar}
              alt={message.user_name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-teal-300 transition-all"
            />
          ) : (
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white text-xs font-bold ring-2 ring-slate-100 group-hover:ring-teal-300 transition-all`}
            >
              {initials}
            </div>
          )}
        </button>

        <div className="flex-1 min-w-0">

          {/* Top row: name + time + topic + menu */}
          <div className="flex items-start gap-2 justify-between flex-wrap mb-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onAvatarClick?.(message.user_id, message.user_name, message.user_avatar)}
                className="font-bold text-slate-900 text-sm hover:text-teal-600 transition-colors focus:outline-none"
              >
                {message.user_name}
              </button>
              {verification?.is_verified && (
                <CheckCircle className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" strokeWidth={2.5} />
              )}
              {message.is_edited && (
                <span className="text-xs text-slate-400 italic">(edited)</span>
              )}
              {message.topic && message.topic !== 'General' && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TOPIC_BADGE[message.topic] ?? 'bg-slate-100 text-slate-600'}`}
                >
                  {message.topic}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3" />
                <span className="text-xs">{getTimeAgo(message.created_at)}</span>
              </div>

              {isOwn && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4 text-slate-500" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 min-w-[130px] overflow-hidden">
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
            </div>
          </div>

          {/* Message body / edit mode */}
          {editing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-3 border border-teal-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-teal-50 resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEditSubmit}
                  className="px-4 py-1.5 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600 transition-colors font-semibold"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditing(false); setEditText(message.message); }}
                  className="px-4 py-1.5 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-700 text-sm leading-relaxed mt-1 whitespace-pre-wrap break-words">
              {message.message}
            </p>
          )}

          {/* Thread button */}
          {onThreadClick && !editing && (
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => onThreadClick(message.id)}
                className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 hover:bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200 hover:border-teal-400 transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Reply in thread
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageCard;

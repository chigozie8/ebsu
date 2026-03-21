import React, { useState, useEffect, useRef } from 'react';
import {
  MoreHorizontal, Trash2, Edit2, MessageCircle, Pin, Clock,
  Heart, Bookmark, Share2, Forward, CornerUpRight, X, Check,
} from 'lucide-react';
import { Community, useLikeMessage, useSaveMessage, useForwardMessage, usePinMessage } from '../../hooks/useCommunity';

interface MessageCardProps {
  message: Community;
  isOwn: boolean;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, newMessage: string) => void;
  onThreadClick?: (messageId: string) => void;
  isAdmin?: boolean;
  userId: string;
  userName: string;
  userAvatar?: string;
  likedIds?: string[];
  savedIds?: string[];
  onLikeChange?: (messageId: string, liked: boolean) => void;
  onSaveChange?: (messageId: string, saved: boolean) => void;
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

const FORWARD_TOPICS = ['General', 'Academics', 'Campus Life', 'Tech', 'Events'];

const MessageCard: React.FC<MessageCardProps> = ({
  message,
  isOwn,
  onDelete,
  onEdit,
  onThreadClick,
  isAdmin = false,
  userId,
  userName,
  userAvatar,
  likedIds = [],
  savedIds = [],
  onLikeChange,
  onSaveChange,
}) => {
  const [showMenu,    setShowMenu]    = useState(false);
  const [editing,     setEditing]     = useState(false);
  const [editText,    setEditText]    = useState(message.message);
  const [showForward, setShowForward] = useState(false);
  const [forwardTopic, setForwardTopic] = useState('General');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [shareCopied,  setShareCopied]  = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Derived liked / saved from parent-managed id lists (optimistic)
  const isLiked = likedIds.includes(message.id);
  const isSaved = savedIds.includes(message.id);

  const { toggleLike, liking } = useLikeMessage();
  const { toggleSave, saving } = useSaveMessage();
  const { forwardMessage, forwarding } = useForwardMessage();
  const { togglePin } = usePinMessage();

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLike = async () => {
    onLikeChange?.(message.id, !isLiked);
    await toggleLike(message.id, userId, isLiked);
  };

  const handleSave = async () => {
    onSaveChange?.(message.id, !isSaved);
    await toggleSave(message.id, userId, isSaved);
  };

  const handleShare = async () => {
    const text = `"${message.message}" — ${message.user_name} on EBSU Community`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'EBSU Community', text });
      } else {
        await navigator.clipboard.writeText(text);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      // user cancelled share
    }
  };

  const handleForward = async () => {
    await forwardMessage(message, forwardTopic, userId, userName, userAvatar);
    setShowForward(false);
  };

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

  const isSticker = message.media_type === 'sticker' && message.sticker_url;
  const isImage   = message.media_type === 'image' && message.image_url;
  const isForwarded = !!message.forwarded_from;

  return (
    <>
      {/* Lightbox */}
      {lightboxOpen && message.image_url && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <img
            src={message.image_url}
            alt="Full view"
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="p-4 sm:p-5">
        <div className="flex gap-3 sm:gap-4">

          {/* Avatar */}
          {message.user_avatar ? (
            <img
              src={message.user_avatar}
              alt={message.user_name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-slate-100"
            />
          ) : (
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ring-2 ring-slate-100`}
            >
              {initials}
            </div>
          )}

          <div className="flex-1 min-w-0">

            {/* Top row */}
            <div className="flex items-start gap-2 justify-between flex-wrap mb-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 text-sm">{message.user_name}</span>
                {message.is_edited && <span className="text-xs text-slate-400 italic">(edited)</span>}
                {message.topic && message.topic !== 'General' && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TOPIC_BADGE[message.topic] ?? 'bg-slate-100 text-slate-600'}`}>
                    {message.topic}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">{getTimeAgo(message.created_at)}</span>
                </div>
                {(isOwn || isAdmin) && (
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4 text-slate-500" />
                    </button>
                    {showMenu && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 min-w-[140px] overflow-hidden">
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
                            onClick={() => { togglePin(message.id, message.is_pinned); setShowMenu(false); }}
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

            {/* Forwarded label */}
            {isForwarded && (
              <div className="flex items-center gap-1.5 mb-1.5 text-xs text-slate-500">
                <CornerUpRight className="w-3 h-3" />
                <span>Forwarded from <span className="font-semibold">{message.forwarded_from_user || 'someone'}</span></span>
              </div>
            )}

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
              <>
                {/* Text message */}
                {message.message && (
                  <p className="text-slate-700 text-sm leading-relaxed mt-1 whitespace-pre-wrap break-words">
                    {message.message}
                  </p>
                )}

                {/* Image */}
                {isImage && (
                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="mt-2 block max-w-xs rounded-xl overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={message.image_url}
                      alt="Shared image"
                      className="w-full h-auto max-h-64 object-cover"
                    />
                  </button>
                )}

                {/* Sticker */}
                {isSticker && (
                  <div className="mt-2">
                    <img
                      src={message.sticker_url}
                      alt="Sticker"
                      className="w-20 h-20 object-contain"
                    />
                  </div>
                )}
              </>
            )}

            {/* Action bar */}
            {!editing && (
              <div className="mt-3 flex items-center gap-1 flex-wrap">

                {/* Like */}
                <button
                  onClick={handleLike}
                  disabled={liking}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    isLiked
                      ? 'bg-rose-50 border-rose-200 text-rose-600'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-rose-200 hover:text-rose-500 hover:bg-rose-50'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{message.likes_count > 0 ? message.likes_count : ''} {isLiked ? 'Liked' : 'Like'}</span>
                </button>

                {/* Thread */}
                {onThreadClick && (
                  <button
                    onClick={() => onThreadClick(message.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-500 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50 transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {message.reply_count > 0 ? `${message.reply_count} Replies` : 'Reply'}
                  </button>
                )}

                {/* Save */}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    isSaved
                      ? 'bg-amber-50 border-amber-200 text-amber-600'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-amber-200 hover:text-amber-500 hover:bg-amber-50'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-500 text-amber-500' : ''}`} />
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>

                {/* Share */}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-500 hover:border-sky-200 hover:text-sky-600 hover:bg-sky-50 transition-all"
                >
                  {shareCopied ? <Check className="w-3.5 h-3.5 text-teal-500" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{shareCopied ? 'Copied!' : 'Share'}</span>
                </button>

                {/* Forward */}
                <button
                  onClick={() => setShowForward(!showForward)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-500 hover:border-violet-200 hover:text-violet-600 hover:bg-violet-50 transition-all"
                >
                  <Forward className="w-3.5 h-3.5" />
                  Forward
                </button>
              </div>
            )}

            {/* Forward topic picker */}
            {showForward && !editing && (
              <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p className="text-xs font-semibold text-slate-700">Forward to topic:</p>
                <div className="flex flex-wrap gap-1.5">
                  {FORWARD_TOPICS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setForwardTopic(t)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        forwardTopic === t
                          ? 'bg-teal-500 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleForward}
                    disabled={forwarding}
                    className="px-4 py-1.5 bg-teal-500 text-white text-xs rounded-lg font-semibold hover:bg-teal-600 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                  >
                    <Forward className="w-3 h-3" />
                    {forwarding ? 'Forwarding...' : 'Forward'}
                  </button>
                  <button
                    onClick={() => setShowForward(false)}
                    className="px-4 py-1.5 bg-slate-100 text-slate-600 text-xs rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MessageCard;

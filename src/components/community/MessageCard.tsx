import React, { useState } from 'react';
import { Community } from '../../lib/supabase';
import { Heart, MessageSquareMore, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';

interface MessageCardProps {
  message: Community;
  isOwn: boolean;
  onReply: (messageId: string) => void;
  onLike: (messageId: string) => void;
  onUnlike: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, newMessage: string) => void;
  isLiked: boolean;
  liking?: boolean;
}

const MessageCard: React.FC<MessageCardProps> = ({
  message,
  isOwn,
  onReply,
  onLike,
  onUnlike,
  onDelete,
  onEdit,
  isLiked,
  liking = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.message);

  const topicColors: Record<string, string> = {
    'General': 'bg-purple-100 text-purple-700',
    'Academics': 'bg-blue-100 text-blue-700',
    'Campus Life': 'bg-pink-100 text-pink-700',
    'Tech': 'bg-green-100 text-green-700',
    'Events': 'bg-amber-100 text-amber-700',
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const handleEditSubmit = () => {
    if (editText.trim() && editText !== message.message) {
      onEdit(message.id, editText);
      setEditing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-teal-300 hover:shadow-lg transition-all">
      <div className="p-4">
        <div className="flex gap-3">
          {message.user_avatar ? (
            <img
              src={message.user_avatar}
              alt={message.user_name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center flex-shrink-0 text-white font-bold">
              {message.user_name.charAt(0)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{message.user_name}</p>
                <p className="text-xs text-gray-500">{getTimeAgo(message.created_at)}</p>
                {message.is_edited && <p className="text-xs text-gray-400">(edited)</p>}
              </div>
              <div className="flex items-center gap-2">
                {message.topic !== 'General' && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${topicColors[message.topic] || 'bg-gray-100 text-gray-700'}`}
                  >
                    {message.topic}
                  </span>
                )}
                {isOwn && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4 text-gray-600" />
                    </button>
                    {showMenu && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => {
                            setEditing(true);
                            setShowMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-200"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            onDelete(message.id);
                            setShowMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
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

            {editing ? (
              <div className="mt-3 space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full p-2 border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleEditSubmit}
                    className="px-3 py-1 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setEditText(message.message);
                    }}
                    className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 mt-2 whitespace-pre-wrap break-words">{message.message}</p>
            )}

            <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 border-t border-gray-100 pt-2">
              <button
                onClick={() => (isLiked ? onUnlike(message.id) : onLike(message.id))}
                disabled={liking}
                className={`flex items-center gap-2 transition-all duration-200 transform hover:scale-110 ${
                  isLiked ? 'text-rose-500 font-semibold' : 'text-gray-600 hover:text-rose-500'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Heart 
                  className={`w-5 h-5 transition-all duration-200 ${
                    isLiked ? 'fill-rose-500 stroke-rose-500' : 'stroke-current'
                  }`} 
                />
                <span className={`transition-all ${isLiked ? 'font-bold' : ''}`}>
                  {message.likes_count}
                </span>
              </button>
              <button
                onClick={() => onReply(message.id)}
                className="flex items-center gap-2 text-gray-600 hover:text-teal-500 transition-colors"
              >
                <MessageSquareMore className="w-5 h-5" />
                <span>{message.reply_count}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageCard;

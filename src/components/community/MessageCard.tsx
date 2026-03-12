import React, { useState } from 'react';
import { Community } from '../../lib/supabase';
import { MoreHorizontal, Trash2, Edit2, SmilePlus, MessageCircle } from 'lucide-react';
import { useReactions, useAddReaction } from '../../hooks/useCommunity';

interface MessageCardProps {
  message: Community;
  isOwn: boolean;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, newMessage: string) => void;
  userId?: string;
  onThreadClick?: (messageId: string) => void;
}

const MessageCard: React.FC<MessageCardProps> = ({
  message,
  isOwn,
  onDelete,
  onEdit,
  userId,
  onThreadClick,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.message);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const { reactions } = useReactions(message.id);
  const { addReaction } = useAddReaction();

  const EMOJI_REACTIONS = ['👍', '❤️', '🔥', '😂', '🎉'];

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

  const handleReaction = async (emoji: string) => {
    if (!userId) return;
    await addReaction(message.id, userId, emoji);
    setShowReactionPicker(false);
  };

  // Group reactions by emoji
  const reactionGroups = EMOJI_REACTIONS.map((emoji) => ({
    emoji,
    count: reactions.filter((r) => r.reaction_emoji === emoji).length,
    userReacted: reactions.some((r) => r.reaction_emoji === emoji && r.user_id === userId),
  })).filter((group) => group.count > 0);

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

            {/* Reactions and Actions Section */}
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
              {/* Reactions Container */}
              <div className="flex gap-2 items-center flex-shrink-0">
                {reactionGroups.map((group) => (
                  <button
                    key={group.emoji}
                    onClick={() => handleReaction(group.emoji)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                      group.userReacted
                        ? 'bg-teal-100 text-teal-700 border border-teal-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-xs font-medium">{group.count}</span>
                  </button>
                ))}
              </div>
              
              {/* View Thread Button */}
              {onThreadClick && (
                <button
                  onClick={() => onThreadClick(message.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-full transition-colors border border-blue-200 hover:border-blue-400 whitespace-nowrap flex-shrink-0"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Thread</span>
                </button>
              )}
              
              {/* Reaction Picker Button */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowReactionPicker(!showReactionPicker)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700 active:bg-gray-200"
                  title="Add reaction"
                >
                  <SmilePlus className="w-5 h-5" />
                </button>
                
                {showReactionPicker && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-1 z-20 min-w-max">
                    {EMOJI_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          handleReaction(emoji);
                          setShowReactionPicker(false);
                        }}
                        className="text-lg hover:scale-125 transition-transform p-1 hover:bg-gray-100 rounded"
                        title={`React with ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageCard;

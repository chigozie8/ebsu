import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FirebaseCommunityReply as CommunityReply } from '../../hooks/useCommunity';
import { MoreHorizontal, Trash2, Edit2 } from 'lucide-react';

interface ReplyCardProps {
  reply: CommunityReply;
  isOwn: boolean;
  isAdmin?: boolean;
  onDelete: (replyId: string) => void;
  onEdit: (replyId: string, newReply: string) => void;
}

const ReplyCard: React.FC<ReplyCardProps> = ({
  reply,
  isOwn,
  isAdmin = false,
  onDelete,
  onEdit,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(reply.reply);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuBtnRef.current && menuBtnRef.current.contains(e.target as Node)) return;
      setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const openMenu = () => {
    if (!menuBtnRef.current) return;
    const rect = menuBtnRef.current.getBoundingClientRect();
    const menuWidth = 160;
    let left = rect.right - menuWidth;
    let top = rect.bottom + 4;
    if (left < 8) left = 8;
    if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;
    if (top + 120 > window.innerHeight - 16) top = rect.top - 120 - 4;
    setMenuPos({ top, left });
    setShowMenu(true);
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
    if (editText.trim() && editText !== reply.reply) {
      onEdit(reply.id, editText);
      setEditing(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-100 hover:border-teal-200 transition-all">
      <div className="p-3">
        <div className="flex gap-3">
          {reply.user_avatar ? (
            <img
              src={reply.user_avatar}
              alt={reply.user_name}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
              {reply.user_name.charAt(0)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">{reply.user_name}</p>
                <p className="text-xs text-gray-500">{getTimeAgo(reply.created_at)}</p>
                {reply.is_edited && <p className="text-xs text-gray-400">(edited)</p>}
              </div>
              {(isOwn || isAdmin) && (
                <button
                  ref={menuBtnRef}
                  onClick={openMenu}
                  className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>

            {editing ? (
              <div className="mt-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-3 py-2 border border-teal-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={2}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleEditSubmit}
                    className="px-3 py-1 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setEditText(reply.reply);
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-700 break-words">{reply.reply}</p>
            )}
          </div>
        </div>

        {showMenu && createPortal(
          <div
            className="fixed z-[9998] bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden"
            style={{ top: menuPos.top, left: menuPos.left, minWidth: 160 }}
            onClick={(e) => e.stopPropagation()}
          >
            {isOwn && (
              <button
                onClick={() => {
                  setEditing(true);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 transition-colors"
              >
                <Edit2 className="w-4 h-4 text-gray-500" />
                Edit
              </button>
            )}
            <button
              onClick={() => {
                onDelete(reply.id);
                setShowMenu(false);
              }}
              className="w-full px-4 py-3 text-left text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

export default ReplyCard;

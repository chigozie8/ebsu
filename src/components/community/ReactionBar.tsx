import React, { useState } from 'react';
import { CommunityReaction } from '../../lib/supabase';
import { SmilePlus } from 'lucide-react';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

interface ReactionBarProps {
  reactions: CommunityReaction[];
  currentUserId: string;
  onReact: (emoji: string) => void;
  isOwn: boolean;
}

interface ReactionGroup {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

function groupReactions(reactions: CommunityReaction[], userId: string): ReactionGroup[] {
  const map = new Map<string, { count: number; hasReacted: boolean }>();
  for (const r of reactions) {
    const existing = map.get(r.reaction_emoji);
    if (existing) {
      existing.count++;
      if (r.user_id === userId) existing.hasReacted = true;
    } else {
      map.set(r.reaction_emoji, { count: 1, hasReacted: r.user_id === userId });
    }
  }
  return Array.from(map.entries()).map(([emoji, { count, hasReacted }]) => ({
    emoji,
    count,
    hasReacted,
  }));
}

const ReactionBar: React.FC<ReactionBarProps> = ({ reactions, currentUserId, onReact, isOwn }) => {
  const [showPicker, setShowPicker] = useState(false);
  const groups = groupReactions(reactions, currentUserId);

  return (
    <div className={`flex items-center gap-1 flex-wrap mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {/* Existing reaction pills */}
      {groups.map(({ emoji, count, hasReacted }) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all border ${
            hasReacted
              ? 'bg-teal-100 border-teal-400 text-teal-700'
              : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300 hover:bg-teal-50'
          }`}
        >
          <span>{emoji}</span>
          <span>{count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="p-1 rounded-full text-slate-400 hover:text-teal-500 hover:bg-teal-50 transition-colors"
          title="Add reaction"
        >
          <SmilePlus className="w-3.5 h-3.5" />
        </button>

        {/* Emoji picker popover */}
        {showPicker && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowPicker(false)} />
            <div
              className={`absolute z-20 bottom-full mb-1 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex gap-1 ${
                isOwn ? 'right-0' : 'left-0'
              }`}
            >
              {QUICK_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => { onReact(e); setShowPicker(false); }}
                  className="text-lg hover:scale-125 transition-transform p-0.5 rounded"
                >
                  {e}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReactionBar;

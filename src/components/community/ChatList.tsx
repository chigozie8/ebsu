import React from 'react';
import { Community } from '../../lib/supabase';
import { MessageSquare, Search, ShieldCheck } from 'lucide-react';

const CHANNEL_ICONS: Record<string, string> = {
  All:          '#',
  General:      'G',
  Academics:    'A',
  'Campus Life':'C',
  Tech:         'T',
  Events:       'E',
};

const CHANNEL_COLORS: Record<string, string> = {
  All:          'bg-teal-500',
  General:      'bg-slate-400',
  Academics:    'bg-blue-500',
  'Campus Life':'bg-pink-500',
  Tech:         'bg-emerald-500',
  Events:       'bg-amber-500',
};

const CHANNEL_DESCRIPTIONS: Record<string, string> = {
  All:          'All recent messages',
  General:      'Anything goes',
  Academics:    'Courses & grades',
  'Campus Life':'Life on campus',
  Tech:         'Coding & gadgets',
  Events:       'Upcoming events',
};

interface ChatListProps {
  topics: string[];
  activeChannel: string;
  messages: Community[];
  onChannelSelect: (topic: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onGuidelinesClick: () => void;
}

function getLastMessage(topic: string, messages: Community[]): Community | null {
  const filtered = topic === 'All'
    ? messages
    : messages.filter((m) => m.topic === topic);
  return filtered.length > 0 ? filtered[0] : null;
}

function formatChatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getUnreadCount(topic: string, messages: Community[], userId: string): number {
  // Simple heuristic: messages from others in the last hour
  const cutoff = Date.now() - 3600000;
  const filtered = (topic === 'All' ? messages : messages.filter((m) => m.topic === topic))
    .filter((m) => m.user_id !== userId && new Date(m.created_at).getTime() > cutoff);
  return filtered.length;
}

const ChatList: React.FC<ChatListProps> = ({
  topics,
  activeChannel,
  messages,
  onChannelSelect,
  searchQuery,
  onSearchChange,
  onGuidelinesClick,
}) => {
  const userId = '';

  const filteredTopics = topics.filter((t) =>
    t.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 bg-gradient-to-r from-teal-600 to-teal-500">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm leading-tight">Community</h2>
            <p className="text-teal-100 text-xs">{messages.length} messages</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-teal-300 pointer-events-none" />
          <input
            type="text"
            placeholder="Search channels…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white/20 text-white placeholder-teal-300 rounded-lg text-xs border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
          />
        </div>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto">
        {filteredTopics.map((topic) => {
          const lastMsg = getLastMessage(topic, messages);
          const unread = getUnreadCount(topic, messages, userId);
          const isActive = activeChannel === topic;
          const iconColor = CHANNEL_COLORS[topic] ?? 'bg-teal-500';

          return (
            <button
              key={topic}
              onClick={() => onChannelSelect(topic)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-slate-100 last:border-b-0 ${
                isActive
                  ? 'bg-teal-50 border-l-4 border-l-teal-500'
                  : 'hover:bg-slate-50 border-l-4 border-l-transparent'
              }`}
            >
              {/* Channel icon */}
              <div
                className={`w-10 h-10 ${iconColor} rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-sm`}
              >
                {CHANNEL_ICONS[topic] ?? topic[0]}
              </div>

              {/* Channel info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`font-semibold text-sm truncate ${isActive ? 'text-teal-700' : 'text-slate-800'}`}>
                    {topic}
                  </span>
                  {lastMsg && (
                    <span className="text-xs text-slate-400 flex-shrink-0 ml-1">
                      {formatChatTime(lastMsg.created_at)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs text-slate-400 truncate">
                    {lastMsg
                      ? `${lastMsg.user_name.split(' ')[0]}: ${lastMsg.message.slice(0, 40)}${lastMsg.message.length > 40 ? '…' : ''}`
                      : CHANNEL_DESCRIPTIONS[topic] ?? ''}
                  </p>
                  {unread > 0 && (
                    <span className="flex-shrink-0 min-w-[18px] h-[18px] bg-teal-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={onGuidelinesClick}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-teal-50 hover:text-teal-700 rounded-xl transition-colors"
        >
          <ShieldCheck className="w-4 h-4 text-teal-500 flex-shrink-0" />
          <span className="font-medium">Community Guidelines</span>
        </button>
      </div>
    </div>
  );
};

export default ChatList;

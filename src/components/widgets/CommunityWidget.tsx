import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Heart, MessageSquareMore, Users, CheckCheck } from 'lucide-react';

function toIso(ts: unknown): string {
  if (!ts) return new Date().toISOString();
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

/** Avatar circle with initials fallback */
const Avatar: React.FC<{ name: string; src?: string; size?: string }> = ({ name, src, size = 'w-8 h-8' }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  // Generate a consistent hue from the name
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  if (src) {
    return <img src={src} alt={name} className={`${size} rounded-full object-cover flex-shrink-0 ring-2 ring-white`} />;
  }
  return (
    <div
      className={`${size} rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold ring-2 ring-white`}
      style={{ backgroundColor: `hsl(${hue},55%,45%)` }}
    >
      {initial}
    </div>
  );
};

const BRAND = '#00875a';

const CommunityWidget: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const base = [
      where('is_deleted', '==', false),
      orderBy('created_at', 'desc'),
      limit(6),
    ];
    const filters = selectedTopic !== 'All'
      ? [where('topic', '==', selectedTopic), ...base]
      : base;

    const q = query(collection(db, 'community_messages'), ...filters);

    const unsub = onSnapshot(
      q,
      (snap) => {
        setMessages(
          snap.docs.map((d) => {
            const data = d.data();
            return { ...data, id: d.id, created_at: toIso(data.created_at) };
          })
        );
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [selectedTopic]);

  const topics = ['All', 'General', 'Academics', 'Campus Life', 'Tech', 'Events'];

  const getTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  };

  const topicBadgeColor: Record<string, string> = {
    Academics:    '#dbeafe|#1d4ed8',
    'Campus Life':'#fce7f3|#be185d',
    Tech:         '#dcfce7|#15803d',
    Events:       '#fef9c3|#a16207',
    General:      '#f3f4f6|#4b5563',
  };

  const getBadgeStyle = (topic: string) => {
    const pair = topicBadgeColor[topic] || '#f3f4f6|#4b5563';
    const [bg, color] = pair.split('|');
    return { backgroundColor: bg, color };
  };

  return (
    <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 flex flex-col" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* WhatsApp-style green header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: BRAND }}>
        {/* Group icon */}
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-base leading-tight">Student Community</p>
          <p className="text-green-100 text-xs truncate">Campus discussions</p>
        </div>
        {/* Online indicator */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
          <span className="text-green-100 text-xs">Live</span>
        </div>
      </div>

      {/* Topic filter pills */}
      <div className="flex gap-2 px-3 py-2.5 overflow-x-auto bg-white border-b border-gray-100" style={{ scrollbarWidth: 'none' }}>
        {topics.map((topic) => {
          const active = selectedTopic === topic;
          return (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className="flex-shrink-0 px-3.5 py-1 rounded-full text-xs font-semibold transition-all duration-200"
              style={
                active
                  ? { backgroundColor: BRAND, color: '#fff', boxShadow: '0 2px 8px rgba(0,135,90,0.3)' }
                  : { backgroundColor: '#f3f4f6', color: '#374151' }
              }
            >
              {topic}
            </button>
          );
        })}
      </div>

      {/* Chat window — WhatsApp wallpaper bg */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
        style={{
          minHeight: '240px',
          maxHeight: '300px',
          backgroundColor: '#e5ddd5',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='1.2' fill='%23c8b9a8' fill-opacity='0.4'/%3E%3C/svg%3E")`,
        }}
      >
        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex gap-2 ${i % 2 === 0 ? 'justify-end' : ''}`}>
                {i % 2 !== 0 && <div className="w-7 h-7 rounded-full bg-gray-300 animate-pulse flex-shrink-0" />}
                <div className={`h-12 rounded-2xl animate-pulse ${i % 2 === 0 ? 'w-2/3 bg-green-200' : 'w-3/4 bg-white'}`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 gap-3">
            <div className="w-16 h-16 rounded-full bg-white/60 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 font-medium">No messages yet</p>
            <p className="text-xs text-gray-400">Be the first to start the conversation</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            // Alternate bubble sides for a lively feel
            const isSelf = index % 3 === 0;
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isSelf ? 'justify-end' : 'justify-start'}`}>
                {!isSelf && <Avatar name={msg.user_name || '?'} src={msg.user_avatar} size="w-7 h-7" />}

                {/* Bubble */}
                <div
                  className="max-w-[75%] rounded-2xl px-3 py-2 shadow-sm"
                  style={
                    isSelf
                      ? { backgroundColor: '#dcf8c6', borderBottomRightRadius: '4px' }
                      : { backgroundColor: '#ffffff', borderBottomLeftRadius: '4px' }
                  }
                >
                  {/* Sender name (only for received messages) */}
                  {!isSelf && (
                    <p className="text-xs font-bold mb-0.5" style={{ color: BRAND }}>
                      {msg.user_name}
                    </p>
                  )}

                  {/* Topic badge */}
                  {msg.topic && msg.topic !== 'General' && (
                    <span
                      className="inline-block text-xss font-semibold px-1.5 py-0.5 rounded-full mb-1"
                      style={getBadgeStyle(msg.topic)}
                    >
                      {msg.topic}
                    </span>
                  )}

                  <p className="text-sm text-gray-800 leading-snug line-clamp-3">{msg.message}</p>

                  {/* Footer: reactions + time + ticks */}
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-0.5 text-xss text-gray-500 hover:text-rose-500 transition-colors">
                        <Heart className="w-3 h-3" />
                        <span>{msg.likes_count || 0}</span>
                      </button>
                      <button className="flex items-center gap-0.5 text-xss text-gray-500 hover:text-green-600 transition-colors">
                        <MessageSquareMore className="w-3 h-3" />
                        <span>{msg.reply_count || 0}</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <span className="text-xss text-gray-400">{getTime(msg.created_at)}</span>
                      {isSelf && <CheckCheck className="w-3 h-3 text-blue-500" />}
                    </div>
                  </div>
                </div>

                {isSelf && <Avatar name={msg.user_name || '?'} src={msg.user_avatar} size="w-7 h-7" />}
              </div>
            );
          })
        )}
      </div>

      {/* Tap-to-reply hint bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border-t border-gray-200">
        <div
          className="flex-1 bg-white rounded-full px-4 py-2 text-xs text-gray-400 cursor-pointer border border-gray-200"
          onClick={() => navigate('/u/community')}
        >
          Type a message...
        </div>
        <button
          onClick={() => navigate('/u/community')}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-95"
          style={{ backgroundColor: BRAND }}
        >
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>

      {/* Browse Communities CTA */}
      <button
        onClick={() => navigate('/u/community')}
        className="w-full py-3 text-white font-bold text-sm tracking-wide transition-all duration-200 active:opacity-90"
        style={{ backgroundColor: BRAND }}
      >
        Browse Communities
      </button>
    </div>
  );
};

export default CommunityWidget;

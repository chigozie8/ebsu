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
import { Heart, MessageSquareMore, Users, CheckCheck, UserPlus } from 'lucide-react';

// Static demo messages shown when Firebase has no data yet
const DEMO_MESSAGES = [
  { id: 'd1', user_name: 'Chukwuemeka O.', message: 'Has anyone gotten the updated timetable for this semester? I heard there were changes to the CS department schedule.', topic: 'Academics', created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(), likes_count: 7, reply_count: 3, user_avatar: undefined },
  { id: 'd2', user_name: 'Adaeze N.', message: 'Yes! Check the faculty notice board or the department WhatsApp group. The new one was posted yesterday evening.', topic: 'Academics', created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(), likes_count: 4, reply_count: 1, user_avatar: undefined },
  { id: 'd3', user_name: 'Babatunde K.', message: 'The inter-faculty football match is this Friday by 3pm at the sports complex. Come out and support!', topic: 'Events', created_at: new Date(Date.now() - 1000 * 60 * 22).toISOString(), likes_count: 12, reply_count: 5, user_avatar: undefined },
  { id: 'd4', user_name: 'Ngozi E.', message: 'Anyone know a good spot on campus to study quietly at night? The library closes at 8pm which is too early.', topic: 'Campus Life', created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), likes_count: 9, reply_count: 8, user_avatar: undefined },
  { id: 'd5', user_name: 'Samuel A.', message: 'Try the Engineering faculty reading room, it is usually open till 10pm and quite peaceful. Just bring your ID card.', topic: 'Campus Life', created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), likes_count: 6, reply_count: 2, user_avatar: undefined },
  { id: 'd6', user_name: 'Ifeoma C.', message: 'Reminder that the GST 201 assignment is due next Monday. The topic is on Nigerian Economic History from 1960 to present.', topic: 'General', created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(), likes_count: 15, reply_count: 11, user_avatar: undefined },
];

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
        if (snap.docs.length > 0) {
          setMessages(
            snap.docs.map((d) => {
              const data = d.data();
              return { ...data, id: d.id, created_at: toIso(data.created_at) };
            })
          );
        } else {
          // Show demo messages so the widget always looks populated
          const filtered = selectedTopic === 'All'
            ? DEMO_MESSAGES
            : DEMO_MESSAGES.filter((m) => m.topic === selectedTopic);
          setMessages(filtered);
        }
        setLoading(false);
      },
      () => {
        setMessages(DEMO_MESSAGES);
        setLoading(false);
      }
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

      {/* Input / Join bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border-t border-gray-200">
        <div
          className="flex-1 bg-white rounded-full px-4 py-2 text-xs text-gray-400 cursor-pointer border border-gray-200"
          onClick={() => navigate('/u/community')}
        >
          Type a message...
        </div>
        {/* Join to Post button */}
        <button
          onClick={() => navigate('/u/community')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-white flex-shrink-0 transition-transform active:scale-95 shadow-sm"
          style={{ backgroundColor: BRAND }}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Join to Post
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

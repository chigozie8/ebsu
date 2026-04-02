import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, CheckCheck, Check, Image, X } from 'lucide-react';
import { useGetUserInfo } from '../../../hooks/auth/useGetUserInfo';
import {
  usePrivateMessages,
  useSendPrivateMessage,
  useMarkSeen,
  useTypingIndicator,
  useAnyUserVerification,
} from '../../../hooks/usePrivateChat';
import { PrivateMessage } from '../../../lib/supabase';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

// ── helpers ────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateGroup(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
}

function groupByDate(messages: PrivateMessage[]): { label: string; items: PrivateMessage[] }[] {
  const groups: Record<string, PrivateMessage[]> = {};
  for (const m of messages) {
    const key = new Date(m.created_at).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }
  return Object.entries(groups).map(([, items]) => ({
    label: formatDateGroup(items[0].created_at),
    items,
  }));
}

const AVATAR_COLORS = [
  'from-teal-400 to-cyan-400',
  'from-blue-400 to-indigo-500',
  'from-pink-400 to-rose-500',
  'from-amber-400 to-orange-400',
  'from-emerald-400 to-teal-500',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// ── BlueTick (verification badge) ─────────────────────────────────────────

function BlueTick({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-label="Verified"
      role="img"
      className="flex-shrink-0 inline-block"
    >
      <circle cx="10" cy="10" r="10" fill="#1D9BF0" />
      <path
        d="M5.5 10.5l3 3 6-6"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Tick component (WhatsApp delivery / seen ticks) ────────────────────────

function Tick({ msg, isMine }: { msg: PrivateMessage; isMine: boolean }) {
  if (!isMine) return null;
  if (msg.is_seen)      return <CheckCheck className="w-3.5 h-3.5" style={{ color: '#53bdeb' }} />;
  if (msg.is_delivered) return <CheckCheck className="w-3.5 h-3.5 text-slate-400" />;
  return <Check className="w-3.5 h-3.5 text-slate-400" />;
}

// ── Avatar mini ────────────────────────────────────────────────────────────

function AvatarMini({ name, src, size = 8 }: { name: string; src?: string; size?: number }) {
  const g = getAvatarColor(name);
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  if (src) return <img src={src} alt={name} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`} />;
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br ${g} flex items-center justify-center flex-shrink-0 text-white text-xs font-bold`}>
      {initials}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function PrivateChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const chatId       = searchParams.get('chatId') ?? null;
  const otherIdParam = searchParams.get('otherId') ?? '';
  const otherName    = searchParams.get('otherName') ?? 'User';
  const otherAvatar  = searchParams.get('otherAvatar') ?? undefined;

  const { studentDetails } = useGetUserInfo();
  const myId     = studentDetails?.userID || '';
  const myName   = studentDetails ? `${studentDetails.firstName} ${studentDetails.lastName}`.trim() : 'Me';
  const myAvatar = studentDetails?.profileImageURL || undefined;

  const { messages, loading } = usePrivateMessages(chatId);
  const { send, sending }     = useSendPrivateMessage();
  const { markSeen }          = useMarkSeen();
  const { otherIsTyping, broadcastTyping } = useTypingIndicator(chatId, myId);
  const { verification: otherVerification } = useAnyUserVerification(otherIdParam || null);

  const [draft, setDraft]         = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile]   = useState<File | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherIsTyping]);

  // Mark messages seen on load & new messages
  useEffect(() => {
    if (chatId && myId) markSeen(chatId, myId);
  }, [chatId, myId, messages.length, markSeen]);

  const handleSend = useCallback(async () => {
    if (!chatId || !myId) return;
    const text = draft.trim();
    if (!text && !imageFile) return;

    let imgUrl: string | undefined;

    if (imageFile) {
      setUploadingImg(true);
      try {
        const ext  = imageFile.name.split('.').pop();
        const path = `private_chat/${chatId}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('community-images').upload(path, imageFile, { upsert: true });
        if (!error) {
          const { data: pub } = supabase.storage.from('community-images').getPublicUrl(path);
          imgUrl = pub.publicUrl;
        }
      } catch {
        toast.error('Image upload failed');
      } finally {
        setUploadingImg(false);
      }
    }

    try {
      await send(chatId, myId, myName, text || (imgUrl ? '📷 Image' : ''), myAvatar, imgUrl);
      setDraft('');
      setImageFile(null);
      setImagePreview(null);
    } catch {
      toast.error('Failed to send message. Tap to retry.');
    }
  }, [chatId, myId, myName, myAvatar, draft, imageFile, send]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    broadcastTyping();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const groups = groupByDate(messages);

  const isOtherOnline = otherVerification?.online_status === 'online';
  const isOtherVerified = otherVerification?.is_verified;

  return (
    <div
      className="h-screen flex flex-col font-sans"
      style={{ background: '#e5ddd5' }}
    >
      {/* ── Sticky header ─────────────────────────────────── */}
      <header
        className="flex items-center gap-3 px-4 py-3 sticky top-0 z-30 shadow-sm"
        style={{ background: '#075e54' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <AvatarMini name={otherName} src={otherAvatar} size={10} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-white font-semibold text-sm truncate">{otherName}</span>
            {isOtherVerified && <BlueTick size={15} />}
          </div>
          <p className="text-xs text-green-200 truncate">
            {otherIsTyping ? 'typing…' : isOtherOnline ? 'online' : otherVerification ? `last seen ${
              (() => {
                const s = Math.floor((Date.now() - new Date(otherVerification.last_seen).getTime()) / 1000);
                if (s < 60) return 'just now';
                if (s < 3600) return `${Math.floor(s / 60)}m ago`;
                return `${Math.floor(s / 3600)}h ago`;
              })()
            }` : ''}
          </p>
        </div>
      </header>

      {/* ── Messages area ─────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23a0aec0' fill-opacity='0.07'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-teal-500/40 border-t-teal-500 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <div className="w-16 h-16 bg-white/60 rounded-full flex items-center justify-center mb-2">
              <AvatarMini name={otherName} src={otherAvatar} size={12} />
            </div>
            <p className="text-slate-600 font-semibold">Start a conversation with {otherName}</p>
            <p className="text-slate-400 text-sm">Messages are end-to-end via EBSU Community</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-3">
                <span className="bg-white/70 text-slate-500 text-xs px-3 py-1 rounded-full shadow-sm">
                  {group.label}
                </span>
              </div>

              {group.items.map((msg) => {
                const isMine = msg.sender_id === myId;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 mb-1.5 ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMine && (
                      <AvatarMini name={msg.sender_name} src={msg.sender_avatar} size={7} />
                    )}

                    <div
                      className={`max-w-[75%] sm:max-w-[60%] rounded-2xl px-3.5 py-2 shadow-sm relative ${
                        isMine
                          ? 'bg-[#dcf8c6] rounded-br-sm'
                          : 'bg-white rounded-bl-sm'
                      }`}
                    >
                      {/* Image attachment */}
                      {msg.image_url && (
                        <img
                          src={msg.image_url}
                          alt="attachment"
                          className="rounded-xl max-h-52 w-full object-cover mb-1.5 border border-black/5"
                          onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                        />
                      )}

                      {/* Text */}
                      {msg.content && msg.content !== '📷 Image' && (
                        <p className="text-[0.875rem] text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      )}

                      {/* Time + ticks */}
                      <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-end'}`}>
                        <span className="text-[0.65rem] text-slate-400">{formatTime(msg.created_at)}</span>
                        <Tick msg={msg} isMine={isMine} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {/* Typing bubble */}
        {otherIsTyping && (
          <div className="flex items-end gap-2 justify-start mb-1.5">
            <AvatarMini name={otherName} src={otherAvatar} size={7} />
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Image preview bar ─────────────────────────────── */}
      {imagePreview && (
        <div className="px-4 py-2 bg-white border-t border-slate-200 flex items-center gap-3">
          <div className="relative">
            <img src={imagePreview} alt="preview" className="h-16 w-16 object-cover rounded-xl border border-slate-200" />
            <button
              onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-slate-500 flex-1">Image ready to send</p>
        </div>
      )}

      {/* ── Input bar ─────────────────────────────────────── */}
      <div
        className="px-3 py-3 flex items-end gap-2 sticky bottom-0 z-20"
        style={{ background: '#f0f0f0' }}
      >
        {/* Image upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImg}
          className="p-2.5 bg-white rounded-full shadow-sm hover:bg-slate-100 transition-colors text-slate-500 disabled:opacity-50 flex-shrink-0"
        >
          {uploadingImg ? (
            <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Image className="w-5 h-5" />
          )}
        </button>

        {/* Text area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm flex items-end px-4 py-2.5 border border-slate-200">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={onTyping}
            onKeyDown={onKeyDown}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 resize-none outline-none text-sm text-slate-800 placeholder-slate-400 bg-transparent leading-relaxed max-h-32"
            style={{ minHeight: '20px' }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sending || uploadingImg || (!draft.trim() && !imageFile)}
          className="p-3 rounded-full text-white shadow-md transition-all disabled:opacity-50 active:scale-95 flex-shrink-0"
          style={{ background: '#075e54' }}
        >
          {sending ? (
            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}

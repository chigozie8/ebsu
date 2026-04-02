import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, MessageCircle, Clock, User } from 'lucide-react';
import { useAnyUserVerification } from '../../hooks/usePrivateChat';

interface ProfileModalProps {
  targetUserId: string;
  targetUserName: string;
  targetUserAvatar?: string;
  viewerUserId: string;
  onMessage: () => void;
  onClose: () => void;
}

// ── helpers ────────────────────────────────────────────────────────────────

function timeAgoFromISO(iso?: string): string {
  if (!iso) return 'Unknown';
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const AVATAR_COLORS = [
  'from-teal-400 to-cyan-400',
  'from-blue-400 to-indigo-500',
  'from-pink-400 to-rose-500',
  'from-amber-400 to-orange-400',
  'from-emerald-400 to-teal-400',
  'from-purple-400 to-violet-500',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/** WhatsApp-style filled blue verification tick */
function BlueTick({ size = 18 }: { size?: number }) {
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

// ── CSS keyframe styles injected once ─────────────────────────────────────

const STYLE_ID = 'profile-modal-styles';
function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes pm-overlay-in  { from { opacity: 0 } to   { opacity: 1 } }
    @keyframes pm-overlay-out { from { opacity: 1 } to   { opacity: 0 } }
    @keyframes pm-card-in     { from { opacity: 0; transform: scale(0.88) translateY(16px) } to { opacity: 1; transform: scale(1) translateY(0) } }
    @keyframes pm-card-out    { from { opacity: 1; transform: scale(1)    translateY(0)    } to { opacity: 0; transform: scale(0.88) translateY(12px) } }

    .pm-overlay-enter { animation: pm-overlay-in  220ms cubic-bezier(0.22,1,0.36,1) forwards; }
    .pm-overlay-exit  { animation: pm-overlay-out 180ms cubic-bezier(0.55,0,1,0.45) forwards; }
    .pm-card-enter    { animation: pm-card-in     260ms cubic-bezier(0.22,1,0.36,1) forwards; }
    .pm-card-exit     { animation: pm-card-out    200ms cubic-bezier(0.55,0,1,0.45) forwards; }
  `;
  document.head.appendChild(style);
}

// ── Component ──────────────────────────────────────────────────────────────

const ProfileModal: React.FC<ProfileModalProps> = ({
  targetUserId,
  targetUserName,
  targetUserAvatar,
  viewerUserId,
  onMessage,
  onClose,
}) => {
  injectStyles();

  const { verification, loading } = useAnyUserVerification(targetUserId);
  const overlayRef = useRef<HTMLDivElement>(null);

  // "closing" state drives the exit animation before the parent unmounts
  const [closing, setClosing] = useState(false);

  const triggerClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 200); // match pm-card-out duration
  }, [closing, onClose]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') triggerClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [triggerClose]);

  const isOnline     = verification?.online_status === 'online';
  const isVerified   = verification?.is_verified;
  const avatarGrad   = getAvatarColor(targetUserName);
  const initials     = targetUserName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const isSelf       = targetUserId === viewerUserId;

  return (
    /* Overlay */
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 ${closing ? 'pm-overlay-exit' : 'pm-overlay-enter'}`}
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(5px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) triggerClose(); }}
    >
      {/* Card */}
      <div
        className={`bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden ${closing ? 'pm-card-exit' : 'pm-card-enter'}`}
      >
        {/* Coloured banner */}
        <div className={`h-28 bg-gradient-to-br ${avatarGrad} relative flex-shrink-0`}>
          <button
            onClick={triggerClose}
            className="absolute top-3 right-3 p-1.5 bg-black/20 hover:bg-black/30 active:bg-black/40 rounded-full text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Drag handle (mobile) */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/30 rounded-full sm:hidden" />
        </div>

        {/* Body */}
        <div className="px-5 pb-6">
          {/* Avatar row */}
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="relative">
              {targetUserAvatar ? (
                <img
                  src={targetUserAvatar}
                  alt={targetUserName}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-lg"
                />
              ) : (
                <div
                  className={`w-24 h-24 rounded-full bg-gradient-to-br ${avatarGrad} flex items-center justify-center ring-4 ring-white shadow-lg text-white text-2xl font-bold`}
                >
                  {initials}
                </div>
              )}
              {/* Online indicator */}
              <span
                className={`absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full border-2 border-white transition-colors ${
                  isOnline ? 'bg-emerald-400' : 'bg-slate-300'
                }`}
              />
            </div>

            {/* Verified chip (top-right of avatar row) */}
            {isVerified && (
              <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full mb-2 mr-1 self-end">
                <BlueTick size={13} />
                Verified
              </div>
            )}
          </div>

          {/* Name + blue tick */}
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900 leading-tight truncate">{targetUserName}</h2>
            {isVerified && <BlueTick size={18} />}
          </div>

          {/* Online status */}
          <div className="flex items-center gap-1.5 text-xs mb-4">
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-600 font-semibold">Online now</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">Last seen {timeAgoFromISO(verification?.last_seen)}</span>
              </>
            )}
          </div>

          {/* Bio */}
          {loading ? (
            <div className="h-9 w-full bg-slate-100 animate-pulse rounded-xl mb-4" />
          ) : verification?.bio ? (
            <p className="text-sm text-slate-600 leading-relaxed mb-4 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
              {verification.bio}
            </p>
          ) : (
            <p className="text-sm text-slate-400 italic mb-4">No bio yet.</p>
          )}

          {/* Verified notice */}
          {isVerified && (
            <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 mb-5">
              <BlueTick size={14} />
              <span>This account is verified as an EBSU student</span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-slate-100 mb-5" />

          {/* Action */}
          {!isSelf ? (
            <button
              onClick={onMessage}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#075e54] hover:bg-[#064e46] active:bg-[#053e38] text-white font-semibold rounded-xl transition-colors text-sm shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              Send Message
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-500 rounded-xl text-sm">
              <User className="w-4 h-4" />
              This is your profile
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;

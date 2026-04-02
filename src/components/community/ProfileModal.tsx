import React, { useEffect, useRef } from 'react';
import { X, MessageCircle, CheckCircle, Clock, User } from 'lucide-react';
import { useAnyUserVerification } from '../../hooks/usePrivateChat';

interface ProfileModalProps {
  /** The user whose profile is being shown */
  targetUserId: string;
  targetUserName: string;
  targetUserAvatar?: string;
  /** Current viewer (used to decide if "Message" makes sense) */
  viewerUserId: string;
  /** Called when the user clicks "Message" */
  onMessage: () => void;
  onClose: () => void;
}

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

const ProfileModal: React.FC<ProfileModalProps> = ({
  targetUserId,
  targetUserName,
  targetUserAvatar,
  viewerUserId,
  onMessage,
  onClose,
}) => {
  const { verification, loading } = useAnyUserVerification(targetUserId);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const isOnline   = verification?.online_status === 'online';
  const avatarGrad = getAvatarColor(targetUserName);
  const initials   = targetUserName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const isSelf     = targetUserId === viewerUserId;

  return (
    /* Overlay */
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Card */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ animationDuration: '150ms' }}
      >
        {/* Header banner */}
        <div className={`h-24 bg-gradient-to-br ${avatarGrad} relative`}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 bg-black/20 hover:bg-black/30 rounded-full text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Avatar (overlapping banner) */}
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              {targetUserAvatar ? (
                <img
                  src={targetUserAvatar}
                  alt={targetUserName}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-md"
                />
              ) : (
                <div
                  className={`w-20 h-20 rounded-full bg-gradient-to-br ${avatarGrad} flex items-center justify-center ring-4 ring-white shadow-md text-white text-2xl font-bold`}
                >
                  {initials}
                </div>
              )}
              {/* Online dot */}
              <span
                className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-400' : 'bg-slate-300'}`}
              />
            </div>
          </div>

          {/* Name + badge */}
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-slate-900 leading-tight">{targetUserName}</h2>
            {verification?.is_verified && (
              <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0" strokeWidth={2.5} />
            )}
          </div>

          {/* Online / last seen */}
          <div className="flex items-center gap-1.5 text-xs mb-3">
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-600 font-medium">Online</span>
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
            <div className="h-4 w-3/4 bg-slate-100 animate-pulse rounded mb-3" />
          ) : verification?.bio ? (
            <p className="text-sm text-slate-600 leading-relaxed mb-4 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
              {verification.bio}
            </p>
          ) : (
            <p className="text-sm text-slate-400 italic mb-4">No bio yet.</p>
          )}

          {/* Verified badge notice */}
          {verification?.is_verified && (
            <div className="flex items-center gap-2 text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2 mb-4">
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
              Verified EBSU student
            </div>
          )}

          {/* Actions */}
          {!isSelf && (
            <button
              onClick={onMessage}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-colors text-sm shadow-md shadow-teal-100"
            >
              <MessageCircle className="w-4 h-4" />
              Message
            </button>
          )}

          {isSelf && (
            <div className="flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-sm">
              <User className="w-4 h-4" />
              This is you
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;

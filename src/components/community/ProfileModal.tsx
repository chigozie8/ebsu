import React, { useEffect } from 'react';
import { X, MessageCircle, Clock, Wifi, WifiOff } from 'lucide-react';
import { useUserProfile } from '../../hooks/useDirectMessages';
import VerifiedBadge from './VerifiedBadge';

interface ProfileModalProps {
  targetUserId: string;
  targetUserName: string;
  targetUserAvatar?: string;
  currentUserId: string;
  onClose: () => void;
  onMessageClick: (targetId: string, targetName: string) => void;
}

const AVATAR_COLORS = [
  'from-teal-400 to-cyan-400',
  'from-blue-400 to-indigo-400',
  'from-pink-400 to-rose-400',
  'from-amber-400 to-orange-400',
  'from-emerald-400 to-teal-400',
];
function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}
function formatLastSeen(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  targetUserId,
  targetUserName,
  targetUserAvatar,
  currentUserId,
  onClose,
  onMessageClick,
}) => {
  const { profile, loading } = useUserProfile(targetUserId);

  const isSelf = targetUserId === currentUserId;
  const displayAvatar = profile?.avatar_url || targetUserAvatar;
  const gradientClass = getAvatarColor(targetUserName);
  const initials = getInitials(targetUserName);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="wa-modal bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* ── Top banner ────────────────────────────────────────── */}
        <div
          className="relative h-24 flex items-end px-5 pb-0"
          style={{ background: 'linear-gradient(135deg, #128C7E 0%, #25D366 100%)' }}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          {/* Avatar — overlaps the banner */}
          <div className="translate-y-1/2 relative">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={targetUserName}
                crossOrigin="anonymous"
                className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-lg"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white shadow-lg`}>
                {initials}
              </div>
            )}
            {/* Online dot */}
            {profile?.is_online && (
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-[#25D366] rounded-full border-2 border-white" />
            )}
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────── */}
        <div className="pt-14 pb-6 px-5">
          {loading ? (
            <div className="space-y-2">
              <div className="wa-skeleton h-5 w-36 rounded" />
              <div className="wa-skeleton h-3.5 w-24 rounded" />
              <div className="wa-skeleton h-3 w-full rounded mt-4" />
            </div>
          ) : (
            <>
              {/* Name + verified */}
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-[#111b21] leading-tight">
                  {profile?.display_name || targetUserName}
                </h2>
                {profile?.is_verified && <VerifiedBadge size="md" />}
              </div>

              {/* Online / last seen */}
              <div className="flex items-center gap-1.5 mt-1">
                {profile?.is_online ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-[#25D366]" />
                    <span className="text-xs font-semibold text-[#25D366]">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-[#8696a0]" />
                    <span className="text-xs text-[#8696a0]">
                      {profile?.last_seen ? `Last seen ${formatLastSeen(profile.last_seen)}` : 'Offline'}
                    </span>
                  </>
                )}
              </div>

              {/* Bio */}
              {profile?.bio && (
                <div className="mt-4 p-3 bg-[#f0fdf4] rounded-xl border border-[#25D366]/20">
                  <p className="text-xs font-semibold text-[#128C7E] uppercase mb-1">About</p>
                  <p className="text-sm text-[#111b21] leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {/* Last seen display */}
              {profile?.last_seen && (
                <div className="flex items-center gap-1.5 mt-3">
                  <Clock className="w-3.5 h-3.5 text-[#8696a0]" />
                  <span className="text-xs text-[#8696a0]">
                    Member since {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              )}

              {/* CTA */}
              {!isSelf && (
                <button
                  onClick={() => onMessageClick(targetUserId, profile?.display_name || targetUserName)}
                  className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #128C7E 0%, #25D366 100%)' }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;

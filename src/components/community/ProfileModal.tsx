import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, MessageCircle, CheckCircle, Clock, User, Shield, Loader2, Pencil, Check } from 'lucide-react';
import { useAnyUserVerification, useUserVerification } from '../../hooks/usePrivateChat';
import VerifiedBadge from './VerifiedBadge';

interface ProfileModalProps {
  targetUserId: string;
  targetUserName: string;
  targetUserAvatar?: string;
  viewerUserId: string;
  onMessage: () => void;
  onClose: () => void;
  currentUserId?: string;
  onMessageClick?: (userId: string, userName: string) => void;
}

function lastSeenText(iso?: string): string {
  if (!iso) return 'a while ago';
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 10)  return 'just now';
  if (seconds < 60)  return `${seconds}s ago`;
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) > 1 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

const AVATAR_COLORS: [string, string][] = [
  ['#00897b', '#26a69a'],
  ['#1976d2', '#42a5f5'],
  ['#e91e63', '#f06292'],
  ['#f57c00', '#ffb74d'],
  ['#388e3c', '#66bb6a'],
  ['#7b1fa2', '#ba68c8'],
];

function getAvatarGradient(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  targetUserId,
  targetUserName,
  targetUserAvatar,
  viewerUserId,
  onMessage,
  onClose,
  currentUserId,
  onMessageClick,
}) => {
  const { verification, loading } = useAnyUserVerification(targetUserId);
  const { upsertVerification } = useUserVerification(viewerUserId);

  const overlayRef = useRef<HTMLDivElement>(null);
  const [imageError, setImageError] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [savingBio, setSavingBio] = useState(false);

  const isSelf = targetUserId === viewerUserId || targetUserId === currentUserId;

  // Populate bio text from verification data
  useEffect(() => {
    if (verification?.bio) setBioText(verification.bio);
    else if (isSelf) setBioText('');
  }, [verification?.bio, isSelf]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 150);
  };

  const handleSaveBio = useCallback(async () => {
    setSavingBio(true);
    try {
      await upsertVerification(viewerUserId, targetUserName, targetUserAvatar, bioText.trim() || 'Student');
      setEditingBio(false);
    } catch (err) {
      console.error('[v0] Bio save error:', err);
    } finally {
      setSavingBio(false);
    }
  }, [viewerUserId, targetUserName, targetUserAvatar, bioText, upsertVerification]);

  const isOnline   = verification?.online_status === 'online';
  const isVerified = verification?.is_verified;
  const displayBio = verification?.bio || (isSelf ? '' : 'Student');
  const [g0, g1] = getAvatarGradient(targetUserName);
  const initials  = getInitials(targetUserName);

  const handleMessageClick = () => {
    if (onMessageClick) onMessageClick(targetUserId, targetUserName);
    else onMessage();
  };

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-150 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        style={{
          animation: isClosing ? 'none' : 'wa-modal-in 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Banner */}
        <div
          className="h-28 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${g0} 0%, ${g1} 100%)` }}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-1.5 bg-black/20 hover:bg-black/30 rounded-full text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="relative">
              {targetUserAvatar && !imageError ? (
                <img
                  src={targetUserAvatar}
                  alt={targetUserName}
                  crossOrigin="anonymous"
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-lg"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center ring-4 ring-white shadow-lg text-white text-2xl font-bold"
                  style={{ background: `linear-gradient(135deg, ${g0}, ${g1})` }}
                >
                  {initials}
                </div>
              )}
              <span
                className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-white ${
                  isOnline ? 'bg-[#25D366]' : 'bg-slate-300'
                }`}
                style={{ borderWidth: 3 }}
              />
            </div>

            {isVerified && (
              <div className="flex items-center gap-1.5 bg-[#e8f5fe] px-3 py-1.5 rounded-full">
                <CheckCircle className="w-4 h-4 text-[#53bdeb]" strokeWidth={2.5} />
                <span className="text-xs font-semibold text-[#0b93d5]">Verified</span>
              </div>
            )}
          </div>

          {/* Name */}
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-xl font-bold text-slate-900 leading-tight">{targetUserName}</h2>
            {isVerified && <VerifiedBadge size="sm" />}
          </div>

          {/* Online / last seen */}
          <div className="flex items-center gap-1.5 text-sm mb-3">
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
            ) : isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                <span className="text-[#25D366] font-medium">Online now</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">
                  Last seen {lastSeenText(verification?.last_seen)}
                </span>
              </>
            )}
          </div>

          {/* Bio section */}
          <div className="mb-4">
            {loading ? (
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-slate-100 rounded animate-pulse" />
              </div>
            ) : isSelf ? (
              <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                {editingBio ? (
                  <div className="space-y-2">
                    <textarea
                      value={bioText}
                      onChange={(e) => setBioText(e.target.value)}
                      placeholder="Tell others about yourself..."
                      maxLength={160}
                      rows={3}
                      className="w-full text-sm text-slate-700 bg-white border border-[#25D366]/50 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 leading-relaxed"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => { setEditingBio(false); setBioText(verification?.bio || ''); }}
                        className="text-xs text-slate-400 px-3 py-1 rounded-lg hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveBio}
                        disabled={savingBio}
                        className="flex items-center gap-1 text-xs text-white px-3 py-1.5 rounded-lg font-semibold disabled:opacity-60"
                        style={{ background: '#25D366' }}
                      >
                        {savingBio ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-slate-600 leading-relaxed flex-1">
                      {displayBio || 'Tap the pencil to add a bio'}
                    </p>
                    <button
                      onClick={() => setEditingBio(true)}
                      className="p-1.5 rounded-full hover:bg-slate-200 transition-colors flex-shrink-0"
                      aria-label="Edit bio"
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                <p className="text-sm text-slate-600 leading-relaxed">{displayBio}</p>
              </div>
            )}
          </div>

          {/* Verified notice */}
          {isVerified && (
            <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#e8f5fe] to-[#f0fdf4] border border-[#bce8f1] rounded-xl px-4 py-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#53bdeb]/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-[#53bdeb]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0b93d5]">Verified EBSU Student</p>
                <p className="text-xs text-slate-500">Identity confirmed by admin</p>
              </div>
            </div>
          )}

          {/* Action */}
          {!isSelf ? (
            <button
              onClick={handleMessageClick}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-[#25D366]/25 active:scale-[0.98]"
            >
              <MessageCircle className="w-5 h-5" />
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

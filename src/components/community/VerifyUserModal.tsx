import React, { useState, useRef } from 'react';
import { X, Search, Loader2, CheckCircle2, ShieldOff, Shield, Mail, AlertCircle } from 'lucide-react';
import { useVerifyByEmail, VerifyByEmailResult } from '../../hooks/usePrivateChat';
import VerifiedBadge from './VerifiedBadge';

interface VerifyUserModalProps {
  adminId: string;
  onClose: () => void;
}

const VerifyUserModal: React.FC<VerifyUserModalProps> = ({ adminId, onClose }) => {
  const [email, setEmail]       = useState('');
  const [result, setResult]     = useState<VerifyByEmailResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [success, setSuccess]   = useState<'verified' | 'revoked' | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const { findByEmail, verifyUser, revokeVerification, searching, verifying } = useVerifyByEmail();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setResult(null);
    setNotFound(false);
    setSuccess(null);
    setAvatarError(false);

    const found = await findByEmail(email.trim());
    if (found) {
      setResult(found);
    } else {
      setNotFound(true);
    }
  };

  const handleVerify = async () => {
    if (!result) return;
    const ok = await verifyUser(result, adminId);
    if (ok) {
      setResult((prev) => prev ? { ...prev, is_verified: true } : prev);
      setSuccess('verified');
    }
  };

  const handleRevoke = async () => {
    if (!result) return;
    const ok = await revokeVerification(result.userId);
    if (ok) {
      setResult((prev) => prev ? { ...prev, is_verified: false } : prev);
      setSuccess('revoked');
    }
  };

  const initials = result
    ? result.userName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '';

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ background: '#075e54' }}
        >
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-white" />
            <h2 className="text-white font-bold text-base">Verify User by Email</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Email search form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-[#075e54]/20 focus-within:border-[#075e54]/40 transition-all">
              <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setNotFound(false); setResult(null); setSuccess(null); }}
                placeholder="Enter student email..."
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!email.trim() || searching}
              className="flex items-center justify-center w-11 h-11 rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#075e54' }}
            >
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          </form>

          {/* Not found state */}
          {notFound && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-600">No student found with that email address.</p>
            </div>
          )}

          {/* Result card */}
          {result && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              {/* User info */}
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50">
                {result.userAvatar && !avatarError ? (
                  <img
                    src={result.userAvatar}
                    alt={result.userName}
                    crossOrigin="anonymous"
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm ring-2 ring-white shadow"
                    style={{ background: '#128C7E' }}
                  >
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-slate-900 text-sm truncate">{result.userName}</p>
                    {result.is_verified && <VerifiedBadge size="sm" />}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{result.email}</p>
                </div>
              </div>

              {/* Status + action */}
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  {result.is_verified ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#53bdeb]" />
                      <span className="text-sm font-medium text-[#0b93d5]">Verified</span>
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                      <span className="text-sm text-slate-500">Not verified</span>
                    </>
                  )}
                </div>

                {result.is_verified ? (
                  <button
                    onClick={handleRevoke}
                    disabled={verifying}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
                  >
                    {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldOff className="w-3 h-3" />}
                    Revoke
                  </button>
                ) : (
                  <button
                    onClick={handleVerify}
                    disabled={verifying}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-50"
                    style={{ background: '#075e54' }}
                  >
                    {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
                    Verify
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Success feedback */}
          {success && (
            <div
              className={`flex items-center gap-2.5 rounded-xl px-4 py-3 border ${
                success === 'verified'
                  ? 'bg-[#e8f5fe] border-[#bce8f1]'
                  : 'bg-orange-50 border-orange-200'
              }`}
            >
              {success === 'verified' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#53bdeb] flex-shrink-0" />
                  <p className="text-sm font-medium text-[#0b93d5]">
                    User successfully verified. The blue badge will now appear on their profile.
                  </p>
                </>
              ) : (
                <>
                  <ShieldOff className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <p className="text-sm font-medium text-orange-700">
                    Verification revoked. The badge has been removed.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Help text */}
          <p className="text-xs text-slate-400 text-center">
            Enter the exact email address used during registration.
            Verified users display a blue checkmark badge across all community features.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyUserModal;

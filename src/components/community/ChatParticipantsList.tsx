import React from 'react';
import { Users, Loader2 } from 'lucide-react';
import { ChatParticipant, useChatParticipants } from '../../hooks/usePrivateChat';
import VerifiedBadge from './VerifiedBadge';

interface ChatParticipantsListProps {
  chatId: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ChatParticipantsList - Displays active participants in a P2P chat
 * Shows online status, verification badges, and participant info
 */
const ChatParticipantsList: React.FC<ChatParticipantsListProps> = ({
  chatId,
  isOpen,
  onClose,
}) => {
  const { participants, loading, error } = useChatParticipants(chatId);

  if (!isOpen) return null;

  // Overlay with modal
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end z-40 md:items-center md:justify-end"
      onClick={onClose}
    >
      <div
        className="bg-white w-full md:w-80 rounded-t-3xl md:rounded-2xl shadow-2xl p-4 max-h-[80dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#075E54]" />
            <h2 className="text-lg font-bold text-[#111b21]">
              {participants.length} {participants.length === 1 ? 'Participant' : 'Participants'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#075E54]" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-700">Error loading participants: {error}</p>
          </div>
        )}

        {/* Participants list */}
        {!loading && participants.length > 0 && (
          <div className="space-y-3">
            {participants.map((participant) => (
              <ParticipantCard key={participant.id} participant={participant} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && participants.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="w-12 h-12 text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No participants</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * ParticipantCard - Individual participant display component
 */
const ParticipantCard: React.FC<{ participant: ChatParticipant }> = ({ participant }) => {
  const initials = participant.user_name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {participant.user_avatar ? (
          <img
            src={participant.user_avatar}
            alt={participant.user_name}
            crossOrigin="anonymous"
            className="w-12 h-12 rounded-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
            {initials}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-[#111b21] truncate">
            {participant.user_name}
          </p>
          {participant.is_verified && <VerifiedBadge size="xs" />}
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Last seen {new Date(participant.last_seen).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
};

export default ChatParticipantsList;

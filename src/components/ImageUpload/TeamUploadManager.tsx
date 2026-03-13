import { useState } from 'react';
import { ImageUploadModal } from './ImageUploadModal';

interface TeamMember {
  id: string;
  name: string;
  image: string;
  role: string;
}

interface TeamUploadManagerProps {
  members: TeamMember[];
  teamType: 'executive' | 'classRep' | 'press';
  teamName: string;
  onImageUpdate: (memberId: string, newImageUrl: string) => void;
}

export function TeamUploadManager({
  members,
  teamType,
  teamName,
  onImageUpdate,
}: TeamUploadManagerProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedMember = members.find(m => m.id === selectedMemberId);

  const openUploadModal = (memberId: string) => {
    setSelectedMemberId(memberId);
    setIsModalOpen(true);
  };

  const handleUploadSuccess = (imageUrl: string) => {
    if (selectedMemberId) {
      onImageUpdate(selectedMemberId, imageUrl);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">{teamName} Image Management</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map(member => (
          <div
            key={member.id}
            className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-md p-5 hover:shadow-xl transition-all duration-300 border border-gray-200"
          >
            <div className="relative mb-4 bg-gray-200 rounded-lg overflow-hidden h-48 flex items-center justify-center">
              {member.image ? (
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23e5e7eb%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2216%22 fill=%22%239ca3af%22%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
              ) : (
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 text-sm">No image</p>
                </div>
              )}
              <button
                onClick={() => openUploadModal(member.id)}
                className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100"
              >
                <span className="bg-green2 hover:bg-green1 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                  Change Photo
                </span>
              </button>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-gray-900 text-lg text-balance">{member.name}</h3>
              <p className="text-sm text-gray-600 font-medium">{member.role}</p>
            </div>
          </div>
        ))}
      </div>

      {selectedMember && (
        <ImageUploadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUploadSuccess={handleUploadSuccess}
          memberId={selectedMemberId!}
          teamType={teamType}
          memberName={selectedMember.name}
        />
      )}
    </div>
  );
}

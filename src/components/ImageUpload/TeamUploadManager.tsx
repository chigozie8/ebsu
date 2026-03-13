import React, { useState } from 'react';
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map(member => (
          <div
            key={member.id}
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
          >
            <div className="relative mb-3">
              <img
                src={member.image}
                alt={member.name}
                className="w-full h-40 object-cover rounded-lg"
              />
              <button
                onClick={() => openUploadModal(member.id)}
                className="absolute bottom-2 right-2 bg-green2 text-white p-2 rounded-lg hover:bg-green1 transition text-sm font-medium"
              >
                Change Photo
              </button>
            </div>
            <h3 className="font-bold text-gray-900">{member.name}</h3>
            <p className="text-sm text-gray-600">{member.role}</p>
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

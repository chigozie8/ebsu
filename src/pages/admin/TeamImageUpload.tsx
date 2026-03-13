import React, { useState } from 'react';
import { TeamUploadManager } from '../../components/ImageUpload/TeamUploadManager';
import { presidentData, executiveMembers } from '../../data/teams/executive';
import { classReps } from '../../data/students/classReps';
import { editorInChief, pressMembers } from '../../data/teams/press';

// Convert data to match interface
const executiveTeamData = [
  { 
    id: 'president', 
    name: presidentData.name, 
    image: presidentData.image, 
    role: presidentData.title 
  },
  ...executiveMembers.map((member, idx) => ({
    id: `exec-${idx}`,
    name: member.name,
    image: member.image,
    role: member.title,
  })),
];

const classRepsData = classReps.map((rep, idx) => ({
  id: `classrep-${idx}`,
  name: rep.name,
  image: rep.img,
  role: rep.title,
}));

const pressTeamData = [
  {
    id: 'editor-in-chief',
    name: editorInChief.name,
    image: editorInChief.image,
    role: editorInChief.role,
  },
  ...pressMembers.map((member, idx) => ({
    id: `press-${idx}`,
    name: member.name,
    image: member.image,
    role: member.role,
  })),
];

export default function AdminTeamUpload() {
  const [teams, setTeams] = useState({
    executive: executiveTeamData,
    classRep: classRepsData,
    press: pressTeamData,
  });

  const handleImageUpdate = (
    teamType: 'executive' | 'classRep' | 'press',
    memberId: string,
    newImageUrl: string
  ) => {
    setTeams(prev => ({
      ...prev,
      [teamType]: prev[teamType].map(member =>
        member.id === memberId ? { ...member, image: newImageUrl } : member
      ),
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Team Image Management</h1>
          <p className="text-gray-600">
            Upload and manage images for executive team, class representatives, and press team
          </p>
        </div>

        {/* Executive Team */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <TeamUploadManager
            members={teams.executive}
            teamType="executive"
            teamName="EBSUMSA Executive"
            onImageUpdate={(memberId, imageUrl) =>
              handleImageUpdate('executive', memberId, imageUrl)
            }
          />
        </div>

        {/* Class Representatives */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <TeamUploadManager
            members={teams.classRep}
            teamType="classRep"
            teamName="Class Representatives"
            onImageUpdate={(memberId, imageUrl) =>
              handleImageUpdate('classRep', memberId, imageUrl)
            }
          />
        </div>

        {/* Press Team */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <TeamUploadManager
            members={teams.press}
            teamType="press"
            teamName="Press Team"
            onImageUpdate={(memberId, imageUrl) =>
              handleImageUpdate('press', memberId, imageUrl)
            }
          />
        </div>
      </div>
    </div>
  );
}

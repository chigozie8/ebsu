'use client';

import { useState, useEffect } from 'react';
import { TeamUploadManager } from '../../components/ImageUpload/TeamUploadManager';
import placeholder from "../../assets/img/team/placeholder.png";
import { db } from '../../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

// =============================================
// Executive Team Data
// =============================================
interface ExecutiveMember {
  name: string;
  title: string;
  image: string;
  level?: string;
  bio?: string;
}

const presidentData: ExecutiveMember = {
  name: "Name Here",
  title: "President",
  image: placeholder,
  level: "600 Level",
  bio: "Leading EBSUMSA with vision and dedication to advance medical student welfare and professional development.",
};

const executiveMembers: ExecutiveMember[] = [
  {
    name: "Name Here",
    title: "Vice President",
    image: placeholder,
    level: "500 Level",
  },
  {
    name: "Name Here",
    title: "General Secretary",
    image: placeholder,
    level: "500 Level",
  },
  {
    name: "Name Here",
    title: "Financial Secretary",
    image: placeholder,
    level: "400 Level",
  },
  {
    name: "Name Here",
    title: "Treasurer",
    image: placeholder,
    level: "400 Level",
  },
  {
    name: "Name Here",
    title: "Public Relations Officer",
    image: placeholder,
    level: "500 Level",
  },
  {
    name: "Name Here",
    title: "Director of Socials",
    image: placeholder,
    level: "400 Level",
  },
  {
    name: "Name Here",
    title: "Director of Academics",
    image: placeholder,
    level: "500 Level",
  },
  {
    name: "Name Here",
    title: "Director of Welfare",
    image: placeholder,
    level: "400 Level",
  },
  {
    name: "Name Here",
    title: "Director of Sports",
    image: placeholder,
    level: "400 Level",
  },
  {
    name: "Name Here",
    title: "Director of Health",
    image: placeholder,
    level: "500 Level",
  },
];

// =============================================
// Class Representatives Data
// =============================================
import { classReps } from '../../data/students/classReps';

// =============================================
// Press Team Data
// =============================================
interface PressMember {
  name: string;
  role: string;
  level: string;
  image: string;
  specialty?: string;
}

const editorInChief: PressMember = {
  name: "Name Here",
  role: "Editor-in-Chief",
  level: "500 Level",
  image: placeholder,
  specialty: "News & Editorial",
};

const pressMembers: PressMember[] = [
  {
    name: "Name Here",
    role: "Deputy Editor",
    level: "500 Level",
    image: placeholder,
    specialty: "Feature Articles",
  },
  {
    name: "Name Here",
    role: "News Editor",
    level: "400 Level",
    image: placeholder,
    specialty: "Campus News",
  },
  {
    name: "Name Here",
    role: "Social Media Manager",
    level: "400 Level",
    image: placeholder,
    specialty: "Digital Content",
  },
  {
    name: "Name Here",
    role: "Graphics Designer",
    level: "400 Level",
    image: placeholder,
    specialty: "Visual Design",
  },
  {
    name: "Name Here",
    role: "Photographer",
    level: "300 Level",
    image: placeholder,
    specialty: "Event Photography",
  },
  {
    name: "Name Here",
    role: "Video Editor",
    level: "400 Level",
    image: placeholder,
    specialty: "Video Production",
  },
  {
    name: "Name Here",
    role: "Reporter",
    level: "300 Level",
    image: placeholder,
    specialty: "Academic News",
  },
  {
    name: "Name Here",
    role: "Reporter",
    level: "300 Level",
    image: placeholder,
    specialty: "Sports News",
  },
  {
    name: "Name Here",
    role: "Reporter",
    level: "200 Level",
    image: placeholder,
    specialty: "Health News",
  },
  {
    name: "Name Here",
    role: "Content Writer",
    level: "400 Level",
    image: placeholder,
    specialty: "Blog Articles",
  },
];

// =============================================
// Convert data to match interface
// =============================================
const executiveTeamData = [
  { 
    id: 'president', 
    name: presidentData.name, 
    image: presidentData.image, 
    role: presidentData.title 
  },
  ...executiveMembers.map((member: any, idx: number) => ({
    id: `exec-${idx}`,
    name: member.name,
    image: member.image,
    role: member.title,
  })),
];

const classRepsData = classReps.map((rep: any, idx: number) => ({
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
  ...pressMembers.map((member: any, idx: number) => ({
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

  // Load persisted images from Firestore so the admin panel reflects live state
  useEffect(() => {
    getDocs(collection(db, 'teamImages')).then((snap) => {
      const updates: Record<string, Record<string, string>> = { executive: {}, classRep: {}, press: {} };
      snap.forEach((d) => {
        const data = d.data();
        if (data.teamType && data.memberId && data.imageUrl) {
          updates[data.teamType][data.memberId] = data.imageUrl;
        }
      });
      setTeams((prev) => ({
        executive: prev.executive.map((m) => updates.executive[m.id] ? { ...m, image: updates.executive[m.id] } : m),
        classRep: prev.classRep.map((m) => updates.classRep[m.id] ? { ...m, image: updates.classRep[m.id] } : m),
        press: prev.press.map((m) => updates.press[m.id] ? { ...m, image: updates.press[m.id] } : m),
      }));
    }).catch(() => { /* silently ignore */ });
  }, []);

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

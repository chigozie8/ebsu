import { useState, useEffect } from 'react';
import { TeamUploadManager } from '../../components/ImageUpload/TeamUploadManager';
import placeholder from "../../assets/img/team/placeholder.png";
import { db } from '../../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { classReps } from '../../data/students/classReps';

// =============================================
// Static default data
// =============================================
const executiveTeamData = [
  { id: 'president',  name: 'Name Here', image: placeholder, role: 'President',               extra: '600 Level' },
  { id: 'exec-0',     name: 'Name Here', image: placeholder, role: 'Vice President',           extra: '500 Level' },
  { id: 'exec-1',     name: 'Name Here', image: placeholder, role: 'General Secretary',        extra: '500 Level' },
  { id: 'exec-2',     name: 'Name Here', image: placeholder, role: 'Financial Secretary',      extra: '400 Level' },
  { id: 'exec-3',     name: 'Name Here', image: placeholder, role: 'Treasurer',                extra: '400 Level' },
  { id: 'exec-4',     name: 'Name Here', image: placeholder, role: 'Public Relations Officer', extra: '500 Level' },
  { id: 'exec-5',     name: 'Name Here', image: placeholder, role: 'Director of Socials',      extra: '400 Level' },
  { id: 'exec-6',     name: 'Name Here', image: placeholder, role: 'Director of Academics',    extra: '500 Level' },
  { id: 'exec-7',     name: 'Name Here', image: placeholder, role: 'Director of Welfare',      extra: '400 Level' },
  { id: 'exec-8',     name: 'Name Here', image: placeholder, role: 'Director of Sports',       extra: '400 Level' },
  { id: 'exec-9',     name: 'Name Here', image: placeholder, role: 'Director of Health',       extra: '500 Level' },
];

const classRepsData = classReps.map((rep, idx) => ({
  id: `classrep-${idx}`,
  name: rep.name,
  image: rep.img,
  role: rep.title,
  extra: rep.work,
}));

const pressTeamData = [
  { id: 'editor-in-chief', name: 'Name Here', image: placeholder, role: 'Editor-in-Chief',      extra: '500 Level' },
  { id: 'press-0',         name: 'Name Here', image: placeholder, role: 'Deputy Editor',         extra: '500 Level' },
  { id: 'press-1',         name: 'Name Here', image: placeholder, role: 'News Editor',           extra: '400 Level' },
  { id: 'press-2',         name: 'Name Here', image: placeholder, role: 'Social Media Manager',  extra: '400 Level' },
  { id: 'press-3',         name: 'Name Here', image: placeholder, role: 'Graphics Designer',     extra: '400 Level' },
  { id: 'press-4',         name: 'Name Here', image: placeholder, role: 'Photographer',          extra: '300 Level' },
  { id: 'press-5',         name: 'Name Here', image: placeholder, role: 'Video Editor',          extra: '400 Level' },
  { id: 'press-6',         name: 'Name Here', image: placeholder, role: 'Reporter',              extra: '300 Level' },
  { id: 'press-7',         name: 'Name Here', image: placeholder, role: 'Reporter',              extra: '300 Level' },
  { id: 'press-8',         name: 'Name Here', image: placeholder, role: 'Reporter',              extra: '200 Level' },
  { id: 'press-9',         name: 'Name Here', image: placeholder, role: 'Content Writer',        extra: '400 Level' },
];

type TeamType = 'executive' | 'classRep' | 'press';

interface TeamMember {
  id: string;
  name: string;
  image: string;
  role: string;
  extra?: string;
}

export default function AdminTeamUpload() {
  const [teams, setTeams] = useState<Record<TeamType, TeamMember[]>>({
    executive: executiveTeamData,
    classRep: classRepsData,
    press: pressTeamData,
  });

  // Load all persisted data (image + name + role + extra) from Firestore
  useEffect(() => {
    getDocs(collection(db, 'teamImages')).then((snap) => {
      const updates: Record<string, Partial<TeamMember>> = {};
      snap.forEach((d) => {
        const data = d.data();
        if (data.teamType && data.memberId) {
          const key = `${data.teamType}_${data.memberId}`;
          updates[key] = {
            ...(data.imageUrl && { image: data.imageUrl }),
            ...(data.name    && { name:  data.name }),
            ...(data.role    && { role:  data.role }),
            ...(data.extra   && { extra: data.extra }),
          };
        }
      });

      setTeams((prev) => {
        const merged: Record<TeamType, TeamMember[]> = { executive: [], classRep: [], press: [] };
        (Object.keys(prev) as TeamType[]).forEach((teamType) => {
          merged[teamType] = prev[teamType].map((m) => {
            const patch = updates[`${teamType}_${m.id}`];
            return patch ? { ...m, ...patch } : m;
          });
        });
        return merged;
      });
    }).catch(() => { /* silently ignore */ });
  }, []);

  const handleImageUpdate = (teamType: TeamType, memberId: string, newImageUrl: string) => {
    setTeams((prev) => ({
      ...prev,
      [teamType]: prev[teamType].map((m) =>
        m.id === memberId ? { ...m, image: newImageUrl } : m
      ),
    }));
  };

  const handleMemberUpdate = (
    teamType: TeamType,
    memberId: string,
    fields: { name?: string; role?: string; extra?: string }
  ) => {
    setTeams((prev) => ({
      ...prev,
      [teamType]: prev[teamType].map((m) =>
        m.id === memberId ? { ...m, ...fields } : m
      ),
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Team Management</h1>
          <p className="text-sm text-gray-500">
            Click any photo to upload a new one. Click any name, title, or info field to edit it inline — changes save instantly.
          </p>
        </div>

        {/* Executive Team */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <TeamUploadManager
            members={teams.executive}
            teamType="executive"
            teamName="EBSUMSA Executive Team"
            onImageUpdate={(id, url) => handleImageUpdate('executive', id, url)}
            onMemberUpdate={(id, fields) => handleMemberUpdate('executive', id, fields)}
          />
        </div>

        {/* Class Representatives */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <TeamUploadManager
            members={teams.classRep}
            teamType="classRep"
            teamName="Class Representatives"
            onImageUpdate={(id, url) => handleImageUpdate('classRep', id, url)}
            onMemberUpdate={(id, fields) => handleMemberUpdate('classRep', id, fields)}
          />
        </div>

        {/* Press Team */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <TeamUploadManager
            members={teams.press}
            teamType="press"
            teamName="Press Team"
            onImageUpdate={(id, url) => handleImageUpdate('press', id, url)}
            onMemberUpdate={(id, fields) => handleMemberUpdate('press', id, fields)}
          />
        </div>
      </div>
    </div>
  );
}

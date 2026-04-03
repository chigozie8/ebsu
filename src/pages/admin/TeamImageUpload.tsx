import { useState, useEffect, useRef } from 'react';
import { TeamUploadManager } from '../../components/ImageUpload/TeamUploadManager';
import placeholder from "../../assets/img/team/placeholder.png";
import { supabase } from '../../config/supabase';
import { classReps } from '../../data/students/classReps';
import { IoLink, IoCheckmark, IoPencil } from 'react-icons/io5';
import { notifyUser } from '../../helpers/notifyUser';
import { Spinner } from '../../components/loaders/Spinner';

// ─── Types ────────────────────────────────────────────────────────────────────
type TeamType = 'executive' | 'classRep' | 'press';

interface TeamMember {
  id: string;
  name: string;
  image: string;
  role: string;
  extra?: string;
}

// ─── Static default data ─────────────────────────────────────────────────────
const executiveTeamData: TeamMember[] = [
  { id: 'president',  name: 'Name Here', image: placeholder, role: 'President',               extra: '' },
  { id: 'exec-0',     name: 'Name Here', image: placeholder, role: 'Vice President',           extra: '' },
  { id: 'exec-1',     name: 'Name Here', image: placeholder, role: 'General Secretary',        extra: '' },
  { id: 'exec-2',     name: 'Name Here', image: placeholder, role: 'Financial Secretary',      extra: '' },
  { id: 'exec-3',     name: 'Name Here', image: placeholder, role: 'Treasurer',                extra: '' },
  { id: 'exec-4',     name: 'Name Here', image: placeholder, role: 'Public Relations Officer', extra: '' },
  { id: 'exec-5',     name: 'Name Here', image: placeholder, role: 'Director of Socials',      extra: '' },
  { id: 'exec-6',     name: 'Name Here', image: placeholder, role: 'Director of Academics',    extra: '' },
  { id: 'exec-7',     name: 'Name Here', image: placeholder, role: 'Director of Welfare',      extra: '' },
  { id: 'exec-8',     name: 'Name Here', image: placeholder, role: 'Director of Sports',       extra: '' },
  { id: 'exec-9',     name: 'Name Here', image: placeholder, role: 'Director of Health',       extra: '' },
  { id: 'exec-10',    name: 'Name Here', image: placeholder, role: 'Director of Research',     extra: '' },
  { id: 'exec-11',    name: 'Name Here', image: placeholder, role: 'Director of Projects',     extra: '' },
  { id: 'exec-12',    name: 'Name Here', image: placeholder, role: 'Chief Whip',               extra: '' },
  { id: 'exec-13',    name: 'Name Here', image: placeholder, role: 'Year One Representative',  extra: '' },
  { id: 'exec-14',    name: 'Name Here', image: placeholder, role: 'Director of Logistics',   extra: '' },
  { id: 'exec-15',    name: 'Name Here', image: placeholder, role: 'Director of Legal',       extra: '' },
  { id: 'exec-16',    name: 'Name Here', image: placeholder, role: 'Director of ICT',         extra: '' },
  { id: 'exec-17',    name: 'Name Here', image: placeholder, role: 'Director of Publicity',   extra: '' },
  { id: 'exec-18',    name: 'Name Here', image: placeholder, role: 'Director of Finance',     extra: '' },
  { id: 'exec-19',    name: 'Name Here', image: placeholder, role: 'Director of Complaints',  extra: '' },
  { id: 'exec-20',    name: 'Name Here', image: placeholder, role: 'Director of Protocol',    extra: '' },
  { id: 'exec-21',    name: 'Name Here', image: placeholder, role: 'Director of Community',   extra: '' },
  { id: 'exec-22',    name: 'Name Here', image: placeholder, role: 'Director of Strategy',    extra: '' },
  { id: 'exec-23',    name: 'Name Here', image: placeholder, role: 'Director of Press',       extra: '' },
];

const classRepsData: TeamMember[] = classReps.map((rep, idx) => ({
  id: `classrep-${idx}`,
  name: rep.name,
  image: rep.img,
  role: rep.title,
  extra: rep.work,
}));

const pressTeamData: TeamMember[] = [
  { id: 'editor-in-chief', name: 'Name Here', image: placeholder, role: 'Editor-in-Chief',     extra: '500 Level' },
  { id: 'press-0',         name: 'Name Here', image: placeholder, role: 'Deputy Editor',        extra: '500 Level' },
  { id: 'press-1',         name: 'Name Here', image: placeholder, role: 'News Editor',          extra: '400 Level' },
  { id: 'press-2',         name: 'Name Here', image: placeholder, role: 'Social Media Manager', extra: '400 Level' },
  { id: 'press-3',         name: 'Name Here', image: placeholder, role: 'Graphics Designer',    extra: '400 Level' },
  { id: 'press-4',         name: 'Name Here', image: placeholder, role: 'Photographer',         extra: '300 Level' },
];

const DEFAULT_DRIVE_URL = 'https://drive.google.com/file/d/1Vv_k_nvjAZ1Wi8QnpFa5wlsWCsns7918/view?usp=drivesdk';

// IDs that ship as defaults — these cannot be deleted
const FIXED_EXECUTIVE_IDS = new Set(executiveTeamData.map((m) => m.id));
const FIXED_CLASSREP_IDS  = new Set(classRepsData.map((m) => m.id));
const FIXED_PRESS_IDS     = new Set(pressTeamData.map((m) => m.id));

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminTeamUpload() {
  const [teams, setTeams] = useState<Record<TeamType, TeamMember[]>>({
    executive: executiveTeamData,
    classRep:  classRepsData,
    press:     pressTeamData,
  });

  const [driveUrl,      setDriveUrl]      = useState(DEFAULT_DRIVE_URL);
  const [driveDraft,    setDriveDraft]    = useState(DEFAULT_DRIVE_URL);
  const [editingDrive,  setEditingDrive]  = useState(false);
  const [savingDrive,   setSavingDrive]   = useState(false);
  const [driveSaved,    setDriveSaved]    = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<{ teamType: TeamType; member: TeamMember } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Add member modal state
  const [addModal, setAddModal] = useState<{ teamType: TeamType; teamName: string } | null>(null);
  const [addName, setAddName] = useState('');
  const [addRole, setAddRole] = useState('');
  const [addExtra, setAddExtra] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load team member overrides from Supabase
    supabase
      .from('team_images')
      .select('team_type, member_id, image_url, name, role, extra')
      .then(({ data, error }) => {
        if (error || !data) return;
        const updates: Record<string, Partial<TeamMember>> = {};
        data.forEach((row) => {
          if (row.team_type && row.member_id) {
            updates[`${row.team_type}_${row.member_id}`] = {
              ...(row.image_url && { image: row.image_url }),
              ...(row.name      && { name:  row.name }),
              ...(row.role      && { role:  row.role }),
              ...(row.extra     && { extra: row.extra }),
            };
          }
        });
        setTeams((prev) => {
          const merged = {} as Record<TeamType, TeamMember[]>;
          (Object.keys(prev) as TeamType[]).forEach((t) => {
            merged[t] = prev[t].map((m) => {
              const patch = updates[`${t}_${m.id}`];
              return patch ? { ...m, ...patch } : m;
            });
          });
          return merged;
        });
      });

    // Load Drive URL from site_settings
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'appointees_drive_url')
      .single()
      .then(({ data }) => {
        if (data?.value) {
          setDriveUrl(data.value);
          setDriveDraft(data.value);
        }
      });
  }, []);

  const saveDriveUrl = async () => {
    setSavingDrive(true);
    await supabase
      .from('site_settings')
      .upsert({ key: 'appointees_drive_url', value: driveDraft.trim() }, { onConflict: 'key' });
    setDriveUrl(driveDraft.trim());
    setSavingDrive(false);
    setEditingDrive(false);
    setDriveSaved(true);
    setTimeout(() => setDriveSaved(false), 2500);
  };

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

  const requestDelete = (teamType: TeamType, memberId: string) => {
    const member = teams[teamType].find((m) => m.id === memberId);
    if (member) setDeleteTarget({ teamType, member });
  };

  const openAddModal = (teamType: TeamType, teamName: string) => {
    setAddModal({ teamType, teamName });
    setAddName('');
    setAddRole(teamType === 'press' ? 'Reporter' : teamType === 'classRep' ? 'Class Rep' : 'Member');
    setAddExtra('');
  };

  const submitAddMember = async () => {
    if (!addModal || !addName.trim()) {
      notifyUser('error', 'Please enter a name');
      return;
    }
    setSaving(true);
    const { teamType } = addModal;
    const newId = `${teamType}-extra-${Date.now()}`;
    try {
      const { error } = await supabase.from('team_images').upsert(
        {
          id: `${teamType}_${newId}`,
          team_type: teamType,
          member_id: newId,
          name: addName.trim(),
          role: addRole.trim() || 'Member',
          extra: addExtra.trim(),
          image_url: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
      if (error) throw error;

      setTeams((prev) => ({
        ...prev,
        [teamType]: [
          ...prev[teamType],
          { id: newId, name: addName.trim(), role: addRole.trim() || 'Member', image: placeholder, extra: addExtra.trim() },
        ],
      }));
      notifyUser('success', 'Member added successfully');
      setAddModal(null);
    } catch {
      notifyUser('error', 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { teamType, member } = deleteTarget;
    try {
      await supabase
        .from('team_images')
        .delete()
        .eq('id', `${teamType}_${member.id}`);

      setTeams((prev) => ({
        ...prev,
        [teamType]: prev[teamType].filter((m) => m.id !== member.id),
      }));
      notifyUser('success', `${member.name} removed`);
      setDeleteTarget(null);
    } catch {
      notifyUser('error', 'Failed to remove member');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-8">

        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Team Management</h1>
          <p className="text-sm text-gray-500">
            Click any photo to upload a new one. Click any name or title to edit inline — changes save instantly.
          </p>
        </div>

        {/* Google Drive Link Manager */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <IoLink className="text-green-600 text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">All Appointees — Google Drive Link</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                This link powers the "View All Appointees" button on the public Executive Team page.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
            {editingDrive ? (
              <>
                <input
                  autoFocus
                  value={driveDraft}
                  onChange={(e) => setDriveDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveDriveUrl();
                    if (e.key === 'Escape') { setDriveDraft(driveUrl); setEditingDrive(false); }
                  }}
                  className="flex-1 min-w-0 bg-white border border-green-500 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-200 font-mono"
                  placeholder="https://drive.google.com/..."
                />
                <button
                  onClick={saveDriveUrl}
                  disabled={savingDrive}
                  className="flex-shrink-0 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {savingDrive ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : <IoCheckmark className="text-base" />}
                  Save
                </button>
                <button
                  onClick={() => { setDriveDraft(driveUrl); setEditingDrive(false); }}
                  className="flex-shrink-0 px-3 py-2 border border-gray-200 text-gray-500 text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <a
                  href={driveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 min-w-0 text-sm text-blue-600 underline truncate font-mono"
                >
                  {driveUrl}
                </a>
                {driveSaved && (
                  <span className="text-xs text-green-600 font-semibold flex items-center gap-1 flex-shrink-0">
                    <IoCheckmark /> Saved
                  </span>
                )}
                <button
                  onClick={() => { setDriveDraft(driveUrl); setEditingDrive(true); }}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
                >
                  <IoPencil className="text-sm" /> Edit Link
                </button>
              </>
            )}
          </div>
        </div>

        {/* Executive Team */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <TeamUploadManager
            members={teams.executive}
            teamType="executive"
            teamName="EBSUMSA Executive Team"
            onImageUpdate={(id, url) => handleImageUpdate('executive', id, url)}
            onMemberUpdate={(id, fields) => handleMemberUpdate('executive', id, fields)}
            onDeleteMember={(id) => requestDelete('executive', id)}
            canDelete={(id) => !FIXED_EXECUTIVE_IDS.has(id)}
            showAddButton={true}
            onAddMember={() => openAddModal('executive', 'Executive Team')}
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
            onDeleteMember={(id) => requestDelete('classRep', id)}
            canDelete={(id) => !FIXED_CLASSREP_IDS.has(id)}
            showAddButton={true}
            onAddMember={() => openAddModal('classRep', 'Class Representatives')}
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
            onDeleteMember={(id) => requestDelete('press', id)}
            canDelete={(id) => !FIXED_PRESS_IDS.has(id)}
            showAddButton={true}
            onAddMember={() => openAddModal('press', 'Press Team')}
          />
        </div>

      </div>

      {/* Add Member Modal */}
      {addModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Add Member</h3>
                <p className="text-xs text-gray-500">{addModal.teamName}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Full Name *</label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. John Doe"
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Role / Title</label>
                <input
                  type="text"
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
                  placeholder="e.g. Director of ICT"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  {addModal.teamType === 'press' ? 'Level / Info' : 'Phone (optional)'}
                </label>
                <input
                  type="text"
                  value={addExtra}
                  onChange={(e) => setAddExtra(e.target.value)}
                  placeholder={addModal.teamType === 'press' ? 'e.g. 400 Level' : 'e.g. 08012345678'}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setAddModal(null)}
                disabled={saving}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitAddMember}
                disabled={saving || !addName.trim()}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Spinner className="w-4 h-4 text-white" />}
                {saving ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-900 text-center mb-2">Remove Member</h3>
          <p className="text-sm text-gray-500 text-center mb-6">
            Remove <span className="font-semibold text-gray-800">{deleteTarget.member.name}</span> ({deleteTarget.member.role}) from the team? This only removes admin-added records — default placeholders are not affected.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {deleting && <Spinner className="w-4 h-4 text-white" />}
              {deleting ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

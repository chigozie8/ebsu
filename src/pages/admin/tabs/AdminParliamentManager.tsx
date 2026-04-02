import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../../config/supabase";
import { TeamUploadManager } from "../../../components/ImageUpload/TeamUploadManager";
import placeholder from "../../../assets/img/team/placeholder.png";
import { notifyUser } from "../../../helpers/notifyUser";
import { Spinner } from "../../../components/loaders/Spinner";

interface ParliamentMember {
  id: string;
  name: string;
  image: string;
  role: string;
  extra?: string; // phone
}

const DEFAULT_MEMBERS: ParliamentMember[] = [
  { id: "parliament-speaker",        name: "Name Here", image: placeholder, role: "Speaker of Parliament",  extra: "" },
  { id: "parliament-deputy-speaker", name: "Name Here", image: placeholder, role: "Deputy Speaker",         extra: "" },
  { id: "parliament-0",              name: "Name Here", image: placeholder, role: "Majority Leader",         extra: "" },
  { id: "parliament-1",              name: "Name Here", image: placeholder, role: "Minority Leader",         extra: "" },
  { id: "parliament-2",              name: "Name Here", image: placeholder, role: "Majority Whip",           extra: "" },
  { id: "parliament-3",              name: "Name Here", image: placeholder, role: "Minority Whip",           extra: "" },
  { id: "parliament-4",              name: "Name Here", image: placeholder, role: "Clerk of Parliament",     extra: "" },
  { id: "parliament-5",              name: "Name Here", image: placeholder, role: "Member of Parliament",    extra: "" },
  { id: "parliament-6",              name: "Name Here", image: placeholder, role: "Member of Parliament",    extra: "" },
  { id: "parliament-7",              name: "Name Here", image: placeholder, role: "Member of Parliament",    extra: "" },
  { id: "parliament-8",              name: "Name Here", image: placeholder, role: "Member of Parliament",    extra: "" },
  { id: "parliament-9",              name: "Name Here", image: placeholder, role: "Member of Parliament",    extra: "" },
];

const FIXED_IDS = new Set(DEFAULT_MEMBERS.map((m) => m.id));

export default function AdminParliamentManager() {
  const [members, setMembers] = useState<ParliamentMember[]>(DEFAULT_MEMBERS);
  const [loading, setLoading] = useState(true);

  // Add-member form
  const [addName,  setAddName]  = useState("");
  const [addRole,  setAddRole]  = useState("Member of Parliament");
  const [addPhone, setAddPhone] = useState("");
  
  // Ref for scrolling to add form
  const addFormRef = useRef<HTMLDivElement>(null);
  
  const scrollToAddForm = () => {
    addFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Focus the name input after scrolling
    setTimeout(() => {
      const nameInput = addFormRef.current?.querySelector('input[type="text"]') as HTMLInputElement;
      nameInput?.focus();
    }, 500);
  };
  const [saving,   setSaving]   = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<ParliamentMember | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load from Supabase
  useEffect(() => {
    supabase
      .from("team_images")
      .select("member_id, image_url, name, role, extra")
      .eq("team_type", "parliament")
      .then(({ data, error }) => {
        setLoading(false);
        if (error || !data) return;

        const map: Record<string, { image_url?: string; name?: string; role?: string; extra?: string }> = {};
        data.forEach((row) => { map[row.member_id] = row; });

        setMembers((prev) => {
          // Patch existing defaults
          const patched = prev.map((m) => {
            const patch = map[m.id];
            if (!patch) return m;
            return {
              ...m,
              name:  patch.name      || m.name,
              role:  patch.role      || m.role,
              image: patch.image_url || m.image,
              extra: patch.extra     ?? m.extra,
            };
          });

          // Append extras (admin-added members not in defaults)
          const existingIds = new Set(prev.map((m) => m.id));
          const extras: ParliamentMember[] = [];
          Object.entries(map).forEach(([memberId, row]) => {
            if (!existingIds.has(memberId)) {
              extras.push({
                id:    memberId,
                name:  row.name      || "Name Here",
                role:  row.role      || "Member of Parliament",
                image: row.image_url || placeholder,
                extra: row.extra     || "",
              });
            }
          });

          return [...patched, ...extras];
        });
      });
  }, []);

  const handleImageUpdate = (memberId: string, url: string) => {
    setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, image: url } : m));
  };

  const handleMemberUpdate = (memberId: string, fields: { name?: string; role?: string; extra?: string }) => {
    setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, ...fields } : m));
  };

  const addMember = async () => {
    if (!addName.trim()) {
      notifyUser("error", "Please enter a name");
      return;
    }
    setSaving(true);
    const newId = `parliament-extra-${Date.now()}`;
    try {
      const { error } = await supabase.from("team_images").upsert(
        {
          id:         `parliament_${newId}`,
          team_type:  "parliament",
          member_id:  newId,
          name:       addName.trim(),
          role:       addRole.trim() || "Member of Parliament",
          extra:      addPhone.trim(),
          image_url:  null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
      if (error) throw error;

      setMembers((prev) => [
        ...prev,
        { id: newId, name: addName.trim(), role: addRole.trim() || "Member of Parliament", image: placeholder, extra: addPhone.trim() },
      ]);
      setAddName("");
      setAddRole("Member of Parliament");
      setAddPhone("");
      notifyUser("success", "Member added successfully");
    } catch {
      notifyUser("error", "Failed to add member");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await supabase
        .from("team_images")
        .delete()
        .eq("id", `parliament_${deleteTarget.id}`);

      setMembers((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      notifyUser("success", `${deleteTarget.name} removed`);
      setDeleteTarget(null);
    } catch {
      notifyUser("error", "Failed to remove member");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="w-8 h-8 text-green2" />
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Add member form */}
      <div ref={addFormRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Add Parliament Member</h3>
        <p className="text-xs text-gray-500 mb-5">
          Add a new member to the parliament roster. They will appear on the public Parliament page.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Full Name *</label>
            <input
              type="text"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green2/30 focus:border-green2 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Role / Title</label>
            <input
              type="text"
              value={addRole}
              onChange={(e) => setAddRole(e.target.value)}
              placeholder="e.g. Member of Parliament"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green2/30 focus:border-green2 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Phone (optional)</label>
            <input
              type="tel"
              value={addPhone}
              onChange={(e) => setAddPhone(e.target.value)}
              placeholder="e.g. 08012345678"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green2/30 focus:border-green2 transition-colors"
            />
          </div>
        </div>
        <button
          onClick={addMember}
          disabled={saving || !addName.trim()}
          className="mt-4 inline-flex items-center gap-2 bg-green2 hover:bg-green2/90 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Spinner className="w-4 h-4 text-white" /> : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          )}
          Add Member
        </button>
      </div>

      {/* Members grid — uses the same TeamUploadManager for photos + inline editing */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <TeamUploadManager
          members={members}
          teamType="parliament"
          teamName="Parliament Members"
          onImageUpdate={handleImageUpdate}
          onMemberUpdate={handleMemberUpdate}
          onDeleteMember={(memberId) => {
            const member = members.find((m) => m.id === memberId);
            if (member) setDeleteTarget(member);
          }}
          canDelete={(memberId) => !FIXED_IDS.has(memberId)}
          showAddButton={true}
          onAddMember={scrollToAddForm}
        />
      </div>

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
              Remove <span className="font-semibold text-gray-800">{deleteTarget.name}</span> ({deleteTarget.role}) from the parliament roster?
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
                {deleting ? <Spinner className="w-4 h-4 text-white" /> : null}
                {deleting ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

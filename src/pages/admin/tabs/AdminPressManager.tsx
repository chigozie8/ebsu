import { useState, useEffect } from "react";
import { db } from "../../../config/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { notifyUser } from "../../../helpers/notifyUser";
import { Spinner } from "../../../components/loaders/Spinner";

interface PressSocialLinks {
  facebook: string;
  instagram: string;
  twitter: string;
  youtube: string;
  tiktok: string;
}

const DEFAULT_LINKS: PressSocialLinks = {
  facebook: "",
  instagram: "",
  twitter: "",
  youtube: "",
  tiktok: "",
};

const FIRESTORE_DOC = "press_social_links";
const FIRESTORE_COLLECTION = "siteConfig";

const platforms = [
  {
    key: "instagram" as keyof PressSocialLinks,
    label: "Instagram",
    placeholder: "https://instagram.com/ebsumsa_press",
    color: "text-pink-600",
    bg: "bg-pink-50 border-pink-200 focus:ring-pink-500/30 focus:border-pink-400",
    icon: (
      <svg className="w-5 h-5 text-pink-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    key: "facebook" as keyof PressSocialLinks,
    label: "Facebook",
    placeholder: "https://facebook.com/ebsumsa.press",
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200 focus:ring-blue-500/30 focus:border-blue-400",
    icon: (
      <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    key: "twitter" as keyof PressSocialLinks,
    label: "X (Twitter)",
    placeholder: "https://x.com/ebsumsa_press",
    color: "text-gray-900",
    bg: "bg-gray-50 border-gray-200 focus:ring-gray-500/30 focus:border-gray-400",
    icon: (
      <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    key: "youtube" as keyof PressSocialLinks,
    label: "YouTube",
    placeholder: "https://youtube.com/@ebsumsa_press",
    color: "text-red-600",
    bg: "bg-red-50 border-red-200 focus:ring-red-500/30 focus:border-red-400",
    icon: (
      <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
  {
    key: "tiktok" as keyof PressSocialLinks,
    label: "TikTok",
    placeholder: "https://tiktok.com/@ebsumsa_press",
    color: "text-gray-900",
    bg: "bg-gray-50 border-gray-200 focus:ring-gray-500/30 focus:border-gray-400",
    icon: (
      <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
      </svg>
    ),
  },
];

export default function AdminPressManager() {
  const [links, setLinks] = useState<PressSocialLinks>(DEFAULT_LINKS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const ref = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC);
    getDoc(ref).then((snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partial<PressSocialLinks>;
        setLinks({ ...DEFAULT_LINKS, ...data });
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const handleChange = (key: keyof PressSocialLinks, value: string) => {
    setLinks((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const ref = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC);
      await setDoc(ref, { ...links }, { merge: true });
      notifyUser("success", "Social media links saved successfully!");
    } catch (err) {
      console.error("[AdminPressManager] save error:", err);
      notifyUser("error", "Failed to save links. Please try again.");
    } finally {
      setSaving(false);
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
    <div className="max-w-2xl space-y-6">
      {/* Info card */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-sm text-blue-700 leading-relaxed">
          Add the full URL for each social media handle below. Leave a field blank to hide that platform on the Press Team page. Changes are reflected immediately after saving.
        </p>
      </div>

      {/* Link fields */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <h3 className="text-base font-bold text-gray-900">Press Club Social Media Links</h3>

        {platforms.map((platform) => (
          <div key={platform.key}>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              {platform.label}
            </label>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                {platform.icon}
              </div>
              <input
                type="url"
                value={links[platform.key]}
                onChange={(e) => handleChange(platform.key, e.target.value)}
                placeholder={platform.placeholder}
                className={`flex-1 border rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 transition-colors ${platform.bg}`}
              />
              {links[platform.key] && (
                <a
                  href={links[platform.key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
                  title="Preview link"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-2 inline-flex items-center gap-2 bg-green2 hover:bg-green2/90 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Spinner className="w-4 h-4 text-white" /> : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {saving ? "Saving..." : "Save Links"}
        </button>
      </div>

      {/* Live preview */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4">Live Preview</h3>
        {platforms.filter((p) => links[p.key]).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No links added yet. Fill in at least one URL above and save.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {platforms
              .filter((p) => links[p.key])
              .map((p) => (
                <a
                  key={p.key}
                  href={links[p.key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {p.icon}
                  <span className="text-sm font-medium text-gray-700">{p.label}</span>
                </a>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
